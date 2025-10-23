import React, { useState, useEffect, useCallback, useRef } from "react";
import { GameMode, VocabularyItem, ReviewItem } from "../types";
import Furigana from "./Furigana";
import { shuffleArray } from "../utils";

interface GameScreenProps {
  vocabulary: VocabularyItem[];
  mode: GameMode;
  onGameEnd: (
    wrongAnswers: VocabularyItem[],
    correctAnswers: VocabularyItem[],
    reviewItems: ReviewItem[]
  ) => void;
  onExit: () => void;
}

const GameScreen: React.FC<GameScreenProps> = ({
  vocabulary,
  mode,
  onGameEnd,
  onExit,
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [currentWord, setCurrentWord] = useState<VocabularyItem | null>(null);
  const [options, setOptions] = useState<string[]>([]);
  const [userInput, setUserInput] = useState("");
  const [feedback, setFeedback] = useState<"correct" | "incorrect" | null>(
    null
  );
  const [isFinished, setIsFinished] = useState(false);
  const [sessionWrongAnswers, setSessionWrongAnswers] = useState<
    VocabularyItem[]
  >([]);
  const [sessionCorrectAnswers, setSessionCorrectAnswers] = useState<
    VocabularyItem[]
  >([]);
  const [reviewItems, setReviewItems] = useState<ReviewItem[]>([]);
  const [showFurigana, setShowFurigana] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const setupQuestion = useCallback(() => {
    const word = vocabulary[currentIndex];
    setCurrentWord(word);

    if (mode === GameMode.MultipleChoice) {
      const correctAnswers = word.meanings;
      const allMeanings = vocabulary.flatMap((v) => v.meanings);
      const uniqueMeanings = [...new Set(allMeanings)];

      const distractors = uniqueMeanings
        .filter((m) => !correctAnswers.includes(m))
        .sort(() => 0.5 - Math.random())
        .slice(0, 3);

      const choiceOptions = shuffleArray([
        ...correctAnswers.slice(0, 1),
        ...distractors,
      ]);
      setOptions(choiceOptions);
    }

    setUserInput("");
    setFeedback(null);
  }, [currentIndex, vocabulary, mode]);

  useEffect(() => {
    if (vocabulary.length > 0 && currentIndex < vocabulary.length) {
      setupQuestion();
    } else if (vocabulary.length > 0) {
      setIsFinished(true);
    }
  }, [currentIndex, vocabulary, setupQuestion]);

  // 새 문제가 표시될 때 input에 포커스
  useEffect(() => {
    if (mode === GameMode.DirectInput && !feedback && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 0);
    }
  }, [currentIndex, feedback, mode]);

  const handleAnswer = useCallback(() => {
    if (!currentWord) return;

    let isCorrect = false;
    const lowerCaseMeanings = currentWord.meanings.map((m) =>
      m.toLowerCase().trim()
    );
    if (mode === GameMode.MultipleChoice) {
      isCorrect = lowerCaseMeanings.includes(userInput.toLowerCase().trim());
    } else {
      isCorrect = lowerCaseMeanings.includes(userInput.toLowerCase().trim());
    }

    // Review 아이템 추가
    setReviewItems((prev) => [
      ...prev,
      {
        ...currentWord,
        isCorrect,
        userAnswer: !isCorrect ? userInput : undefined,
      },
    ]);

    if (isCorrect) {
      setFeedback("correct");
      // 정답인 경우 정답 목록에 추가
      setSessionCorrectAnswers((prev) => {
        if (
          prev.find(
            (item) =>
              item.word === currentWord.word &&
              item.reading === currentWord.reading
          )
        ) {
          return prev;
        }
        return [...prev, currentWord];
      });
    } else {
      setFeedback("incorrect");
      setSessionWrongAnswers((prev) => {
        if (
          prev.find(
            (item) =>
              item.word === currentWord.word &&
              item.reading === currentWord.reading
          )
        ) {
          return prev;
        }
        return [...prev, currentWord];
      });
    }
  }, [currentWord, userInput, mode]);

  const handleNext = useCallback(() => {
    setCurrentIndex((prev) => prev + 1);
  }, []);

  // Enter 키 전역 이벤트 처리
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Enter") {
        if (feedback) {
          // 피드백이 표시된 상태면 다음 문제로
          handleNext();
        } else if (mode === GameMode.DirectInput && userInput.trim()) {
          // 주관식 모드이고 입력값이 있으면 답 제출
          handleAnswer();
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [feedback, handleNext, handleAnswer, mode, userInput]);

  const handleSkip = () => {
    if (!currentWord) return;

    setSessionWrongAnswers((prev) => {
      if (
        prev.find(
          (item) =>
            item.word === currentWord.word &&
            item.reading === currentWord.reading
        )
      ) {
        return prev;
      }
      return [...prev, currentWord];
    });

    handleNext();
  };

  useEffect(() => {
    if (isFinished) {
      onGameEnd(sessionWrongAnswers, sessionCorrectAnswers, reviewItems);
    }
  }, [isFinished]); // eslint-disable-line react-hooks/exhaustive-deps

  if (isFinished) {
    return (
      <div className="game-finished-container">
        <h2 className="game-finished-title">お疲れ様でした！</h2>
        <p className="game-finished-summary">
          {vocabulary.length}問中、
          {vocabulary.length - sessionWrongAnswers.length}問正解しました。
        </p>
        <button onClick={onExit} className="button button-primary">
          ホームに戻る
        </button>
      </div>
    );
  }

  if (!currentWord) {
    return <div className="loading">Loading...</div>;
  }

  const progressPercentage = ((currentIndex + 1) / vocabulary.length) * 100;

  return (
    <div className="game-screen">
      <div className="progress-bar-container">
        <div className="progress-bar-info">
          <span>進捗</span>
          <span>
            {currentIndex + 1} / {vocabulary.length}
          </span>
        </div>
        <div className="progress-bar-track">
          <div
            className="progress-bar-fill"
            style={{ width: `${progressPercentage}%` }}
          ></div>
        </div>
      </div>

      <div className="furigana-toggle-container">
        <label htmlFor="furigana-toggle" className="furigana-toggle-label">
          <span className="toggle-text">フリガナ表示</span>
          <div className="toggle-switch">
            <input
              type="checkbox"
              id="furigana-toggle"
              className="sr-only"
              checked={showFurigana}
              onChange={() => setShowFurigana(!showFurigana)}
            />
            <div
              className={`toggle-track ${showFurigana ? "active" : ""}`}
            ></div>
            <div className={`toggle-dot ${showFurigana ? "active" : ""}`}></div>
          </div>
        </label>
      </div>

      <div className="word-display-container">
        <Furigana
          word={currentWord.word}
          reading={currentWord.reading}
          className="word-text"
          show={showFurigana}
        />
      </div>

      <div className="answer-section">
        {mode === GameMode.MultipleChoice ? (
          <div className="multiple-choice-grid">
            {options.map((option, index) => (
              <button
                key={index}
                onClick={() => setUserInput(option)}
                disabled={!!feedback}
                className={`choice-button
                  ${userInput === option ? "selected" : ""}
                  ${
                    feedback && currentWord.meanings.includes(option)
                      ? "correct"
                      : ""
                  }
                  ${
                    feedback &&
                    !currentWord.meanings.includes(option) &&
                    userInput === option
                      ? "incorrect"
                      : ""
                  }
                  ${feedback ? "disabled" : ""}
                `}
              >
                {option}
              </button>
            ))}
          </div>
        ) : (
          <input
            ref={inputRef}
            type="text"
            value={userInput}
            onChange={(e) => setUserInput(e.target.value)}
            placeholder="意味を入力してください"
            disabled={!!feedback}
            className="input-field"
          />
        )}
      </div>

      {feedback ? (
        <div className="feedback-section">
          <div className={`feedback-message ${feedback}`}>
            {feedback === "correct"
              ? "正解！"
              : `不正解... 正解は: ${currentWord.meanings.join(", ")}`}
          </div>
          <button
            onClick={handleNext}
            className="button button-primary feedback-next-button"
          >
            次へ
          </button>
        </div>
      ) : (
        <div className="action-buttons">
          <div className="confirm-skip-container">
            <button
              onClick={handleAnswer}
              disabled={!userInput}
              className="button button-confirm"
            >
              確認
            </button>
            <button onClick={handleSkip} className="button button-skip">
              スキップ
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default GameScreen;
