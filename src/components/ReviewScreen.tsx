import React, { useState } from "react";
import { ReviewItem, GameMode } from "../types";
import Furigana from "./Furigana";
import { useI18n } from "../i18n/I18nContext";

interface ReviewScreenProps {
  reviewItems: ReviewItem[];
  totalQuestions: number;
  correctCount: number;
  onReturnHome: () => void;
  onReviewWrong: (mode: GameMode) => void;
}

const ReviewScreen: React.FC<ReviewScreenProps> = ({
  reviewItems,
  totalQuestions,
  correctCount,
  onReturnHome,
  onReviewWrong,
}) => {
  const { t } = useI18n();
  const [filter, setFilter] = useState<"all" | "correct" | "wrong">("all");
  const [showModeSelect, setShowModeSelect] = useState(false);

  const wrongCount = totalQuestions - correctCount;
  const accuracy =
    totalQuestions > 0 ? Math.round((correctCount / totalQuestions) * 100) : 0;

  const filteredItems = reviewItems.filter((item) => {
    if (filter === "correct") return item.isCorrect;
    if (filter === "wrong") return !item.isCorrect;
    return true;
  });

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
