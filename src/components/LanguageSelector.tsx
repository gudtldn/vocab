/**
 * 언어 선택 컴포넌트
 */

import { useI18n } from "../i18n/I18nContext";
import { availableLocales } from "../i18n";

export function LanguageSelector() {
  const { locale, setLocale } = useI18n();

  return (
    <div className="language-selector">
      <select
        value={locale}
        onChange={(e) => setLocale(e.target.value as any)}
        className="language-select"
        aria-label="Select language"
      >
        {availableLocales.map((lang) => (
          <option key={lang.code} value={lang.code}>
            {lang.nativeName}
          </option>
        ))}
      </select>
    </div>
  );
}
