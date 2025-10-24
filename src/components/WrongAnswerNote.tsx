import React, { useState } from "react";
import Furigana from "./Furigana";
import ConfirmDialog from "./ConfirmDialog";
import { WrongAnswerItem, VocabularyItem } from "../types";
import { WRONG_ANSWER_RELEARN_THRESHOLD } from "../constants";
import { useI18n } from "../i18n/I18nContext";

interface WrongAnswerNoteProps {
  wrongAnswers: WrongAnswerItem[];
  onReview: (reviewList: VocabularyItem[]) => void;
  onDeleteItem: (word: string, reading: string) => void;
  onClearAll: () => void;
}

const WrongAnswerNote: React.FC<WrongAnswerNoteProps> = ({
  wrongAnswers,
  onReview,
  onDeleteItem,
  onClearAll,
}) => {
  const { t } = useI18n();
  const [showClearDialog, setShowClearDialog] = useState(false);

  if (wrongAnswers.length === 0) {
    return (
      <div className="wrong-answer-note-container">
        <h2 className="section-title">{t.wrongAnswers.title}</h2>
        <p className="no-wrong-answers-message">
          {t.wrongAnswers.emptyDesc}
        </p>
      </div>
    );
  }

  const sortedAnswers = [...wrongAnswers].sort(
    (a, b) => b.missCount - a.missCount
  );

  const handleClearConfirm = () => {
    onClearAll();
    setShowClearDialog(false);
  };

  return (
    <>
      <ConfirmDialog
        isOpen={showClearDialog}
        title={t.common.confirm}
        message={t.wrongAnswers.confirmClearDesc}
        confirmText={t.common.delete}
        cancelText={t.common.cancel}
        onConfirm={handleClearConfirm}
        onCancel={() => setShowClearDialog(false)}
        danger={true}
      />

      <div className="wrong-answer-note-container">
        <div className="section-header">
          <h2 className="section-title">{t.wrongAnswers.title}</h2>
          <div className="button-group">
            <button
              onClick={() => onReview(wrongAnswers)}
              className="button button-review"
            >
              {t.wrongAnswers.reviewAll}
            </button>
            <button
              onClick={() => setShowClearDialog(true)}
              className="button button-danger"
            >
              {t.wrongAnswers.clearAll}
            </button>
          </div>
        </div>

        <div className="table-container">
          <table className="wrong-answer-table">
            <thead>
              <tr>
                <th>{t.wrongAnswers.word}</th>
                <th>{t.wrongAnswers.meaning}</th>
                <th className="text-center">{t.wrongAnswers.missCountHeader}</th>
                <th className="text-center">{t.wrongAnswers.correctStreakHeader}</th>
                <th className="text-center">{t.common.delete}</th>
              </tr>
            </thead>
            <tbody>
              {sortedAnswers.map((item, index) => (
                <tr key={`${item.word}-${item.reading}-${index}`}>
                  <td className="word-cell">
                    <Furigana
                      word={item.word}
                      reading={item.reading}
                      className="table-word-text"
                      show={true}
                    />
                  </td>
                  <td>{item.meanings.join(", ")}</td>
                  <td className="text-center">
                    <span
                      className={`miss-count-badge ${
                        item.missCount >= WRONG_ANSWER_RELEARN_THRESHOLD
                          ? "high"
                          : "low"
                      }`}
                    >
                      {item.missCount}
                    </span>
                  </td>
                  <td className="text-center">
                    <span
                      className={`correct-streak-badge ${
                        (item.correctStreak || 0) >= 2 ? "near-mastery" : ""
                      }`}
                    >
                      {item.correctStreak || 0}/3
                    </span>
                  </td>
                  <td className="text-center">
                    <button
                      onClick={() => onDeleteItem(item.word, item.reading)}
                      className="button button-delete-small"
                      title={t.common.delete}
                    >
                      ✕
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
};

export default WrongAnswerNote;
