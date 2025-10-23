import React, { useState, useEffect } from "react";
import { GameMode, VocabularyItem, VocabularyBook } from "../types";
import { invoke } from "@tauri-apps/api/core";
import { open } from "@tauri-apps/plugin-dialog";
import {
  writeTextFile,
  readTextFile,
  exists,
  BaseDirectory,
} from "@tauri-apps/plugin-fs";

interface HomeProps {
  onStartGame: (vocabulary: VocabularyItem[], mode: GameMode) => void;
}

const Home: React.FC<HomeProps> = ({ onStartGame }) => {
  const [vocabulary, setVocabulary] = useState<VocabularyItem[]>([]);
  const [error, setError] = useState<string>("");
  const [fileName, setFileName] = useState<string>("");
  const [savedBooks, setSavedBooks] = useState<VocabularyBook[]>([]);
  const [selectedBookIds, setSelectedBookIds] = useState<string[]>([]);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [editingBookId, setEditingBookId] = useState<string>("");
  const [tagInput, setTagInput] = useState<string>("");

  // 저장된 단어장 목록 불러오기
  useEffect(() => {
    const loadSavedBooks = async () => {
      try {
        const fileExists = await exists("vocabularyBooks.json", {
          baseDir: BaseDirectory.AppData,
        });

        if (fileExists) {
          const data = await readTextFile("vocabularyBooks.json", {
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
        "vocabularyBooks.json",
        JSON.stringify(books, null, 2),
        { baseDir: BaseDirectory.AppData }
      );
    } catch (error) {
      console.error("단어장 목록 저장 실패:", error);
    }
  };

  const handleButtonClick = async () => {
    setError(""); // 에러 초기화
    setFileName(""); // 파일 이름 초기화
    setVocabulary([]); // 단어 목록 초기화

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
        // 사용자가 파일 선택을 취소했을 때
        setFileName("");
        return;
      }

      const paths = Array.isArray(selectedPaths) ? selectedPaths : [selectedPaths];
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
      setFileName(
        paths.length === 1
          ? newBooks[0].name
          : `${paths.length}個のファイル`
      );
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
          const existing = updatedBooks.find((b) => b.filePath === book.filePath);
          return existing?.id || book.id;
        })
      );
      await saveBooksToFile(updatedBooks);
    } catch (err) {
      console.error("Tauri invoke error:", err);
      // Rust 커맨드에서 발생한 에러 메시지를 표시
      setError(err instanceof Error ? err.message : String(err));
      setVocabulary([]);
      setFileName("");
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
      setFileName("");
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
      setFileName(
        selectedBooks.length === 1
          ? selectedBooks[0].name
          : `${selectedBooks.length}個の単語帳`
      );

      // 마지막 사용 시간 업데이트
      const updatedBooks = savedBooks.map((b) =>
        newSelectedIds.includes(b.id) ? { ...b, lastUsed: Date.now() } : b
      );
      setSavedBooks(updatedBooks.sort((a, b) => b.lastUsed - a.lastUsed));
      await saveBooksToFile(updatedBooks);
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
        setFileName("");
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
        <button onClick={handleButtonClick} className="button button-primary">
          単語帳をアップロード
        </button>
        {fileName && (
          <p className="file-name-display">
            ファイル: <span className="file-name">{fileName}</span>
          </p>
        )}
        {error && <p className="error-message">{error}</p>}
      </div>

      {savedBooks.length > 0 && (
        <div className="saved-books-section">
          <div className="section-header">
            <h3 className="section-subtitle">保存された単語帳</h3>
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
          </div>
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
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDeleteBook(book.id);
                  }}
                  className="button button-delete-small"
                  title="削除"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {canStartGame && (
        <div className="mode-selection">
          <h3 className="mode-title">学習モード選択</h3>
          <div className="mode-buttons">
            <button
              onClick={() => onStartGame(vocabulary, GameMode.MultipleChoice)}
              className="button button-choice"
            >
              客観式
            </button>
            <button
              onClick={() => onStartGame(vocabulary, GameMode.DirectInput)}
              className="button button-input"
            >
              主観式
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Home;
