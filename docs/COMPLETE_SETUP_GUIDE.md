# 🔧 개발 모드 완벽 설정 가이드

이 가이드는 YouTubeFinder에 개발 모드를 설정하는 **완벽한 단계별 가이드**입니다.

---

## 📋 목차

1. [개요](#개요)
2. [1단계: Script 태그 추가](#1단계-script-태그-추가)
3. [2단계: API 설정 버튼 추가](#2단계-api-설정-버튼-추가)
4. [3단계: API 설정 모달 추가](#3단계-api-설정-모달-추가)
5. [4단계: 테스트](#4단계-테스트)

---

## 개요

개발 모드는 다음 기능을 제공합니다:
- ✅ API 키 없이 모든 기능 테스트 가능
- ✅ 검색, 인기, AI 분석 모두 더미 데이터 사용
- ✅ API 할당량 소모 없음
- ✅ UI에서 토글 가능

---

## 1단계: Script 태그 추가

`index.html` 파일을 열고, **`</body>` 태그 바로 앞**에 다음 스크립트 태그들을 추가하세요:

```html
    <!-- 개발 모드 스크립트 (trending.js 전에 로드) -->
    <script src="dev_mode_config.js"></script>
    <script src="dev_mode_inject.js"></script>
    <script src="trending.js"></script>
  </body>
</html>
```

**⚠️ 중요:** 
- `dev_mode_config.js`는 반드시 **가장 먼저** 로드되어야 합니다.
- `trending.js`는 **가장 마지막**에 로드되어야 합니다.

---

## 2단계: API 설정 버튼 추가

`index.html`의 **헤더 섹션**에서 API 설정 버튼을 찾거나 추가하세요.

보통 다음과 같은 위치에 있습니다:

```html
<header class="...">
  <!-- 기존 헤더 콘텐츠 -->
  
  <!-- API 설정 버튼 추가 -->
  <button onclick="openSettings()" 
    class="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 rounded-lg border border-white/10 transition-all">
    <i class="fa-solid fa-gear"></i>
    <span class="hidden sm:inline">API 설정</span>
  </button>
</header>
```

---

## 3단계: API 설정 모달 추가

`index.html`의 **`<main>` 태그 바로 뒤**, 즉 **`</main>` 다음**에 다음 모달 HTML을 추가하세요:

```html
  </main>

  <!-- Settings Modal -->
  <div id="settingsModal" class="fixed inset-0 z-[110] hidden">
    <div class="absolute inset-0 bg-black/80 backdrop-blur-sm transition-opacity" onclick="closeSettings()"></div>
    <div class="absolute inset-0 flex items-center justify-center p-4 pointer-events-none">
      <div class="bg-[#1e293b] w-full max-w-md rounded-2xl shadow-2xl border border-white/10 pointer-events-auto overflow-hidden transform transition-all scale-95 opacity-0"
        id="settingsContent">
        <!-- Modal Header -->
        <div class="p-6 border-b border-white/10 flex justify-between items-center bg-[#0f172a]">
          <div class="flex items-center gap-3">
            <i class="fa-solid fa-gear text-blue-400"></i>
            <h2 class="text-xl font-bold text-white">API 키 설정</h2>
          </div>
          <button onclick="closeSettings()"
            class="text-gray-400 hover:text-white transition-colors p-2 hover:bg-white/5 rounded-lg">
            <i class="fa-solid fa-xmark text-2xl"></i>
          </button>
        </div>

        <!-- Modal Body -->
        <div class="p-6 space-y-6">
          <p class="text-sm text-gray-400">
            API 키를 입력하면 브라우저에 안전하게 저장됩니다.
          </p>

          <!-- YouTube API Keys -->
          <div>
            <label class="block text-sm font-medium text-gray-300 mb-2">YouTube Data API Keys (최대 3개)</label>
            <div class="space-y-2">
              <div class="flex items-center gap-2">
                <input type="radio" name="activeYoutubeKey" value="0" class="accent-blue-500 w-4 h-4" />
                <input type="password" id="inputYoutubeKey1"
                  class="flex-grow bg-black/20 border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-blue-500 transition-colors"
                  placeholder="Key 1" />
              </div>
              <div class="flex items-center gap-2">
                <input type="radio" name="activeYoutubeKey" value="1" class="accent-blue-500 w-4 h-4" />
                <input type="password" id="inputYoutubeKey2"
                  class="flex-grow bg-black/20 border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-blue-500 transition-colors"
                  placeholder="Key 2 (Optional)" />
              </div>
              <div class="flex items-center gap-2">
                <input type="radio" name="activeYoutubeKey" value="2" class="accent-blue-500 w-4 h-4" />
                <input type="password" id="inputYoutubeKey3"
                  class="flex-grow bg-black/20 border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-blue-500 transition-colors"
                  placeholder="Key 3 (Optional)" />
              </div>
            </div>
            <p class="text-xs text-gray-500 mt-1">
              <a href="https://console.cloud.google.com/apis/credentials" target="_blank"
                class="text-blue-400 hover:underline">Google Cloud Console</a>에서 발급
            </p>
          </div>

          <!-- Gemini API Keys -->
          <div>
            <label class="block text-sm font-medium text-gray-300 mb-2">Gemini API Keys (최대 3개)</label>
            <div class="space-y-2">
              <div class="flex items-center gap-2">
                <input type="radio" name="activeGeminiKey" value="0" class="accent-blue-500 w-4 h-4" />
                <input type="password" id="inputGeminiKey1"
                  class="flex-grow bg-black/20 border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-blue-500 transition-colors"
                  placeholder="Key 1" />
              </div>
              <div class="flex items-center gap-2">
                <input type="radio" name="activeGeminiKey" value="1" class="accent-blue-500 w-4 h-4" />
                <input type="password" id="inputGeminiKey2"
                  class="flex-grow bg-black/20 border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-blue-500 transition-colors"
                  placeholder="Key 2 (Optional)" />
              </div>
              <div class="flex items-center gap-2">
                <input type="radio" name="activeGeminiKey" value="2" class="accent-blue-500 w-4 h-4" />
                <input type="password" id="inputGeminiKey3"
                  class="flex-grow bg-black/20 border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-blue-500 transition-colors"
                  placeholder="Key 3 (Optional)" />
              </div>
            </div>
            <p class="text-xs text-gray-500 mt-1">
              <a href="https://aistudio.google.com/app/apikey" target="_blank"
                class="text-blue-400 hover:underline">Google AI Studio</a>에서 발급
            </p>
          </div>

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

          <!-- 저장 버튼 -->
          <button onclick="saveApiKeys()"
            class="w-full bg-blue-600 hover:bg-blue-500 text-white py-3 rounded-lg font-bold transition-all shadow-lg shadow-blue-600/20">
            <i class="fa-solid fa-save mr-2"></i>저장하기
          </button>
        </div>
      </div>
    </div>
  </div>

  <!-- Toast Container -->
  <div id="toast-container"></div>
```

---

## 4단계: 테스트

1. **브라우저에서 `index.html` 열기**
2. **Ctrl+F5** 또는 **Cmd+Shift+R**로 강제 새로고침
3. **"API 설정"** 버튼 클릭
4. **"🔧 개발 모드"** 체크박스 확인
5. 체크 후 **"저장하기"** 클릭
6. **검색 탭**에서 아무 검색어나 입력하고 검색 → 더미 데이터 표시 확인
7. **인기 탭** 클릭 → 더미 데이터 표시 확인
8. 비디오 클릭하여 **AI 분석** 모달 열기 → 더미 분석 결과 확인

---

## 🐞 문제 해결

### 문제: "toggleDevMode is not defined" 오류
**해결:** `dev_mode_config.js`가 올바르게 로드되지 않았습니다. Script 태그 순서를 확인하세요.

### 문제: 검색해도 더미 데이터가 안 나옴
**해결:** 
1. 브라우저 콘솔(F12)에서 `localStorage.getItem('DEV_MODE')` 확인
2. `"true"`가 아니면 다시 체크박스를 체크하고 저장
3. 페이지 새로고침

### 문제: 모달이 안 열림
**해결:** 
1. 콘솔에서 `openSettings()` 함수 확인
2. JavaScript 오류가 있는지 확인
3. `settingsModal` ID가 중복되지 않았는지 확인

---

## 📝 체크리스트

설정을 완료했다면 다음 항목들을 확인하세요:

- [ ] `dev_mode_config.js` 스크립트 태그 추가됨
- [ ] `dev_mode_inject.js` 스크립트 태그 추가됨
- [ ] `trending.js` 스크립트 태그 추가됨 (마지막에 로드)
- [ ] API 설정 버튼이 헤더에 추가됨
- [ ] Settings Modal HTML이 추가됨
- [ ] 개발 모드 체크박스가 모달에 표시됨
- [ ] 체크박스 토글 시 경고 메시지가 표시됨
- [ ] 검색, 인기, AI 분석에서 더미 데이터가 표시됨
- [ ] 개발 모드 해제 시 실제 API 호출로 전환됨

---

## 🎉 완료!

모든 단계를 완료했다면, 이제 API 키 없이도 모든 기능을 테스트할 수 있습니다!

배포 전에는 반드시 개발 모드를 비활성화하는 것을 잊지 마세요! 🚀
