// ==========================================
// UTILITY FUNCTIONS
// ==========================================

/**
 * 성과율에 따른 불꽃 아이콘 HTML 생성
 * @param {number} ratio - 성과율 (%)
 * @returns {string} 불꽃 아이콘 HTML
 */
function generateFireIcons(ratio) {
    // 성과율이 10,000% 이상인 경우: 숫자로 표시
    if (ratio >= 10000) {
        const displayRatio = (ratio / 1000).toFixed(1);
        return `<span class="flex items-center gap-1">
            <i class="fa-solid fa-fire text-lg text-yellow-300 drop-shadow-[0_0_5px_rgba(253,224,71,0.8)]"></i>
            <span class="text-yellow-300 font-bold text-sm">×${displayRatio}K</span>
        </span>`;
    }

    // 기존 로직: 10,000% 미만
    const bigFireCount = Math.floor(ratio / 1000);
    const smallFireCount = Math.floor((ratio % 1000) / 100);

    let fireIcons = '';
    if (bigFireCount > 0) {
        fireIcons += '<i class="fa-solid fa-fire text-lg text-yellow-300 drop-shadow-[0_0_5px_rgba(253,224,71,0.8)]"></i>'.repeat(
            bigFireCount
        );
    }
    if (smallFireCount > 0) {
        fireIcons += '<i class="fa-solid fa-fire text-sm"></i>'.repeat(
            Math.min(smallFireCount, 10)
        );
    }

    return fireIcons;
}

/**
 * 시간 경과 표시 (상대 시간)
 * @param {string} dateString - ISO 8601 날짜 문자열
 * @returns {string} 상대 시간 문자열
 */
function timeAgo(dateString) {
    const date = new Date(dateString);
    const now = new Date();
    const seconds = Math.floor((now - date) / 1000);

    if (seconds < 60) return '방금 전';
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}분 전`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `약 ${hours}시간 전`;
    const days = Math.floor(hours / 24);
    if (days < 7) return `${days}일 전`;
    const weeks = Math.floor(days / 7);
    if (weeks < 4) return `${weeks}주 전`;
    const months = Math.floor(days / 30);
    if (months < 12) return `${months}개월 전`;
    const years = Math.floor(days / 365);
    return `${years}년 전`;
}

/**
 * 재생 시간 포맷팅
 * @param {number} seconds - 초 단위 재생 시간
 * @returns {string} 포맷된 재생 시간
 */
function formatDuration(seconds) {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;

    if (h > 0) {
        return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    }
    return `${m}:${s.toString().padStart(2, '0')}`;
}
