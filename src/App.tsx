import React, { useState, useCallback } from "react";
import Home from "./components/Home";
import GameScreen from "./components/GameScreen";
import WrongAnswerNote from "./components/WrongAnswerNote";
import Header from "./components/Header";
import { AppView, GameMode, VocabularyItem, WrongAnswerItem } from "./types";
import { shuffleArray } from "./utils";

const App: React.FC = () => {
  const [view, setView] = useState<AppView>(AppView.Home);
  const [gameVocabulary, setGameVocabulary] = useState<VocabularyItem[]>([]);
  const [gameMode, setGameMode] = useState<GameMode>(GameMode.MultipleChoice);
  const [wrongAnswers, setWrongAnswers] = useState<WrongAnswerItem[]>([]);

  const handleStartGame = (vocabulary: VocabularyItem[], mode: GameMode) => {
    setGameVocabulary(shuffleArray(vocabulary));
    setGameMode(mode);
    setView(AppView.Game);
  };

  const handleReviewWrongAnswers = (reviewList: VocabularyItem[]) => {
    // For simplicity, let's reuse the multiple choice mode for review.
    handleStartGame(reviewList, GameMode.MultipleChoice);
  };

  const handleGameEnd = useCallback((sessionWrongAnswers: VocabularyItem[]) => {
    setWrongAnswers((prevWrongAnswers) => {
      const updatedAnswers = [...prevWrongAnswers];
      sessionWrongAnswers.forEach((wrongItem) => {
        const existing = updatedAnswers.find(
          (item) => item.id === wrongItem.id
        );
        if (existing) {
          existing.missCount += 1;
        } else {
          updatedAnswers.push({ ...wrongItem, missCount: 1 });
        }
      });
      return updatedAnswers;
    });
    setView(AppView.WrongAnswers);
  }, []);

  const handleExitGame = () => {
    setGameVocabulary([]);
    setView(AppView.Home);
  };

  const renderContent = () => {
    switch (view) {
      case AppView.Game:
        return (
          <GameScreen
            vocabulary={gameVocabulary}
            mode={gameMode}
            onGameEnd={handleGameEnd}
            onExit={handleExitGame}
          />
        );
      case AppView.WrongAnswers:
        return (
          <WrongAnswerNote
            wrongAnswers={wrongAnswers}
            onReview={handleReviewWrongAnswers}
          />
        );
      case AppView.Home:
      default:
        return <Home onStartGame={handleStartGame} />;
    }
  };

  return (
    <div className="app-container">
      <Header
        currentView={view}
        setView={setView}
        hasWrongAnswers={wrongAnswers.length > 0}
      />
      <main className="main-content">{renderContent()}</main>
    </div>
  );
};

export default App;
