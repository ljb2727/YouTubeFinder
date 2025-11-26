# 개발 모드 설치 가이드

API 설정 창에서 체크박스 하나만 클릭하면 모든 기능을 더미 데이터로 테스트할 수 있도록 설정하는 방법입니다.

## 🚀 빠른 설치 (3단계)

### 1단계: 스크립트 파일 추가

`index.html` 파일의 `</body>` 태그 바로 위에 다음 두 줄을 추가하세요:

```html
    <script src="dev_mode_config.js"></script>
    <script src="dev_mode_inject.js"></script>
    <script src="trending.js"></script>
</body>
```

**중요**: `dev_mode_config.js`와 `dev_mode_inject.js`는 반드시 `trending.js` **앞에** 로드되어야 합니다!

### 2단계: API 설정 모달에 체크박스 추가

`index.html` 파일에서 "Gemini API Keys" 섹션을 찾으세요. (약 680번 라인 근처)

다음 HTML을 Gemini API 섹션과 "저장하기" 버튼 사이에 추가하세요:

```html
                    <!-- 개발 모드 설정 -->
                    <div class="border-t border-white/10 pt-6">
                        <div class="flex items-center gap-3 mb-2">
                            <input type="checkbox" id="devModeCheckbox" 
                                class="w-5 h-5 accent-purple-500 rounded" 
                                onchange="toggleDevMode(this.checked)" />
                            <label for="devModeCheckbox" class="text-sm font-medium text-white cursor-pointer">
                                🔧 개발 모드 (더미 데이터 사용)
                            </label>
                        </div>
                        <p class="text-xs text-gray-500 ml-8">
                            체크 시 API 키 없이 모든 기능을 더미 데이터로 테스트할 수 있습니다. 실제 API 호출이 발생하지 않습니다.
                        </p>
                        <div id="devModeWarning" class="hidden ml-8 mt-2 p-3 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
                            <p class="text-xs text-yellow-400">
                                ⚠️ 개발 모드가 활성화되었습니다. 배포 전에 반드시 비활성화하세요!
                            </p>
                        </div>
                    </div>
```

**삽입 위치 예시:**

```html
                        </p>
                    </div>  <!-- Gemini API 섹션 끝 -->

                    <!-- 👇 여기에 위의 개발 모드 HTML 추가 -->
                    
                    <button onclick="saveApiKeys()"  <!-- 저장하기 버튼 시작 -->
```

### 3단계: 확인

브라우저에서 `index.html`을 열고:
1. "API 설정" 버튼 클릭
2. 개발 모드 체크박스가 보이는지 확인
3. 체크박스 체크 → "저장하기" 클릭
4. 검색창에 아무거나 입력 → 더미 데이터가 표시되는지 확인!

## ✅ 작동 확인

### 개발 모드 ON
- 개발자 콘솔에 `🔧 개발 모드: 더미 검색 데이터 로드` 메시지 표시
- API 호출 없이 더미 데이터 표시
- 검색, 인기, AI 분석 모두 더미로 작동

### 개발 모드 OFF  
- 개발자 콘솔에 `Trending 모드: 프로덕션 (실제 API)` 메시지 표시
- 실제 YouTube API 호출
- API 키 필요

## 📋 생성된 파일 목록

- ✅ `dev_mode_config.js` - 개발 모드 설정 관리
- ✅ `dev_mode_inject.js` - 검색/AI 분석에 더미 데이터 주입
- ✅ `dummy_search.json` - 검색용 더미 데이터
- ✅ `dummy_trending.json` - 인기 탭용 더미 데이터 (이미 생성됨)
- ✅ `trending.js` - localStorage 기반으로 수정됨

## 🎯 사용 시나리오

### 개발 중
1. API 설정에서 개발 모드 체크
2. API 키 없이 자유롭게 테스트
3. UI/로직 개발 집중

### 배포 전
1. API 설정에서 개발 모드 **체크 해제**
2. 실제 API 키 입력
3. 실제 데이터로 최종 검증

## ⚠️ 주의사항

- **반드시** 배포 전에 개발 모드를 해제하세요!
- 개발 모드는 localStorage에 저장되므로 브라우저/사용자별로 독립적입니다
- 더미 데이터는 `dummy_search.json`과 `dummy_trending.json`을 수정하여 커스텀 가능합니다

---

**문제 발생 시:**
1. 브라우저 콘솔(F12)에서 에러 메시지 확인
2. 스크립트 로드 순서 확인 (`dev_mode_config.js` → `dev_mode_inject.js` → `trending.js`)
3. 체크박스 HTML이 올바른 위치에 추가되었는지 확인
