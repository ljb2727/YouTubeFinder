const fs = require('fs');
const path = require('path');

// 환경 변수에서 API 키 가져오기
const YOUTUBE_API_KEY = process.env.YOUTUBE_API_KEY;

if (!YOUTUBE_API_KEY) {
    console.error('Error: YOUTUBE_API_KEY environment variable is not set.');
    process.exit(1);
}

// 검색 키워드 (trending.js와 동일하게 유지)
const FIXED_TRENDING_KEYWORDS = [
    '막장드라마', '시니어드라마', '시니어썰', '노후지혜', '시니어로맨스', 
    '고부갈등', '숏폼드라마', '황혼이야기', '쇼츠드라마', '시어머니', 
    '반전드라마', '시니어사연', '사이다사연', '실제사연', '시월드', 
    '참교육', '숏드라마', '실화사연'
];

// 한글 포함 여부 검사 함수
function containsKorean(text) {
    const koreanRegex = /[\uAC00-\uD7A3\u1100-\u11FF\u3130-\u318F]/;
    return koreanRegex.test(text);
}

async function updateTrendingData() {
    console.log('🚀 Starting trending data update...');
    
    // 최근 3주 (21일)
    const publishedAfter = new Date(Date.now() - 21 * 24 * 60 * 60 * 1000).toISOString();
    let allVideos = [];
    const videoIds = new Set();

    // 1. 키워드별 검색
    // 사용자의 요청에 따라 모든 키워드 검색 (전용 API 키 사용 가정)
    const selectedKeywords = FIXED_TRENDING_KEYWORDS;
    
    console.log(`Searching with ${selectedKeywords.length} keywords: ${selectedKeywords.join(', ')}`);

    for (const keyword of selectedKeywords) {
        try {
            // regionCode=KR 추가하여 한국 지역 중심으로 검색
            const url = `https://www.googleapis.com/youtube/v3/search?part=snippet&q=${encodeURIComponent(keyword)}&type=video&order=viewCount&publishedAfter=${publishedAfter}&videoDuration=short&maxResults=10&regionCode=KR&key=${YOUTUBE_API_KEY}`;
            
            const response = await fetch(url);
            if (!response.ok) {
                console.warn(`Failed to search keyword '${keyword}': ${response.status}`);
                continue;
            }
            
            const data = await response.json();
            if (data.items) {
                data.items.forEach(item => {
                    if (item.id && item.id.videoId && !videoIds.has(item.id.videoId)) {
                        videoIds.add(item.id.videoId);
                        allVideos.push(item);
                    }
                });
            }
        } catch (e) {
            console.error(`Error searching keyword '${keyword}':`, e);
        }
    }

    if (allVideos.length === 0) {
        console.log('No videos found.');
        return;
    }

    console.log(`Found ${allVideos.length} unique videos.`);

    // 2. 비디오 상세 정보
    const videoDetails = [];
    const chunkIds = Array.from(videoIds);
    
    for (let i = 0; i < chunkIds.length; i += 50) {
        const chunk = chunkIds.slice(i, i + 50);
        try {
            const url = `https://www.googleapis.com/youtube/v3/videos?part=snippet,statistics,contentDetails&id=${chunk.join(',')}&key=${YOUTUBE_API_KEY}`;
            const response = await fetch(url);
            if (response.ok) {
                const data = await response.json();
                if (data.items) videoDetails.push(...data.items);
            }
        } catch (e) {
            console.error('Error fetching video details:', e);
        }
    }

    // 3. 채널 정보
    const channelIds = new Set(videoDetails.map(v => v.snippet.channelId));
    const channelDetails = new Map();
    const channelIdArray = Array.from(channelIds);

    for (let i = 0; i < channelIdArray.length; i += 50) {
        const chunk = channelIdArray.slice(i, i + 50);
        try {
            const url = `https://www.googleapis.com/youtube/v3/channels?part=statistics&id=${chunk.join(',')}&key=${YOUTUBE_API_KEY}`;
            const response = await fetch(url);
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

    // 4. 데이터 가공 및 필터링
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
            hiddenSubs: hiddenSubs
        };
    });

    // 필터링: 조회수 1만 이상, 1-3분, 구독자 100명 이상, 성과율 300% 이상, 한글 포함
    processedVideos = processedVideos.filter(v =>
        v.viewCount >= 10000 &&
        v.durationSec >= 60 &&
        v.durationSec <= 180 &&
        v.subCount >= 100 &&
        v.ratio >= 300 &&
        containsKorean(v.title) // 제목에 한글 포함된 영상만
    );

    // 정렬
    processedVideos.sort((a, b) => b.ratio - a.ratio);

    console.log(`Final processed videos (Korean only): ${processedVideos.length}`);

    // 파일 저장 (메타데이터 포함)
    const outputData = {
        meta: {
            updatedAt: new Date().toISOString(),
            keywords: selectedKeywords
        },
        videos: processedVideos
    };

    const outputPath = path.join(__dirname, '../data/trending.json');
    fs.writeFileSync(outputPath, JSON.stringify(outputData, null, 2));
    console.log(`Saved to ${outputPath}`);
}

updateTrendingData();
