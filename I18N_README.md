# 🌍 다국어 지원 (Internationalization)

## ✨ 주요 변경사항

### 새로운 기능

- 🌐 **3개 언어 지원**: 일본어 (日本語), 한국어, English
- 🔄 **실시간 언어 전환**: 헤더에서 언어 선택 가능
- 💾 **언어 설정 저장**: `localStorage`에 자동 저장
- 🌍 **브라우저 언어 자동 감지**: 초기 로드 시 브라우저 언어 자동 선택

### 추가된 파일

```text
src/
├── i18n/
│   ├── index.ts              # i18n 시스템 진입점
│   ├── I18nContext.tsx       # React Context Provider
│   └── locales/
│       ├── ja.ts            # 일본어 번역
│       ├── ko.ts            # 한국어 번역
│       └── en.ts            # 영어 번역
└── components/
    └── LanguageSelector.tsx  # 언어 선택 드롭다운
```

### 수정된 파일

- ✅ `src/main.tsx` - I18nProvider 추가
- ✅ `src/components/Header.tsx` - i18n 적용
- ✅ `src/components/Home.tsx` - 부분 i18n 적용
- ✅ `src/App.css` - 언어 선택기 스타일 추가

## 📖 사용 가이드

자세한 사용법은 [`I18N_GUIDE.md`](./I18N_GUIDE.md)를 참고하세요.

### 컴포넌트에서 사용하기

```tsx
import { useI18n } from "../i18n/I18nContext";

function MyComponent() {
  const { t, locale, setLocale } = useI18n();
  
  return (
    <div>
      <h1>{t.common.appName}</h1>
      <p>{t.home.subtitle}</p>
      <button>{t.common.save}</button>
    </div>
  );
}
```

## 🚀 다음 단계

아직 다음 컴포넌트들은 i18n이 적용되지 않았습니다:

- [ ] `GameScreen.tsx`
- [ ] `WrongAnswerNote.tsx`
- [ ] `Statistics.tsx`
- [ ] `ReviewScreen.tsx`
- [ ] `VocabCreator.tsx`
- [ ] `VocabEditor.tsx`

점진적으로 적용할 수 있으며, 모든 번역은 `src/i18n/locales/` 폴더에서 관리됩니다.

## 🎨 UI 스크린샷

헤더 왼쪽 상단에 언어 선택 드롭다운이 추가되었습니다:

- 🇯🇵 日本語
- 🇰🇷 한국어
- 🇺🇸 English

## 🔧 기술 스택

- **React Context API**: 전역 상태 관리
- **TypeScript**: 타입 안전한 번역
- **localStorage**: 언어 설정 영구 저장
- **브라우저 언어 감지**: `navigator.language` API 사용
