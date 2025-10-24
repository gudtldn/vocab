import React, { useState, useEffect, useCallback, useRef } from "react";
import { GameMode, VocabularyItem, ReviewItem } from "../types";
import Furigana from "./Furigana";
import { shuffleArray, removeWhitespace } from "../utils";
import { useI18n } from "../i18n/I18nContext";

interface GameScreenProps {
  vocabulary: VocabularyItem[];
  mode: GameMode;
  onGameEnd: (
    wrongAnswers: VocabularyItem[],
    correctAnswers: VocabularyItem[],
    reviewItems: ReviewItem[]
  ) => void;
  onExit: () => void;
  allVocabulary?: VocabularyItem[]; // 선택지 생성용 전체 어휘
}

const GameScreen: React.FC<GameScreenProps> = ({
  vocabulary,
  mode,
  onGameEnd,
  onExit,
  allVocabulary,
}) => {
  const { t } = useI18n();
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
  const [showTimer, setShowTimer] = useState(true);
  const [elapsedTime, setElapsedTime] = useState(0); // 전체 경과 시간
  const [questionStartTime, setQuestionStartTime] = useState(Date.now()); // 현재 문제 시작 시간
  const inputRef = useRef<HTMLInputElement>(null);
  const timerRef = useRef<number | null>(null);

  const setupQuestion = useCallback(() => {
    const word = vocabulary[currentIndex];
    setCurrentWord(word);
    setQuestionStartTime(Date.now()); // 문제 시작 시간 기록

    if (mode === GameMode.MultipleChoice) {
      const correctAnswers = word.meanings;
      // 선택지 생성에는 전체 어휘 사용 (allVocabulary가 있으면 사용, 없으면 vocabulary 사용)
      const vocabularyForChoices =
        allVocabulary && allVocabulary.length > vocabulary.length
          ? allVocabulary
          : vocabulary;
      const allMeanings = vocabularyForChoices.flatMap((v) => v.meanings);
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
  }, [currentIndex, vocabulary, mode, allVocabulary]);

  // 타이머 효과
  useEffect(() => {
    timerRef.current = window.setInterval(() => {
      setElapsedTime((prev) => prev + 1);
    }, 1000);

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, []);

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
    // 띄어쓰기를 제거한 정답 목록
    const normalizedMeanings = currentWord.meanings.map((m) =>
      removeWhitespace(m.toLowerCase().trim())
    );
    // 사용자 입력도 띄어쓰기 제거
    const normalizedInput = removeWhitespace(userInput.toLowerCase().trim());

    if (mode === GameMode.MultipleChoice) {
      isCorrect = normalizedMeanings.includes(normalizedInput);
    } else {
      isCorrect = normalizedMeanings.includes(normalizedInput);
    }

    // 소요 시간 계산 (초)
    const timeSpent = Math.floor((Date.now() - questionStartTime) / 1000);

    // Review 아이템 추가
    setReviewItems((prev) => [
      ...prev,
      {
        ...currentWord,
        isCorrect,
        userAnswer: !isCorrect ? userInput : undefined,
        timeSpent,
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

    // 소요 시간 계산 (초)
    const timeSpent = Math.floor((Date.now() - questionStartTime) / 1000);

    // 오답 처리
    setFeedback("incorrect");
    setUserInput(""); // 입력값 비우기
    
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

    // Review 아이템에 스킵된 문제 추가
    setReviewItems((prev) => [
      ...prev,
      {
        ...currentWord,
        isCorrect: false,
        userAnswer: t.game.skipped, // 스킵 표시
        timeSpent,
      },
    ]);
  };

  useEffect(() => {
    if (isFinished) {
      onGameEnd(sessionWrongAnswers, sessionCorrectAnswers, reviewItems);
    }
  }, [isFinished]); // eslint-disable-line react-hooks/exhaustive-deps

  // 시간 포맷 함수 (초 -> MM:SS)
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  if (isFinished) {
    return (
      <div className="game-finished-container">
        <h2 className="game-finished-title">{t.game.finished}</h2>
        <p className="game-finished-summary">
          {t.game.result(
            vocabulary.length - sessionWrongAnswers.length,
            vocabulary.length
          )}
        </p>
        <button onClick={onExit} className="button button-primary">
          {t.game.returnHome}
        </button>
      </div>
    );
  }

  if (!currentWord) {
    return <div className="loading">{t.common.loading}</div>;
  }

  const progressPercentage = ((currentIndex + 1) / vocabulary.length) * 100;

  return (
    <div className="game-screen">
      <div className="progress-bar-container">
        <div className="progress-bar-info">
          <div className="progress-left">
            <span>{t.game.progress}</span>
            <span className="progress-count">
              {currentIndex + 1} / {vocabulary.length}
            </span>
          </div>
          {/* 타이머를 진행바 오른쪽에 배치 */}
          <div 
            className="timer-display-inline" 
            onClick={() => setShowTimer(!showTimer)}
            style={{ 
              opacity: showTimer ? 1 : 0.3,
              cursor: 'pointer',
              transition: 'opacity 0.2s'
            }}
            title={showTimer ? t.game.hideTimer : t.game.showTimer}
          >
            ⏱️ {showTimer ? formatTime(elapsedTime) : ''}
          </div>
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
          <span className="toggle-text">{t.game.toggleFurigana}</span>
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
            placeholder={t.game.answerPlaceholder}
            disabled={!!feedback}
            className="input-field"
          />
        )}
      </div>

      <div className="action-buttons">
        {feedback && (
          <div className={`feedback-badge ${feedback}`}>
            {feedback === "correct" ? (
              <span>
                {t.game.correct}
                <br />
                <span className="all-meanings">
                  {currentWord.meanings.join(", ")}
                </span>
              </span>
            ) : (
              <span>{t.game.incorrect(currentWord.meanings.join(", "))}</span>
            )}
          </div>
        )}

        <div className="confirm-skip-container">
          {feedback ? (
            <button
              onClick={handleNext}
              className="button button-primary button-next"
            >
              {t.common.next}
            </button>
          ) : (
            <>
              <button
                onClick={handleAnswer}
                disabled={!userInput}
                className="button button-confirm"
              >
                {t.game.checkAnswer}
              </button>
              <button onClick={handleSkip} className="button button-skip">
                {t.game.skip}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default GameScreen;
