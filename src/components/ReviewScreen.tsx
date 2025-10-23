import React, { useState } from "react";
import { ReviewItem } from "../types";
import Furigana from "./Furigana";

interface ReviewScreenProps {
  reviewItems: ReviewItem[];
  totalQuestions: number;
  correctCount: number;
  onReturnHome: () => void;
  onReviewWrong: () => void;
}

const ReviewScreen: React.FC<ReviewScreenProps> = ({
  reviewItems,
  totalQuestions,
  correctCount,
  onReturnHome,
  onReviewWrong,
}) => {
  const [filter, setFilter] = useState<"all" | "correct" | "wrong">("all");

  const wrongCount = totalQuestions - correctCount;
  const accuracy = totalQuestions > 0 ? Math.round((correctCount / totalQuestions) * 100) : 0;

  const filteredItems = reviewItems.filter((item) => {
    if (filter === "correct") return item.isCorrect;
    if (filter === "wrong") return !item.isCorrect;
    return true;
  });

  return (
    <div className="review-screen">
      <div className="review-header">
        <h2 className="review-title">📊 学習結果</h2>
        <div className="review-stats">
          <div className="stat-card correct">
            <div className="stat-label">正解</div>
            <div className="stat-value">{correctCount}</div>
          </div>
          <div className="stat-card wrong">
            <div className="stat-label">不正解</div>
            <div className="stat-value">{wrongCount}</div>
          </div>
          <div className="stat-card accuracy">
            <div className="stat-label">正解率</div>
            <div className="stat-value">{accuracy}%</div>
          </div>
        </div>
      </div>

      <div className="review-filters">
        <button
          onClick={() => setFilter("all")}
          className={`filter-button ${filter === "all" ? "active" : ""}`}
        >
          全て ({reviewItems.length})
        </button>
        <button
          onClick={() => setFilter("correct")}
          className={`filter-button ${filter === "correct" ? "active" : ""}`}
        >
          ✓ 正解 ({correctCount})
        </button>
        <button
          onClick={() => setFilter("wrong")}
          className={`filter-button ${filter === "wrong" ? "active" : ""}`}
        >
          ✗ 不正解 ({wrongCount})
        </button>
      </div>

      <div className="review-list">
        {filteredItems.map((item, index) => (
          <div
            key={index}
            className={`review-item ${item.isCorrect ? "correct" : "wrong"}`}
          >
            <div className="review-item-header">
              <span className={`review-badge ${item.isCorrect ? "correct" : "wrong"}`}>
                {item.isCorrect ? "✓ 正解" : "✗ 不正解"}
              </span>
            </div>
            <div className="review-item-content">
              <div className="review-word">
                <Furigana word={item.word} reading={item.reading} show={true} />
              </div>
              <div className="review-meanings">
                <strong>意味:</strong> {item.meanings.join(", ")}
              </div>
              {!item.isCorrect && item.userAnswer && (
                <div className="review-user-answer">
                  <strong>あなたの回答:</strong> {item.userAnswer}
                </div>
              )}
              {item.note && (
                <div className="review-note">
                  <strong>📝 メモ:</strong> {item.note}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      <div className="review-actions">
        <button onClick={onReturnHome} className="button button-secondary">
          ホームに戻る
        </button>
        {wrongCount > 0 && (
          <button onClick={onReviewWrong} className="button button-primary">
            不正解の単語を復習
          </button>
        )}
      </div>
    </div>
  );
};

export default ReviewScreen;
