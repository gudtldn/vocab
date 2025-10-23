import React, { useState, useCallback, useEffect } from "react";
import Home from "./components/Home";
import GameScreen from "./components/GameScreen";
import WrongAnswerNote from "./components/WrongAnswerNote";
import Statistics from "./components/Statistics";
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
  const [totalWordsStudied, setTotalWordsStudied] = useState(0);
  const [totalGamesPlayed, setTotalGamesPlayed] = useState(0);

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
          // 기존 데이터에 correctStreak 필드가 없는 경우 0으로 초기화
          const migratedData = parsed.map((item) => ({
            ...item,
            correctStreak: item.correctStreak ?? 0,
          }));
          setWrongAnswers(migratedData);
          console.log("오답 노트 불러오기 성공:", migratedData.length, "개");
        }
      } catch (error) {
        console.error("오답 노트 불러오기 실패:", error);
      }

      // 통계 데이터 불러오기
      try {
        const statsExists = await exists("statistics.json", {
          baseDir: BaseDirectory.AppData,
        });

        if (statsExists) {
          const statsData = await readTextFile("statistics.json", {
            baseDir: BaseDirectory.AppData,
          });
          const stats = JSON.parse(statsData);
          setTotalWordsStudied(stats.totalWordsStudied || 0);
          setTotalGamesPlayed(stats.totalGamesPlayed || 0);
          console.log("통계 불러오기 성공");
        }
      } catch (error) {
        console.error("통계 불러오기 실패:", error);
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

  // 통계 데이터 저장
  useEffect(() => {
    const saveStatistics = async () => {
      if (!isLoading) {
        try {
          const appDataPath = await appDataDir();
          await mkdir(appDataPath, { recursive: true }).catch(() => {});

          const stats = {
            totalWordsStudied,
            totalGamesPlayed,
          };

          await writeTextFile(
            "statistics.json",
            JSON.stringify(stats, null, 2),
            { baseDir: BaseDirectory.AppData }
          );
          console.log("통계 저장 성공");
        } catch (error) {
          console.error("통계 저장 실패:", error);
        }
      }
    };

    saveStatistics();
  }, [totalWordsStudied, totalGamesPlayed, isLoading]);

  const handleStartGame = (vocabulary: VocabularyItem[], mode: GameMode) => {
    setGameVocabulary(shuffleArray(vocabulary));
    setGameMode(mode);
    setView(AppView.Game);
  };

  const handleReviewWrongAnswers = (reviewList: VocabularyItem[]) => {
    // For simplicity, let's reuse the multiple choice mode for review.
    handleStartGame(reviewList, GameMode.MultipleChoice);
  };

  const handleGameEnd = useCallback(
    (
      sessionWrongAnswers: VocabularyItem[],
      sessionCorrectAnswers: VocabularyItem[]
    ) => {
      setWrongAnswers((prevWrongAnswers) => {
        const updatedAnswers = [...prevWrongAnswers];

        // 틀린 단어 처리
        sessionWrongAnswers.forEach((wrongItem) => {
          const existing = updatedAnswers.find(
            (item) =>
              item.word === wrongItem.word && item.reading === wrongItem.reading
          );
          if (existing) {
            existing.missCount += 1;
            existing.correctStreak = 0; // 틀렸으므로 연속 정답 초기화
          } else {
            updatedAnswers.push({
              ...wrongItem,
              missCount: 1,
              correctStreak: 0,
            });
          }
        });

        // 맞은 단어 처리 (오답노트에 있는 경우)
        sessionCorrectAnswers.forEach((correctItem) => {
          const existing = updatedAnswers.find(
            (item) =>
              item.word === correctItem.word &&
              item.reading === correctItem.reading
          );
          if (existing) {
            existing.correctStreak = (existing.correctStreak || 0) + 1;
          }
        });

        // 3회 연속 정답인 단어 제거 (숙달 완료)
        const masteredAnswers = updatedAnswers.filter(
          (item) => item.correctStreak >= 3
        );

        if (masteredAnswers.length > 0) {
          console.log(
            "숙달 완료:",
            masteredAnswers.map((item) => item.word).join(", ")
          );
        }

        return updatedAnswers.filter((item) => item.correctStreak < 3);
      });

      // 통계 업데이트
      setTotalGamesPlayed((prev) => prev + 1);
      setTotalWordsStudied((prev) => prev + gameVocabulary.length);

      setView(AppView.WrongAnswers);
    },
    [gameVocabulary.length]
  );

  const handleExitGame = () => {
    setGameVocabulary([]);
    setView(AppView.Home);
  };

  const handleDeleteWrongAnswer = useCallback(
    (word: string, reading: string) => {
      setWrongAnswers((prev) =>
        prev.filter((item) => !(item.word === word && item.reading === reading))
      );
    },
    []
  );

  const handleClearAllWrongAnswers = useCallback(() => {
    setWrongAnswers([]);
  }, []);

  const handleResetStatistics = useCallback(() => {
    setTotalWordsStudied(0);
    setTotalGamesPlayed(0);
  }, []);

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
            onDeleteItem={handleDeleteWrongAnswer}
            onClearAll={handleClearAllWrongAnswers}
          />
        );
      case AppView.Statistics:
        return (
          <Statistics
            wrongAnswers={wrongAnswers}
            totalWordsStudied={totalWordsStudied}
            totalGamesPlayed={totalGamesPlayed}
            onResetStatistics={handleResetStatistics}
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
