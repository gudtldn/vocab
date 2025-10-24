import React, { useState, useEffect, useCallback, useRef } from "react";
import { GameMode, VocabularyItem, ReviewItem } from "../types";
import Furigana from "./Furigana";
import { formatTime, matchesAny } from "../utils";
import { generateChoices } from "../utils/vocabHelpers";
import { useI18n } from "../i18n/I18nContext";
import { useTimer } from "../hooks/useTimer";

interface GameScreenProps {
  vocabulary: VocabularyItem[];
  mode: GameMode;
  onGameEnd: (
    wrongAnswers: VocabularyItem[],
    correctAnswers: VocabularyItem[],
    reviewItems: ReviewItem[],
    totalTimeSpent: number
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
  const [feedback, setFeedback] = useState<"correct" | "incorrect" | null>(null);
  const [isFinished, setIsFinished] = useState(false);
  const [sessionWrongAnswers, setSessionWrongAnswers] = useState<VocabularyItem[]>([]);
  const [sessionCorrectAnswers, setSessionCorrectAnswers] = useState<VocabularyItem[]>([]);
  const [reviewItems, setReviewItems] = useState<ReviewItem[]>([]);
  const [showFurigana, setShowFurigana] = useState(false);
  const [showTimer, setShowTimer] = useState(true);
  const [questionStartTime, setQuestionStartTime] = useState(Date.now());
  const inputRef = useRef<HTMLInputElement>(null);
  
  // 타이머 훅 사용 - 피드백 표시 중이거나 게임 종료 시 일시정지
  const { elapsedTime } = useTimer(feedback !== null || isFinished);

  // 현재 문제의 소요 시간 계산
  const getQuestionTimeSpent = useCallback(() => {
    return Math.floor((Date.now() - questionStartTime) / 1000);
  }, [questionStartTime]);

  // 중복 단어 체크 헬퍼
  const isDuplicate = useCallback((list: VocabularyItem[], word: VocabularyItem) => {
    return list.some(item => 
      item.word === word.word && item.reading === word.reading
    );
  }, []);

  // 세션 목록에 단어 추가
  const addToSession = useCallback((
    isCorrect: boolean,
    word: VocabularyItem
  ) => {
    if (isCorrect) {
      setSessionCorrectAnswers(prev => 
        isDuplicate(prev, word) ? prev : [...prev, word]
      );
    } else {
      setSessionWrongAnswers(prev => 
        isDuplicate(prev, word) ? prev : [...prev, word]
      );
    }
  }, [isDuplicate]);

  // 리뷰 아이템 추가
  const addReviewItem = useCallback((
    word: VocabularyItem,
    isCorrect: boolean,
    userAnswer?: string
  ) => {
    setReviewItems(prev => [
      ...prev,
      {
        ...word,
        isCorrect,
        userAnswer: !isCorrect ? userAnswer : undefined,
        timeSpent: getQuestionTimeSpent(),
      },
    ]);
  }, [getQuestionTimeSpent]);

  const setupQuestion = useCallback(() => {
    const word = vocabulary[currentIndex];
    setCurrentWord(word);
    setQuestionStartTime(Date.now());

    if (mode === GameMode.MultipleChoice) {
      // 선택지 생성
      const vocabularyForChoices =
        allVocabulary && allVocabulary.length > vocabulary.length
          ? allVocabulary
          : vocabulary;
      
      const choices = generateChoices(word, vocabularyForChoices);
      setOptions(choices);
    }

    setUserInput("");
    setFeedback(null);
  }, [currentIndex, vocabulary, mode, allVocabulary]);

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

    // 정답 체크 - 정규화된 문자열 비교
    const isCorrect = matchesAny(userInput, currentWord.meanings);

    // 결과 기록
    setFeedback(isCorrect ? "correct" : "incorrect");
    addToSession(isCorrect, currentWord);
    addReviewItem(currentWord, isCorrect, userInput);
  }, [currentWord, userInput, addToSession, addReviewItem]);

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

  const handleSkip = useCallback(() => {
    if (!currentWord) return;

    // 스킵은 오답 처리
    setFeedback("incorrect");
    setUserInput("");
    addToSession(false, currentWord);
    addReviewItem(currentWord, false, t.game.skipped);
  }, [currentWord, t.game.skipped, addToSession, addReviewItem]);

  useEffect(() => {
    if (isFinished) {
      onGameEnd(sessionWrongAnswers, sessionCorrectAnswers, reviewItems, elapsedTime);
    }
  }, [isFinished]); // eslint-disable-line react-hooks/exhaustive-deps

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
