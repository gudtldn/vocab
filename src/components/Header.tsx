import React from "react";
import { AppView } from "../types";

interface HeaderProps {
  currentView: AppView;
  setView: (view: AppView) => void;
  hasWrongAnswers: boolean;
}

const Header: React.FC<HeaderProps> = ({
  setView,
  currentView,
  hasWrongAnswers,
}) => {
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
          <h1 className="app-title">日本語クイズ</h1>
        </div>
        <nav className="navigation">
          <NavButton view={AppView.Home}>ホーム</NavButton>
          <NavButton view={AppView.WrongAnswers}>誤答ノート</NavButton>
          <NavButton view={AppView.Statistics}>統計</NavButton>
        </nav>
      </div>
    </header>
  );
};

export default Header;
