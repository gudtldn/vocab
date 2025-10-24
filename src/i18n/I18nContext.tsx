/**
 * i18n Context Provider
 * React Context를 통해 앱 전체에서 다국어 지원
 */

import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { Locale, getLocale, setLocale as setI18nLocale, getTranslation, initI18n } from "./index";
import type { Translation } from "./locales/ja";

interface I18nContextType {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: Translation;
}

const I18nContext = createContext<I18nContextType | undefined>(undefined);

export function I18nProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(getLocale());
  const [t, setTranslation] = useState<Translation>(getTranslation());

  useEffect(() => {
    // 초기화
    initI18n();
    setLocaleState(getLocale());
    setTranslation(getTranslation());
  }, []);

  const setLocale = (newLocale: Locale) => {
    setI18nLocale(newLocale);
    setLocaleState(newLocale);
    setTranslation(getTranslation());
  };

  return (
    <I18nContext.Provider value={{ locale, setLocale, t }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useI18n(): I18nContextType {
  const context = useContext(I18nContext);
  if (!context) {
    throw new Error("useI18n must be used within an I18nProvider");
  }
  return context;
}
