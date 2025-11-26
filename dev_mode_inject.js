// ==========================================
// 개발 모드: 더미 데이터 주입
// ==========================================

console.log('🔧 dev_mode_inject.js 로드됨');

// 더미 검색 데이터 (내장)
const DUMMY_SEARCH_DATA = {
    "items": [
        {
            "id": { "videoId": "search_dummy_001" },
            "snippet": {
                "title": "[더미] 시니어를 위한 쇼츠 제작 꿀팁 10가지",
                "channelTitle": "시니어 크리에이터",
                "channelId": "search_ch_001",
                "publishedAt": "2024-11-20T10:00:00Z",
                "thumbnails": { "medium": { "url": "https://picsum.photos/320/180?random=10" } }
            }
        },
        {
            "id": { "videoId": "search_dummy_002" },
            "snippet": {
                "title": "[더미] 구독자 100명으로 조회수 10만 찍은 비결",
                "channelTitle": "유튜브 마스터",
                "channelId": "search_ch_002",
                "publishedAt": "2024-11-22T15:30:00Z",
                "thumbnails": { "medium": { "url": "https://picsum.photos/320/180?random=11" } }
            }
        },
        {
            "id": { "videoId": "search_dummy_003" },
            "snippet": {
                "title": "[더미] 황혼 로맨스 드라마 1화 - 60대의 두근거림",
                "channelTitle": "드라마 채널",
                "channelId": "search_ch_003",
                "publishedAt": "2024-11-25T09:00:00Z",
                "thumbnails": { "medium": { "url": "https://picsum.photos/320/180?random=12" } }
            }
        },
        {
            "id": { "videoId": "search_dummy_004" },
            "snippet": {
                "title": "[더미] 성과율 500% 달성한 시니어 유튜버의 노하우",
                "channelTitle": "성공 사례",
                "channelId": "search_ch_004",
                "publishedAt": "2024-11-18T12:00:00Z",
                "thumbnails": { "medium": { "url": "https://picsum.photos/320/180?random=13" } }
            }
        },
        {
            "id": { "videoId": "search_dummy_005" },
            "snippet": {
                "title": "[더미] 할머니의 요리 비법 - 손주가 좋아하는 간식",
                "channelTitle": "할머니 레시피",
                "channelId": "search_ch_005",
                "publishedAt": "2024-11-24T18:00:00Z",
                "thumbnails": { "medium": { "url": "https://picsum.photos/320/180?random=14" } }
            }
        },
        {
            "id": { "videoId": "search_dummy_006" },
            "snippet": {
                "title": "[더미] 중년 부부의 여행 브이로그 - 제주도 3박 4일",
                "channelTitle": "여행 일기",
                "channelId": "search_ch_006",
                "publishedAt": "2024-11-21T14:00:00Z",
                "thumbnails": { "medium": { "url": "https://picsum.photos/320/180?random=15" } }
            }
        }
    ],
    "videoStats": [
        { "id": "search_dummy_001", "statistics": { "viewCount": "85000", "subscriberCount": "5000" }, "contentDetails": { "duration": "PT2M15S" } },
        { "id": "search_dummy_002", "statistics": { "viewCount": "120000", "subscriberCount": "100" }, "contentDetails": { "duration": "PT1M45S" } },
        { "id": "search_dummy_003", "statistics": { "viewCount": "200000", "subscriberCount": "50000" }, "contentDetails": { "duration": "PT2M30S" } },
        { "id": "search_dummy_004", "statistics": { "viewCount": "95000", "subscriberCount": "500" }, "contentDetails": { "duration": "PT1M50S" } },
        { "id": "search_dummy_005", "statistics": { "viewCount": "150000", "subscriberCount": "20000" }, "contentDetails": { "duration": "PT2M00S" } },
        { "id": "search_dummy_006", "statistics": { "viewCount": "70000", "subscriberCount": "8000" }, "contentDetails": { "duration": "PT2M45S" } }
    ],
    "channelStats": [
        { "id": "search_ch_001", "statistics": { "subscriberCount": "5000", "hiddenSubscriberCount": false } },
        { "id": "search_ch_002", "statistics": { "subscriberCount": "100", "hiddenSubscriberCount": false } },
        { "id": "search_ch_003", "statistics": { "subscriberCount": "50000", "hiddenSubscriberCount": false } },
        { "id": "search_ch_004", "statistics": { "subscriberCount": "500", "hiddenSubscriberCount": false } },
        { "id": "search_ch_005", "statistics": { "subscriberCount": "20000", "hiddenSubscriberCount": false } },
        { "id": "search_ch_006", "statistics": { "subscriberCount": "8000", "hiddenSubscriberCount": false } }
    ]
};

// 원본 함수 백업
if (typeof window !== 'undefined') {
    const originalSearchVideos = window.searchVideos;
    const originalOpenAnalysisFromFeed = window.openAnalysisFromFeed;

    // searchVideos 오버라이드
    window.searchVideos = async function () {
        if (!window.DEV_MODE) {
            return originalSearchVideos?.apply(this, arguments);
        }

        console.log('🔧 개발 모드: 더미 검색 데이터 사용');

        const searchLoader = document.getElementById('searchLoader');
        const resultsSection = document.getElementById('resultsSection');
        const emptyMessage = document.getElementById('emptySearchMessage');

        if (searchLoader) searchLoader.classList.remove('hidden');
        if (resultsSection) resultsSection.classList.add('hidden');
        if (emptyMessage) emptyMessage.classList.add('hidden');

        // Simulate API delay
        await new Promise(resolve => setTimeout(resolve, 800));

        try {
            const dummyData = DUMMY_SEARCH_DATA;

            // Process videos (simulate real logic)
            const statsMap = {};
            const durationMap = {};
            dummyData.videoStats.forEach(item => {
                statsMap[item.id] = item.statistics;
                durationMap[item.id] = item.contentDetails.duration;
            });

            const channelMap = {};
            dummyData.channelStats.forEach(ch => {
                channelMap[ch.id] = ch.statistics;
            });

            const processedVideos = dummyData.items.map(video => {
                const videoId = video.id.videoId;
                const stats = statsMap[videoId];
                const duration = durationMap[videoId];
                const chStats = channelMap[video.snippet.channelId];

                const viewCount = parseInt(stats?.viewCount) || 0;
                const subCount = parseInt(chStats?.subscriberCount) || 0;
                const hiddenSubs = chStats?.hiddenSubscriberCount || false;

                let ratio = 0;
                if (subCount > 0) ratio = (viewCount / subCount) * 100;

                return {
                    id: { videoId: videoId },
                    snippet: video.snippet,
                    statistics: stats,
                    contentDetails: { duration: duration },
                    channelId: video.snippet.channelId,
                    ratio: ratio,
                    subCount: subCount,
                    hiddenSubs: hiddenSubs
                };
            });

            // Update global currentVideos
            if (typeof window.currentVideos !== 'undefined') {
                window.currentVideos = processedVideos;
            }

            // Render results
            if (typeof window.renderResults === 'function') {
                window.renderResults(processedVideos);
            }

            if (searchLoader) searchLoader.classList.add('hidden');

            if (typeof window.showToast === 'function') {
                window.showToast('🔧 더미 데이터 로드 완료!', 'success');
            }
        } catch (error) {
            console.error('더미 데이터 로드 실패:', error);
            if (searchLoader) searchLoader.classList.add('hidden');
            if (typeof window.showToast === 'function') {
                window.showToast('더미 데이터 로드 실패', 'error');
            }
        }
    };

    // openAnalysisFromFeed 오버라이드
    window.openAnalysisFromFeed = async function (id, title, thumbnail, channelTitle, ratio, hiddenSubs) {
        // Call original first to set up modal
        if (originalOpenAnalysisFromFeed) {
            originalOpenAnalysisFromFeed.call(this, id, title, thumbnail, channelTitle, ratio, hiddenSubs);
        }

        if (!window.DEV_MODE) {
            // Let original handle the analysis
            return;
        }

        console.log('🔧 개발 모드: 더미 AI 분석 데이터 사용');

        // Wait for modal to open
        await new Promise(resolve => setTimeout(resolve, 100));

        const aiLoader = document.getElementById('aiLoader');
        const analysisResult = document.getElementById('analysisResult');

        if (aiLoader) aiLoader.classList.remove('hidden');
        if (analysisResult) analysisResult.classList.add('hidden');

        // Simulate AI analysis delay
        await new Promise(resolve => setTimeout(resolve, 1500));

        // Set dummy analysis results
        const summaryEl = document.getElementById('aiSummary');
        const reactionsEl = document.getElementById('aiReactions');
        const ideasList = document.getElementById('ideasList');

        if (summaryEl) {
            summaryEl.textContent = '[더미 분석] 이 영상은 시니어층을 타겟으로 한 콘텐츠로, 쇼츠 형식의 드라마틱한 구성이 돋보입니다. 감정선이 잘 전달되며, 짧은 시간 안에 공감을 유도하는데 성공했습니다.';
        }

        if (reactionsEl) {
            reactionsEl.textContent = '[더미 반응] 시청자들은 "공감된다", "우리 부모님 생각난다", "다음편 기대" 등의 긍정적인 반응을 보이고 있습니다. 특히 50-60대 시청자층에서 높은 참여도를 보입니다.';
        }

        if (ideasList) {
            ideasList.innerHTML = '';
            const dummyIdeas = [
                '가족 간의 갈등과 화해를 다루는 스토리',
                '시니어의 은퇴 후 새로운 도전 에피소드',
                '손주와 조부모의 따뜻한 일상',
                '황혼 이혼 또는 황혼 재혼 스토리',
                '시니어의 SNS 도전기'
            ];

            dummyIdeas.forEach(idea => {
                const btn = document.createElement('button');
                btn.className = 'w-full text-left px-4 py-3 rounded-lg border border-white/10 bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white transition-all flex items-start gap-3';
                btn.innerHTML = `
                    <i class="fa-regular fa-lightbulb text-purple-400 mt-0.5"></i>
                    <span class="flex-1">${idea}</span>
                `;
                btn.onclick = () => {
                    if (typeof window.generateStoryline === 'function') {
                        window.generateStoryline(idea);
                    }
                };
                ideasList.appendChild(btn);
            });
        }

        if (aiLoader) aiLoader.classList.add('hidden');
        if (analysisResult) analysisResult.classList.remove('hidden');
    };

    console.log('✅ 개발 모드 함수 오버라이드 완료');
}
