# 개발 모드 사용 가이드

## 🔧 더미 데이터 모드란?

개발 중에 YouTube API 할당량을 절약하고 빠르게 테스트할 수 있도록, 실제 API 호출 대신 로컬 더미 데이터를 사용하는 모드입니다.

## 📁 관련 파일

- **`trending.js`**: trending 로직 (개발 모드 플래그 포함)
- **`dummy_trending.json`**: 테스트용 더미 비디오 데이터

## 🚀 사용 방법

### 1. 개발 모드로 전환 (더미 데이터 사용)

`trending.js` 파일의 5번째 라인을 수정합니다:

```javascript
const USE_DUMMY_DATA = true; // 개발 중
```

### 2. 프로덕션 모드로 전환 (실제 API 사용)

`trending.js` 파일의 5번째 라인을 수정합니다:

```javascript
const USE_DUMMY_DATA = false; // 배포 시
```

## ✨ 장점

- ✅ **API 할당량 절약**: YouTube API 쿼터를 소모하지 않음
- ✅ **빠른 테스트**: 네트워크 지연 없이 즉시 결과 확인
- ✅ **일관된 데이터**: 매번 동일한 결과로 UI/로직 테스트 가능
- ✅ **오프라인 작업**: 인터넷 연결 없이도 개발 가능
- ✅ **API 키 불필요**: 개발 모드에서는 API 키 없이도 테스트 가능!

## 🔑 API 키 없이 테스트하기

**개발 모드(`USE_DUMMY_DATA = true`)에서는 API 키가 전혀 필요하지 않습니다!**

1. `trending.js`에서 `USE_DUMMY_DATA = true` 확인
2. 브라우저에서 `index.html` 열기
3. 인기 탭 클릭
4. API 키 설정 없이 바로 더미 데이터 확인!

> **참고**: 개발 모드에서는 trending 탭만 더미 데이터를 사용합니다. 검색, 즐겨찾기, AI 분석 기능을 테스트하려면 실제 API 키가 필요합니다.

## 📝 더미 데이터 커스터마이징

`dummy_trending.json` 파일을 수정하여 원하는 테스트 시나리오를 만들 수 있습니다:

```json
{
  "id": { "videoId": "custom_vid_001" },
  "snippet": {
    "title": "테스트용 제목",
    "channelTitle": "테스트 채널",
    ...
  },
  "statistics": {
    "viewCount": "100000",
    "subscriberCount": "5000",
    ...
  },
  ...
}
```

## ⚠️ 주의사항

**배포 전 반드시 `USE_DUMMY_DATA = false`로 변경하세요!**

그렇지 않으면 실제 사용자에게 더미 데이터가 표시됩니다.

## 🔍 작동 확인

브라우저 개발자 콘솔(F12)에서 다음 메시지를 확인하세요:

- 개발 모드: `🔧 개발 모드: 더미 데이터를 로드합니다...`
- 프로덕션 모드: `🚀 프로덕션 모드: YouTube API를 호출합니다...`

---

**최종 업데이트**: 2025-11-26
