import React, { useState, useRef } from 'react';
import { GameMode, VocabularyItem } from '../types';

interface HomeProps {
  onStartGame: (vocabulary: VocabularyItem[], mode: GameMode) => void;
}

const Home: React.FC<HomeProps> = ({ onStartGame }) => {
  const [vocabulary, setVocabulary] = useState<VocabularyItem[]>([]);
  const [error, setError] = useState<string>('');
  const [fileName, setFileName] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      try {
        const parsedData = text
          .split('\n')
          .filter(line => line.trim() !== '')
          .map((line, index) => {
            const parts = line.split(',');
            if (parts.length < 3) {
              throw new Error(`Line ${index + 1} is invalid. Each line must have a word, a reading, and at least one meaning.`);
            }
            const [word, reading, ...meanings] = parts.map(p => p.trim());
            if (!word || !reading || meanings.length === 0 || meanings.some(m => !m)) {
                throw new Error(`Line ${index + 1} has missing parts. Format: word,reading,meaning1,meaning2,...`);
            }
            return { id: `${word}-${index}`, word, reading, meanings };
          });
        
        if (parsedData.length === 0) {
            throw new Error("The file is empty or does not contain valid data.");
        }

        setVocabulary(parsedData);
        setError('');
      } catch (err: any) {
        setError(err.message);
        setVocabulary([]);
        setFileName('');
      }
    };
    reader.readAsText(file);
  };
  
  const handleButtonClick = () => {
      fileInputRef.current?.click();
  }

  const canStartGame = vocabulary.length > 0;

  return (
    <div className="home-container">
      <div>
        <h2 className="home-title">学習を始めましょう</h2>
        <p className="home-subtitle">単語帳ファイルをアップロードして、学習モードを選択してください。</p>
      </div>

      <div className="upload-section">
        <input
          type="file"
          accept=".txt,.csv"
          onChange={handleFileChange}
          className="hidden-input"
          ref={fileInputRef}
        />
        <button
          onClick={handleButtonClick}
          className="button button-primary"
        >
          単語帳をアップロード
        </button>
        {fileName && <p className="file-name-display">ファイル: <span className="file-name">{fileName}</span></p>}
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
