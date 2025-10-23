import React, { useState } from "react";
import { WrongAnswerItem } from "../types";
import ConfirmDialog from "./ConfirmDialog";

interface StatisticsProps {
  wrongAnswers: WrongAnswerItem[];
  totalWordsStudied: number;
  totalGamesPlayed: number;
  onResetStatistics: () => void;
}

const Statistics: React.FC<StatisticsProps> = ({
  wrongAnswers,
  totalWordsStudied,
  totalGamesPlayed,
  onResetStatistics,
}) => {
  const [showResetDialog, setShowResetDialog] = useState(false);

  const totalMistakes = wrongAnswers.reduce(
    (sum, item) => sum + item.missCount,
    0
  );
  const uniqueWrongWords = wrongAnswers.length;
  const accuracyRate =
    totalWordsStudied > 0
      ? (
          ((totalWordsStudied - totalMistakes) / totalWordsStudied) *
          100
        ).toFixed(1)
      : "0.0";

  const mostMissedWords = [...wrongAnswers]
    .sort((a, b) => b.missCount - a.missCount)
    .slice(0, 5);

  const handleResetConfirm = () => {
    onResetStatistics();
    setShowResetDialog(false);
  };

  return (
    <>
      <ConfirmDialog
        isOpen={showResetDialog}
        title="統計初期化"
        message="本当に統計データをすべて初期化しますか？この操作は取り消せません。"
        confirmText="初期化"
        cancelText="キャンセル"
        onConfirm={handleResetConfirm}
        onCancel={() => setShowResetDialog(false)}
        danger={true}
      />

      <div className="statistics-container">
        <div className="statistics-header">
          <h2 className="section-title">統計</h2>
          <button
            onClick={() => setShowResetDialog(true)}
            className="button button-danger"
          >
            統計初期化
          </button>
        </div>

        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-value">{totalGamesPlayed}</div>
            <div className="stat-label">学習回数</div>
          </div>

          <div className="stat-card">
            <div className="stat-value">{totalWordsStudied}</div>
            <div className="stat-label">総学習単語数</div>
          </div>

          <div className="stat-card">
            <div className="stat-value">{accuracyRate}%</div>
            <div className="stat-label">正答率</div>
          </div>

          <div className="stat-card">
            <div className="stat-value">{uniqueWrongWords}</div>
            <div className="stat-label">誤答単語数</div>
          </div>

          <div className="stat-card">
            <div className="stat-value">{totalMistakes}</div>
            <div className="stat-label">総誤答回数</div>
          </div>
        </div>

        {mostMissedWords.length > 0 && (
          <div className="most-missed-section">
            <h3 className="subsection-title">最も間違えた単語 Top 5</h3>
            <div className="most-missed-list">
              {mostMissedWords.map((item, index) => (
                <div key={`${item.word}-${index}`} className="most-missed-item">
                  <div className="rank">{index + 1}</div>
                  <div className="word-info">
                    <div className="word-main">{item.word}</div>
                    <div className="word-reading">{item.reading}</div>
                    <div className="word-meanings">
                      {item.meanings.join(", ")}
                    </div>
                  </div>
                  <div className="miss-count">{item.missCount}回</div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default Statistics;
