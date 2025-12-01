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
        <div class="flex justify-between items-end mb-2 flex-wrap gap-4">
            <div>
                <div class="flex items-center gap-3">
                    <h2 class="text-2xl md:text-3xl font-bold text-white">
                        최근 인기 동영상
                    </h2>
                    <button onclick="openUsageModal()" class="text-xs md:text-sm bg-white/10 hover:bg-white/20 text-gray-300 px-3 py-1.5 rounded-full transition-colors flex items-center gap-1.5 border border-white/10">
                        <i class="fa-regular fa-circle-question"></i>
                        <span>사용 방법</span>
                    </button>
                </div>
                <div id="trendingLastUpdated" class="text-xs text-gray-400 mt-1"></div>
            </div>
            
            <!-- 정렬 선택 -->
            <div class="flex items-center gap-2">
                <label class="text-sm text-gray-400 hidden md:inline">정렬:</label>
                <select id="trendingSortSelect" 
                    class="bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-sm text-white focus:outline-none focus:border-blue-500 transition-colors cursor-pointer hover:bg-white/10"
                    onchange="sortTrendingVideos(this.value)">
                    <option value="ratio" class="bg-gray-800 text-white">성과율 높은순</option>
                    <option value="viewsPerHour" class="bg-gray-800 text-white">시간당 조회수</option>
                    <option value="viewCount" class="bg-gray-800 text-white">조회수 많은순</option>
                    <option value="publishedAt" class="bg-gray-800 text-white">최근 업로드순</option>
                    <option value="subCount" class="bg-gray-800 text-white">구독자 많은순</option>
                </select>
            </div>
        </div>
        <p class="text-sm md:text-base text-gray-400 mb-4">
            고정된 키워드 조합으로 최근 3주간 조회수 5만 이상인 인기 영상을 모아봅니다. 매시 정각 자동 업데이트됩니다.
        </p>
        
        <!-- 적용된 키워드 표시 -->
        <div class="bg-white/5 rounded-lg p-4 mb-6 border border-white/10">
            <p class="text-xs text-gray-500 mb-2 font-bold">적용된 검색 키워드</p>
            <div id="trendingKeywordsList" class="flex gap-2 flex-wrap"></div>
        </div>
    </div>

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
        ※ 최신 리스트는 매시 정각 자동 업데이트됩니다.
    </p>

    <!-- Usage Guide Modal -->
    <div id="usageModal" class="fixed inset-0 z-50 hidden" aria-labelledby="modal-title" role="dialog" aria-modal="true">
        <!-- Backdrop -->
        <div class="absolute inset-0 bg-black/80 backdrop-blur-sm transition-opacity" onclick="closeUsageModal()"></div>
        
        <!-- Modal Panel -->
        <div class="relative z-10 flex min-h-full items-center justify-center p-4 text-center sm:p-0">
            <div class="relative transform overflow-hidden rounded-2xl bg-[#1a1a1a] border border-white/10 text-left shadow-2xl transition-all sm:my-8 sm:w-full sm:max-w-lg">
                <!-- Header -->
                <div class="bg-white/5 px-4 py-3 sm:px-6 border-b border-white/10 flex justify-between items-center">
                    <h3 class="text-lg font-bold text-white flex items-center gap-2" id="modal-title">
                        <i class="fa-solid fa-book-open text-blue-400"></i> 사용 방법 및 지표 설명
                    </h3>
                    <button type="button" onclick="closeUsageModal()" class="text-gray-400 hover:text-white transition-colors">
                        <i class="fa-solid fa-xmark text-xl"></i>
                    </button>
                </div>
                
                <!-- Body -->
                <div class="px-4 py-5 sm:p-6 space-y-6 max-h-[70vh] overflow-y-auto custom-scrollbar">
                    
                    <!-- Section 1: 지표 설명 -->
                    <div>
                        <h4 class="text-blue-400 font-bold mb-3 text-sm uppercase tracking-wider">📊 핵심 지표 이해하기</h4>
                        <div class="space-y-3">
                            <div class="bg-white/5 rounded-lg p-3 border border-white/5">
                                <div class="flex justify-between items-center mb-1">
                                    <span class="font-bold text-white">🔥 성과율 (Performance Ratio)</span>
                                    <span class="text-xs bg-red-500/20 text-red-300 px-2 py-0.5 rounded">핵심 지표</span>
                                </div>
                                <p class="text-sm text-gray-300 mb-2">구독자 대비 조회수가 얼마나 잘 나왔는지 보여줍니다.</p>
                                <div class="bg-black/30 rounded p-2 text-xs text-gray-400 font-mono">
                                    (조회수 ÷ 구독자수) × 100
                                </div>
                                <p class="text-xs text-gray-400 mt-2">
                                    • <span class="text-green-400">100% 이상</span>: 구독자보다 많은 사람이 시청함 (알고리즘 탐)<br>
                                    • <span class="text-red-400">300% 이상</span>: 대박 터진 영상! 벤치마킹 1순위
                                </p>
                            </div>

                            <div class="bg-white/5 rounded-lg p-3 border border-white/5">
                                <div class="flex justify-between items-center mb-1">
                                    <span class="font-bold text-white">⚡ 시간당 조회수 (Views/Hr)</span>
                                </div>
                                <p class="text-sm text-gray-300">영상이 업로드된 후 현재까지 시간당 평균 몇 명이 봤는지 나타냅니다.</p>
                                <p class="text-xs text-gray-400 mt-1">이 수치가 높을수록 현재 가장 뜨거운 반응을 얻고 있는 영상입니다.</p>
                            </div>
                        </div>
                    </div>

                    <!-- Section 2: 활용 팁 -->
                    <div>
                        <h4 class="text-purple-400 font-bold mb-3 text-sm uppercase tracking-wider">💡 이렇게 활용해보세요</h4>
                        <ul class="space-y-2 text-sm text-gray-300 list-disc list-inside">
                            <li><span class="text-white font-bold">성과율 300% 이상</span>인 영상을 찾아 썸네일과 제목 패턴을 분석하세요.</li>
                            <li><span class="text-white font-bold">AI 분석하기</span> 버튼을 눌러 해당 영상이 왜 떴는지 심층 분석을 받아보세요.</li>
                            <li>비슷한 주제의 영상을 만들 때, 상위 노출된 키워드와 태그를 참고하세요.</li>
                        </ul>
                    </div>
                </div>

                <!-- Footer -->
                <div class="bg-white/5 px-4 py-3 sm:flex sm:flex-row-reverse sm:px-6 border-t border-white/10">
                    <button type="button" onclick="closeUsageModal()" class="inline-flex w-full justify-center rounded-lg bg-blue-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-500 sm:ml-3 sm:w-auto transition-colors">
                        확인했습니다
                    </button>
                </div>
            </div>
        </div>
    </div>
</div>
        `;

        trendingContainer.innerHTML = html;
        // HTML 로드 후 trending 기능 초기화
        initTrending();
    }
});

// Trending 기능 초기화
function initTrending() {
    // 저장된 정렬 값 불러오기
    const savedSort = localStorage.getItem('trendingSort') || 'ratio';
    const sortSelect = document.getElementById('trendingSortSelect');
    if (sortSelect) {
        sortSelect.value = savedSort;
    }

    // 캐시된 데이터가 있으면 바로 표시
    if (cachedTrendingVideos.length > 0) {
        // 메타데이터가 있으면 표시
        const cachedMeta = JSON.parse(localStorage.getItem('cachedTrendingMeta'));
        if (cachedMeta) {
            renderTrendingMeta(cachedMeta);
        } else {
            // 없으면 기본 키워드 표시
            renderTrendingKeywords(FIXED_TRENDING_KEYWORDS);
        }
        // 저장된 정렬 기준으로 정렬 후 렌더링
        sortTrendingVideos(savedSort, false);
    } else {
        // 데이터가 없으면 기본 키워드라도 표시
        renderTrendingKeywords(FIXED_TRENDING_KEYWORDS);
    }
}

// 고정 키워드 (기본값, 서버 데이터 없을 시 사용)
const FIXED_TRENDING_KEYWORDS = [
    '막장드라마', '시니어드라마', '시니어썰', '노후지혜', '시니어로맨스', 
    '고부갈등', '숏폼드라마', '황혼이야기', '쇼츠드라마', '시어머니', 
    '반전드라마', '시니어사연', '사이다사연', '실제사연', '시월드', 
    '참교육', '숏드라마', '실화사연', '인생사연', '반전사연', 
    '노후사연', '노년사연', '가족사연', '가족갈등', '사연'
];

let cachedTrendingVideos = JSON.parse(localStorage.getItem('cachedTrendingVideos')) || [];
let lastTrendingFetchTime = parseInt(localStorage.getItem('lastTrendingFetchTime')) || 0;

// 메타데이터 렌더링 (업데이트 시간 및 키워드)
function renderTrendingMeta(meta) {
    if (!meta) return;

    // 업데이트 시간 표시
    const timeEl = document.getElementById('trendingLastUpdated');
    if (timeEl && meta.updatedAt) {
        const date = new Date(meta.updatedAt);
        const timeStr = date.toLocaleString('ko-KR', { 
            month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' 
        });
        timeEl.innerHTML = `<i class="fa-regular fa-clock mr-1"></i>업데이트: ${timeStr}`;
    }

    // 키워드 표시
    if (meta.keywords && Array.isArray(meta.keywords)) {
        renderTrendingKeywords(meta.keywords);
    }
}

// 키워드 칩 렌더링
function renderTrendingKeywords(keywords) {
    const list = document.getElementById('trendingKeywordsList');
    if (!list) return;

    list.innerHTML = '';
    keywords.forEach(k => {
        const chip = document.createElement('div');
        chip.className = 'px-3 py-1.5 rounded-full bg-purple-600/30 border border-purple-500 text-white text-xs font-medium';
        chip.innerHTML = `<span>#${k}</span>`;
        list.appendChild(chip);
    });
}

async function loadTrendingFeed(forceRefresh = false) {
    console.log('loadTrendingFeed called. Force:', forceRefresh);
    const grid = document.getElementById('trendingGrid');
    const loader = document.getElementById('trendingLoader');
    const emptyMsg = document.getElementById('emptyTrendingMessage');

    if (!grid || !loader || !emptyMsg) {
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
                        "title": "[더미] 황혼 이혼? 70대 부부의 솔픈 대화 (충격)",
                        "channelTitle": "부부 클리닉",
                        "channelId": "dummy_channel_002",
                        "publishedAt": "2024-11-22T15:30:00Z",
                        "thumbnails": { "medium": { "url": "https://picsum.photos/320/180?random=2" } }
                    },
                    "statistics": { "viewCount": "85000", "subscriberCount": "5000", "hiddenSubscriberCount": false },
                    "contentDetails": { "duration": "PT1M45S" }
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
                
                // 더미 데이터용 시간당 조회수 계산
                const publishedDate = new Date(item.snippet.publishedAt);
                const hoursSincePublished = Math.max(1, (Date.now() - publishedDate.getTime()) / (1000 * 60 * 60));
                const viewsPerHour = Math.round(viewCount / hoursSincePublished);

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
                    viewsPerHour: viewsPerHour,
                    hiddenSubs: item.statistics.hiddenSubscriberCount || false
                };
            });

            // 필터링: 조회수 5만 이상, 1-3분, 구독자 100명 이상, 성과율 300% 이상
            processedVideos = processedVideos.filter(v =>
                v.viewCount >= 50000 &&
                v.durationSec >= 60 &&
                v.durationSec <= 180 &&
                v.subCount >= 100 &&
                v.ratio >= 300
            );

            // 성과율로 정렬
            processedVideos.sort((a, b) => b.ratio - a.ratio);

            console.log(`✅ 더미 데이터 ${processedVideos.length}개 로드 완료`);

            // 캐시 업데이트
            cachedTrendingVideos = processedVideos;
            lastTrendingFetchTime = Date.now();
            localStorage.setItem('cachedTrendingVideos', JSON.stringify(cachedTrendingVideos));
            localStorage.setItem('lastTrendingFetchTime', lastTrendingFetchTime);

            // 저장된 정렬 기준으로 정렬 후 렌더링
            const savedSort = localStorage.getItem('trendingSort') || 'ratio';
            sortTrendingVideos(savedSort, false);
            loader.classList.add('hidden');
            return;
        }

        // ========== 프로덕션 모드: 정적 데이터 파일 로드 (GitHub Actions 갱신) ==========
        console.log('🚀 프로덕션 모드: 서버에서 갱신된 인기 영상 데이터를 로드합니다...');

        try {
            // GitHub Actions가 생성한 JSON 파일 로드
            // 캐싱 방지를 위해 타임스탬프 추가
            const response = await fetch(`data/trending.json?t=${Date.now()}`);
            
            if (!response.ok) {
                throw new Error(`데이터 파일을 찾을 수 없습니다. (${response.status})`);
            }

            const rawData = await response.json();
            let videos = [];
            let meta = null;

            // 데이터 구조 확인 (배열 vs 객체)
            if (Array.isArray(rawData)) {
                videos = rawData;
            } else if (rawData.videos && Array.isArray(rawData.videos)) {
                videos = rawData.videos;
                meta = rawData.meta;
            }

            if (videos.length === 0) {
                console.log('데이터 파일이 비어있습니다.');
                loader.classList.add('hidden');
                emptyMsg.classList.remove('hidden');
                return;
            }

            console.log(`✅ 정적 데이터 ${videos.length}개 로드 완료`);

            // 메타데이터 처리
            if (meta) {
                renderTrendingMeta(meta);
                localStorage.setItem('cachedTrendingMeta', JSON.stringify(meta));
            } else {
                // 메타데이터가 없으면 기본 키워드 표시
                renderTrendingKeywords(FIXED_TRENDING_KEYWORDS);
            }

            // 캐시 업데이트
            cachedTrendingVideos = videos;
            lastTrendingFetchTime = Date.now();
            localStorage.setItem('cachedTrendingVideos', JSON.stringify(cachedTrendingVideos));
            localStorage.setItem('lastTrendingFetchTime', lastTrendingFetchTime);

            // 저장된 정렬 기준으로 정렬 후 렌더링
            const savedSort = localStorage.getItem('trendingSort') || 'ratio';
            sortTrendingVideos(savedSort, false);
            loader.classList.add('hidden');

        } catch (fileError) {
            console.warn('정적 데이터 로드 실패, API 직접 호출을 시도하지 않습니다 (비용 절감).', fileError);
            loader.classList.add('hidden');
            emptyMsg.classList.remove('hidden');
        }

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

        // Fire Icons (utils.js의 공통 함수 사용)
        const fireIcons = generateFireIcons(video.ratio);

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
                
                <div class="grid grid-cols-2 gap-2 mb-4 bg-black/20 rounded-lg p-3 border border-white/5">
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
                    <div class="text-center border-t border-white/10 pt-2 mt-1">
                        <div class="text-xs text-gray-500 mb-1">성과율</div>
                        <div class="font-bold ${ratioColor} text-xs">${ratioDisplay}</div>
                    </div>
                    <div class="text-center border-l border-t border-white/10 pt-2 mt-1">
                        <div class="text-xs text-gray-500 mb-1">시간당</div>
                        <div class="font-bold text-blue-400 text-xs">${typeof formatKoreanNumber === 'function' ? formatKoreanNumber(video.viewsPerHour || 0) : (video.viewsPerHour || 0)}/hr</div>
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

// 정렬 기능
function sortTrendingVideos(sortBy, save = true) {
    if (!cachedTrendingVideos || cachedTrendingVideos.length === 0) return;

    console.log(`Sorting trending videos by: ${sortBy}`);

    const sorted = [...cachedTrendingVideos].sort((a, b) => {
        if (sortBy === 'viewCount') {
            return b.viewCount - a.viewCount;
        } else if (sortBy === 'publishedAt') {
            return new Date(b.publishedAt) - new Date(a.publishedAt);
        } else if (sortBy === 'subCount') {
            return b.subCount - a.subCount;
        } else if (sortBy === 'viewsPerHour') {
            return (b.viewsPerHour || 0) - (a.viewsPerHour || 0);
        } else {
            // 기본값: ratio (성과율)
            return b.ratio - a.ratio;
        }
    });

    renderTrendingVideos(sorted);

    if (save) {
        localStorage.setItem('trendingSort', sortBy);
    }
}

// 모달 제어 함수
function openUsageModal() {
    const modal = document.getElementById('usageModal');
    if (modal) {
        modal.classList.remove('hidden');
        // 애니메이션 효과
        const panel = modal.querySelector('.relative.transform');
        if (panel) {
            panel.classList.remove('opacity-0', 'translate-y-4', 'sm:translate-y-0', 'sm:scale-95');
            panel.classList.add('opacity-100', 'translate-y-0', 'sm:scale-100');
        }
    }
}

function closeUsageModal() {
    const modal = document.getElementById('usageModal');
    if (modal) {
        modal.classList.add('hidden');
    }
}

// 전역 스코프에 함수 할당
window.openUsageModal = openUsageModal;
window.closeUsageModal = closeUsageModal;

console.log('✅ trending.js 로드 완료');
