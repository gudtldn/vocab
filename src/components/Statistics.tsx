import React, { useState } from "react";
import { WrongAnswerItem } from "../types";
import ConfirmDialog from "./ConfirmDialog";
import { useI18n } from "../i18n/I18nContext";

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
  const { t } = useI18n();
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
        title={t.statistics.resetStats}
        message={t.statistics.confirmResetDesc}
        confirmText={t.common.confirm}
        cancelText={t.common.cancel}
        onConfirm={handleResetConfirm}
        onCancel={() => setShowResetDialog(false)}
        danger={true}
      />

      <div className="statistics-container">
        <div className="statistics-header">
          <h2 className="section-title">{t.statistics.title}</h2>
          <button
            onClick={() => setShowResetDialog(true)}
            className="button button-danger"
          >
            {t.statistics.resetStats}
          </button>
        </div>

        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-value">{totalGamesPlayed}</div>
            <div className="stat-label">{t.statistics.totalGames}</div>
          </div>

          <div className="stat-card">
            <div className="stat-value">{totalWordsStudied}</div>
            <div className="stat-label">{t.statistics.totalStudied}</div>
          </div>

          <div className="stat-card">
            <div className="stat-value">{accuracyRate}%</div>
            <div className="stat-label">{t.review.accuracy}</div>
          </div>

          <div className="stat-card">
            <div className="stat-value">{uniqueWrongWords}</div>
            <div className="stat-label">{t.statistics.wrongAnswerCount}</div>
          </div>

          <div className="stat-card">
            <div className="stat-value">{totalMistakes}</div>
            <div className="stat-label">{t.wrongAnswers.missCountHeader}</div>
          </div>
        </div>

        {mostMissedWords.length > 0 && (
          <div className="most-missed-section">
            <h3 className="subsection-title">{t.statistics.topMissedWords}</h3>
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
                  <div className="miss-count">{item.missCount}{t.statistics.times}</div>
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
