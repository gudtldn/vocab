/**
 * i18n (Internationalization) 시스템
 * 다국어 지원을 위한 중앙 관리 시스템
 */

import { ja } from "./locales/ja";
import { ko } from "./locales/ko";
import { en } from "./locales/en";
import type { Translation } from "./locales/ja";

export type Locale = "ja" | "ko" | "en";

const translations: Record<Locale, Translation> = {
  ja,
  ko,
  en,
};

// 현재 선택된 언어
let currentLocale: Locale = "ko";

/**
 * 현재 언어 가져오기
 */
export function getLocale(): Locale {
  return currentLocale;
}

/**
 * 언어 변경
 */
export function setLocale(locale: Locale): void {
  if (translations[locale]) {
    currentLocale = locale;
    // 로컬 스토리지에 저장
    if (typeof window !== "undefined") {
      localStorage.setItem("locale", locale);
    }
  }
}

/**
 * 번역 가져오기
 */
export function getTranslation(): Translation {
  return translations[currentLocale];
}

/**
 * 단축 함수: 현재 언어의 번역 객체
 */
export function t(): Translation {
  return getTranslation();
}

/**
 * 초기화: 저장된 언어 설정 불러오기
 */
export function initI18n(): void {
  if (typeof window !== "undefined") {
    const savedLocale = localStorage.getItem("locale") as Locale | null;
    if (savedLocale && translations[savedLocale]) {
      currentLocale = savedLocale;
    } else {
      // 브라우저 언어 감지
      const browserLang = navigator.language.toLowerCase();
      if (browserLang.startsWith("ko")) {
        currentLocale = "ko";
      } else if (browserLang.startsWith("ja")) {
        currentLocale = "ja";
      } else {
        currentLocale = "en";
      }
    }
  }
}

/**
 * 사용 가능한 모든 언어 목록
 */
export const availableLocales: Array<{ code: Locale; name: string; nativeName: string }> = [
  { code: "ja", name: "Japanese", nativeName: "日本語" },
  { code: "ko", name: "Korean", nativeName: "한국어" },
  { code: "en", name: "English", nativeName: "English" },
];

// 기본 export
export { ja, ko, en, translations };
export type { Translation };
