import React, { useState } from "react";
import { VocabularyItem } from "../types";
import ConfirmDialog from "./ConfirmDialog";

interface VocabCreatorProps {
  onSave: (name: string, vocabulary: VocabularyItem[]) => void;
  onCancel: () => void;
}

interface DialogState {
  isOpen: boolean;
  title: string;
  message: string;
  onConfirm: () => void;
  danger?: boolean;
}

const VocabCreator: React.FC<VocabCreatorProps> = ({ onSave, onCancel }) => {
  const [bookName, setBookName] = useState("");
  const [vocabulary, setVocabulary] = useState<VocabularyItem[]>([]);
  const [currentWord, setCurrentWord] = useState("");
  const [currentReading, setCurrentReading] = useState("");
  const [currentMeanings, setCurrentMeanings] = useState("");
  const [currentNote, setCurrentNote] = useState("");
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [dialog, setDialog] = useState<DialogState>({
    isOpen: false,
    title: "",
    message: "",
    onConfirm: () => {},
  });

  const handleAddWord = () => {
    if (!currentWord.trim() || !currentReading.trim() || !currentMeanings.trim()) {
      setDialog({
        isOpen: true,
        title: "入力エラー",
        message: "単語、読み、意味は必須です。",
        onConfirm: () => setDialog({ ...dialog, isOpen: false }),
      });
      return;
    }

    const newWord: VocabularyItem = {
      word: currentWord.trim(),
      reading: currentReading.trim(),
      meanings: currentMeanings
        .split(",")
        .map((m) => m.trim())
        .filter((m) => m),
      note: currentNote.trim() || undefined,
    };

    if (editingIndex !== null) {
      // 編集モード
      const updated = [...vocabulary];
      updated[editingIndex] = newWord;
      setVocabulary(updated);
      setEditingIndex(null);
    } else {
      // 追加モード
      setVocabulary([...vocabulary, newWord]);
    }

    // フォームをリセット
    setCurrentWord("");
    setCurrentReading("");
    setCurrentMeanings("");
    setCurrentNote("");
  };

  const handleEdit = (index: number) => {
    const word = vocabulary[index];
    setCurrentWord(word.word);
    setCurrentReading(word.reading);
    setCurrentMeanings(word.meanings.join(", "));
    setCurrentNote(word.note || "");
    setEditingIndex(index);
  };

  const handleDelete = (index: number) => {
    const word = vocabulary[index];
    setDialog({
      isOpen: true,
      title: "単語を削除",
      message: `「${word.word}」を削除しますか？`,
      onConfirm: () => {
        setVocabulary(vocabulary.filter((_, i) => i !== index));
        setDialog({ ...dialog, isOpen: false });
      },
      danger: true,
    });
  };

  const handleCancelEdit = () => {
    setEditingIndex(null);
    setCurrentWord("");
    setCurrentReading("");
    setCurrentMeanings("");
    setCurrentNote("");
  };

  const handleSave = () => {
    if (!bookName.trim()) {
      setDialog({
        isOpen: true,
        title: "入力エラー",
        message: "単語帳の名前を入力してください。",
        onConfirm: () => setDialog({ ...dialog, isOpen: false }),
      });
      return;
    }

    if (vocabulary.length === 0) {
      setDialog({
        isOpen: true,
        title: "入力エラー",
        message: "単語を少なくとも1つ追加してください。",
        onConfirm: () => setDialog({ ...dialog, isOpen: false }),
      });
      return;
    }

    onSave(bookName.trim(), vocabulary);
  };

  return (
    <div className="vocab-creator-container">
      <div className="creator-header">
        <h2 className="creator-title">新しい単語帳を作成</h2>
        <button onClick={onCancel} className="button button-secondary">
          キャンセル
        </button>
      </div>

      <div className="book-name-section">
        <label htmlFor="bookName" className="form-label">
          単語帳の名前 *
        </label>
        <input
          id="bookName"
          type="text"
          value={bookName}
          onChange={(e) => setBookName(e.target.value)}
          placeholder="例: JLPT N5 単語"
          className="form-input"
        />
      </div>

      <div className="word-form-section">
        <h3 className="section-title">
          {editingIndex !== null ? "単語を編集" : "単語を追加"}
        </h3>
        <div className="form-grid">
          <div className="form-group">
            <label htmlFor="word" className="form-label">
              単語 *
            </label>
            <input
              id="word"
              type="text"
              value={currentWord}
              onChange={(e) => setCurrentWord(e.target.value)}
              placeholder="例: 食べる"
              className="form-input"
            />
          </div>

          <div className="form-group">
            <label htmlFor="reading" className="form-label">
              読み *
            </label>
            <input
              id="reading"
              type="text"
              value={currentReading}
              onChange={(e) => setCurrentReading(e.target.value)}
              placeholder="例: たべる"
              className="form-input"
            />
          </div>

          <div className="form-group full-width">
            <label htmlFor="meanings" className="form-label">
              意味 * (カンマ区切り)
            </label>
            <input
              id="meanings"
              type="text"
              value={currentMeanings}
              onChange={(e) => setCurrentMeanings(e.target.value)}
              placeholder="例: 먹다, 食べる, eat"
              className="form-input"
            />
          </div>

          <div className="form-group full-width">
            <label htmlFor="note" className="form-label">
              メモ (任意)
            </label>
            <input
              id="note"
              type="text"
              value={currentNote}
              onChange={(e) => setCurrentNote(e.target.value)}
              placeholder="例: 五段動詞"
              className="form-input"
            />
          </div>
        </div>

        <div className="form-actions">
          {editingIndex !== null && (
            <button
              onClick={handleCancelEdit}
              className="button button-secondary"
            >
              編集をキャンセル
            </button>
          )}
          <button onClick={handleAddWord} className="button button-primary">
            {editingIndex !== null ? "更新" : "追加"}
          </button>
        </div>
      </div>

      <div className="vocabulary-list-section">
        <div className="list-header">
          <h3 className="section-title">追加された単語 ({vocabulary.length})</h3>
          {vocabulary.length > 0 && (
            <button onClick={handleSave} className="button button-success">
              💾 単語帳を保存
            </button>
          )}
        </div>

        {vocabulary.length === 0 ? (
          <p className="empty-message">まだ単語が追加されていません。</p>
        ) : (
          <div className="vocab-list">
            {vocabulary.map((word, index) => (
              <div key={index} className="vocab-list-item">
                <div className="vocab-item-content">
                  <div className="vocab-item-main">
                    <span className="vocab-word">{word.word}</span>
                    <span className="vocab-reading">({word.reading})</span>
                  </div>
                  <div className="vocab-meanings">
                    {word.meanings.join(", ")}
                  </div>
                  {word.note && (
                    <div className="vocab-note">📝 {word.note}</div>
                  )}
                </div>
                <div className="vocab-item-actions">
                  <button
                    onClick={() => handleEdit(index)}
                    className="button-icon button-icon-edit"
                    title="編集"
                  >
                    ✏️
                  </button>
                  <button
                    onClick={() => handleDelete(index)}
                    className="button-icon button-icon-delete"
                    title="削除"
                  >
                    🗑️
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <ConfirmDialog
        isOpen={dialog.isOpen}
        title={dialog.title}
        message={dialog.message}
        onConfirm={dialog.onConfirm}
        onCancel={() => setDialog({ ...dialog, isOpen: false })}
        danger={dialog.danger}
      />
    </div>
  );
};

export default VocabCreator;
