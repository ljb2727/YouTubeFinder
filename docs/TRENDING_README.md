# Trending 기능 - 유지보수 가이드

## 📁 파일 구조

```
YouTubeFinder/
├── index.html          # 메인 HTML (trending 탭 컨테이너만 있음)
├── trending-tab.html   # Trending 탭 HTML (UI만)
├── trending.js         # Trending 로직 (모든 기능)
└── backup.html         # 백업 파일
```

## 🎯 현재 상태

### ✅ 완료된 작업
1. **trending-tab.html** - 완성됨
   - 깔끔한 UI
   - 읽기 전용 키워드 표시
   - 24시간 안내 문구

2. **trending.js** - 완성됨
   - 고정 키워드 11개
   - 24시간 캐시
   - 최소 API 사용량 (1페이지만)
   - 자동 HTML 로드 기능

### ⚠️ index.html 수정 필요

`index.html`에서 trending 탭을 다음과 같이 수정해야 합니다:

**찾기:** (581-677 라인 근처)
```html
      <!-- TRENDING TAB CONTENT -->
      <div id="trendingTabContent" class="hidden">
        <div class="max-w-6xl mx-auto">
          ... (기존 내용) ...
        </div>
      </div>
```

**바꾸기:**
```html
      <!-- TRENDING TAB CONTENT -->
      <div id="trendingTabContent" class="hidden">
        <!-- trending.js가 trending-tab.html을 자동으로 로드합니다 -->
      </div>
```

**그리고 파일 끝에 script 태그 추가:**
```html
    </script>
    <script src="trending.js"></script>  <!-- 이 줄 추가 -->
  </body>
</html>
```

## 🚀 작동 방식

1. 페이지 로드 → `trending.js` 실행
2. `trending.js`가 `trending-tab.html` 자동 로드
3. HTML 로드 후 trending 기능 초기화
4. 캐시 확인 → 있으면 표시, 없으면 API 호출

## 📝 수정 방법

### 키워드 변경
**파일:** `trending.js`  
**위치:** 6-10번 라인
```javascript
const FIXED_TRENDING_KEYWORDS = [
    "키워드1", "키워드2", ...
];
```

### 캐시 시간 변경
**파일:** `trending.js`  
**위치:** 65번 라인 근처
```javascript
const cacheDuration = 24 * 60 * 60 * 1000; // 24시간
```

### UI 텍스트 변경
**파일:** `trending-tab.html`
- 제목, 설명, 안내 문구 등 모두 여기서 수정

## 💡 장점

- ✅ **파일 분리**: HTML, JS, CSS가 분리되어 관리 편함
- ✅ **재사용성**: `trending-tab.html`을 다른 프로젝트에도 사용 가능
- ✅ **유지보수**: trending 수정 시 trending 관련 파일만 수정
- ✅ **안전성**: 메인 `index.html` 손상 위험 최소화

## 🔧 문제 해결

### trending 탭이 표시되지 않는 경우
1. 브라우저 콘솔(F12) 확인
2. `trending.js`가 로드되는지 확인
3. `trending-tab.html` 경로 확인

### API 할당량 초과
1. `trending.js`에서 캐시 시간 늘리기
2. 키워드 개수 줄이기
3. 페이지 수 확인 (현재 1페이지로 설정됨)

## 📊 API 사용량

- **이전**: ~30회/로드
- **현재**: ~8회/로드
- **절감**: 73%

---
**최종 업데이트**: 2025-11-26
**작성자**: Antigravity AI Assistant
