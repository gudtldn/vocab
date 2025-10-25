import React from "react";
import { AppView } from "../types";
import { useI18n } from "../i18n/I18nContext";
import { LanguageSelector } from "../components/LanguageSelector";
import VersionInfo from "./VersionInfo";

interface HeaderProps {
  currentView: AppView;
  setView: (view: AppView) => void;
  hasWrongAnswers: boolean;
  darkMode: boolean;
  toggleDarkMode: () => void;
}

const Header: React.FC<HeaderProps> = ({
  setView,
  currentView,
  hasWrongAnswers,
  darkMode,
  toggleDarkMode,
}) => {
  const { t } = useI18n();

  const NavButton: React.FC<{ view: AppView; children: React.ReactNode }> = ({
    view,
    children,
  }) => (
    <button
      onClick={() => setView(view)}
      disabled={view === AppView.WrongAnswers && !hasWrongAnswers}
      className={`nav-button ${currentView === view ? "active" : ""}`}
    >
      {children}
    </button>
  );

  return (
    <header className="app-header">
      <div className="header-content">
        <div className="header-left">
          <div
            className="logo-container"
            onClick={() => setView(AppView.Home)}
            role="button"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="logo-icon"
              viewBox="0 0 24 24"
              fill="currentColor"
            >
              <path d="M12.38 .94a1.86 1.86 0 0 0-2.76 0L.94 9.62a1.86 1.86 0 0 0 .16 2.8l8.49 6.06a1.86 1.86 0 0 0 2.42 0l8.49-6.06a1.86 1.86 0 0 0 .16-2.8L12.38.94zM3.8 11.23l7.2-5.14a.36.36 0 0 1 .4 0l7.2 5.14-7.4 5.28-7.4-5.28zm8.6 11.23l-8.5-6.07-1.4 1a1.86 1.86 0 0 0-.16 2.8l9.67 6.91a1.86 1.86 0 0 0 2.6 0l9.67-6.91a1.86 1.86 0 0 0-.16-2.8l-1.4-1-8.5 6.07z" />
            </svg>
            <h1 className="app-title">{t.common.appName}</h1>
            <VersionInfo />
          </div>
          <LanguageSelector />
        </div>
        <nav className="navigation">
          <NavButton view={AppView.Home}>{t.header.home}</NavButton>
          <NavButton view={AppView.WrongAnswers}>{t.header.wrongAnswers}</NavButton>
          <NavButton view={AppView.Statistics}>{t.header.statistics}</NavButton>
          <button
            onClick={toggleDarkMode}
            className="nav-button theme-toggle"
            title={darkMode ? t.header.lightMode : t.header.darkMode}
          >
            {darkMode ? "☀️" : "🌙"}
          </button>
        </nav>
      </div>
    </header>
  );
};

export default Header;
