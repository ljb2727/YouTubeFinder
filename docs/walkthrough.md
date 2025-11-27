# 변경 사항 가이드

## 1. API 키 자동 회전 제거
`rotateYoutubeKey`와 `rotateGeminiKey` 함수를 제거하여, API 키가 자동으로 변경되지 않도록 했습니다.

## 2. fetchWithAuth 함수 구현
기존 `fetchWithRotation`을 `fetchWithAuth`로 변경하고 다음 로직을 적용했습니다:
- 현재 선택된 API 키로 요청 시도
- 403 에러(할당량 초과 등) 발생 시:
  - 경고 메시지 표시 ("API 키 한도가 초과되었습니다...")
  - 설정 모달 자동 오픈
  - 에러 발생시켜 로직 중단

## 3. 호출부 업데이트
모든 API 호출 지점에서 `fetchWithAuth`를 사용하도록 수정했습니다.
