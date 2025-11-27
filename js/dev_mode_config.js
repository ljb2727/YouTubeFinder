// ==========================================
// 개발 모드 설정 관리
// ==========================================

// localStorage에서 개발 모드 상태 가져오기
let DEV_MODE = localStorage.getItem('DEV_MODE') === 'true';

// 개발 모드 토글 함수
function toggleDevMode(enabled) {
    DEV_MODE = enabled;
    localStorage.setItem('DEV_MODE', enabled);

    // 경고 표시/숨김
    const warning = document.getElementById('devModeWarning');
    if (warning) {
        if (enabled) {
            warning.classList.remove('hidden');
        } else {
            warning.classList.add('hidden');
        }
    }

    // trending.js의 USE_DUMMY_DATA 업데이트
    window.USE_DUMMY_DATA = enabled;

    // 페이지 새로고침 알림
    if (typeof showToast === 'function') {
        if (enabled) {
            showToast('🔧 개발 모드가 활성화되었습니다. 이제 더미 데이터를 사용합니다.', 'success');
        } else {
            showToast('✅ 개발 모드가 비활성화되었습니다. 실제 API를 사용합니다.', 'info');
        }
    }

    console.log(`개발 모드: ${enabled ? 'ON' : 'OFF'}`);
}

// 페이지 로드 시 개발 모드 체크박스 상태 복원
window.addEventListener('DOMContentLoaded', () => {
    const checkbox = document.getElementById('devModeCheckbox');
    if (checkbox) {
        checkbox.checked = DEV_MODE;
        
        // 경고 표시/숨김 (초기 상태)
        const warning = document.getElementById('devModeWarning');
        if (warning) {
            if (DEV_MODE) {
                warning.classList.remove('hidden');
            } else {
                warning.classList.add('hidden');
            }
        }
    }
    
    console.log(`개발 모드 초기 상태: ${DEV_MODE ? 'ON' : 'OFF'}`);
});

// 전역으로 노출
window.DEV_MODE = DEV_MODE;
window.USE_DUMMY_DATA = DEV_MODE; // trending.js 호환성
window.toggleDevMode = toggleDevMode;
