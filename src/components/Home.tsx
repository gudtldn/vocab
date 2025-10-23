import React, { useState } from "react";
import { GameMode, VocabularyItem } from "../types";
import { invoke } from "@tauri-apps/api/core";
import { open } from "@tauri-apps/plugin-dialog";

interface HomeProps {
  onStartGame: (vocabulary: VocabularyItem[], mode: GameMode) => void;
}

const Home: React.FC<HomeProps> = ({ onStartGame }) => {
  const [vocabulary, setVocabulary] = useState<VocabularyItem[]>([]);
  const [error, setError] = useState<string>("");
  const [fileName, setFileName] = useState<string>("");

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
    } catch (err) {
      console.error("Tauri invoke error:", err);
      // Rust 커맨드에서 발생한 에러 메시지를 표시
      setError(err instanceof Error ? err.message : String(err));
      setVocabulary([]);
      setFileName("");
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
