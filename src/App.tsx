import React, { useState, useCallback, useEffect } from "react";
import Home from "./components/Home";
import GameScreen from "./components/GameScreen";
import WrongAnswerNote from "./components/WrongAnswerNote";
import Statistics from "./components/Statistics";
import VocabEditor from "./components/VocabEditor";
import ReviewScreen from "./components/ReviewScreen";
import Header from "./components/Header";
import {
  AppView,
  GameMode,
  VocabularyItem,
  WrongAnswerItem,
  VocabularyBook,
  ReviewItem,
} from "./types";
import { shuffleArray } from "./utils";
import {
  writeTextFile,
  readTextFile,
  exists,
  BaseDirectory,
  mkdir,
} from "@tauri-apps/plugin-fs";
import { appDataDir } from "@tauri-apps/api/path";
import { save } from "@tauri-apps/plugin-dialog";

const App: React.FC = () => {
  const [view, setView] = useState<AppView>(AppView.Home);
  const [gameVocabulary, setGameVocabulary] = useState<VocabularyItem[]>([]);
  const [gameMode, setGameMode] = useState<GameMode>(GameMode.MultipleChoice);
  const [wrongAnswers, setWrongAnswers] = useState<WrongAnswerItem[]>([]);
  const [reviewItems, setReviewItems] = useState<ReviewItem[]>([]);
  const [lastGameStats, setLastGameStats] = useState({ correct: 0, total: 0 });
  const [isLoading, setIsLoading] = useState(true);
  const [totalWordsStudied, setTotalWordsStudied] = useState(0);
  const [totalGamesPlayed, setTotalGamesPlayed] = useState(0);
  const [darkMode, setDarkMode] = useState(false);

  // 단어장 편집을 위한 상태
  const [currentVocabulary, setCurrentVocabulary] = useState<VocabularyItem[]>(
    []
  );
  const [currentBooks, setCurrentBooks] = useState<VocabularyBook[]>([]);
  const [showShortcutHelp, setShowShortcutHelp] = useState(false);

  // 키보드 단축키 처리
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl/Cmd 키 조합
      const modifier = e.ctrlKey || e.metaKey;

      // 입력 필드에서는 단축키 비활성화
      const target = e.target as HTMLElement;
      if (target.tagName === "INPUT" || target.tagName === "TEXTAREA") {
        // Esc 키는 예외
        if (e.key === "Escape") {
          target.blur();
        }
        return;
      }

      // 단축키 처리
      if (modifier) {
        switch (e.key.toLowerCase()) {
          case "h":
            e.preventDefault();
            setView(AppView.Home);
            break;
          case "w":
            e.preventDefault();
            if (wrongAnswers.length > 0) {
              setView(AppView.WrongAnswers);
            }
            break;
          case "s":
            e.preventDefault();
            setView(AppView.Statistics);
            break;
          case "d":
            e.preventDefault();
            setDarkMode((prev) => !prev);
            break;
          case "/":
          case "?":
            e.preventDefault();
            setShowShortcutHelp((prev) => !prev);
            break;
        }
      } else if (e.key === "Escape") {
        // Esc: 단축키 도움말 닫기
        if (showShortcutHelp) {
          setShowShortcutHelp(false);
        }
      } else if (e.key === "?") {
        // ?: 단축키 도움말 표시
        e.preventDefault();
        setShowShortcutHelp((prev) => !prev);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [wrongAnswers.length, showShortcutHelp]);

  // 다크모드 설정 불러오기
  useEffect(() => {
    const loadDarkMode = async () => {
      try {
        const fileExists = await exists("settings.json", {
          baseDir: BaseDirectory.AppData,
        });

        if (fileExists) {
          const data = await readTextFile("settings.json", {
            baseDir: BaseDirectory.AppData,
          });
          const settings = JSON.parse(data);
          setDarkMode(settings.darkMode ?? false);
        }
      } catch (error) {
        console.error("설정 불러오기 실패:", error);
      }
    };

    loadDarkMode();
  }, []);

  // 다크모드 변경 시 저장
  useEffect(() => {
    const saveDarkMode = async () => {
      if (!isLoading) {
        try {
          const appDataPath = await appDataDir();
          await mkdir(appDataPath, { recursive: true }).catch(() => {});

          await writeTextFile(
            "settings.json",
            JSON.stringify({ darkMode }, null, 2),
            { baseDir: BaseDirectory.AppData }
          );
        } catch (error) {
          console.error("설정 저장 실패:", error);
        }
      }
    };

    saveDarkMode();
  }, [darkMode, isLoading]);

  // 다크모드 클래스 적용
  useEffect(() => {
    if (darkMode) {
      document.body.classList.add("dark-mode");
    } else {
      document.body.classList.remove("dark-mode");
    }
  }, [darkMode]);

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
    // 현재 단어장 데이터 저장 (편집 화면에서 사용)
    setCurrentVocabulary(vocabulary);
    setView(AppView.Game);
  };

  const handleReviewWrongAnswers = (reviewList: VocabularyItem[]) => {
    // For simplicity, let's reuse the multiple choice mode for review.
    handleStartGame(reviewList, GameMode.MultipleChoice);
  };

  const handleGameEnd = useCallback(
    (
      sessionWrongAnswers: VocabularyItem[],
      sessionCorrectAnswers: VocabularyItem[],
      reviewItems: ReviewItem[]
    ) => {
      // Review 데이터 저장
      setReviewItems(reviewItems);
      setLastGameStats({
        correct: sessionCorrectAnswers.length,
        total: gameVocabulary.length,
      });

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

      setView(AppView.Review);
    },
    [gameVocabulary.length]
  );

  const handleExitGame = () => {
    setGameVocabulary([]);
    setView(AppView.Home);
  };

  const handleReturnFromReview = () => {
    setView(AppView.Home);
  };

  const handleReviewWrongFromReview = () => {
    const wrongItems = reviewItems.filter((item) => !item.isCorrect);
    if (wrongItems.length > 0) {
      handleStartGame(wrongItems, GameMode.MultipleChoice);
    }
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

  const handleSaveVocabulary = useCallback(
    async (updatedVocabulary: VocabularyItem[]) => {
      // 현재 단어장 데이터 업데이트
      setCurrentVocabulary(updatedVocabulary);

      // 선택된 단어장 파일이 하나만 있는 경우, 해당 파일에 저장
      if (currentBooks.length === 1) {
        try {
          const book = currentBooks[0];
          const csvContent = updatedVocabulary
            .map((item) => {
              const meanings = item.meanings.join(",");
              const note = item.note ? `,${item.note}` : "";
              return `${item.word},${item.reading},${meanings}${note}`;
            })
            .join("\n");

          await writeTextFile(book.filePath, csvContent);
          console.log("단어장 파일 저장 성공:", book.filePath);
          alert("単語帳を保存しました！");
        } catch (error) {
          console.error("단어장 파일 저장 실패:", error);
          alert("単語帳の保存に失敗しました。");
        }
      } else if (currentBooks.length > 1) {
        // 여러 단어장이 선택된 경우, 새 파일로 저장 안내
        alert(
          "複数の単語帳が選択されています。\n変更を保存するには、単一の単語帳を選択してください。"
        );
      } else {
        // 단어장이 선택되지 않은 경우
        alert(
          "単語帳が選択されていません。\nホーム画面で単語帳を選択してください。"
        );
      }
    },
    [currentBooks]
  );

  const handleExportCSV = useCallback(async () => {
    // 현재 편집 중인 단어장이 있으면 그것을, 없으면 오답노트를 출력
    const dataToExport =
      currentVocabulary.length > 0 ? currentVocabulary : wrongAnswers;

    if (dataToExport.length === 0) {
      alert("出力するデータがありません。");
      return;
    }

    try {
      const filePath = await save({
        defaultPath: "vocabulary.csv",
        filters: [
          {
            name: "CSV",
            extensions: ["csv"],
          },
        ],
      });

      if (filePath) {
        // CSV 형식으로 변환
        const csvContent = dataToExport
          .map((item) => {
            const meanings = item.meanings.join(",");
            const note = item.note ? `,${item.note}` : "";
            return `${item.word},${item.reading},${meanings}${note}`;
          })
          .join("\n");

        await writeTextFile(filePath, csvContent);
        alert("CSV ファイルに出力しました！");
      }
    } catch (error) {
      console.error("CSV 출력 실패:", error);
      alert("CSV出力に失敗しました。");
    }
  }, [currentVocabulary, wrongAnswers]);

  const handleUpdateCurrentBooks = useCallback(
    (books: VocabularyBook[], vocabulary: VocabularyItem[]) => {
      setCurrentBooks(books);
      setCurrentVocabulary(vocabulary);
    },
    []
  );

  const handleEditBook = useCallback(
    (book: VocabularyBook, vocabulary: VocabularyItem[]) => {
      setCurrentBooks([book]);
      setCurrentVocabulary(vocabulary);
      setView(AppView.VocabEditor);
    },
    []
  );

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
      case AppView.VocabEditor:
        return (
          <VocabEditor
            vocabulary={currentVocabulary}
            currentBook={currentBooks.length === 1 ? currentBooks[0] : null}
            onSave={handleSaveVocabulary}
            onExportCSV={handleExportCSV}
          />
        );
      case AppView.Review:
        return (
          <ReviewScreen
            reviewItems={reviewItems}
            totalQuestions={lastGameStats.total}
            correctCount={lastGameStats.correct}
            onReturnHome={handleReturnFromReview}
            onReviewWrong={handleReviewWrongFromReview}
          />
        );
      case AppView.Home:
      default:
        return (
          <Home
            onStartGame={handleStartGame}
            onUpdateCurrentBooks={handleUpdateCurrentBooks}
            onEditBook={handleEditBook}
          />
        );
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
        darkMode={darkMode}
        toggleDarkMode={() => setDarkMode(!darkMode)}
      />
      <main className="main-content">{renderContent()}</main>

      {/* 단축키 도움말 */}
      {showShortcutHelp && (
        <div
          className="shortcut-overlay"
          onClick={() => setShowShortcutHelp(false)}
        >
          <div className="shortcut-dialog" onClick={(e) => e.stopPropagation()}>
            <div className="shortcut-header">
              <h2 className="shortcut-title">⌨️ キーボードショートカット</h2>
              <button
                onClick={() => setShowShortcutHelp(false)}
                className="shortcut-close"
                aria-label="閉じる"
              >
                ✕
              </button>
            </div>
            <div className="shortcut-body">
              <div className="shortcut-section">
                <h3 className="shortcut-section-title">ナビゲーション</h3>
                <div className="shortcut-list">
                  <div className="shortcut-item">
                    <kbd className="shortcut-key">Ctrl/⌘</kbd>
                    <kbd className="shortcut-key">H</kbd>
                    <span className="shortcut-desc">ホーム画面</span>
                  </div>
                  <div className="shortcut-item">
                    <kbd className="shortcut-key">Ctrl/⌘</kbd>
                    <kbd className="shortcut-key">W</kbd>
                    <span className="shortcut-desc">誤答ノート</span>
                  </div>
                  <div className="shortcut-item">
                    <kbd className="shortcut-key">Ctrl/⌘</kbd>
                    <kbd className="shortcut-key">S</kbd>
                    <span className="shortcut-desc">統計画面</span>
                  </div>
                </div>
              </div>

              <div className="shortcut-section">
                <h3 className="shortcut-section-title">アクション</h3>
                <div className="shortcut-list">
                  <div className="shortcut-item">
                    <kbd className="shortcut-key">Ctrl/⌘</kbd>
                    <kbd className="shortcut-key">D</kbd>
                    <span className="shortcut-desc">ダークモード切り替え</span>
                  </div>
                  <div className="shortcut-item">
                    <kbd className="shortcut-key">Enter</kbd>
                    <span className="shortcut-desc">
                      決定 / 次へ (ゲーム中)
                    </span>
                  </div>
                  <div className="shortcut-item">
                    <kbd className="shortcut-key">Esc</kbd>
                    <span className="shortcut-desc">
                      キャンセル / フォーカス解除
                    </span>
                  </div>
                </div>
              </div>

              <div className="shortcut-section">
                <h3 className="shortcut-section-title">ヘルプ</h3>
                <div className="shortcut-list">
                  <div className="shortcut-item">
                    <kbd className="shortcut-key">?</kbd>
                    <span className="shortcut-desc">このヘルプを表示</span>
                  </div>
                  <div className="shortcut-item">
                    <kbd className="shortcut-key">Ctrl/⌘</kbd>
                    <kbd className="shortcut-key">?</kbd>
                    <span className="shortcut-desc">このヘルプを表示</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 단축키 힌트 버튼 */}
      <button
        onClick={() => setShowShortcutHelp(true)}
        className="shortcut-hint-button"
        title="キーボードショートカット (?) を表示"
      >
        ⌨️
      </button>
    </div>
  );
};

export default App;
