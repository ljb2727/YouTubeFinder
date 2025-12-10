const fs = require('fs');
const path = require('path');

// 환경 변수에서 API 키 가져오기
const API_KEYS = (process.env.YOUTUBE_API_KEY || '').split(',').map(k => k.trim()).filter(k => k);

if (API_KEYS.length === 0) {
    console.error('Error: YOUTUBE_API_KEY environment variable is not set.');
    process.exit(1);
}

// 키 로테이션 로직 (하나의 키만 사용하는 경우에도 호환)
const currentHour = new Date().getHours();
let currentKeyIndex = currentHour % API_KEYS.length;

console.log(`🔑 Starting with API Key index: ${currentKeyIndex} (Total keys: ${API_KEYS.length})`);

async function safeFetch(urlBuilder) {
    let attempts = 0;
    while (attempts < API_KEYS.length) {
        const apiKey = API_KEYS[currentKeyIndex];
        const url = urlBuilder(apiKey);
        
        try {
            const response = await fetch(url);
            
            if (response.ok) return response;
            
            if (response.status === 403) {
                console.warn(`⚠️ API Key index ${currentKeyIndex} quota exceeded (403). Switching to next key...`);
                currentKeyIndex = (currentKeyIndex + 1) % API_KEYS.length;
                attempts++;
                continue;
            }
            
            return response;
        } catch (e) {
            console.error(`Network error with key index ${currentKeyIndex}:`, e);
            throw e;
        }
    }
    throw new Error('🚫 All API keys exhausted.');
}

const FIXED_TRENDING_KEYWORDS = [
    '막장드라마', '시니어드라마', '시니어썰', '노후지혜', '시니어로맨스', 
    '고부갈등', '숏폼드라마', '황혼이야기', '쇼츠드라마', '시어머니', 
    '반전드라마', '시니어사연', '사이다사연', '실제사연', '시월드', 
    '참교육', '숏드라마', '실화사연', '인생사연', '반전사연', 
    '노후사연', '노년사연', '가족사연', '가족갈등', '사연'
];

function containsKorean(text) {
    const koreanRegex = /[\uAC00-\uD7A3\u1100-\u11FF\u3130-\u318F]/;
    return koreanRegex.test(text);
}

async function updateTrendingData() {
    console.log('🚀 Starting smart optimized trending update...');
    
    const DATA_PATH = path.join(__dirname, '../data/trending.json');
    
    // 1. 기존 데이터 로드 (Merge를 위해)
    let existingVideos = [];
    try {
        if (fs.existsSync(DATA_PATH)) {
            const raw = fs.readFileSync(DATA_PATH, 'utf8');
            const data = JSON.parse(raw);
            existingVideos = data.videos || [];
            console.log(`📂 Loaded ${existingVideos.length} existing videos.`);
        }
    } catch (e) {
        console.log('⚠️ Failed to load existing data, starting fresh.');
    }

    // 2. 이번 시간대 검색 키워드 선정 (API 할당량 최적화: 4개씩 순환)
    const KEYWORDS_PER_RUN = 4;
    const totalKeywords = FIXED_TRENDING_KEYWORDS.length;
    // UTC 시간 기준 (GitHub Actions)으로 순환
    const batchIndex = new Date().getHours(); 
    
    const selectedKeywords = [];
    for (let i = 0; i < KEYWORDS_PER_RUN; i++) {
        const idx = (batchIndex * KEYWORDS_PER_RUN + i) % totalKeywords;
        selectedKeywords.push(FIXED_TRENDING_KEYWORDS[idx]);
    }

    console.log(`🔍 Searching keywords for this hour (${selectedKeywords.length}): ${selectedKeywords.join(', ')}`);

    // 3. 검색 수행 (Search API 비용: 4 * 100 = 400 Quota)
    // 최근 3주 (21일)
    const publishedAfter = new Date(Date.now() - 21 * 24 * 60 * 60 * 1000).toISOString();
    const newVideoIds = new Set();

    for (const keyword of selectedKeywords) {
        try {
            const response = await safeFetch(key => 
                `https://www.googleapis.com/youtube/v3/search?part=snippet&q=${encodeURIComponent(keyword)}&type=video&order=viewCount&publishedAfter=${publishedAfter}&videoDuration=short&maxResults=10&regionCode=KR&key=${key}`
            );
            
            if (!response.ok) {
                console.warn(`Failed to search keyword '${keyword}': ${response.status}`);
                continue;
            }
            
            const data = await response.json();
            if (data.items) {
                data.items.forEach(item => {
                    if (item.id && item.id.videoId) {
                        newVideoIds.add(item.id.videoId);
                    }
                });
            }
        } catch (e) {
            console.error(`Error searching keyword '${keyword}':`, e);
        }
    }

    console.log(`✨ Discovered ${newVideoIds.size} related videos from current keywords.`);

    // 4. 업데이트 대상 통합 (기존 영상 + 신규 영상)
    // 기존 영상 중에서도 아직 날짜가 유효한 것들만 유지
    const threeWeeksAgo = new Date(Date.now() - 21 * 24 * 60 * 60 * 1000);
    const validExistingIds = existingVideos
        .filter(v => new Date(v.publishedAt) > threeWeeksAgo)
        .map(v => v.id.videoId);
    
    // Set을 사용하여 중복 제거
    const allTargetIds = new Set([...validExistingIds, ...newVideoIds]);
    const allTargetIdsArray = Array.from(allTargetIds);

    console.log(`🔄 Updating stats for total ${allTargetIdsArray.length} videos...`);

    // 5. 상세 정보 갱신 (Videos List + Channels List)
    // 비용 매우 저렴 (50개당 1 unit)
    const videoDetails = [];
    
    for (let i = 0; i < allTargetIdsArray.length; i += 50) {
        const chunk = allTargetIdsArray.slice(i, i + 50);
        try {
            const response = await safeFetch(key => 
                `https://www.googleapis.com/youtube/v3/videos?part=snippet,statistics,contentDetails&id=${chunk.join(',')}&key=${key}`
            );
            if (response.ok) {
                const data = await response.json();
                if (data.items) videoDetails.push(...data.items);
            }
        } catch (e) {
            console.error('Error fetching video details:', e);
        }
    }

    // 채널 정보
    const channelIds = new Set(videoDetails.map(v => v.snippet.channelId));
    const channelDetails = new Map();
    const channelIdArray = Array.from(channelIds);

    for (let i = 0; i < channelIdArray.length; i += 50) {
        const chunk = channelIdArray.slice(i, i + 50);
        try {
            const response = await safeFetch(key => 
                `https://www.googleapis.com/youtube/v3/channels?part=statistics&id=${chunk.join(',')}&key=${key}`
            );
            if (response.ok) {
                const data = await response.json();
                if (data.items) {
                    data.items.forEach(ch => {
                        channelDetails.set(ch.id, ch.statistics);
                    });
                }
            }
        } catch (e) {
            console.error('Error fetching channel details:', e);
        }
    }

    // 6. 데이터 가공 및 필터링
    function parseDuration(duration) {
        const match = duration.match(/PT(\d+H)?(\d+M)?(\d+S)?/);
        if (!match) return 0;
        const hours = (parseInt(match[1]) || 0);
        const minutes = (parseInt(match[2]) || 0);
        const seconds = (parseInt(match[3]) || 0);
        return hours * 3600 + minutes * 60 + seconds;
    }

    let processedVideos = videoDetails.map(item => {
        const viewCount = parseInt(item.statistics.viewCount) || 0;
        const channelStats = channelDetails.get(item.snippet.channelId);
        const subCount = channelStats ? (parseInt(channelStats.subscriberCount) || 0) : 0;
        const hiddenSubs = channelStats ? channelStats.hiddenSubscriberCount : false;
        const durationSec = parseDuration(item.contentDetails.duration);

        const publishedDate = new Date(item.snippet.publishedAt);
        const hoursSincePublished = Math.max(1, (Date.now() - publishedDate.getTime()) / (1000 * 60 * 60));
        const viewsPerHour = Math.round(viewCount / hoursSincePublished);

        return {
            id: { videoId: item.id }, 
            title: item.snippet.title,
            thumbnail: item.snippet.thumbnails.medium?.url || item.snippet.thumbnails.default?.url,
            channelTitle: item.snippet.channelTitle,
            channelId: item.snippet.channelId,
            publishedAt: item.snippet.publishedAt,
            viewCount: viewCount,
            durationSec: durationSec,
            subCount: subCount,
            ratio: subCount > 0 ? (viewCount / subCount) * 100 : 0,
            viewsPerHour: viewsPerHour,
            hiddenSubs: hiddenSubs
        };
    });

    // 필터링 적용 (한글 필수, 1만 조회수 등)
    processedVideos = processedVideos.filter(v =>
        v.viewCount >= 10000 &&
        v.durationSec >= 60 &&
        v.durationSec <= 180 &&
        v.subCount >= 100 &&
        v.ratio >= 300 &&
        containsKorean(v.title)
    );

    // 성과율 정렬
    processedVideos.sort((a, b) => b.ratio - a.ratio);

    // 파일 사이즈 관리: 상위 500개만 유지 (API 호출량 최적화 및 파일 크기 관리)
    if (processedVideos.length > 500) {
        console.log(`✂️ Trimming list from ${processedVideos.length} to top 500.`);
        processedVideos = processedVideos.slice(0, 500);
    }

    console.log(`✅ Final count: ${processedVideos.length} videos`);

    // 7. 저장
    // 메타데이터의 keywords에는 '현재 수집된 모든 영상의 기반이 된 전체 키워드'를 표시하거나
    // 혹은 '이번 턴에 사용된 키워드'를 표시할 수 있음.
    // UI에서 '적용된 검색 키워드'를 보여주므로, 여기서는 전체 키워드를 보여주는 게 맞을 수도 있으나,
    // 현재 로직상 이번 턴의 키워드를 보여주는 게 시스템 상태 확인에 유리함.
    const outputData = {
        meta: {
            updatedAt: new Date().toISOString(),
            keywords: selectedKeywords // 이번 업데이트에 사용된 키워드 표시
        },
        videos: processedVideos
    };

    fs.writeFileSync(DATA_PATH, JSON.stringify(outputData, null, 2));
    console.log(`💾 Saved to ${DATA_PATH}`);
}

updateTrendingData();
