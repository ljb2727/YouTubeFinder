// ==========================================
// TRENDING LOGIC - OPTIMIZED FOR LOW API USAGE
// ==========================================

// 개발 모드 설정 (localStorage에서 읽기)
const USE_DUMMY_DATA = localStorage.getItem('DEV_MODE') === 'true';

// 전역에서 접근 가능하도록 window 객체에 할당
window.USE_DUMMY_DATA = USE_DUMMY_DATA;

console.log(`Trending 모드: ${USE_DUMMY_DATA ? '개발 (더미 데이터)' : '프로덕션 (실제 API)'}`);

// 페이지 로드 시 trending 탭 HTML 로드
document.addEventListener('DOMContentLoaded', async () => {
    const trendingContainer = document.getElementById('trendingTabContent');
    if (trendingContainer) {
        // HTML 내장 (CORS 문제 방지)
        const html = `
<div class="max-w-6xl mx-auto">
    <div class="mb-8">
        <h2 class="text-3xl font-bold text-white mb-2">
            최근 인기 동영상
        </h2>
        <p class="text-gray-400">
            고정된 키워드 조합으로 최근 3주간 조회수 5만 이상인 인기 영상을 모아봅니다. 24시간마다 자동 업데이트됩니다.
        </p>
    </div>

    <!-- 고정 키워드 표시 (읽기 전용) -->
    <div id="trendingKeywordsList" class="flex gap-2 flex-wrap mb-8"></div>

    <!-- Loading Indicator -->
    <div id="trendingLoader" class="hidden flex flex-col items-center justify-center py-20">
        <div class="w-12 h-12 border-4 border-purple-500/30 border-t-purple-500 rounded-full animate-spin mb-4"></div>
        <p class="text-gray-400 animate-pulse">인기 영상을 불러오는 중...</p>
    </div>

    <!-- Video Grid -->
    <div id="trendingGrid" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"></div>

    <!-- Empty Message -->
    <div id="emptyTrendingMessage" class="hidden text-center py-20 text-gray-500">
        <i class="fa-regular fa-fire text-4xl mb-4 opacity-50"></i>
        <p>조건에 맞는 인기 영상이 없습니다.</p>
    </div>

    <!-- Auto-update notice -->
    <p class="text-xs text-gray-500 text-center mt-8">
        ※ 최신 리스트는 24시간마다 자동 업데이트됩니다.
    </p>
</div>
        `;

        trendingContainer.innerHTML = html;
        // HTML 로드 후 trending 기능 초기화
        initTrending();
    }
});

// Trending 기능 초기화
function initTrending() {
    // 캐시된 데이터가 있으면 바로 표시
    if (cachedTrendingVideos.length > 0) {
        renderTrendingKeywords();
        renderTrendingVideos(cachedTrendingVideos);
    }
}

// 고정 키워드 (사용자가 변경 불가)
const FIXED_TRENDING_KEYWORDS = [
    "시니어드라마", "숏폼드라마", "쇼츠드라마", "시니어로맨스",
    "노후지혜", "숏드라마", "황혼이야기", "시어머니",
    "막장드라마", "고부갈등", "시니어썰"
];

let cachedTrendingVideos = JSON.parse(localStorage.getItem('cachedTrendingVideos')) || [];
let lastTrendingFetchTime = parseInt(localStorage.getItem('lastTrendingFetchTime')) || 0;

// 고정 키워드 표시 (읽기 전용)
function renderTrendingKeywords() {
    const list = document.getElementById('trendingKeywordsList');
    if (!list) return;

    list.innerHTML = '';
    FIXED_TRENDING_KEYWORDS.forEach(k => {
        const chip = document.createElement('div');
        chip.className = 'px-3 py-1.5 rounded-full bg-purple-600/30 border border-purple-500 text-white text-sm font-medium';
        chip.innerHTML = `<span>${k}</span>`;
        list.appendChild(chip);
    });
}

async function loadTrendingFeed(forceRefresh = false) {
    console.log('loadTrendingFeed called. Force:', forceRefresh);
    const grid = document.getElementById('trendingGrid');
    const loader = document.getElementById('trendingLoader');
    const emptyMsg = document.getElementById('emptyTrendingMessage');

    if (!grid || !loader || !emptyMsg) {
        console.error('Trending elements not found');
        return;
    }

    renderTrendingKeywords();

    // 캐시 확인 (24시간 = 86400000 ms)
    const now = Date.now();
    const cacheDuration = 24 * 60 * 60 * 1000;

    if (!forceRefresh && cachedTrendingVideos.length > 0 && (now - lastTrendingFetchTime < cacheDuration)) {
        console.log('Using cached trending videos');
        renderTrendingVideos(cachedTrendingVideos);
        return;
    }

    emptyMsg.classList.add('hidden');
    grid.innerHTML = '';
    loader.classList.remove('hidden');

    try {
        // ========== 개발 모드: 더미 데이터 사용 ==========
        if (window.DEV_MODE || localStorage.getItem('DEV_MODE') === 'true') {
            console.log('🔧 개발 모드: 더미 데이터를 사용합니다...');

            // 더미 데이터 (내장)
            const dummyData = [
                {
                    "id": { "videoId": "dummy_vid_001" },
                    "snippet": {
                        "title": "[더미] 시니어 전성시대! 60대 유튜버의 하루",
                        "channelTitle": "시니어 라이프",
                        "channelId": "dummy_channel_001",
                        "publishedAt": "2024-11-20T10:00:00Z",
                        "thumbnails": { "medium": { "url": "https://picsum.photos/320/180?random=1" } }
                    },
                    "statistics": { "viewCount": "150000", "subscriberCount": "10000", "hiddenSubscriberCount": false },
                    "contentDetails": { "duration": "PT2M30S" }
                },
                {
                    "id": { "videoId": "dummy_vid_002" },
                    "snippet": {
                        "title": "[더미] 황혼 이혼? 70대 부부의 솔직한 대화 (충격)",
                        "channelTitle": "부부 클리닉",
                        "channelId": "dummy_channel_002",
                        "publishedAt": "2024-11-22T15:30:00Z",
                        "thumbnails": { "medium": { "url": "https://picsum.photos/320/180?random=2" } }
                    },
                    "statistics": { "viewCount": "85000", "subscriberCount": "5000", "hiddenSubscriberCount": false },
                    "contentDetails": { "duration": "PT1M45S" }
                },
                {
                    "id": { "videoId": "dummy_vid_003" },
                    "snippet": {
                        "title": "[더미] 손주들이 오면 꼭 해주는 요리 TOP 3",
                        "channelTitle": "할머니의 부엌",
                        "channelId": "dummy_channel_003",
                        "publishedAt": "2024-11-25T09:00:00Z",
                        "thumbnails": { "medium": { "url": "https://picsum.photos/320/180?random=3" } }
                    },
                    "statistics": { "viewCount": "300000", "subscriberCount": "200000", "hiddenSubscriberCount": false },
                    "contentDetails": { "duration": "PT3M10S" }
                },
                {
                    "id": { "videoId": "dummy_vid_004" },
                    "snippet": {
                        "title": "[더미] 은퇴 후 귀농 1년차, 현실은 이렇습니다",
                        "channelTitle": "귀농 일기",
                        "channelId": "dummy_channel_004",
                        "publishedAt": "2024-11-18T12:00:00Z",
                        "thumbnails": { "medium": { "url": "https://picsum.photos/320/180?random=4" } }
                    },
                    "statistics": { "viewCount": "45000", "subscriberCount": "100", "hiddenSubscriberCount": false },
                    "contentDetails": { "duration": "PT5M00S" }
                },
                {
                    "id": { "videoId": "dummy_vid_005" },
                    "snippet": {
                        "title": "[더미] 5060 패션 꿀팁! 이것만 입어도 10년 젊어보임",
                        "channelTitle": "멋쟁이 시니어",
                        "channelId": "dummy_channel_005",
                        "publishedAt": "2024-11-24T18:00:00Z",
                        "thumbnails": { "medium": { "url": "https://picsum.photos/320/180?random=5" } }
                    },
                    "statistics": { "viewCount": "1200000", "subscriberCount": "50000", "hiddenSubscriberCount": false },
                    "contentDetails": { "duration": "PT0M58S" }
                },
                {
                    "id": { "videoId": "dummy_vid_006" },
                    "snippet": {
                        "title": "[더미] (성과율 대박) 구독자 500명인데 조회수 20만?!",
                        "channelTitle": "떡상 비밀",
                        "channelId": "dummy_channel_006",
                        "publishedAt": "2024-11-26T08:00:00Z",
                        "thumbnails": { "medium": { "url": "https://picsum.photos/320/180?random=6" } }
                    },
                    "statistics": { "viewCount": "200000", "subscriberCount": "500", "hiddenSubscriberCount": false },
                    "contentDetails": { "duration": "PT1M15S" }
                }
            ];

            let processedVideos = dummyData.map(item => {
                const viewCount = parseInt(item.statistics.viewCount) || 0;
                const subCount = parseInt(item.statistics.subscriberCount) || 0;
                const durationSec = parseDuration(item.contentDetails.duration);

                return {
                    id: item.id.videoId,
                    title: item.snippet.title,
                    thumbnail: item.snippet.thumbnails.medium?.url || 'https://via.placeholder.com/320x180',
                    channelTitle: item.snippet.channelTitle,
                    channelId: item.snippet.channelId,
                    publishedAt: item.snippet.publishedAt,
                    viewCount: viewCount,
                    durationSec: durationSec,
                    subCount: subCount,
                    ratio: subCount > 0 ? (viewCount / subCount) * 100 : 0,
                    hiddenSubs: item.statistics.hiddenSubscriberCount || false
                };
            });

            // 필터링: 조회수 5만 이상, 1-3분, 구독자 100명 이상
            processedVideos = processedVideos.filter(v =>
                v.viewCount >= 50000 &&
                v.durationSec >= 60 &&
                v.durationSec <= 180 &&
                v.subCount >= 100
            );

            // 성과율로 정렬
            processedVideos.sort((a, b) => b.ratio - a.ratio);

            console.log(`✅ 더미 데이터 ${processedVideos.length}개 로드 완료`);

            // 캐시 업데이트
            cachedTrendingVideos = processedVideos;
            lastTrendingFetchTime = Date.now();
            localStorage.setItem('cachedTrendingVideos', JSON.stringify(cachedTrendingVideos));
            localStorage.setItem('lastTrendingFetchTime', lastTrendingFetchTime);

            renderTrendingVideos(cachedTrendingVideos);
            loader.classList.add('hidden');
            return;
        }

        // ========== 프로덕션 모드: YouTube API 호출 생략 (index.html에 로직 있음) ==========
        console.log('⚠️ 프로덕션 모드는 index.html의 기존 trending 로직을 사용합니다.');
        loader.classList.add('hidden');
        emptyMsg.classList.remove('hidden');

    } catch (error) {
        console.error('Trending 로드 실패:', error);
        loader.classList.add('hidden');
        emptyMsg.classList.remove('hidden');
    }
}

function renderTrendingVideos(videos) {
    const grid = document.getElementById('trendingGrid');
    const emptyMsg = document.getElementById('emptyTrendingMessage');

    if (!grid) return;

    grid.innerHTML = '';

    if (videos.length === 0) {
        if (emptyMsg) emptyMsg.classList.remove('hidden');
        return;
    }

    if (emptyMsg) emptyMsg.classList.add('hidden');

    videos.forEach((video, index) => {
        const isFav = typeof isFavorite === 'function' ? isFavorite(video.channelId) : false;
        const timeAgoStr = typeof timeAgo === 'function' ? timeAgo(video.publishedAt) : '';
        const durationStr = typeof formatDuration === 'function' ? formatDuration(video.durationSec) : '';

        const isHighPerformer = video.ratio >= 300;
        const ratioDisplay = video.hiddenSubs ? 'N/A' : `${video.ratio.toFixed(0)}%`;
        const ratioColor = isHighPerformer ? 'text-red-400' : 'text-green-400';
        const glow = isHighPerformer ? 'shadow-[0_0_15px_rgba(239,68,68,0.15)]' : '';
        const cardBorderColor = isHighPerformer ? 'rgba(239, 68, 68, 0.3)' : 'rgba(255, 255, 255, 0.05)';

        // Fire Icons
        const bigFireCount = Math.floor(video.ratio / 1000);
        const smallFireCount = Math.floor((video.ratio % 1000) / 100);

        let fireIcons = '';
        if (bigFireCount > 0) {
            fireIcons +=
                '<i class="fa-solid fa-fire text-lg text-yellow-300 drop-shadow-[0_0_5px_rgba(253,224,71,0.8)]"></i>'.repeat(
                    bigFireCount
                );
        }
        if (smallFireCount > 0) {
            fireIcons += '<i class="fa-solid fa-fire text-sm"></i>'.repeat(
                Math.min(smallFireCount, 10)
            );
        }

        const safeTitle = video.title.replace(/'/g, "\\'").replace(/"/g, "&quot;");
        const safeChannel = video.channelTitle.replace(/'/g, "\\'").replace(/"/g, "&quot;");

        const card = document.createElement('div');
        card.className = `glass-card rounded-xl overflow-hidden flex flex-col h-full ${glow} animate-slide-up`;
        card.style.animationDelay = `${index * 50}ms`;
        card.style.border = `1px solid ${cardBorderColor}`;

        card.innerHTML = `
            <div class="relative group cursor-pointer" onclick="window.open('https://www.youtube.com/watch?v=${video.id.videoId}', '_blank')">
                <img src="${video.thumbnail}" alt="${safeTitle}" class="w-full h-48 object-cover transition-transform duration-500 group-hover:scale-105">
                <div class="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <i class="fa-brands fa-youtube text-red-500 text-4xl drop-shadow-lg"></i>
                </div>
                ${fireIcons
                    ? `<div class="absolute top-2 left-2 bg-gradient-to-r from-red-600 to-orange-500 text-white text-sm font-bold px-2 py-1 rounded shadow-lg flex items-center gap-0.5">${fireIcons}</div>`
                    : ""
                }
                <div class="absolute bottom-2 right-2 bg-black/80 text-white text-xs px-1.5 py-0.5 rounded">
                    ${timeAgoStr}
                </div>
            </div>
            
            <div class="p-5 flex flex-col flex-grow">
                <div class="flex justify-between items-start mb-3">
                    <div class="flex-1">
                        <div class="flex items-center gap-2 mb-1">
                            <span class="text-sm font-bold text-white">${video.channelTitle}</span>
                        </div>
                    </div>
                    <button id="fav-btn-trending-${video.channelId}" onclick="toggleFavorite(event, '${video.channelId}', '${safeChannel}')" class="text-lg transition-transform hover:scale-110 ml-2">
                        <i class="${isFav ? "fa-solid" : "fa-regular"} fa-heart ${isFav ? "text-red-500" : "text-gray-400 hover:text-red-400"}"></i>
                    </button>
                </div>

                <h3 class="text-base font-bold text-white mb-3 line-clamp-2 leading-snug" title="${safeTitle}">${video.title}</h3>
                
                <div class="text-sm text-gray-400 mb-3">
                    <i class="fa-regular fa-clock mr-1"></i>${durationStr}
                </div>
                
                <div class="grid grid-cols-3 gap-2 mb-4 bg-black/20 rounded-lg p-3 border border-white/5">
                    <div class="text-center">
                        <div class="text-xs text-gray-500 mb-1">조회수</div>
                        <div class="font-semibold text-white text-xs">${typeof formatKoreanNumber === 'function' ? formatKoreanNumber(video.viewCount) : video.viewCount}회</div>
                    </div>
                    <div class="text-center border-l border-white/10">
                        <div class="text-xs text-gray-500 mb-1">구독자</div>
                        <div class="font-semibold text-white text-xs">${video.hiddenSubs || video.subCount === 0
                    ? "비공개"
                    : (typeof formatKoreanNumber === 'function' ? formatKoreanNumber(video.subCount) : video.subCount) + "명"
                }</div>
                    </div>
                    <div class="text-center border-l border-white/10">
                        <div class="text-xs text-gray-500 mb-1">성과율</div>
                        <div class="font-bold ${ratioColor} text-xs">${ratioDisplay}</div>
                    </div>
                </div>

                <button onclick="typeof openAnalysisFromFeed === 'function' && openAnalysisFromFeed('${video.id.videoId}', '${safeTitle}', '${video.thumbnail}', '${safeChannel}', ${video.ratio}, ${video.hiddenSubs})" class="mt-auto w-full bg-white/5 hover:bg-blue-600 hover:text-white text-gray-300 border border-white/10 hover:border-blue-500 py-2.5 rounded-lg transition-all duration-200 font-medium flex items-center justify-center gap-2 group">
                    <i class="fa-solid fa-wand-magic-sparkles group-hover:animate-pulse"></i> AI 분석하기
                </button>
            </div>
        `;

        grid.appendChild(card);
    });
}

console.log('✅ trending.js 로드 완료');
