import React, { useState, useEffect } from "react";
import { GameMode, VocabularyItem, VocabularyBook } from "../types";
import { invoke } from "@tauri-apps/api/core";
import { open } from "@tauri-apps/plugin-dialog";
import { STORAGE_KEYS } from "../constants/index";
import {
  writeTextFile,
  readTextFile,
  exists,
  BaseDirectory,
} from "@tauri-apps/plugin-fs";

interface HomeProps {
  onStartGame: (vocabulary: VocabularyItem[], mode: GameMode) => void;
  onUpdateCurrentBooks: (
    books: VocabularyBook[],
    vocabulary: VocabularyItem[]
  ) => void;
  onEditBook: (book: VocabularyBook, vocabulary: VocabularyItem[]) => void;
  onCreateVocabBook: () => void;
  onVocabularyCountChange: (count: number) => void;
}

const Home: React.FC<HomeProps> = ({
  onStartGame,
  onUpdateCurrentBooks,
  onEditBook,
  onCreateVocabBook,
  onVocabularyCountChange,
}) => {
  const [vocabulary, setVocabulary] = useState<VocabularyItem[]>([]);
  const [error, setError] = useState<string>("");
  const [savedBooks, setSavedBooks] = useState<VocabularyBook[]>([]);
  const [selectedBookIds, setSelectedBookIds] = useState<string[]>([]);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [editingBookId, setEditingBookId] = useState<string>("");
  const [tagInput, setTagInput] = useState<string>("");

  // vocabulary 카운트가 변경될 때마다 부모에게 알림
  useEffect(() => {
    onVocabularyCountChange(vocabulary.length);
  }, [vocabulary.length, onVocabularyCountChange]);

  // 저장된 단어장 목록 불러오기
  useEffect(() => {
    const loadSavedBooks = async () => {
      try {
        const fileExists = await exists(`${STORAGE_KEYS.VOCABULARY_BOOKS}.json`, {
          baseDir: BaseDirectory.AppData,
        });

        if (fileExists) {
          const data = await readTextFile(`${STORAGE_KEYS.VOCABULARY_BOOKS}.json`, {
            baseDir: BaseDirectory.AppData,
          });
          const books = JSON.parse(data) as VocabularyBook[];
          setSavedBooks(books.sort((a, b) => b.lastUsed - a.lastUsed));
        }
      } catch (error) {
        console.error("단어장 목록 불러오기 실패:", error);
      }
    };

    loadSavedBooks();
  }, []);

  // 단어장 목록 저장
  const saveBooksToFile = async (books: VocabularyBook[]) => {
    try {
      await writeTextFile(
        `${STORAGE_KEYS.VOCABULARY_BOOKS}.json`,
        JSON.stringify(books, null, 2),
        { baseDir: BaseDirectory.AppData }
      );
    } catch (error) {
      console.error("단어장 목록 저장 실패:", error);
    }
  };

  const handleButtonClick = async () => {
    setError("");
    setVocabulary([]);

    try {
      // Tauri 파일 열기 다이얼로그 호출 (다중 선택)
      const selectedPaths = await open({
        multiple: true,
        filters: [
          {
            name: "Vocabulary Files",
            extensions: ["txt", "csv"],
          },
        ],
      });

      if (!selectedPaths || selectedPaths.length === 0) {
        return;
      }

      const paths = Array.isArray(selectedPaths)
        ? selectedPaths
        : [selectedPaths];
      let allVocabulary: VocabularyItem[] = [];
      const newBooks: VocabularyBook[] = [];

      // 각 파일을 파싱
      for (const selectedPath of paths) {
        const pathParts = selectedPath.split(/[/\\]/);
        const name = pathParts[pathParts.length - 1];

        // Rust 백엔드의 parse_vocab_file 커맨드 호출
        const parsedData: VocabularyItem[] = await invoke("parse_vocab_file", {
          filePath: selectedPath,
        });

        if (parsedData.length === 0) {
          console.warn(`${name} is empty or invalid`);
          continue;
        }

        allVocabulary = [...allVocabulary, ...parsedData];

        // 새 단어장 생성
        const newBook: VocabularyBook = {
          id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
          name: name,
          filePath: selectedPath,
          lastUsed: Date.now(),
          wordCount: parsedData.length,
          tags: [],
        };

        newBooks.push(newBook);
      }

      if (allVocabulary.length === 0) {
        throw new Error("有効なファイルがありません。");
      }

      setVocabulary(allVocabulary);
      setError("");

      // 단어장 목록 업데이트
      let updatedBooks = [...savedBooks];

      for (const newBook of newBooks) {
        const existingBookIndex = updatedBooks.findIndex(
          (book) => book.filePath === newBook.filePath
        );

        if (existingBookIndex !== -1) {
          // 기존 단어장 업데이트
          updatedBooks[existingBookIndex] = {
            ...updatedBooks[existingBookIndex],
            lastUsed: Date.now(),
            wordCount: newBook.wordCount,
          };
        } else {
          // 새 단어장 추가
          updatedBooks = [newBook, ...updatedBooks];
        }
      }

      setSavedBooks(updatedBooks);
      setSelectedBookIds(
        newBooks.map((book) => {
          const existing = updatedBooks.find(
            (b) => b.filePath === book.filePath
          );
          return existing?.id || book.id;
        })
      );
      await saveBooksToFile(updatedBooks);
    } catch (err) {
      console.error("Tauri invoke error:", err);
      // Rust 커맨드에서 발생한 에러 메시지를 표시
      setError(err instanceof Error ? err.message : String(err));
      setVocabulary([]);
    }
  };

  const handleToggleBook = async (bookId: string) => {
    const newSelectedIds = selectedBookIds.includes(bookId)
      ? selectedBookIds.filter((id) => id !== bookId)
      : [...selectedBookIds, bookId];

    setSelectedBookIds(newSelectedIds);

    // 선택된 모든 단어장의 단어를 합치기
    if (newSelectedIds.length === 0) {
      setVocabulary([]);
      return;
    }

    try {
      let allVocabulary: VocabularyItem[] = [];
      const selectedBooks = savedBooks.filter((book) =>
        newSelectedIds.includes(book.id)
      );

      for (const book of selectedBooks) {
        const parsedData: VocabularyItem[] = await invoke("parse_vocab_file", {
          filePath: book.filePath,
        });
        allVocabulary = [...allVocabulary, ...parsedData];
      }

      setVocabulary(allVocabulary);

      // 마지막 사용 시간 업데이트
      const updatedBooks = savedBooks.map((b) =>
        newSelectedIds.includes(b.id) ? { ...b, lastUsed: Date.now() } : b
      );
      setSavedBooks(updatedBooks.sort((a, b) => b.lastUsed - a.lastUsed));
      await saveBooksToFile(updatedBooks);

      // 부모 컴포넌트에 현재 선택된 단어장 정보 전달
      onUpdateCurrentBooks(selectedBooks, allVocabulary);
    } catch (err) {
      console.error("단어장 불러오기 실패:", err);
      setError(err instanceof Error ? err.message : String(err));
    }
  };

  const handleDeleteBook = async (bookId: string) => {
    const updatedBooks = savedBooks.filter((book) => book.id !== bookId);
    setSavedBooks(updatedBooks);
    await saveBooksToFile(updatedBooks);

    if (selectedBookIds.includes(bookId)) {
      const newSelectedIds = selectedBookIds.filter((id) => id !== bookId);
      setSelectedBookIds(newSelectedIds);

      if (newSelectedIds.length === 0) {
        setVocabulary([]);
      } else {
        // 남은 선택된 단어장들의 단어를 다시 로드
        handleToggleBook(bookId); // 이미 제거되었으므로 재계산 트리거
      }
    }
  };

  const handleAddTag = async (bookId: string) => {
    if (!tagInput.trim()) return;

    const updatedBooks = savedBooks.map((book) => {
      if (book.id === bookId) {
        const newTags = book.tags || [];
        if (!newTags.includes(tagInput.trim())) {
          return { ...book, tags: [...newTags, tagInput.trim()] };
        }
      }
      return book;
    });

    setSavedBooks(updatedBooks);
    await saveBooksToFile(updatedBooks);
    setTagInput("");
  };

  const handleRemoveTag = async (bookId: string, tag: string) => {
    const updatedBooks = savedBooks.map((book) => {
      if (book.id === bookId) {
        return { ...book, tags: book.tags.filter((t) => t !== tag) };
      }
      return book;
    });

    setSavedBooks(updatedBooks);
    await saveBooksToFile(updatedBooks);
  };

  const handleToggleTagFilter = (tag: string) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  const handleEditBook = async (book: VocabularyBook) => {
    try {
      // 해당 단어장의 단어들을 불러오기
      const parsedData: VocabularyItem[] = await invoke("parse_vocab_file", {
        filePath: book.filePath,
      });

      // 편집 화면으로 전환
      onEditBook(book, parsedData);
    } catch (err) {
      console.error("단어장 불러오기 실패:", err);
      setError(err instanceof Error ? err.message : String(err));
    }
  };

  // 모든 태그 목록 가져오기
  const allTags = Array.from(
    new Set(savedBooks.flatMap((book) => book.tags || []))
  ).sort();

  // 태그 필터링된 단어장 목록
  const filteredBooks =
    selectedTags.length === 0
      ? savedBooks
      : savedBooks.filter((book) =>
          selectedTags.some((tag) => book.tags?.includes(tag))
        );

  // 전체 선택/해제
  const handleSelectAll = async () => {
    const allFilteredIds = filteredBooks.map((book) => book.id);
    setSelectedBookIds(allFilteredIds);

    // 모든 단어장의 단어를 합치기
    try {
      let allVocabulary: VocabularyItem[] = [];

      for (const book of filteredBooks) {
        const parsedData: VocabularyItem[] = await invoke("parse_vocab_file", {
          filePath: book.filePath,
        });
        allVocabulary = [...allVocabulary, ...parsedData];
      }

      setVocabulary(allVocabulary);

      // 마지막 사용 시간 업데이트
      const updatedBooks = savedBooks.map((b) =>
        allFilteredIds.includes(b.id) ? { ...b, lastUsed: Date.now() } : b
      );
      setSavedBooks(updatedBooks.sort((a, b) => b.lastUsed - a.lastUsed));
      await saveBooksToFile(updatedBooks);
    } catch (err) {
      console.error("단어장 불러오기 실패:", err);
      setError(err instanceof Error ? err.message : String(err));
    }
  };

  const handleDeselectAll = () => {
    setSelectedBookIds([]);
    setVocabulary([]);
  };

  const allFilteredSelected =
    filteredBooks.length > 0 &&
    filteredBooks.every((book) => selectedBookIds.includes(book.id));

  const canStartGame = vocabulary.length > 0;

  return (
    <div className="home-container">
      <div>
        <h2 className="home-title">学習を始めましょう</h2>
        <p className="home-subtitle">
          単語帳ファイルをアップロードして、学習モードを選択してください。
        </p>
      </div>

      <div className="upload-section">
        <div className="upload-buttons">
          <button onClick={handleButtonClick} className="button button-primary">
            📂 単語帳をアップロード
          </button>
          <button onClick={onCreateVocabBook} className="button button-success">
            ➕ 新しく作成
          </button>
        </div>
        {error && <p className="error-message">エラー: {error}</p>}
      </div>

      {savedBooks.length > 0 && (
        <div className="saved-books-section">
          <div className="section-header">
            <h3 className="section-subtitle">保存された単語帳</h3>
            <div className="header-actions">
              {filteredBooks.length > 0 && (
                <button
                  onClick={allFilteredSelected ? handleDeselectAll : handleSelectAll}
                  className={`button ${allFilteredSelected ? 'button-secondary' : 'button-select-all'}`}
                  title={allFilteredSelected ? "すべての選択を解除" : "すべて選択"}
                >
                  {allFilteredSelected ? "☑ 選択解除" : "☐ 全選択"}
                </button>
              )}
              <div className="bulk-actions">
                <button
                  onClick={() => {
                    if (selectedBookIds.length === 1) {
                      const book = savedBooks.find(
                        (b) => b.id === selectedBookIds[0]
                      );
                      if (book) handleEditBook(book);
                    }
                  }}
                  className="button button-bulk-edit"
                  disabled={selectedBookIds.length !== 1}
                  title={
                    selectedBookIds.length === 0
                      ? "編集する単語帳を選択してください"
                      : selectedBookIds.length === 1
                      ? "選択した単語帳を編集"
                      : "編集するには単語帳を1つだけ選択してください"
                  }
                >
                  ✏️ 編集
                </button>
                <button
                  onClick={() => {
                    if (
                      selectedBookIds.length > 0 &&
                      window.confirm(
                        `選択した${selectedBookIds.length}個の単語帳を削除しますか？`
                      )
                    ) {
                      selectedBookIds.forEach((id) => handleDeleteBook(id));
                    }
                  }}
                  className="button button-bulk-delete"
                  disabled={selectedBookIds.length === 0}
                  title={
                    selectedBookIds.length === 0
                      ? "削除する単語帳を選択してください"
                      : `選択した${selectedBookIds.length}個の単語帳を削除`
                  }
                >
                  🗑️ 削除
                </button>
              </div>
            </div>
          </div>
          {allTags.length > 0 && (
            <div className="tag-filters">
              <span className="filter-label">タグでフィルター:</span>
              {allTags.map((tag) => (
                <button
                  key={tag}
                  onClick={() => handleToggleTagFilter(tag)}
                  className={`tag-filter ${
                    selectedTags.includes(tag) ? "active" : ""
                  }`}
                >
                  {tag}
                </button>
              ))}
              {selectedTags.length > 0 && (
                <button
                  onClick={() => setSelectedTags([])}
                  className="clear-filter"
                >
                  クリア
                </button>
              )}
            </div>
          )}
          <div className="saved-books-list">
            {filteredBooks.map((book) => (
              <div
                key={book.id}
                className={`book-item ${
                  selectedBookIds.includes(book.id) ? "selected" : ""
                }`}
              >
                <input
                  type="checkbox"
                  className="book-checkbox"
                  checked={selectedBookIds.includes(book.id)}
                  onChange={() => handleToggleBook(book.id)}
                />
                <div
                  className="book-info"
                  onClick={() => handleToggleBook(book.id)}
                >
                  <div className="book-name">{book.name}</div>
                  <div className="book-details">
                    {book.wordCount}個の単語 • 最終使用:{" "}
                    {new Date(book.lastUsed).toLocaleDateString("ja-JP")}
                  </div>
                  {book.tags && book.tags.length > 0 && (
                    <div className="book-tags">
                      {book.tags.map((tag) => (
                        <span key={tag} className="book-tag">
                          {tag}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleRemoveTag(book.id, tag);
                            }}
                            className="tag-remove"
                          >
                            ✕
                          </button>
                        </span>
                      ))}
                    </div>
                  )}
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setEditingBookId(editingBookId === book.id ? "" : book.id);
                    setTagInput("");
                  }}
                  className="button button-tag"
                  title="タグ編集"
                >
                  🏷️
                </button>
                {editingBookId === book.id && (
                  <div
                    className="tag-input-section"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <input
                      type="text"
                      value={tagInput}
                      onChange={(e) => setTagInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          handleAddTag(book.id);
                        } else if (e.key === "Escape") {
                          setEditingBookId("");
                          setTagInput("");
                        }
                      }}
                      placeholder="新しいタグ..."
                      className="tag-input"
                      autoFocus
                    />
                    <button
                      onClick={() => handleAddTag(book.id)}
                      className="button-tag-add"
                    >
                      追加
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 플로팅 액션 바 */}
      {canStartGame && (
        <div className="floating-action-bar">
          <div className="floating-content">
            <div className="floating-info">
              <span className="floating-count">
                📚 {vocabulary.length}個の単語
              </span>
              <span className="floating-label">
                {selectedBookIds.length === 1
                  ? `ファイル: ${savedBooks.find(b => b.id === selectedBookIds[0])?.name || ''}`
                  : `ファイル: ${selectedBookIds.length}個の単語帳`}
              </span>
            </div>
            <div className="floating-buttons">
              <button
                onClick={() => onStartGame(vocabulary, GameMode.MultipleChoice)}
                className="button button-choice button-floating"
              >
                客観式
              </button>
              <button
                onClick={() => onStartGame(vocabulary, GameMode.DirectInput)}
                className="button button-input button-floating"
              >
                主観式
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Home;
