// ==========================================
// CONFIGURATION
// ==========================================
let YOUTUBE_API_KEYS =
    JSON.parse(localStorage.getItem("YOUTUBE_API_KEYS")) || [];
if (YOUTUBE_API_KEYS.length === 0) {
    const oldKey = localStorage.getItem("YOUTUBE_API_KEY");
    if (oldKey) YOUTUBE_API_KEYS.push(oldKey);
}

let GEMINI_API_KEYS = JSON.parse(localStorage.getItem('GEMINI_API_KEYS')) || [];
if (GEMINI_API_KEYS.length === 0) {
    const oldKey = localStorage.getItem("GEMINI_API_KEY");
    if (oldKey) GEMINI_API_KEYS.push(oldKey);
}

let currentYoutubeKeyIndex =
    parseInt(localStorage.getItem("currentYoutubeKeyIndex")) || 0;
let currentGeminiKeyIndex =
    parseInt(localStorage.getItem("currentGeminiKeyIndex")) || 0;

// Validate index bounds
if (currentYoutubeKeyIndex >= YOUTUBE_API_KEYS.length)
    currentYoutubeKeyIndex = 0;
if (currentGeminiKeyIndex >= GEMINI_API_KEYS.length)
    currentGeminiKeyIndex = 0;

let YOUTUBE_API_KEY = YOUTUBE_API_KEYS[currentYoutubeKeyIndex] || '';
let GEMINI_API_KEY = GEMINI_API_KEYS[currentGeminiKeyIndex] || '';

function rotateYoutubeKey() {
    if (YOUTUBE_API_KEYS.length <= 1) return false;
    currentYoutubeKeyIndex = (currentYoutubeKeyIndex + 1) % YOUTUBE_API_KEYS.length;
    YOUTUBE_API_KEY = YOUTUBE_API_KEYS[currentYoutubeKeyIndex];
    console.log(`Rotated YouTube API Key to index ${currentYoutubeKeyIndex}`);
    showToast(`API 키 전환됨: ${currentYoutubeKeyIndex + 1}번 키 사용`, 'info');
    return true;
}

function rotateGeminiKey() {
    if (GEMINI_API_KEYS.length <= 1) return false;
    currentGeminiKeyIndex = (currentGeminiKeyIndex + 1) % GEMINI_API_KEYS.length;
    GEMINI_API_KEY = GEMINI_API_KEYS[currentGeminiKeyIndex];
    console.log(`Rotated Gemini API Key to index ${currentGeminiKeyIndex}`);
    showToast(`Gemini API 키 전환됨: ${currentGeminiKeyIndex + 1}번 키 사용`, 'info');
    return true;
}

// State
let currentVideos = [];
let currentVideoData = null;
let favoriteChannels =
    JSON.parse(localStorage.getItem("favoriteChannels")) || [];
let recentSearches =
    JSON.parse(localStorage.getItem("recentSearches")) || [];

// ==========================================
// UTILITIES
// ==========================================

const formatKoreanNumber = (num) => {
    if (num >= 100000000) return (num / 100000000).toFixed(1) + "억";
    if (num >= 10000) return (num / 10000).toFixed(1) + "만";
    if (num >= 1000) return (num / 1000).toFixed(1) + "천";
    return num.toString();
};

// timeAgo와 formatDuration 함수는 utils.js에 정의되어 있음

const parseDuration = (duration) => {
    const match = duration.match(/PT(\d+H)?(\d+M)?(\d+S)?/);
    const hours = parseInt(match[1]) || 0;
    const minutes = parseInt(match[2]) || 0;
    const seconds = parseInt(match[3]) || 0;
    return hours * 3600 + minutes * 60 + seconds;
};

const parseNumber = (str) => {
    if (!str) return 0;
    if (typeof str === "number") return str;
    return parseInt(str.toString().replace(/,/g, "")) || 0;
};

const getRandomColor = () => {
    const colors = [
        '#ef4444', '#f97316', '#f59e0b', '#84cc16', '#10b981',
        '#06b6d4', '#3b82f6', '#6366f1', '#8b5cf6', '#d946ef', '#f43f5e'
    ];
    return colors[Math.floor(Math.random() * colors.length)];
};

async function fetchWithRotation(urlBuilder, type = 'youtube') {
    const maxRetries = type === 'youtube' ? YOUTUBE_API_KEYS.length : GEMINI_API_KEYS.length;
    let attempts = 0;

    while (attempts < maxRetries) {
        try {
            const currentKey = type === 'youtube' ? YOUTUBE_API_KEY : GEMINI_API_KEY;
            const url = urlBuilder(currentKey);
            const response = await fetch(url);

            if (response.status === 403) {
                const data = await response.json();
                // Check if it's a quota error or key error
                // YouTube API often returns 403 for quota exceeded
                console.warn(`API Key ${type} index ${type === 'youtube' ? currentYoutubeKeyIndex : currentGeminiKeyIndex} failed (403). Rotating...`);
                const rotated = type === 'youtube' ? rotateYoutubeKey() : rotateGeminiKey();
                if (!rotated) {
                    alert('모든 API 키의 할당량이 초과되었습니다. 설정에서 다른 키를 선택하거나 새로운 키를 입력해주세요.');
                    openSettings();
                    throw new Error('All API keys exhausted or failed.');
                }
                attempts++;
                continue;
            }

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            return response;
        } catch (error) {
            console.error(`Attempt ${attempts + 1} failed:`, error);
            if (attempts === maxRetries - 1) throw error;
            const rotated = type === 'youtube' ? rotateYoutubeKey() : rotateGeminiKey();
            if (!rotated) throw error;
            attempts++;
        }
    }
}

const showToast = (message, type = 'info') => {
    const container = document.getElementById('toast-container');
    const toast = document.createElement('div');
    toast.className = 'toast';

    let icon = 'fa-info-circle';
    let color = 'text-blue-400';

    if (type === 'error') {
        icon = 'fa-circle-exclamation';
        color = 'text-red-400';
        toast.style.borderLeftColor = '#ef4444';
    } else if (type === 'success') {
        icon = 'fa-check-circle';
        color = 'text-green-400';
        toast.style.borderLeftColor = '#22c55e';
    }

    toast.innerHTML = `
    <i class="fa-solid ${icon} ${color} text-xl"></i>
    <span class="font-medium">${message}</span>
`;

    container.appendChild(toast);

    setTimeout(() => {
        toast.style.animation = "slideInRight 0.3s ease-in reverse forwards";
        setTimeout(() => toast.remove(), 300);
    }, 3000);
};

const handleEnter = (e) => {
    if (e.key === "Enter") searchVideos();
};

const updateRatioLabel = (val) => {
    const ratio = val * 10;
    const label = document.getElementById('ratioValueLabel');

    let text = '';
    let colorClass = 'text-blue-400';

    if (ratio < 100) {
        text = "일반";
        colorClass = "text-gray-300";
    } else if (ratio < 300) {
        text = "우수";
        colorClass = "text-green-400";
    } else if (ratio < 500) {
        text = "대박";
        colorClass = "text-blue-400";
    } else {
        text = "초대박";
        colorClass = "text-purple-400";
    }

    label.className = `font-bold transition-all ${colorClass}`;
    label.innerText = `${text} (${ratio}% 이상)`;
};

// ==========================================
// FILTER PERSISTENCE
// ==========================================
function saveFilters() {
    localStorage.setItem(
        "filter_duration",
        document.getElementById("durationFilter").value
    );
    localStorage.setItem(
        "filter_date",
        document.getElementById("dateFilter").value
    );
    localStorage.setItem(
        "filter_ratio",
        document.getElementById("ratioSlider").value
    );
    localStorage.setItem(
        "filter_viewCount",
        document.getElementById("viewCountFilter").value
    );
}

function loadFilters() {
    const duration = localStorage.getItem("filter_duration");
    const date = localStorage.getItem("filter_date");
    const ratio = localStorage.getItem("filter_ratio");
    const viewCount = localStorage.getItem("filter_viewCount");

    document.getElementById("durationFilter").value =
        duration || "long_shorts";
    if (date) document.getElementById("dateFilter").value = date;
    if (ratio) {
        document.getElementById("ratioSlider").value = ratio;
        updateRatioLabel(ratio);
    }
    if (viewCount)
        document.getElementById("viewCountFilter").value = viewCount;
}

function saveSortAndApply() {
    sortVideos();
    renderVideos(currentVideos);
}

function sortVideos() {
    const sortOrder = document.getElementById('sortFilter')?.value || 'views';

    switch (sortOrder) {
        case 'views':
            currentVideos.sort((a, b) => (parseInt(b.statistics.viewCount) || 0) - (parseInt(a.statistics.viewCount) || 0));
            break;
        case "recent":
            currentVideos.sort(
                (a, b) =>
                    new Date(b.snippet.publishedAt) -
                    new Date(a.snippet.publishedAt)
            );
            break;
        case "subs":
            currentVideos.sort((a, b) => (b.subCount || 0) - (a.subCount || 0));
            break;
        case "ratio":
        default:
            currentVideos.sort((a, b) => (b.ratio || 0) - (a.ratio || 0));
            break;
    }
}

// Initialize Filters & Keys & Recent Searches
window.addEventListener("DOMContentLoaded", () => {
    loadFilters();
    checkApiKeys();
    renderRecentSearches();
    // 페이지 첫 로드 시 인기영상 탭을 기본으로 표시
    showTrendingTab();
});

// ==========================================
// SETTINGS LOGIC
// ==========================================
function checkApiKeys() {
    // 개발 모드이면 API 키 확인 건너뜀
    if (window.DEV_MODE || localStorage.getItem('DEV_MODE') === 'true') {
        return;
    }

    if (YOUTUBE_API_KEYS.length === 0 || GEMINI_API_KEYS.length === 0) {
        openSettings();
    }
}

function openSettings() {
    const modal = document.getElementById('settingsModal');
    const content = document.getElementById('settingsContent');

    // Load keys into inputs
    document.getElementById("inputYoutubeKey1").value =
        YOUTUBE_API_KEYS[0] || "";
    document.getElementById("inputYoutubeKey2").value =
        YOUTUBE_API_KEYS[1] || "";
    document.getElementById("inputYoutubeKey3").value =
        YOUTUBE_API_KEYS[2] || "";

    document.getElementById("inputGeminiKey1").value =
        GEMINI_API_KEYS[0] || "";
    document.getElementById("inputGeminiKey2").value =
        GEMINI_API_KEYS[1] || "";
    document.getElementById("inputGeminiKey3").value =
        GEMINI_API_KEYS[2] || "";

    // Check active keys
    const yRadios = document.getElementsByName('activeYoutubeKey');
    if (yRadios[currentYoutubeKeyIndex]) yRadios[currentYoutubeKeyIndex].checked = true;

    const gRadios = document.getElementsByName('activeGeminiKey');
    if (gRadios[currentGeminiKeyIndex]) gRadios[currentGeminiKeyIndex].checked = true;

    document.body.style.overflow = "hidden";
    modal.classList.remove("hidden");
    setTimeout(() => {
        content.classList.remove("scale-95", "opacity-0");
        content.classList.add("scale-100", "opacity-100");
    }, 10);
}

function closeSettings() {
    const modal = document.getElementById('settingsModal');
    const content = document.getElementById('settingsContent');

    content.classList.remove('scale-100', 'opacity-100');
    content.classList.add('scale-95', 'opacity-0');

    setTimeout(() => {
        modal.classList.add("hidden");
        document.body.style.overflow = "";
    }, 300);
}

function saveApiKeys() {
    const yKeys = [
        document.getElementById("inputYoutubeKey1").value.trim(),
        document.getElementById("inputYoutubeKey2").value.trim(),
        document.getElementById("inputYoutubeKey3").value.trim(),
    ].filter((k) => k);

    const gKeys = [
        document.getElementById("inputGeminiKey1").value.trim(),
        document.getElementById("inputGeminiKey2").value.trim(),
        document.getElementById("inputGeminiKey3").value.trim(),
    ].filter((k) => k);

    if (yKeys.length === 0 || gKeys.length === 0) {
        showToast("최소 1개 이상의 API 키를 입력해주세요.", "error");
        return;
    }

    YOUTUBE_API_KEYS = yKeys;
    GEMINI_API_KEYS = gKeys;

    // Get selected index
    const selectedYIndex = parseInt(
        document.querySelector('input[name="activeYoutubeKey"]:checked')
            ?.value || 0
    );
    const selectedGIndex = parseInt(
        document.querySelector('input[name="activeGeminiKey"]:checked')
            ?.value || 0
    );

    // Validate index range and existence
    if (selectedYIndex >= YOUTUBE_API_KEYS.length) {
        alert(
            "선택된 YouTube API 키가 비어있습니다. 유효한 키를 선택해주세요."
        );
        return;
    }
    if (selectedGIndex >= GEMINI_API_KEYS.length) {
        alert(
            "선택된 Gemini API 키가 비어있습니다. 유효한 키를 선택해주세요."
        );
        return;
    }

    currentYoutubeKeyIndex = selectedYIndex;
    currentGeminiKeyIndex = selectedGIndex;

    YOUTUBE_API_KEY = YOUTUBE_API_KEYS[currentYoutubeKeyIndex];
    GEMINI_API_KEY = GEMINI_API_KEYS[currentGeminiKeyIndex];

    localStorage.setItem('YOUTUBE_API_KEYS', JSON.stringify(YOUTUBE_API_KEYS));
    localStorage.setItem('GEMINI_API_KEYS', JSON.stringify(GEMINI_API_KEYS));

    // Legacy support
    localStorage.setItem("YOUTUBE_API_KEY", YOUTUBE_API_KEY);
    localStorage.setItem("GEMINI_API_KEY", GEMINI_API_KEY);

    // Save current index to localStorage if needed (optional, but good for persistence)
    // For now, we rely on the order, but since we reload, we might want to persist the index too.
    // However, the requirement says "reload page", so we should probably save the index or just let the user know.
    // Actually, to persist the *selection* after reload, we need to save the index.
    // Let's modify the initialization logic to read the index if we want to be perfect,
    // but the prompt says "key is changed -> reload".
    // If we reload, the JS state is lost. So we MUST save the index to localStorage.

    localStorage.setItem('currentYoutubeKeyIndex', currentYoutubeKeyIndex);
    localStorage.setItem('currentGeminiKeyIndex', currentGeminiKeyIndex);

    alert("API 키 설정이 저장되었습니다. 페이지를 새로고침합니다.");
    location.reload();
}

function resetAllSettings() {
    if (confirm("⚠️ 경고: 모든 설정과 데이터(API 키, 즐겨찾기 등)가 완전히 삭제됩니다.\n\n정말 초기화하시겠습니까?")) {
        localStorage.clear();
        alert("모든 데이터가 초기화되었습니다. 페이지를 새로고침합니다.");
        location.reload();
    }
}

// ==========================================
// TAB NAVIGATION & RESET
// ==========================================
function resetToHome() {
    showTrendingTab();
}

function updateTabStyles(activeId) {
    const tabs = ["tabSearch", "tabFavorites", "tabTrending"];
    tabs.forEach((id) => {
        const el = document.getElementById(id);
        if (!el) return;

        if (id === activeId) {
            el.classList.add("bg-white/10", "text-white", "shadow-sm");
            el.classList.remove("text-gray-400");
        } else {
            el.classList.remove("bg-white/10", "text-white", "shadow-sm");
            el.classList.add("text-gray-400");
        }
    });
}

function showSearchTab() {
    document.getElementById("searchTabContent").classList.remove("hidden");
    document.getElementById("favoritesTabContent").classList.add("hidden");
    document.getElementById("trendingTabContent").classList.add("hidden");
    updateTabStyles("tabSearch");
}

function showFavoritesTab() {
    document.getElementById("searchTabContent").classList.add("hidden");
    document
        .getElementById("favoritesTabContent")
        .classList.remove("hidden");
    document.getElementById("trendingTabContent").classList.add("hidden");
    updateTabStyles("tabFavorites");
    loadFavoritesFeed(true);
}

function showTrendingTab() {
    document.getElementById("searchTabContent").classList.add("hidden");
    document.getElementById("favoritesTabContent").classList.add("hidden");
    document
        .getElementById("trendingTabContent")
        .classList.remove("hidden");
    updateTabStyles("tabTrending");
    loadTrendingFeed();
}

// ==========================================
// FAVORITES LOGIC
// ==========================================

function toggleFavorite(event, channelId, channelTitle) {
    event.stopPropagation();

    const index = favoriteChannels.findIndex(c => c.id === channelId);
    const isAdding = index === -1;

    if (isAdding) {
        if (favoriteChannels.length >= 10) {
            showToast("즐겨찾기는 최대 10개까지만 가능합니다.", "error");
            return;
        }
        // Add with random color
        favoriteChannels.push({
            id: channelId,
            title: channelTitle,
            color: getRandomColor(),
        });

        // Auto-select for feed
        if (!selectedFeedChannels.includes(channelId)) {
            selectedFeedChannels.push(channelId);
            localStorage.setItem(
                "selectedFeedChannels",
                JSON.stringify(selectedFeedChannels)
            );
        }

        showToast("즐겨찾기에 추가되었습니다.", "success");
    } else {
        // Remove
        favoriteChannels.splice(index, 1);

        // Remove from selected feed
        const feedIndex = selectedFeedChannels.indexOf(channelId);
        if (feedIndex !== -1) {
            selectedFeedChannels.splice(feedIndex, 1);
            localStorage.setItem(
                "selectedFeedChannels",
                JSON.stringify(selectedFeedChannels)
            );
        }

        showToast("즐겨찾기에서 삭제되었습니다.", "info");
    }

    localStorage.setItem('favoriteChannels', JSON.stringify(favoriteChannels));

    // Update UI
    loadFavoritesFeed();

    // Update ALL heart buttons for this channel in the search results
    // This handles multiple videos from the same channel
    const heartButtons = document.querySelectorAll(`button[onclick*="'${channelId}'"]`);
    heartButtons.forEach(btn => {
        updateFavoriteBtn(btn, isAdding);
    });

    // If we are in the favorites tab, we might need to remove cards
    if (!isAdding) {
        // If removing, remove elements directly to save API calls
        const chip = document.getElementById(`fav-chip-${channelId}`);
        if (chip) chip.remove();

        const cards = document.querySelectorAll(
            `.feed-card[data-channel-id="${channelId}"]`
        );
        cards.forEach((card) => card.remove());

        if (favoriteChannels.length === 0) {
            const emptyMsg = document.getElementById("emptyFeedMessage");
            if (emptyMsg) emptyMsg.classList.remove("hidden");
        }
    }
}

function updateFavoriteBtn(btn, isFav) {
    if (isFav) {
        btn.innerHTML = '<i class="fa-solid fa-heart text-red-500"></i>';
    } else {
        btn.innerHTML =
            '<i class="fa-regular fa-heart text-gray-400 hover:text-red-400"></i>';
    }
}

function isFavorite(channelId) {
    return favoriteChannels.some((c) => c.id === channelId);
}

let selectedFeedChannels =
    JSON.parse(localStorage.getItem("selectedFeedChannels")) || [];

function toggleFeedChannel(channelId) {
    const index = selectedFeedChannels.indexOf(channelId);
    if (index === -1) {
        selectedFeedChannels.push(channelId);
    } else {
        selectedFeedChannels.splice(index, 1);
    }
    localStorage.setItem(
        "selectedFeedChannels",
        JSON.stringify(selectedFeedChannels)
    );
    loadFavoritesFeed(); // Reload feed
}

async function loadFavoritesFeed() {
    const listContainer = document.getElementById("favoritesList");
    const feedGrid = document.getElementById("feedGrid");
    const emptyMsg = document.getElementById("emptyFeedMessage");
    const loader = document.getElementById("feedLoader");

    // Render Favorites List Chips
    listContainer.innerHTML = "";
    if (favoriteChannels.length === 0) {
        emptyMsg.classList.remove("hidden");
        feedGrid.innerHTML = "";
        return;
    } else {
        emptyMsg.classList.add("hidden");
    }

    // Initialize selected channels if empty
    if (selectedFeedChannels.length === 0 && favoriteChannels.length > 0) {
        selectedFeedChannels = favoriteChannels.map((c) => c.id);
        localStorage.setItem(
            "selectedFeedChannels",
            JSON.stringify(selectedFeedChannels)
        );
    }

    favoriteChannels.forEach((ch) => {
        // Ensure color exists
        if (!ch.color) {
            ch.color = getRandomColor();
            localStorage.setItem(
                "favoriteChannels",
                JSON.stringify(favoriteChannels)
            );
        }

        const isSelected = selectedFeedChannels.includes(ch.id);
        const chip = document.createElement("div");
        chip.id = `fav-chip-${ch.id}`;
        chip.className = `flex items-center gap-2 px-3 py-1.5 rounded-full whitespace-nowrap animate-fade-in cursor-pointer transition-all bg-white/5 border`;
        chip.style.borderColor = ch.color;

        chip.onclick = () => toggleFeedChannel(ch.id);
        chip.innerHTML = `
        <i class="fa-solid ${isSelected ? "fa-check-circle" : "fa-circle"
            }" style="color: ${ch.color}"></i>
        <span class="text-sm font-medium" style="color: ${ch.color
            }">${ch.title}</span>
        <button onclick="event.stopPropagation(); toggleFavorite(event, '${ch.id
            }', '${ch.title
            }')" class="text-gray-500 hover:text-red-400 ml-1">
            <i class="fa-solid fa-xmark"></i>
        </button>
    `;
        listContainer.appendChild(chip);
    });

    // Load Videos (API call or Dummy Data)
    feedGrid.innerHTML = "";
    loader.classList.remove("hidden");

    // ========== 개발 모드: 더미  데이터 사용 ==========
    if (window.DEV_MODE || localStorage.getItem('DEV_MODE') === 'true') {
        console.log('🔧 즐겨찾기 피드: 더미 데이터 사용');
        
        // 시뮬레이션 딜레이
        await new Promise(resolve => setTimeout(resolve, 800));
        
        // 더미 데이터 생성 (모든 즐겨찾기 채널에 대해 동적으로 생성)
        const dummyVideos = favoriteChannels.flatMap((ch, idx) => {
            return [
                {
                    id: { videoId: `fav_dummy_${ch.id}_1` },
                    snippet: {
                        title: `[더미] ${ch.title}의 최신 인기 영상 1`,
                        channelTitle: ch.title,
                        channelId: ch.id,
                        publishedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * (idx + 1)).toISOString(), // 1일씩 차이
                        thumbnails: { medium: { url: `https://picsum.photos/320/180?random=${idx * 10 + 1}` } }
                    },
                    channelColor: ch.color
                },
                {
                    id: { videoId: `fav_dummy_${ch.id}_2` },
                    snippet: {
                        title: `[더미] ${ch.title}의 숨겨진 명작 2`,
                        channelTitle: ch.title,
                        channelId: ch.id,
                        publishedAt: new Date(Date.now() - 1000 * 60 * 60 * 12 * (idx + 1)).toISOString(),
                        thumbnails: { medium: { url: `https://picsum.photos/320/180?random=${idx * 10 + 2}` } }
                    },
                    channelColor: ch.color
                }
            ];
        });

        // 더미 통계 데이터 생성
        const dummyStats = {};
        dummyVideos.forEach(v => {
            dummyStats[v.id.videoId] = {
                viewCount: Math.floor(Math.random() * 900000) + 10000, // 1만 ~ 91만
                subscriberCount: Math.floor(Math.random() * 50000) + 1000, // 1천 ~ 5.1만
                hiddenSubscriberCount: Math.random() < 0.1, // 10% 확률로 비공개
                duration: `PT${Math.floor(Math.random() * 10) + 1}M${Math.floor(Math.random() * 60)}S` // 1~10분
            };
        });

        loader.classList.add('hidden');

        // 선택된 채널만 필터링
        const activeChannelIds = selectedFeedChannels;
        const filteredVideos = dummyVideos.filter(v => activeChannelIds.includes(v.snippet.channelId));

        if (filteredVideos.length === 0) {
            feedGrid.innerHTML =
                '<div class="col-span-full text-center py-20 text-gray-500"><i class="fa-regular fa-square-check text-4xl mb-4 opacity-50"></i><p>채널을 선택하여 영상을 확인하세요.</p></div>';
            return;
        }

        filteredVideos.forEach((video, index) => {
            const vidId = video.id.videoId;
            const stats = dummyStats[vidId];
            
            const viewCount = stats.viewCount;
            const durationSec = parseDuration(stats.duration);
            const durationStr = formatDuration(durationSec);
            const subCount = stats.subscriberCount;
            const hiddenSubs = stats.hiddenSubscriberCount;

            let ratio = 0;
            if (subCount > 0) ratio = (viewCount / subCount) * 100;

            const isHighPerformer = ratio >= 300;
            const ratioDisplay = hiddenSubs ? 'N/A' : `${ratio.toFixed(0)}%`;
            const ratioColor = isHighPerformer ? 'text-red-400' : 'text-green-400';

            const cardBorderColor = video.channelColor || "#ffffff";
            const glow = isHighPerformer
                ? "shadow-[0_0_15px_rgba(239,68,68,0.15)]"
                : "";
            const timeAgoStr = timeAgo(video.snippet.publishedAt);

            // Fire Icons (utils.js의 공통 함수 사용)
            const fireIcons = generateFireIcons(ratio);

            const safeTitle = video.snippet.title
                .replace(/'/g, "\\'")
                .replace(/"/g, "&quot;");
            const safeChannel = video.snippet.channelTitle
                .replace(/'/g, "\\'")
                .replace(/"/g, "&quot;");

            const card = document.createElement("div");
            card.className = `glass-card rounded-xl overflow-hidden flex flex-col h-full ${glow} feed-card animate-fade-in`;
            card.style.border = `6px solid ${cardBorderColor}`;
            if (isHighPerformer)
                card.style.boxShadow = `0 0 15px ${cardBorderColor}40`;

            card.style.animationDelay = `${index * 50}ms`;
            card.setAttribute("data-channel-id", video.snippet.channelId);
            card.innerHTML = `
            <div class="relative group cursor-pointer" onclick="window.open('https://www.youtube.com/watch?v=${vidId}', '_blank')">
                <img src="${video.snippet.thumbnails.medium.url}" alt="${safeTitle}" class="w-full h-48 object-cover transition-transform duration-500 group-hover:scale-105">
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
                            <span class="text-sm font-bold text-white">${video.snippet.channelTitle}</span>
                        </div>
                    </div>
                    <button onclick="toggleFavorite(event, '${video.snippet.channelId}', '${safeChannel}')" class="text-lg transition-transform hover:scale-110 ml-2">
                        <i class="fa-solid fa-heart text-red-500"></i>
                    </button>
                </div>

                <h3 class="text-base font-bold text-white mb-3 line-clamp-2 leading-snug" title="${safeTitle}">${video.snippet.title}</h3>
                
                <div class="text-sm text-gray-400 mb-3">
                    <i class="fa-regular fa-clock mr-1"></i>${durationStr}
                </div>
                
                <div class="grid grid-cols-3 gap-2 mb-4 bg-black/20 rounded-lg p-3 border border-white/5">
                    <div class="text-center">
                        <div class="text-xs text-gray-500 mb-1">조회수</div>
                        <div class="font-semibold text-white text-xs">${formatKoreanNumber(viewCount)}회</div>
                    </div>
                    <div class="text-center border-l border-white/10">
                        <div class="text-xs text-gray-500 mb-1">구독자</div>
                        <div class="font-semibold text-white text-xs">${hiddenSubs || subCount === 0
                    ? "비공개"
                    : formatKoreanNumber(subCount) + "명"
                }</div>
                    </div>
                    <div class="text-center border-l border-white/10">
                        <div class="text-xs text-gray-500 mb-1">성과율</div>
                        <div class="font-bold ${ratioColor} text-xs">${ratioDisplay}</div>
                    </div>
                </div>

                <button onclick="openAnalysisFromFeed('${vidId}', '${safeTitle}', '${video.snippet.thumbnails.medium.url}', '${safeChannel}', ${ratio}, ${hiddenSubs})" class="mt-auto w-full bg-white/5 hover:bg-blue-600 hover:text-white text-gray-300 border border-white/10 hover:border-blue-500 py-2.5 rounded-lg transition-all duration-200 font-medium flex items-center justify-center gap-2 group">
                    <i class="fa-solid fa-wand-magic-sparkles group-hover:animate-pulse"></i> AI 분석하기
                </button>
            </div>
        `;
            feedGrid.appendChild(card);
        });
        
        return;
    }

    // ========== 프로덕션 모드: 실제 API 호출 ==========
    try {
        // Filter to only selected channels
        const activeChannels = favoriteChannels.filter(c => selectedFeedChannels.includes(c.id));

        if (activeChannels.length === 0) {
            loader.classList.add("hidden");
            feedGrid.innerHTML =
                '<div class="col-span-full text-center py-20 text-gray-500"><i class="fa-regular fa-square-check text-4xl mb-4 opacity-50"></i><p>채널을 선택하여 영상을 확인하세요.</p></div>';
            return;
        }

        // Fetch latest 10 videos for EACH active channel
        const videoPromises = activeChannels.map(async (ch) => {
            const urlBuilder = (key) =>
                `https://www.googleapis.com/youtube/v3/search?part=snippet&channelId=${ch.id}&order=date&type=video&maxResults=10&key=${key}`;
            try {
                const res = await fetchWithRotation(urlBuilder, 'youtube');
                const data = await res.json();
                return (data.items || []).map((item) => ({
                    ...item,
                    channelColor: ch.color,
                }));
            } catch (e) {
                console.warn(`Failed to fetch videos for channel ${ch.title}`, e);
                return [];
            }
        });

        const results = await Promise.all(videoPromises);
        let allVideos = results.flat();

        // Sort by Date Descending
        allVideos.sort(
            (a, b) =>
                new Date(b.snippet.publishedAt) - new Date(a.snippet.publishedAt)
        );

        if (allVideos.length === 0) {
            loader.classList.add("hidden");
            return;
        }

        // Fetch Stats
        const videoIds = allVideos.map(v => v.id.videoId).join(',');
        const statsRes = await fetchWithRotation((key) => `https://www.googleapis.com/youtube/v3/videos?part=statistics,contentDetails,snippet&id=${videoIds}&key=${key}`, 'youtube');
        const statsData = await statsRes.json();

        const statsMap = {};
        const durationMap = {};
        if (statsData.items) {
            statsData.items.forEach(item => {
                statsMap[item.id] = item.statistics;
                durationMap[item.id] = item.contentDetails.duration;
            });
        }

        // Fetch Channel Stats for Ratio
        const channelIds = [...new Set(allVideos.map(v => v.snippet.channelId))].join(',');
        const chRes = await fetchWithRotation((key) => `https://www.googleapis.com/youtube/v3/channels?part=statistics&id=${channelIds}&key=${key}`, 'youtube');
        const chData = await chRes.json();
        const chMap = {};
        chData.items.forEach((c) => {
            chMap[c.id] = c.statistics;
        });

        // Render
        loader.classList.add('hidden');

        allVideos.forEach((video, index) => {
            const vidId = video.id.videoId;
            const stats = statsMap[vidId];
            if (!stats) return;

            const viewCount = parseInt(stats.viewCount) || 0;
            const durationSec = parseDuration(durationMap[vidId] || "PT0S");
            const durationStr = formatDuration(durationSec);
            const chStats = chMap[video.snippet.channelId];
            const subCount = parseInt(chStats?.subscriberCount) || 0;
            const hiddenSubs = chStats?.hiddenSubscriberCount || false;

            let ratio = 0;
            if (subCount > 0) ratio = (viewCount / subCount) * 100;

            const isHighPerformer = ratio >= 300;
            const ratioDisplay = hiddenSubs ? 'N/A' : `${ratio.toFixed(0)}%`;
            const ratioColor = isHighPerformer ? 'text-red-400' : 'text-green-400';

            // Use channel color for border
            const cardBorderColor = video.channelColor || "#ffffff";
            const glow = isHighPerformer
                ? "shadow-[0_0_15px_rgba(239,68,68,0.15)]"
                : "";
            const timeAgoStr = timeAgo(video.snippet.publishedAt);

            // Calculate fire icons
            const fireIcons = generateFireIcons(ratio);

            const safeTitle = video.snippet.title
                .replace(/'/g, "\\'")
                .replace(/"/g, "&quot;");
            const safeChannel = video.snippet.channelTitle
                .replace(/'/g, "\\'")
                .replace(/"/g, "&quot;");

            const card = document.createElement("div");
            card.className = `glass-card rounded-xl overflow-hidden flex flex-col h-full ${glow} feed-card animate-fade-in`;
            card.style.border = `6px solid ${cardBorderColor}`; // Apply custom border color
            if (isHighPerformer)
                card.style.boxShadow = `0 0 15px ${cardBorderColor}40`;

            card.style.animationDelay = `${index * 50}ms`;
            card.setAttribute("data-channel-id", video.snippet.channelId);
            card.innerHTML = `
            <div class="relative group cursor-pointer" onclick="window.open('https://www.youtube.com/watch?v=${vidId}', '_blank')">
                <img src="${video.snippet.thumbnails.medium.url
                }" alt="${safeTitle}" class="w-full h-48 object-cover transition-transform duration-500 group-hover:scale-105">
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
                            <span class="text-sm font-bold text-white">${video.snippet.channelTitle
                }</span>
                        </div>
                    </div>
                    <button onclick="toggleFavorite(event, '${video.snippet.channelId
                }', '${safeChannel}')" class="text-lg transition-transform hover:scale-110 ml-2">
                        <i class="fa-solid fa-heart text-red-500"></i>
                    </button>
                </div>

                <h3 class="text-base font-bold text-white mb-3 line-clamp-2 leading-snug" title="${safeTitle}">${video.snippet.title
                }</h3>
                
                <div class="text-sm text-gray-400 mb-3">
                    <i class="fa-regular fa-clock mr-1"></i>${durationStr}
                </div>
                
                <div class="grid grid-cols-3 gap-2 mb-4 bg-black/20 rounded-lg p-3 border border-white/5">
                    <div class="text-center">
                        <div class="text-xs text-gray-500 mb-1">조회수</div>
                        <div class="font-semibold text-white text-xs">${formatKoreanNumber(
                    viewCount
                )}회</div>
                    </div>
                    <div class="text-center border-l border-white/10">
                        <div class="text-xs text-gray-500 mb-1">구독자</div>
                        <div class="font-semibold text-white text-xs">${hiddenSubs || subCount === 0
                    ? "비공개"
                    : formatKoreanNumber(subCount) + "명"
                }</div>
                    </div>
                    <div class="text-center border-l border-white/10">
                        <div class="text-xs text-gray-500 mb-1">성과율</div>
                        <div class="font-bold ${ratioColor} text-xs">${ratioDisplay}</div>
                    </div>
                </div>

                <button onclick="openAnalysisFromFeed('${vidId}', '${safeTitle}', '${video.snippet.thumbnails.medium.url
                }', '${safeChannel}', ${ratio}, ${hiddenSubs})" class="mt-auto w-full bg-white/5 hover:bg-blue-600 hover:text-white text-gray-300 border border-white/10 hover:border-blue-500 py-2.5 rounded-lg transition-all duration-200 font-medium flex items-center justify-center gap-2 group">
                    <i class="fa-solid fa-wand-magic-sparkles group-hover:animate-pulse"></i> AI 분석하기
                </button>
            </div>
        `;
            feedGrid.appendChild(card);
        });
    } catch (error) {
        console.error("Feed loading error:", error);
        loader.classList.add("hidden");
        showToast("피드를 불러오는 중 오류가 발생했습니다.", "error");
    }
}

// Helper for Feed Analysis (since feed items aren't in currentVideos)
function openAnalysisFromFeed(id, title, thumbnail, channelTitle, ratio, hiddenSubs) {
    currentVideoData = { id, title, thumbnail, channelTitle, hiddenSubs, ratio };

    // Set Modal Info
    document.getElementById("modalThumbnail").src = thumbnail;
    document.getElementById("modalTitle").innerText = title;
    document.getElementById("modalChannel").innerText = channelTitle;
    document.getElementById("modalRatio").innerText = hiddenSubs
        ? "N/A"
        : `성과율 ${ratio.toFixed(0)}%`;

    // Reset UI States
    document.getElementById('aiLoader').classList.remove('hidden');
    document.getElementById('analysisResult').classList.add('hidden');
    document.getElementById('storyPlaceholder').classList.remove('hidden');
    document.getElementById('storyContent').classList.add('hidden');
    document.getElementById('storyContent').innerHTML = '';

    // Show Modal
    const modal = document.getElementById('analysisModal');
    const content = document.getElementById('modalContent');

    document.body.style.overflow = 'hidden';
    modal.classList.remove('hidden');

    setTimeout(() => {
        content.classList.remove("scale-95", "opacity-0");
        content.classList.add("scale-100", "opacity-100");
    }, 10);

    analyzeVideo(currentVideoData);
}

// ==========================================
// YOUTUBE API LOGIC (SEARCH)
// ==========================================
async function searchVideos() {
    const query = document.getElementById("searchInput").value.trim();
    const durationFilter = document.getElementById("durationFilter").value;
    const minRatio =
        parseInt(document.getElementById("ratioSlider").value) * 10;
    const minViewCount = parseInt(
        document.getElementById("viewCountFilter").value
    );
    const dateFilter = document.getElementById("dateFilter").value;

    if (!query) {
        showToast("검색어를 입력해주세요.", "error");
        return;
    }

    // UI Reset
    document.getElementById("resultsSection").classList.add("hidden");
    document.getElementById("searchLoader").classList.remove("hidden");
    document.getElementById("videoGrid").innerHTML = "";
    document
        .getElementById("keywordRecommendations")
        .classList.add("hidden");

    // Fetch Related Keywords (Parallel)
    fetchRelatedKeywords(query);

    // Save Recent Search
    saveRecentSearch(query);

    try {
        // 1. Search Videos Only (no channels)
        let searchUrl = `https://www.googleapis.com/youtube/v3/search?part=snippet&type=video&maxResults=20&q=${encodeURIComponent(query)}&regionCode=KR&relevanceLanguage=ko&key=${YOUTUBE_API_KEY}`;

        if (dateFilter !== 'any') {
            const date = new Date();
            if (dateFilter === "1d") date.setDate(date.getDate() - 1);
            else if (dateFilter === "7d") date.setDate(date.getDate() - 7);
            else if (dateFilter === "15d") date.setDate(date.getDate() - 15);
            else if (dateFilter === "30d") date.setDate(date.getDate() - 30);
            else if (dateFilter === "90d") date.setDate(date.getDate() - 90);
            searchUrl += `&publishedAfter=${date.toISOString()}`;
        }

        const searchRes = await fetch(searchUrl);
        const searchData = await searchRes.json();

        if (!searchData.items || searchData.items.length === 0) {
            document.getElementById("searchLoader").classList.add("hidden");
            showToast("검색 결과가 없습니다.");
            return;
        }

        // 2. Fetch Video Stats & Details
        const videoIds = searchData.items
            .map((item) => item.id.videoId)
            .join(",");
        const statsUrl = `https://www.googleapis.com/youtube/v3/videos?part=statistics,contentDetails,snippet&id=${videoIds}&key=${YOUTUBE_API_KEY}`;
        const statsRes = await fetch(statsUrl);
        const statsData = await statsRes.json();

        // 3. Fetch Channel Stats (for Subscriber Count)
        const channelIds = [
            ...new Set(searchData.items.map((item) => item.snippet.channelId)),
        ].join(",");
        const channelUrl = `https://www.googleapis.com/youtube/v3/channels?part=statistics&id=${channelIds}&key=${YOUTUBE_API_KEY}`;
        const channelRes = await fetch(channelUrl);
        const channelData = await channelRes.json();

        const channelStats = {};
        if (channelData.items) {
            channelData.items.forEach((ch) => {
                channelStats[ch.id] = ch.statistics;
            });
        }

        // 4. Process & Filter
        let videos = [];
        if (statsData.items) {
            videos = statsData.items.map((item) => {
                const viewCount = parseInt(item.statistics.viewCount) || 0;
                const duration = parseDuration(item.contentDetails.duration);
                const channelId = item.snippet.channelId;
                const subCount =
                    parseInt(channelStats[channelId]?.subscriberCount) || 0;
                const hiddenSubs =
                    channelStats[channelId]?.hiddenSubscriberCount || false;

                // Calculate Ratio
                let ratio = 0;
                if (subCount > 0) {
                    ratio = (viewCount / subCount) * 100;
                }

                return {
                    ...item,
                    durationSec: duration,
                    ratio: ratio,
                    subCount: subCount,
                    hiddenSubs: hiddenSubs,
                };
            });
        }

        // Apply Filters
        videos = videos.filter((v) => {
            // View Count Filter
            if (parseInt(v.statistics.viewCount) < minViewCount) return false;

            // Ratio Filter
            if (v.ratio < minRatio) return false;

            // Duration Filter
            if (durationFilter === "short_shorts") return v.durationSec < 60; // 1분 미만
            if (durationFilter === "long_shorts")
                return v.durationSec >= 60 && v.durationSec <= 180; // 1분 ~ 3분
            if (durationFilter === "medium")
                return v.durationSec > 180 && v.durationSec <= 1200; // 3분 ~ 20분
            if (durationFilter === "long") return v.durationSec > 1200; // 20분 이상

            return true;
        });

        // Update Global State for Sorting
        currentVideos = videos;

        // Apply Current Sort
        sortVideos();

        renderVideos(currentVideos);
    } catch (error) {
        console.error(error);
        showToast("검색 중 오류가 발생했습니다.", "error");
    } finally {
        document.getElementById("searchLoader").classList.add("hidden");
    }
}

function renderVideos(videos) {
    const grid = document.getElementById('videoGrid');
    const section = document.getElementById('resultsSection');
    const countLabel = document.getElementById('resultCount');

    if (countLabel) countLabel.innerText = videos.length;

    if (videos.length === 0) {
        grid.innerHTML =
            '<div class="col-span-full text-center text-gray-400 py-10">조건에 맞는 영상이 없습니다.</div>';
    } else {
        grid.innerHTML = ""; // Clear existing content
        videos.forEach((video, index) => {
            const viewCount = parseInt(video.statistics.viewCount);
            const ratio = video.ratio;
            const isHighPerformer = ratio >= 300; // 300% 이상이면 성과 좋음

            const ratioDisplay = video.hiddenSubs ? 'N/A' : `${ratio.toFixed(0)}%`;
            const ratioColor = isHighPerformer ? 'text-red-400' : 'text-green-400';
            const glow = isHighPerformer ? 'shadow-[0_0_15px_rgba(239,68,68,0.15)]' : '';

            // Fire Icons
            const fireIcons = generateFireIcons(ratio);

            const safeTitle = video.snippet.title
                .replace(/'/g, "\\'")
                .replace(/"/g, "&quot;");
            const safeChannel = video.snippet.channelTitle
                .replace(/'/g, "\\'")
                .replace(/"/g, "&quot;");
            const durationStr = formatDuration(video.durationSec);
            const timeAgoStr = timeAgo(video.snippet.publishedAt);

            // Calculate views per hour
            const publishedDate = new Date(video.snippet.publishedAt);
            const hoursSincePublished = Math.max(1, (Date.now() - publishedDate.getTime()) / (1000 * 60 * 60));
            const viewsPerHour = Math.round(viewCount / hoursSincePublished);

            // Check if favorite
            const isFav = isFavorite(video.snippet.channelId);
            const heartClass = isFav
                ? "fa-solid text-red-500"
                : "fa-regular text-gray-400";

            const card = document.createElement("div");
            card.className = `glass-card rounded-xl overflow-hidden flex flex-col h-full ${glow} animate-slide-up`;
            card.style.animationDelay = `${index * 50}ms`;
            card.style.border = `1px solid ${cardBorderColor}`;

            card.innerHTML = `
            <div class="relative group cursor-pointer" onclick="window.open('https://www.youtube.com/watch?v=${video.id
                }', '_blank')">
                <img src="${video.snippet.thumbnails.medium.url
                }" alt="${safeTitle}" class="w-full h-48 object-cover transition-transform duration-500 group-hover:scale-105">
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
                            <span class="text-sm font-bold text-white">${video.snippet.channelTitle
                }</span>
                        </div>
                    </div>
                    <button id="fav-btn-${video.snippet.channelId
                }" onclick="toggleFavorite(event, '${video.snippet.channelId
                }', '${safeChannel}')" class="text-lg transition-transform hover:scale-110 ml-2">
                        <i class="${heartClass} fa-heart"></i>
                    </button>
                </div>

                <h3 class="text-base font-bold text-white mb-3 line-clamp-2 leading-snug" title="${safeTitle}">${video.snippet.title
                }</h3>
                
                <div class="text-sm text-gray-400 mb-3">
                    <i class="fa-regular fa-clock mr-1"></i>${durationStr}
                </div>
                
                <div class="grid grid-cols-2 gap-2 mb-4 bg-black/20 rounded-lg p-3 border border-white/5">
                    <div class="text-center">
                        <div class="text-xs text-gray-500 mb-1">조회수</div>
                        <div class="font-semibold text-white text-xs">${formatKoreanNumber(
                    viewCount
                )}회</div>
                    </div>
                    <div class="text-center border-l border-white/10">
                        <div class="text-xs text-gray-500 mb-1">구독자</div>
                        <div class="font-semibold text-white text-xs">${video.hiddenSubs || video.subCount === 0
                    ? "비공개"
                    : formatKoreanNumber(video.subCount) + "명"
                }</div>
                    </div>
                    <div class="text-center border-t border-white/10 pt-2 mt-1">
                        <div class="text-xs text-gray-500 mb-1">성과율</div>
                        <div class="font-bold ${ratioColor} text-xs">${ratioDisplay}</div>
                    </div>
                    <div class="text-center border-l border-t border-white/10 pt-2 mt-1">
                        <div class="text-xs text-gray-500 mb-1">시간당</div>
                        <div class="font-bold text-blue-400 text-xs">${formatKoreanNumber(viewsPerHour)}/hr</div>
                    </div>
                </div>

                <button onclick="openAnalysis('${video.id
                }', '${safeTitle}', '${video.snippet.thumbnails.medium.url
                }', '${safeChannel}', ${ratio}, ${video.hiddenSubs
                })" class="mt-auto w-full bg-white/5 hover:bg-blue-600 hover:text-white text-gray-300 border border-white/10 hover:border-blue-500 py-2.5 rounded-lg transition-all duration-200 font-medium flex items-center justify-center gap-2 group">
                    <i class="fa-solid fa-wand-magic-sparkles group-hover:animate-pulse"></i> AI 분석하기
                </button>
            </div>
        `;
            grid.appendChild(card);
        });
    }

    section.classList.remove('hidden');
}

function openAnalysis(videoId, title, thumbnail, channelTitle, ratio, hiddenSubs) {
    currentVideoData = { id: videoId, title, thumbnail, channelTitle, hiddenSubs, ratio };

    // Set Modal Info
    document.getElementById("modalThumbnail").src = thumbnail;
    document.getElementById("modalTitle").innerText = title;
    document.getElementById("modalChannel").innerText = channelTitle;
    document.getElementById("modalRatio").innerText = hiddenSubs
        ? "N/A"
        : `성과율 ${ratio.toFixed(0)}%`;

    // Reset UI
    document.getElementById('aiLoader').classList.remove('hidden');
    document.getElementById('analysisResult').classList.add('hidden');
    document.getElementById('storyPlaceholder').classList.remove('hidden');
    document.getElementById('storyContent').classList.add('hidden');
    document.getElementById('storyContent').innerHTML = '';

    // Show Modal
    const modal = document.getElementById('analysisModal');
    const content = document.getElementById('modalContent');

    document.body.style.overflow = 'hidden';
    modal.classList.remove('hidden');

    setTimeout(() => {
        content.classList.remove("scale-95", "opacity-0");
        content.classList.add("scale-100", "opacity-100");
    }, 10);

    // Start Analysis
    analyzeVideo(currentVideoData);
}

function closeModal() {
    const modal = document.getElementById('analysisModal');
    const content = document.getElementById('modalContent');

    content.classList.remove('scale-100', 'opacity-100');
    content.classList.add('scale-95', 'opacity-0');

    setTimeout(() => {
        modal.classList.add("hidden");
        document.body.style.overflow = "";
    }, 300);
}

async function analyzeVideo(video) {
    try {
        // 1. Fetch Comments
        const commentsUrl = `https://www.googleapis.com/youtube/v3/commentThreads?part=snippet&videoId=${video.id}&maxResults=30&order=relevance&key=${YOUTUBE_API_KEY}`;
        const commentsRes = await fetch(commentsUrl);

        let comments = "댓글 없음";
        if (commentsRes.ok) {
            const commentsData = await commentsRes.json();
            if (commentsData.items) {
                comments = commentsData.items
                    .map((item) => item.snippet.topLevelComment.snippet.textDisplay)
                    .join("\n");
            }
        }

        // 2. Call Gemini for Summary & Ideas (Senior Drama Focus)
        const prompt = `
        너는 시니어 드라마 콘텐츠 기획 전문가야.
        다음 영상의 제목과 댓글을 분석해서 3가지 정보를 JSON으로 줘.
        
        [영상 제목]: ${video.title}
        [댓글]: ${comments.substring(0, 3000)}

        요구사항:
        1. summary: 이 영상이 어떤 내용인지 제목과 댓글로 유추해서 2문장 요약.
        2. reactions: 시청자들이 주로 어떤 반응(재미, 유익, 공감 등)을 보였는지 2문장 요약.
        3. ideas: 이 영상의 주제나 감정, 스토리 요소를 활용하여 만들 수 있는 **시니어 드라마 에피소드 아이디어** 10가지.
           - 시니어(중·장년층, 노년층)가 주인공인 드라마 형식으로 구성
           - 각 아이디어는 감동, 인생 교훈, 일상의 위로, 가족애, 추억 등 시니어 세대가 공감할 수 있는 주제여야 함
           - 제목은 드라마 에피소드처럼 간결하고 흥미로운 형식으로 작성 (예: "은퇴 후 시작한 작은 식당", "할머니의 첫 스마트폰")

        반드시 JSON 형식으로만 답변해. 마크다운 쓰지 마.
        형식: 
        { 
            "summary": "...", 
            "reactions": "...", 
            "ideas": ["드라마 아이디어1", "드라마 아이디어2", "드라마 아이디어3", "드라마 아이디어4", "드라마 아이디어5", "드라마 아이디어6", "드라마 아이디어7", "드라마 아이디어8", "드라마 아이디어9", "드라마 아이디어10"] 
        }
    `;

        const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`;
        const geminiRes = await fetch(geminiUrl, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                contents: [{ parts: [{ text: prompt }] }],
            }),
        });

        const geminiData = await geminiRes.json();
        const rawText = geminiData.candidates[0].content.parts[0].text;
        const jsonText = rawText
            .replace(/```json/g, "")
            .replace(/```/g, "")
            .trim();
        const result = JSON.parse(jsonText);

        renderAnalysis(result);
    } catch (error) {
        console.error(error);
        showToast("분석 중 오류가 발생했습니다.", "error");
        document.getElementById("aiLoader").classList.add("hidden");
    }
}

function renderAnalysis(data) {
    // Summary & Reactions
    document.getElementById("aiSummary").innerText = data.summary;
    document.getElementById("aiReactions").innerText = data.reactions;

    // Ideas List
    const list = document.getElementById("ideasList");
    list.innerHTML = "";

    data.ideas.forEach((idea) => {
        const btn = document.createElement("button");
        btn.className =
            "w-full text-left px-4 py-3 rounded-lg bg-white/5 hover:bg-purple-600 hover:text-white border border-white/5 transition-all duration-200 text-sm text-gray-300 flex justify-between items-center group";
        btn.innerHTML = `
        <span class="font-medium line-clamp-1">${idea}</span>
        <i class="fa-solid fa-pen-nib opacity-0 group-hover:opacity-100 transition-opacity"></i>
    `;
        btn.onclick = () => generateStoryline(idea);
        list.appendChild(btn);
    });

    document.getElementById("aiLoader").classList.add("hidden");
    document.getElementById("analysisResult").classList.remove("hidden");
    document
        .getElementById("analysisResult")
        .classList.add("animate-fade-in");
}

async function generateStoryline(idea) {
    // UI Update
    document.getElementById("storyPlaceholder").classList.add("hidden");
    document.getElementById("storyContent").classList.add("hidden");
    document.getElementById("storyLoader").classList.remove("hidden");

    // Highlight selected idea
    const buttons = document.getElementById('ideasList').querySelectorAll('button');
    buttons.forEach(b => {
        if (b.innerText.includes(idea)) {
            b.classList.add('bg-purple-600', 'text-white', 'border-purple-500');
            b.classList.remove('bg-white/5', 'text-gray-300');
        } else {
            b.classList.remove(
                "bg-purple-600",
                "text-white",
                "border-purple-500"
            );
            b.classList.add("bg-white/5", "text-gray-300");
        }
    });

    try {
        const prompt = `
        너는 창의적인 스토리텔러야.
        
        [선택한 아이디어]: "${idea}"
        [참고한 원본 영상]: "${currentVideoData.title}"
        
        위 아이디어로 영상을 만들 때 사용할 수 있는 **간단하고 매력적인 스토리라인**을 작성해줘.
        복잡한 대본 형식이 아니라, 이야기의 흐름을 파악할 수 있는 줄거리 형태여야 해.
        
        [구성]
        1. **기획 의도**: 왜 이 소재가 먹힐까? (1줄)
        2. **도입부 (Hook)**: 시청자를 사로잡을 첫 장면이나 멘트.
        3. **전개 (Flow)**: 이야기의 핵심 흐름 (3단계).
        4. **결말 (Climax/Outro)**: 인상 깊은 마무리.
        
        출력 형식: 가독성 좋은 마크다운(Markdown).
    `;

        const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`;
        const geminiRes = await fetch(geminiUrl, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                contents: [{ parts: [{ text: prompt }] }],
            }),
        });

        const geminiData = await geminiRes.json();
        const storyMarkdown = geminiData.candidates[0].content.parts[0].text;

        // Render Markdown
        const contentDiv = document.getElementById("storyContent");
        contentDiv.innerHTML = marked.parse(storyMarkdown);

        document.getElementById('storyLoader').classList.add('hidden');
        contentDiv.classList.remove('hidden');
        contentDiv.classList.add('animate-fade-in');

    } catch (error) {
        console.error(error);
        showToast("스토리 생성 중 오류가 발생했습니다.", "error");
        document.getElementById("storyLoader").classList.add("hidden");
    }
}

// ==========================================
// KEYWORD RECOMMENDATION LOGIC
// ==========================================
async function fetchRelatedKeywords(query) {
    try {
        const prompt = `
        너는 유튜브 검색 전문가야.
        사용자가 "${query}"라는 키워드로 검색했어.
        이와 연관성이 높고, 유튜브에서 검색량이 많을 것으로 예상되는 '추천 검색어' 6가지를 추천해줘.
        
        조건:
        1. 한국어 키워드 위주로.
        2. 너무 긴 문장보다는 검색에 실제로 쓰이는 단어 조합으로.
        3. JSON 배열 형식으로만 출력해. (예: ["키워드1", "키워드2", ...])
    `;

        const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`;
        const res = await fetch(geminiUrl, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                contents: [{ parts: [{ text: prompt }] }],
            }),
        });

        const data = await res.json();
        const text = data.candidates[0].content.parts[0].text;
        const jsonText = text
            .replace(/```json/g, "")
            .replace(/```/g, "")
            .trim();
        const keywords = JSON.parse(jsonText);

        renderRelatedKeywords(keywords);
    } catch (error) {
        console.error("Keyword fetch failed:", error);
        // Fail silently for keywords, main search is more important
    }
}

function renderRelatedKeywords(keywords) {
    const container = document.getElementById('keywordRecommendations');
    const list = document.getElementById('keywordList');

    list.innerHTML = '';

    if (!keywords || keywords.length === 0) return;

    keywords.forEach((k) => {
        const chip = document.createElement("button");
        chip.className =
            "px-3 py-1 rounded-full bg-white/5 hover:bg-blue-600/20 hover:text-blue-300 border border-white/10 hover:border-blue-500/30 text-gray-400 text-xs transition-all duration-200";
        chip.innerText = k;
        chip.onclick = () => handleKeywordClick(k);
        list.appendChild(chip);
    });

    container.classList.remove("hidden");
}

function handleKeywordClick(keyword) {
    document.getElementById("searchInput").value = keyword;
    searchVideos();
}

// ==========================================
// RECENT SEARCH LOGIC
// ==========================================
function saveRecentSearch(keyword) {
    // Remove if exists (to move to top)
    recentSearches = recentSearches.filter(k => k !== keyword);

    // Add to top
    recentSearches.unshift(keyword);

    // Limit to 10
    if (recentSearches.length > 10) {
        recentSearches = recentSearches.slice(0, 10);
    }

    localStorage.setItem('recentSearches', JSON.stringify(recentSearches));
    renderRecentSearches();
}

function renderRecentSearches() {
    const container = document.getElementById('recentSearchSection');
    const list = document.getElementById('recentSearchList');

    list.innerHTML = '';

    if (recentSearches.length === 0) {
        container.classList.add("hidden");
        return;
    }

    recentSearches.forEach((k) => {
        const chip = document.createElement("div");
        chip.className =
            "flex items-center gap-2 bg-white/5 hover:bg-white/10 border border-white/10 px-2 py-1 rounded text-xs text-gray-300 transition-colors cursor-pointer group";
        chip.innerHTML = `
        <span onclick="handleKeywordClick('${k}')">${k}</span>
        <button onclick="deleteRecentSearch(event, '${k}')" class="text-gray-500 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity">
            <i class="fa-solid fa-xmark"></i>
        </button>
    `;
        list.appendChild(chip);
    });

    container.classList.remove("hidden");
}

function deleteRecentSearch(event, keyword) {
    event.stopPropagation();
    recentSearches = recentSearches.filter((k) => k !== keyword);
    localStorage.setItem("recentSearches", JSON.stringify(recentSearches));
    renderRecentSearches();
}

function clearRecentSearches() {
    if (confirm('최근 검색 기록을 모두 삭제하시겠습니까?')) {
        recentSearches = [];
        localStorage.removeItem("recentSearches");
        renderRecentSearches();
    }
}

// ==========================================
// TARGET CHANNEL SUBS
// ==========================================
async function fetchTargetChannelSubs() {
    const channelId = "UC2qjSbOs_InmdtWO2Q-aY6w";
    try {
        const response = await fetchWithRotation((key) => `https://www.googleapis.com/youtube/v3/channels?part=statistics&id=${channelId}&key=${key}`, 'youtube');
        
        if (!response) return;

        const data = await response.json();
        if (data.items && data.items.length > 0) {
            const subs = parseInt(data.items[0].statistics.subscriberCount);
            const formattedSubs = subs.toLocaleString();
            const el = document.getElementById("targetChannelSubs");
            const countEl = document.getElementById("targetSubsCount");
            if (el && countEl) {
                countEl.innerText = `${formattedSubs}명`;
                el.classList.remove("hidden");
            }
        }
    } catch (error) {
        console.error("Failed to fetch target channel subs:", error);
    }
}

// Initialize
document.addEventListener("DOMContentLoaded", () => {
    fetchTargetChannelSubs();
    // Refresh every 60 seconds
    setInterval(fetchTargetChannelSubs, 60000);
});
