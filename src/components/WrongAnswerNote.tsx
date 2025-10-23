import React, { useState } from "react";
import Furigana from "./Furigana";
import ConfirmDialog from "./ConfirmDialog";
import { WrongAnswerItem, VocabularyItem } from "../types";
import { WRONG_ANSWER_RELEARN_THRESHOLD } from "../constants";

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
  const [showClearDialog, setShowClearDialog] = useState(false);

  if (wrongAnswers.length === 0) {
    return (
      <div className="wrong-answer-note-container">
        <h2 className="section-title">誤答ノート</h2>
        <p className="no-wrong-answers-message">
          素晴らしい！まだ間違えた単語はありません。
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
        title="確認"
        message="本当にすべての誤答を削除しますか？この操作は取り消せません。"
        confirmText="削除"
        cancelText="キャンセル"
        onConfirm={handleClearConfirm}
        onCancel={() => setShowClearDialog(false)}
        danger={true}
      />

      <div className="wrong-answer-note-container">
        <div className="section-header">
          <h2 className="section-title">誤答ノート</h2>
          <div className="button-group">
            <button
              onClick={() => onReview(wrongAnswers)}
              className="button button-review"
            >
              間違えた単語を復習
            </button>
            <button
              onClick={() => setShowClearDialog(true)}
              className="button button-danger"
            >
              全て削除
            </button>
          </div>
        </div>

        <div className="table-container">
          <table className="wrong-answer-table">
            <thead>
              <tr>
                <th>単語</th>
                <th>意味</th>
                <th className="text-center">間違い回数</th>
                <th className="text-center">削除</th>
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
                    <button
                      onClick={() => onDeleteItem(item.word, item.reading)}
                      className="button button-delete-small"
                      title="削除"
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
