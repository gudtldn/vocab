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
  const [selectedBookId, setSelectedBookId] = useState<string>("");

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
      // Tauri 파일 열기 다이얼로그 호출
      // https://v2.tauri.app/plugin/dialog/#open-a-file-selector-dialog
      const selectedPath = await open({
        multiple: false,
        filters: [
          {
            name: "Vocabulary Files",
            extensions: ["txt", "csv"],
          },
        ],
      });

      if (!selectedPath) {
        // 사용자가 파일 선택을 취소했을 때
        setFileName("");
        return;
      }

      const pathParts = selectedPath.split(/[/\\]/); // OS에 따라 / 또는 \로 분리
      const name = pathParts[pathParts.length - 1];
      setFileName(name);

      // Rust 백엔드의 parse_vocab_file 커맨드 호출
      const parsedData: VocabularyItem[] = await invoke("parse_vocab_file", {
        filePath: selectedPath,
      });

      // 결과 처리
      if (parsedData.length === 0) {
        throw new Error(
          "The file is empty or does not contain valid data (Rust parsing result)."
        );
      }

      setVocabulary(parsedData);
      setError("");

      // 새 단어장을 목록에 추가
      const newBook: VocabularyBook = {
        id: Date.now().toString(),
        name: name,
        filePath: selectedPath,
        lastUsed: Date.now(),
        wordCount: parsedData.length,
      };

      const existingBookIndex = savedBooks.findIndex(
        (book) => book.filePath === selectedPath
      );

      let updatedBooks: VocabularyBook[];
      if (existingBookIndex !== -1) {
        // 기존 단어장 업데이트
        updatedBooks = [...savedBooks];
        updatedBooks[existingBookIndex] = {
          ...updatedBooks[existingBookIndex],
          lastUsed: Date.now(),
          wordCount: parsedData.length,
        };
      } else {
        // 새 단어장 추가
        updatedBooks = [newBook, ...savedBooks];
      }

      setSavedBooks(updatedBooks);
      setSelectedBookId(
        existingBookIndex !== -1
          ? savedBooks[existingBookIndex].id
          : newBook.id
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

  const handleSelectBook = async (book: VocabularyBook) => {
    try {
      setError("");
      const parsedData: VocabularyItem[] = await invoke("parse_vocab_file", {
        filePath: book.filePath,
      });

      if (parsedData.length === 0) {
        throw new Error("ファイルが空か、有効なデータがありません。");
      }

      setVocabulary(parsedData);
      setFileName(book.name);
      setSelectedBookId(book.id);

      // 마지막 사용 시간 업데이트
      const updatedBooks = savedBooks.map((b) =>
        b.id === book.id ? { ...b, lastUsed: Date.now() } : b
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

    if (selectedBookId === bookId) {
      setVocabulary([]);
      setFileName("");
      setSelectedBookId("");
    }
  };

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
          <h3 className="section-subtitle">保存された単語帳</h3>
          <div className="saved-books-list">
            {savedBooks.map((book) => (
              <div
                key={book.id}
                className={`book-item ${
                  selectedBookId === book.id ? "selected" : ""
                }`}
              >
                <div
                  className="book-info"
                  onClick={() => handleSelectBook(book)}
                >
                  <div className="book-name">{book.name}</div>
                  <div className="book-details">
                    {book.wordCount}個の単語 • 最終使用:{" "}
                    {new Date(book.lastUsed).toLocaleDateString("ja-JP")}
                  </div>
                </div>
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
