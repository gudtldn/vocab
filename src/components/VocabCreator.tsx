import React, { useState, useRef } from "react";
import { VocabularyItem } from "../types";
import ConfirmDialog from "./ConfirmDialog";
import { useDialog } from "../hooks/useDialog";

interface VocabCreatorProps {
  onSave: (name: string, vocabulary: VocabularyItem[]) => void;
  onCancel: () => void;
}

const VocabCreator: React.FC<VocabCreatorProps> = ({ onSave, onCancel }) => {
  const [bookName, setBookName] = useState("");
  const [vocabulary, setVocabulary] = useState<VocabularyItem[]>([]);
  const [currentWord, setCurrentWord] = useState("");
  const [currentReading, setCurrentReading] = useState("");
  const [currentMeanings, setCurrentMeanings] = useState("");
  const [currentNote, setCurrentNote] = useState("");
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const { dialog, showDialog, hideDialog } = useDialog();

  const wordInputRef = useRef<HTMLInputElement>(null);
  const readingInputRef = useRef<HTMLInputElement>(null);
  const meaningsInputRef = useRef<HTMLInputElement>(null);
  const noteInputRef = useRef<HTMLInputElement>(null);
  const lastFocusedInputRef = useRef<HTMLInputElement | null>(null);

  const handleAddWord = () => {
    // 필수 입력 확인 - 비어있으면 무시 (Enter로 다음 칸 이동 기능이 있음)
    if (
      !currentWord.trim() ||
      !currentReading.trim() ||
      !currentMeanings.trim()
    ) {
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

    // 単語入力欄にフォーカス
    setTimeout(() => {
      wordInputRef.current?.focus();
    }, 0);
  };

  const handleEdit = (index: number) => {
    const word = vocabulary[index];
    setCurrentWord(word.word);
    setCurrentReading(word.reading);
    setCurrentMeanings(word.meanings.join(", "));
    setCurrentNote(word.note || "");
    setEditingIndex(index);

    // 単語入力欄にフォーカス
    setTimeout(() => {
      wordInputRef.current?.focus();
    }, 0);
  };

  const handleDelete = (index: number) => {
    const word = vocabulary[index];
    showDialog(
      "単語を削除",
      `「${word.word}」を削除しますか？`,
      () => {
        setVocabulary(vocabulary.filter((_, i) => i !== index));
        hideDialog();
      },
      true
    );
  };

  const handleCancelEdit = () => {
    setEditingIndex(null);
    setCurrentWord("");
    setCurrentReading("");
    setCurrentMeanings("");
    setCurrentNote("");

    // 単語入力欄にフォーカス
    setTimeout(() => {
      wordInputRef.current?.focus();
    }, 0);
  };

  const handleSave = () => {
    if (!bookName.trim()) {
      showDialog(
        "入力エラー",
        "単語帳の名前を入力してください。",
        hideDialog
      );
      return;
    }

    if (vocabulary.length === 0) {
      showDialog(
        "入力エラー",
        "単語を少なくとも1つ追加してください。",
        hideDialog
      );
      return;
    }

    onSave(bookName.trim(), vocabulary);
  };

  const handleKeyDown = (
    e: React.KeyboardEvent,
    currentField: "word" | "reading" | "meanings"
  ) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();

      // 単語フィールド: 入力されていれば読みへ、なければそのまま
      if (currentField === "word") {
        if (currentWord.trim()) {
          readingInputRef.current?.focus();
        }
        return;
      }

      // 読みフィールド: 入力されていれば意味へ、なければそのまま
      if (currentField === "reading") {
        if (currentReading.trim()) {
          meaningsInputRef.current?.focus();
        }
        return;
      }

      // 意味フィールド: すべて入力されていれば追加、そうでなければそのまま
      if (currentField === "meanings") {
        if (
          currentWord.trim() &&
          currentReading.trim() &&
          currentMeanings.trim()
        ) {
          handleAddWord();
        }
        return;
      }
    }
  };

  return (
    <div className="vocab-creator-container">
      <div className="creator-header">
        <h2 className="creator-title">新しい単語帳を作成</h2>
        <button onClick={onCancel} className="button button-secondary">
          キャンセル
        </button>
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
              ref={wordInputRef}
              value={currentWord}
              onChange={(e) => setCurrentWord(e.target.value)}
              onKeyDown={(e) => handleKeyDown(e, "word")}
              onFocus={() => {
                lastFocusedInputRef.current = wordInputRef.current;
              }}
              placeholder="例: 食べる"
              className="form-input"
              lang="ja"
            />
          </div>

          <div className="form-group">
            <label htmlFor="reading" className="form-label">
              読み *
            </label>
            <input
              id="reading"
              type="text"
              ref={readingInputRef}
              value={currentReading}
              onChange={(e) => setCurrentReading(e.target.value)}
              onKeyDown={(e) => handleKeyDown(e, "reading")}
              onFocus={() => {
                lastFocusedInputRef.current = readingInputRef.current;
              }}
              placeholder="例: たべる"
              className="form-input"
              lang="ja"
            />
          </div>

          <div className="form-group full-width">
            <label htmlFor="meanings" className="form-label">
              意味 * (カンマ区切り)
            </label>
            <input
              id="meanings"
              type="text"
              ref={meaningsInputRef}
              value={currentMeanings}
              onChange={(e) => setCurrentMeanings(e.target.value)}
              onKeyDown={(e) => handleKeyDown(e, "meanings")}
              onFocus={() => {
                lastFocusedInputRef.current = meaningsInputRef.current;
              }}
              placeholder="例: 먹다, 食べる, eat"
              className="form-input"
              lang="ko"
            />
          </div>

          <div className="form-group full-width">
            <label htmlFor="note" className="form-label">
              メモ (任意)
            </label>
            <input
              id="note"
              type="text"
              ref={noteInputRef}
              value={currentNote}
              onChange={(e) => setCurrentNote(e.target.value)}
              onFocus={() => {
                lastFocusedInputRef.current = noteInputRef.current;
              }}
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
          <h3 className="section-title">
            追加された単語 ({vocabulary.length})
          </h3>
          {vocabulary.length > 0 && (
            <div className="save-section">
              <input
                id="bookName"
                type="text"
                value={bookName}
                onChange={(e) => setBookName(e.target.value)}
                placeholder="単語帳の名前を入力 *"
                className="form-input book-name-inline"
              />
              <button onClick={handleSave} className="button button-success">
                💾 保存
              </button>
            </div>
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
        onCancel={hideDialog}
        danger={dialog.danger}
      />
    </div>
  );
};

export default VocabCreator;
