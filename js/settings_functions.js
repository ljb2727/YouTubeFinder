// ==========================================
// SETTINGS MODAL FUNCTIONS
// = =========================================

function openSettings() {
    const modal = document.getElementById('settingsModal');
    const content = document.getElementById('settingsContent');

    if (!modal || !content) {
        console.error('Settings modal elements not found');
        return;
    }

    modal.classList.remove('hidden');

    // Load current API keys
    const youtubeKeys = JSON.parse(localStorage.getItem('YOUTUBE_API_KEYS')) || [];
    const geminiKeys = JSON.parse(localStorage.getItem('GEMINI_API_KEYS')) || [];
    const currentYoutubeKeyIndex = parseInt(localStorage.getItem('currentYoutubeKeyIndex')) || 0;
    const currentGeminiKeyIndex = parseInt(localStorage.getItem('currentGeminiKeyIndex')) || 0;

    // Populate YouTube API Keys
    for (let i = 0; i < 3; i++) {
        const input = document.getElementById(`inputYoutubeKey${i + 1}`);
        const radio = document.querySelector(`input[name="activeYoutubeKey"][value="${i}"]`);
        if (input) {
            input.value = youtubeKeys[i] || '';
        }
        if (radio) {
            radio.checked = (i === currentYoutubeKeyIndex);
        }
    }

    // Populate Gemini API Keys
    for (let i = 0; i < 3; i++) {
        const input = document.getElementById(`inputGeminiKey${i + 1}`);
        const radio = document.querySelector(`input[name="activeGeminiKey"][value="${i}"]`);
        if (input) {
            input.value = geminiKeys[i] || '';
        }
        if (radio) {
            radio.checked = (i === currentGeminiKeyIndex);
        }
    }

    // Load dev mode state
    const devMode = localStorage.getItem('DEV_MODE') === 'true';
    const devModeCheckbox = document.getElementById('devModeCheckbox');
    if (devModeCheckbox) {
        devModeCheckbox.checked = devMode;
    }

    // Show/hide warning
    const devModeWarning = document.getElementById('devModeWarning');
    if (devModeWarning) {
        if (devMode) {
            devModeWarning.classList.remove('hidden');
        } else {
            devModeWarning.classList.add('hidden');
        }
    }

    // Animate modal
    setTimeout(() => {
        content.style.transform = 'scale(1)';
        content.style.opacity = '1';
    }, 10);
}

function closeSettings() {
    const modal = document.getElementById('settingsModal');
    const content = document.getElementById('settingsContent');

    if (!modal || !content) return;

    content.style.transform = 'scale(0.95)';
    content.style.opacity = '0';

    setTimeout(() => {
        modal.classList.add('hidden');
    }, 200);
}

function saveApiKeys() {
    //  Collect YouTube API Keys
    const youtubeKeys = [];
    for (let i = 1; i <= 3; i++) {
        const input = document.getElementById(`inputYoutubeKey${i}`);
        if (input && input.value.trim()) {
            youtubeKeys.push(input.value.trim());
        }
    }

    // Collect Gemini API Keys
    const geminiKeys = [];
    for (let i = 1; i <= 3; i++) {
        const input = document.getElementById(`inputGeminiKey${i}`);
        if (input && input.value.trim()) {
            geminiKeys.push(input.value.trim());
        }
    }

    // Get selected key indexes
    const youtubeKeyIndex = parseInt(document.querySelector('input[name="activeYoutubeKey"]:checked')?.value || '0');
    const geminiKeyIndex = parseInt(document.querySelector('input[name="activeGeminiKey"]:checked')?.value || '0');

    // Save dev mode state
    const devModeCheckbox = document.getElementById('devModeCheckbox');
    if (devModeCheckbox) {
        localStorage.setItem('DEV_MODE', devModeCheckbox.checked.toString());
        if (typeof window !== 'undefined') {
            window.DEV_MODE = devModeCheckbox.checked;
        }
    }

    // Save to localStorage
    localStorage.setItem('YOUTUBE_API_KEYS', JSON.stringify(youtubeKeys));
    localStorage.setItem('GEMINI_API_KEYS', JSON.stringify(geminiKeys));
    localStorage.setItem('currentYoutubeKeyIndex', youtubeKeyIndex.toString());
    localStorage.setItem('currentGeminiKeyIndex', geminiKeyIndex.toString());

    // Update global variables
    if (typeof YOUTUBE_API_KEYS !== 'undefined') {
        YOUTUBE_API_KEYS = youtubeKeys;
        YOUTUBE_API_KEY = youtubeKeys[youtubeKeyIndex] || '';
    }

    if (typeof GEMINI_API_KEYS !== 'undefined') {
        GEMINI_API_KEYS = geminiKeys;
        GEMINI_API_KEY = geminiKeys[geminiKeyIndex] || '';
    }

    // Show success message
    if (typeof showToast !== 'undefined') {
        showToast('설정이 저장되었습니다!', 'success');
    } else {
        alert('설정이 저장되었습니다!');
    }

    closeSettings();

    // Reload page to apply changes
    setTimeout(() => {
        location.reload();
    }, 1000);
}
