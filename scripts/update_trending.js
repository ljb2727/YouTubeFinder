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
    '전원주택', '귀농귀촌', '시골살이', '50대취미', '60대취미',
    '건강정보', '노후준비', '은퇴생활', '트로트', '임영웅',
    '이찬원', '장민호', '정동원', '김호중', '송가인',
    '주말농장', '텃밭가꾸기', '등산', '파크골프', '게이트볼',
    '황토방', '이동식주택', '농막', '시골빈집', '시골땅',
    '자연인', '나는자연인이다', '약초캐기', '산나물', '버섯채취',
    '건강밥상', '항암식단', '당뇨식단', '고혈압식단', '관절운동',
    '허리통증', '무릎통증', '치매예방', '뇌운동', '기억력',
    '손주육아', '황혼육아', '손주사랑', '가족여행', '효도여행',
    '국내여행', '시장투어', '오일장', '맛집탐방', '노포맛집',
    '옛날노래', '7080가요', '흘러간노래', '팝송명곡', '클래식명곡',
    '미스터트롯', '불타는트롯맨', '현역가왕', '미스트롯', '전국노래자랑',
    '아침마당', '인간극장', '한국기행', '동네한바퀴', '생생정보',
    '6시내고향', '다큐멘터리', '역사스페셜', '동물의왕국', '세계테마기행',
    '부동산정보', '재테크', '연금관리', '상속증여', '세금절약',
    '스마트폰배우기', '키오스크사용법', '유튜브시청', '카카오톡사용법', '컴퓨터기초',
    '반려견', '반려묘', '강아지', '고양이', '애완동물',
    '다육이', '화초키우기', '베란다정원', '실내식물', '공기정화식물',
    '풍수지리', '운세', '사주팔자', '토정비결', '꿈해몽',
    '노래교실', '댄스교실', '요가', '스트레칭', '라인댄스',
    '서예', '캘리그라피', '수채화', '색연필화', '종이접기',
    '뜨개질', '바느질', '재봉틀', '리폼', '목공',
    '도자기', '가죽공예', '비즈공예', '매듭공예', '라탄공예',
    '수석', '분재', '난초', '야생화', '약초',
    '낚시', '민물낚시', '바다낚시', '캠핑', '차박',
    '캠핑카', '카라반', '오토캠핑', '노지캠핑', '백패킹',
    '자전거', '라이딩', '산악자전거', '전기자전거', '오토바이',
    '바둑', '장기', '체스', '당구', '탁구',
    '배드민턴', '테니스', '수영', '아쿠아로빅', '헬스',
    '마라톤', '걷기운동', '맨발걷기', '황톳길', '둘레길',
    '올레길', '자연휴양림', '국립공원', '도립공원', '수목원',
    '식물원', '동물원', '박물관', '미술관', '전시회',
    '공연', '콘서트', '뮤지컬', '연극', '영화',
    '드라마', '사극', '대하드라마', '일일드라마', '주말드라마',
    '예능', '토크쇼', '리얼리티', '오디션', '먹방',
    '쿡방', '집밥', '반찬만들기', '김치담그기', '장담그기',
    '막걸리만들기', '전통주', '와인', '커피', '차',
    '다도', '명상', '힐링', '마음챙김', '심리상담',
    '인문학', '철학', '역사', '문학', '시낭송',
    '독서', '오디오북', '책읽어주는', '북리뷰', '글쓰기',
    '자서전쓰기', '일기쓰기', '편지쓰기', '시쓰기', '수필쓰기',
    '봉사활동', '재능기부', '사회공헌', '지역사회', '동호회',
    '동창회', '친목회', '계모임', '산악회', '낚시회',
    '골프회', '당구회', '탁구회', '배드민턴회', '테니스회',
    '축구회', '야구회', '족구회', '게이트볼회', '파크골프회',
    '숏드라마', '막장드라마', '시니어드라마', '시니어썰', '노후지혜',
    '시니어로맨스', '고부갈등', '숏폼드라마', '황혼이야기', '쇼츠드라마', '시어머니'
];

async function updateTrendingData() {
    console.log('🚀 Starting trending data update...');
    
    // 최근 3주 (21일)
    const publishedAfter = new Date(Date.now() - 21 * 24 * 60 * 60 * 1000).toISOString();
    let allVideos = [];
    const videoIds = new Set();

    // 1. 키워드별 검색
    // API Quota 절약을 위해 키워드를 랜덤으로 10개만 선정하여 검색
    const shuffled = FIXED_TRENDING_KEYWORDS.sort(() => 0.5 - Math.random());
    const selectedKeywords = shuffled.slice(0, 10); 
    
    console.log(`Selected keywords: ${selectedKeywords.join(', ')}`);

    for (const keyword of selectedKeywords) {
        try {
            const url = `https://www.googleapis.com/youtube/v3/search?part=snippet&q=${encodeURIComponent(keyword)}&type=video&order=viewCount&publishedAfter=${publishedAfter}&videoDuration=short&maxResults=10&key=${YOUTUBE_API_KEY}`;
            
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

    // 필터링: 조회수 1만 이상, 1-3분, 구독자 100명 이상, 성과율 300% 이상
    processedVideos = processedVideos.filter(v =>
        v.viewCount >= 10000 &&
        v.durationSec >= 60 &&
        v.durationSec <= 180 &&
        v.subCount >= 100 &&
        v.ratio >= 300
    );

    // 정렬
    processedVideos.sort((a, b) => b.ratio - a.ratio);

    console.log(`Final processed videos: ${processedVideos.length}`);

    // 파일 저장
    const outputPath = path.join(__dirname, '../data/trending.json');
    fs.writeFileSync(outputPath, JSON.stringify(processedVideos, null, 2));
    console.log(`Saved to ${outputPath}`);
}

updateTrendingData();
