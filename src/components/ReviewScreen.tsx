import React, { useState, useMemo } from "react";
import { ReviewItem, GameMode } from "../types";
import Furigana from "./Furigana";
import { useI18n } from "../i18n/I18nContext";
import { formatTime } from "../utils";

interface ReviewScreenProps {
  reviewItems: ReviewItem[];
  totalQuestions: number;
  correctCount: number;
  totalTimeSpent: number;
  onReturnHome: () => void;
  onReviewWrong: (mode: GameMode) => void;
}

const ReviewScreen: React.FC<ReviewScreenProps> = ({
  reviewItems,
  totalQuestions,
  correctCount,
  totalTimeSpent,
  onReturnHome,
  onReviewWrong,
}) => {
  const { t } = useI18n();
  const [filter, setFilter] = useState<"all" | "correct" | "wrong">("all");
  const [showModeSelect, setShowModeSelect] = useState(false);

  // 통계 계산
  const wrongCount = totalQuestions - correctCount;
  const accuracy = totalQuestions > 0 
    ? Math.round((correctCount / totalQuestions) * 100) 
    : 0;

  // 필터링된 아이템 (useMemo로 최적화)
  const filteredItems = useMemo(() => {
    if (filter === "correct") return reviewItems.filter(item => item.isCorrect);
    if (filter === "wrong") return reviewItems.filter(item => !item.isCorrect);
    return reviewItems;
  }, [reviewItems, filter]);

  return (
    <div className="review-screen">
      <div className="review-header">
        <h2 className="review-title">{t.review.title}</h2>
        <div className="review-stats">
          <div className="stat-card correct">
            <div className="stat-label">{t.review.correct}</div>
            <div className="stat-value">{correctCount}</div>
          </div>
          <div className="stat-card wrong">
            <div className="stat-label">{t.review.incorrect}</div>
            <div className="stat-value">{wrongCount}</div>
          </div>
          <div className="stat-card accuracy">
            <div className="stat-label">{t.review.accuracy}</div>
            <div className="stat-value">{accuracy}%</div>
          </div>
          <div className="stat-card time">
            <div className="stat-label">{t.game.totalTime}</div>
            <div className="stat-value">⏱️ {formatTime(totalTimeSpent)}</div>
          </div>
        </div>
      </div>

      <div className="review-filters">
        <button
          onClick={() => setFilter("all")}
          className={`filter-button ${filter === "all" ? "active" : ""}`}
        >
          {t.review.all(reviewItems.length)}
        </button>
        <button
          onClick={() => setFilter("correct")}
          className={`filter-button ${filter === "correct" ? "active" : ""}`}
        >
          {t.review.correctOnly(correctCount)}
        </button>
        <button
          onClick={() => setFilter("wrong")}
          className={`filter-button ${filter === "wrong" ? "active" : ""}`}
        >
          {t.review.incorrectOnly(wrongCount)}
        </button>
      </div>

      <div className="review-list">
        {filteredItems.map((item, index) => {
          const isSkipped = item.userAnswer === t.game.skipped;
          return (
            <div
              key={index}
              className={`review-item ${item.isCorrect ? "correct" : "wrong"} ${
                isSkipped ? "skipped" : ""
              }`}
            >
              <div className="review-item-header">
                <span
                  className={`review-badge ${
                    item.isCorrect ? "correct" : "wrong"
                  }`}
                >
                  {item.isCorrect
                    ? t.review.correct
                    : isSkipped
                    ? t.game.skipped
                    : t.review.incorrect}
                </span>
              </div>
              <div className="review-item-content">
                <div className="review-word">
                  <Furigana
                    word={item.word}
                    reading={item.reading}
                    show={true}
                  />
                </div>
                <div className="review-meanings">
                  <strong>{t.review.meaning}:</strong> {item.meanings.join(", ")}
                </div>
                {!item.isCorrect && item.userAnswer && (
                  <div className="review-user-answer">
                    <strong>{isSkipped ? "" : t.review.yourAnswer}:</strong>{" "}
                    {item.userAnswer}
                  </div>
                )}
                {item.note && (
                  <div className="review-note">
                    <strong>📝 メモ:</strong> {item.note}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <div className="review-actions">
        <button onClick={onReturnHome} className="button button-secondary">
          {t.review.returnHome}
        </button>
        {wrongCount > 0 && (
          <>
            {!showModeSelect ? (
              <button 
                onClick={() => setShowModeSelect(true)} 
                className="button button-primary"
              >
                {t.review.reviewIncorrect}
              </button>
            ) : (
              <>
                <button 
                  onClick={() => {
                    onReviewWrong(GameMode.MultipleChoice);
                    setShowModeSelect(false);
                  }} 
                  className="button button-primary"
                >
                  {t.review.reviewIncorrectMultipleChoice}
                </button>
                <button 
                  onClick={() => {
                    onReviewWrong(GameMode.DirectInput);
                    setShowModeSelect(false);
                  }} 
                  className="button button-primary"
                >
                  {t.review.reviewIncorrectDirectInput}
                </button>
                <button
                  onClick={() => setShowModeSelect(false)}
                  className="button button-secondary"
                >
                  {t.common.cancel}
                </button>
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default ReviewScreen;
