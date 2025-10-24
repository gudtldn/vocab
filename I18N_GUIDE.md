# 🌍 다국어(i18n) 시스템 가이드

## 📁 파일 구조

```text
src/i18n/
├── index.ts              # i18n 메인 진입점 & 유틸리티 함수
├── I18nContext.tsx       # React Context Provider & useI18n 훅
└── locales/
    ├── ja.ts             # 일본어 (기준 언어)
    ├── ko.ts             # 한국어
    └── en.ts             # 영어
```

## 🚀 사용 방법

### 1. 컴포넌트에서 번역 사용하기

```tsx
import { useI18n } from "../i18n/I18nContext";

function MyComponent() {
  const { t } = useI18n();
  
  return (
    <div>
      <h1>{t.common.appName}</h1>
      <button>{t.common.save}</button>
      <p>{t.home.subtitle}</p>
    </div>
  );
}
```

### 2. 함수가 있는 번역 사용하기

일부 번역은 함수 형태입니다 (예: 동적 숫자 표시):

```tsx
// locales/ja.ts
vocabularyCount: (count: number) => `📚 ${count}個の単語`,

// 컴포넌트에서
<div>{t.home.vocabularyCount(42)}</div>
// 결과: 📚 42個の単語
```

### 3. 언어 전환하기

```tsx
import { useI18n } from "../i18n/I18nContext";

function LanguageSwitcher() {
  const { locale, setLocale } = useI18n();
  
  return (
    <select value={locale} onChange={(e) => setLocale(e.target.value)}>
      <option value="ja">日本語</option>
      <option value="ko">한국어</option>
      <option value="en">English</option>
    </select>
  );
}
```

## 📝 번역 키 구조

### `common` - 공통 UI 요소

- `appName`: 앱 이름
- `loading`, `error`, `success`: 상태 메시지
- `save`, `delete`, `edit`, `cancel` 등: 버튼 레이블

### `header` - 헤더 네비게이션

- `home`, `wrongAnswers`, `statistics`: 탭 이름
- `darkMode`, `lightMode`: 테마 전환

### `home` - 홈 화면

- `title`, `subtitle`: 제목 및 설명
- `uploadButton`, `createButton`: 버튼
- `vocabularyCount(count)`: 단어 수 표시 함수

### `game` - 게임/퀴즈 화면

- `progress`, `checkAnswer`, `skip`: 게임 UI
- `correct`, `incorrect(answer)`: 결과 메시지
- `result(correct, total)`: 최종 점수

### `review` - 복습 화면

- `title`, `accuracy`: 통계
- `all(count)`, `correctOnly(count)`, `incorrectOnly(count)`: 필터

### `wrongAnswers` - 오답노트

- `title`, `subtitle`, `empty`: 제목 및 상태
- `reviewAll`, `clearAll`: 액션 버튼
- `missCount(count)`, `correctStreak(count)`: 통계 함수

### `statistics` - 통계 화면

- `title`, `overview`: 제목
- `totalStudied`, `totalGames`: 통계 항목

### `editor` / `creator` - 단어장 편집/생성

- 입력 필드 레이블
- `wordPlaceholder`, `readingPlaceholder` 등: placeholder 텍스트

### `shortcuts` - 키보드 단축키

- 단축키 설명

### `errors` / `success` - 메시지

- 에러 및 성공 메시지

## ✏️ 새 번역 추가하기

### 1. 일본어(`ja.ts`)에 먼저 추가

```typescript
// src/i18n/locales/ja.ts
export const ja = {
  // 기존 코드...
  
  myNewSection: {
    title: "新しいセクション",
    button: "クリック",
    message: (name: string) => `こんにちは、${name}さん！`,
  },
};
```

### 2. 한국어(`ko.ts`) & 영어(`en.ts`)에도 추가

```typescript
// src/i18n/locales/ko.ts
myNewSection: {
  title: "새 섹션",
  button: "클릭",
  message: (name: string) => `안녕하세요, ${name}님!`,
},

// src/i18n/locales/en.ts
myNewSection: {
  title: "New Section",
  button: "Click",
  message: (name: string) => `Hello, ${name}!`,
},
```

## 🔧 타입 안전성

TypeScript가 자동으로 타입을 체크합니다:

```tsx
const { t } = useI18n();

t.home.title         // ✅ OK
t.home.nonExistent   // ❌ TypeScript 에러!
t.home.vocabularyCount(42)  // ✅ OK
t.home.vocabularyCount()    // ❌ TypeScript 에러! (인자 필요)
```

## 🎯 점진적 적용 가이드

이미 적용된 컴포넌트:

- ✅ `Header.tsx` - 완전히 적용됨
- ⏳ `Home.tsx` - 부분 적용 (title, subtitle, buttons)
- ⬜ `GameScreen.tsx` - 미적용
- ⬜ `WrongAnswerNote.tsx` - 미적용
- ⬜ `Statistics.tsx` - 미적용
- ⬜ `ReviewScreen.tsx` - 미적용

### 적용 예시: GameScreen.tsx

**Before:**

```tsx
<h2 className="progress-text">
  進捗: {currentQuestionIndex + 1} / {questions.length}
</h2>
```

**After:**

```tsx
import { useI18n } from "../i18n/I18nContext";

function GameScreen() {
  const { t } = useI18n();
  
  return (
    <h2 className="progress-text">
      {t.game.progress}: {currentQuestionIndex + 1} / {questions.length}
    </h2>
  );
}
```

## 💡 베스트 프랙티스

### 1. 하드코딩된 텍스트 찾기

```bash
# VSCode에서 Ctrl+Shift+F로 검색:
"日本語"
"誤答"
"統計"
```

### 2. 번역 함수 사용

동적 값이 있는 경우:

```typescript
// ❌ 나쁜 예
`${count}個の単語`

// ✅ 좋은 예
wordCount: (count: number) => `${count}개 단어`,
```

### 3. 조건부 텍스트

```tsx
// ❌ 나쁜 예
{darkMode ? "ライトモード" : "ダークモード"}

// ✅ 좋은 예
{darkMode ? t.header.lightMode : t.header.darkMode}
```

## 🌐 브라우저 언어 자동 감지

초기 로드 시 자동으로 브라우저 언어를 감지:

- `ko`로 시작 → 한국어
- `ja`로 시작 → 일본어
- 그 외 → 영어

사용자가 언어를 변경하면 `localStorage`에 저장되어 다음 방문 시 유지됩니다.

## 🔄 다음 단계

1. **나머지 컴포넌트에 i18n 적용**
   - `GameScreen.tsx`
   - `WrongAnswerNote.tsx`
   - `Statistics.tsx`
   - `ReviewScreen.tsx`
   - `VocabCreator.tsx`

2. **추가 언어 지원**
   - 중국어 (간체/번체)
   - 프랑스어
   - 스페인어
   등을 `locales/` 폴더에 추가

3. **날짜 포맷 국제화**

   ```typescript
   // 추후 추가 예정
   lastUsed: new Date().toLocaleDateString(locale)
   ```

## 📚 참고

- React i18n 패턴: Context API 사용
- 타입 안전성: TypeScript `typeof` 추론
- 저장소: `localStorage`의 `locale` 키
- 기본 언어: 일본어 (`ja`)
