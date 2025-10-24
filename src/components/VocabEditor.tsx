import React, { useState, useEffect } from "react";
import { VocabularyItem, VocabularyBook } from "../types";
import Furigana from "./Furigana";
import ConfirmDialog from "./ConfirmDialog";

interface VocabEditorProps {
  vocabulary: VocabularyItem[];
  currentBook: VocabularyBook | null;
  onSave: (vocabulary: VocabularyItem[]) => void;
  onExportCSV: () => void;
}

const VocabEditor: React.FC<VocabEditorProps> = ({
  vocabulary,
  currentBook,
  onSave,
  onExportCSV,
}) => {
  const [vocabList, setVocabList] = useState<VocabularyItem[]>([]);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [showAddForm, setShowAddForm] = useState(false);
  const [newWord, setNewWord] = useState<VocabularyItem>({
    word: "",
    reading: "",
    meanings: [""],
    note: "",
  });
  const [dialog, setDialog] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
  }>({
    isOpen: false,
    title: "",
    message: "",
    onConfirm: () => {},
  });

  useEffect(() => {
    setVocabList(vocabulary);
  }, [vocabulary]);

  const handleEdit = (index: number) => {
    setEditingId(index);
  };

  const handleSave = (index: number, updatedItem: VocabularyItem) => {
    const updated = [...vocabList];
    updated[index] = updatedItem;
    setVocabList(updated);
    setEditingId(null);
    onSave(updated);
  };

  const handleDelete = (index: number) => {
    const updated = vocabList.filter((_, i) => i !== index);
    setVocabList(updated);
    onSave(updated);
  };

  const handleAdd = () => {
    if (!newWord.word || !newWord.reading || !newWord.meanings[0]) {
      setDialog({
        isOpen: true,
        title: "入力エラー",
        message: "単語、読み、意味を入力してください。",
        onConfirm: () => setDialog({ ...dialog, isOpen: false }),
      });
      return;
    }

    const updated = [...vocabList, { ...newWord }];
    setVocabList(updated);
    onSave(updated);
    setNewWord({ word: "", reading: "", meanings: [""], note: "" });
    setShowAddForm(false);
  };

  const filteredVocab = vocabList.filter(
    (item) =>
      item.word.includes(searchQuery) ||
      item.reading.includes(searchQuery) ||
      item.meanings.some((m) => m.includes(searchQuery))
  );

  // 단어장이 비어있는 경우
  if (vocabList.length === 0 && !showAddForm) {
    return (
      <div className="vocab-editor-container">
        <div className="editor-header">
          <h2 className="section-title">単語帳編集</h2>
          <div className="editor-actions">
            <button
              onClick={() => setShowAddForm(true)}
              className="button button-primary"
            >
              ➕ 単語追加
            </button>
          </div>
        </div>
        <div className="empty-state">
          <div className="empty-icon">📚</div>
          <h3 className="empty-title">編集する単語帳がありません</h3>
          <p className="empty-description">
            ホーム画面で単語帳を選択してから、
            <br />
            こちらで編集できます。
          </p>
          <p className="empty-hint">
            または、下のボタンで新しい単語を追加できます。
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="vocab-editor-container">
      <div className="editor-header">
        <div className="editor-title-section">
          <h2 className="section-title">単語帳編集</h2>
          {currentBook && (
            <div className="current-book-name">
              📚 {currentBook.name}
            </div>
          )}
        </div>
        <div className="editor-actions">
          <button onClick={onExportCSV} className="button button-export">
            📤 CSV出力
          </button>
          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="button button-primary"
          >
            {showAddForm ? "キャンセル" : "➕ 単語追加"}
          </button>
        </div>
      </div>

      <div className="search-section">
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="🔍 単語を検索..."
          className="search-input"
        />
      </div>

      {showAddForm && (
        <div className="add-form">
          <h3 className="form-title">新しい単語を追加</h3>
          <div className="form-grid">
            <div className="form-group">
              <label>単語</label>
              <input
                type="text"
                value={newWord.word}
                onChange={(e) =>
                  setNewWord({ ...newWord, word: e.target.value })
                }
                placeholder="例: 食べる"
                className="form-input"
              />
            </div>
            <div className="form-group">
              <label>読み</label>
              <input
                type="text"
                value={newWord.reading}
                onChange={(e) =>
                  setNewWord({ ...newWord, reading: e.target.value })
                }
                placeholder="例: たべる"
                className="form-input"
              />
            </div>
            <div className="form-group full-width">
              <label>意味</label>
              <input
                type="text"
                value={newWord.meanings[0]}
                onChange={(e) =>
                  setNewWord({ ...newWord, meanings: [e.target.value] })
                }
                placeholder="例: 먹다"
                className="form-input"
              />
            </div>
            <div className="form-group full-width">
              <label>メモ (任意)</label>
              <textarea
                value={newWord.note || ""}
                onChange={(e) =>
                  setNewWord({ ...newWord, note: e.target.value })
                }
                placeholder="例: よく使う動詞"
                className="form-textarea"
                rows={2}
              />
            </div>
          </div>
          <div className="form-actions">
            <button onClick={handleAdd} className="button button-primary">
              追加
            </button>
            <button
              onClick={() => setShowAddForm(false)}
              className="button button-secondary"
            >
              キャンセル
            </button>
          </div>
        </div>
      )}

      <div className="vocab-list">
        <div className="vocab-count">
          {filteredVocab.length}個の単語
        </div>
        {filteredVocab.map((item, index) => (
          <VocabItem
            key={index}
            item={item}
            index={index}
            isEditing={editingId === index}
            onEdit={() => handleEdit(index)}
            onSave={(updated) => handleSave(index, updated)}
            onDelete={() => handleDelete(index)}
            onCancel={() => setEditingId(null)}
          />
        ))}
      </div>

      <ConfirmDialog
        isOpen={dialog.isOpen}
        title={dialog.title}
        message={dialog.message}
        onConfirm={dialog.onConfirm}
        onCancel={() => setDialog({ ...dialog, isOpen: false })}
      />
    </div>
  );
};

interface VocabItemProps {
  item: VocabularyItem;
  index: number;
  isEditing: boolean;
  onEdit: () => void;
  onSave: (item: VocabularyItem) => void;
  onDelete: () => void;
  onCancel: () => void;
}

const VocabItem: React.FC<VocabItemProps> = ({
  item,
  isEditing,
  onEdit,
  onSave,
  onDelete,
  onCancel,
}) => {
  const [editedItem, setEditedItem] = useState(item);

  useEffect(() => {
    setEditedItem(item);
  }, [item, isEditing]);

  if (isEditing) {
    return (
      <div className="vocab-item editing">
        <div className="form-grid">
          <div className="form-group">
            <label>単語</label>
            <input
              type="text"
              value={editedItem.word}
              onChange={(e) =>
                setEditedItem({ ...editedItem, word: e.target.value })
              }
              className="form-input"
            />
          </div>
          <div className="form-group">
            <label>読み</label>
            <input
              type="text"
              value={editedItem.reading}
              onChange={(e) =>
                setEditedItem({ ...editedItem, reading: e.target.value })
              }
              className="form-input"
            />
          </div>
          <div className="form-group full-width">
            <label>意味</label>
            <input
              type="text"
              value={editedItem.meanings.join(", ")}
              onChange={(e) =>
                setEditedItem({
                  ...editedItem,
                  meanings: e.target.value.split(",").map((m) => m.trim()),
                })
              }
              className="form-input"
            />
          </div>
          <div className="form-group full-width">
            <label>メモ</label>
            <textarea
              value={editedItem.note || ""}
              onChange={(e) =>
                setEditedItem({ ...editedItem, note: e.target.value })
              }
              className="form-textarea"
              rows={2}
            />
          </div>
        </div>
        <div className="item-actions">
          <button
            onClick={() => onSave(editedItem)}
            className="button button-save"
          >
            保存
          </button>
          <button onClick={onCancel} className="button button-secondary">
            キャンセル
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="vocab-item">
      <div className="item-content">
        <div className="item-word">
          <Furigana word={item.word} reading={item.reading} show={true} />
        </div>
        <div className="item-meanings">{item.meanings.join(", ")}</div>
        {item.note && <div className="item-note">📝 {item.note}</div>}
      </div>
      <div className="item-actions">
        <button onClick={onEdit} className="button button-edit" title="編集">
          ✏️
        </button>
        <button
          onClick={onDelete}
          className="button button-delete-small"
          title="削除"
        >
          ✕
        </button>
      </div>
    </div>
  );
};

export default VocabEditor;
