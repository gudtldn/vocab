import React, { useState, useCallback, useEffect } from "react";
import Home from "./components/Home";
import GameScreen from "./components/GameScreen";
import WrongAnswerNote from "./components/WrongAnswerNote";
import Header from "./components/Header";
import { AppView, GameMode, VocabularyItem, WrongAnswerItem } from "./types";
import { shuffleArray } from "./utils";
import {
  writeTextFile,
  readTextFile,
  exists,
  BaseDirectory,
  mkdir,
} from "@tauri-apps/plugin-fs";
import { appDataDir } from "@tauri-apps/api/path";

const App: React.FC = () => {
  const [view, setView] = useState<AppView>(AppView.Home);
  const [gameVocabulary, setGameVocabulary] = useState<VocabularyItem[]>([]);
  const [gameMode, setGameMode] = useState<GameMode>(GameMode.MultipleChoice);
  const [wrongAnswers, setWrongAnswers] = useState<WrongAnswerItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // 앱 시작 시 오답 노트 불러오기
  useEffect(() => {
    const loadWrongAnswers = async () => {
      try {
        const fileExists = await exists("wrongAnswers.json", {
          baseDir: BaseDirectory.AppData,
        });

        if (fileExists) {
          const data = await readTextFile("wrongAnswers.json", {
            baseDir: BaseDirectory.AppData,
          });
          const parsed = JSON.parse(data) as WrongAnswerItem[];
          setWrongAnswers(parsed);
          console.log("오답 노트 불러오기 성공:", parsed.length, "개");
        }
      } catch (error) {
        console.error("오답 노트 불러오기 실패:", error);
      } finally {
        setIsLoading(false);
      }
    };

    loadWrongAnswers();
  }, []);

  // wrongAnswers가 변경될 때마다 자동 저장
  useEffect(() => {
    const saveWrongAnswers = async () => {
      // 로딩이 끝난 후에만 저장 (초기 로드 시에는 저장하지 않음)
      if (!isLoading) {
        try {
          // 앱 데이터 디렉터리 경로 가져오기
          const appDataPath = await appDataDir();

          // 디렉터리가 없으면 생성
          await mkdir(appDataPath, { recursive: true }).catch(() => {});

          await writeTextFile(
            "wrongAnswers.json",
            JSON.stringify(wrongAnswers, null, 2),
            { baseDir: BaseDirectory.AppData }
          );
          console.log("오답 노트 저장 성공:", wrongAnswers.length, "개");
        } catch (error) {
          console.error("오답 노트 저장 실패:", error);
        }
      }
    };

    saveWrongAnswers();
  }, [wrongAnswers, isLoading]);

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
          (item) =>
            item.word === wrongItem.word && item.reading === wrongItem.reading
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

  if (isLoading) {
    return (
      <div className="app-container">
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            minHeight: "100vh",
            fontSize: "1.2rem",
            color: "#666",
          }}
        >
          読み込み中...
        </div>
      </div>
    );
  }

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
