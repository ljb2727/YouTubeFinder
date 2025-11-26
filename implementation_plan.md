# API 키 수동 선택 변경 계획

## 목표
API 키 자동 회전 기능을 제거하고, 할당량 초과(403 에러) 발생 시 사용자가 직접 설정에서 키를 변경하도록 수정합니다.

## 변경 사항

1.  **자동 회전 함수 제거**:
    *   `rotateYoutubeKey` 함수 제거
    *   `rotateGeminiKey` 함수 제거

2.  **API 호출 함수 리팩토링**:
    *   `fetchWithRotation` 함수를 `fetchWithAuth`로 이름 변경
    *   자동 재시도(while loop) 로직 제거
    *   403 에러 발생 시:
        *   사용자에게 알림 (Toast 메시지)
        *   설정 모달 열기 (`openSettings()`)
        *   에러 throw

3.  **호출부 수정**:
    *   `loadFavoritesFeed` 내 `fetchWithRotation` 호출을 `fetchWithAuth`로 변경
    *   `loadTrendingFeed` 내 `fetchWithRotation` 호출을 `fetchWithAuth`로 변경
    *   `fetchTargetChannelSubs` 내 `fetchWithRotation` 호출을 `fetchWithAuth`로 변경

## 검증 계획
*   수정 후 앱을 실행하여 정상적으로 API 호출이 되는지 확인
*   (가능하다면) 잘못된 키를 설정하여 403 에러 발생 시 설정창이 뜨는지 확인
