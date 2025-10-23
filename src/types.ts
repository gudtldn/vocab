export interface VocabularyItem {
  word: string;
  reading: string;
  meanings: string[];
  note?: string; // 개인 메모
}

export interface WrongAnswerItem extends VocabularyItem {
  missCount: number;
  correctStreak: number; // 연속 정답 횟수
}

export interface VocabularyBook {
  id: string;
  name: string;
  filePath: string;
  lastUsed: number;
  wordCount: number;
  tags: string[];
}

export enum GameMode {
  MultipleChoice = "multiple-choice",
  DirectInput = "direct-input",
}

export enum AppView {
  Home = "home",
  Game = "game",
  WrongAnswers = "wrong-answers",
  Statistics = "statistics",
  VocabEditor = "vocab-editor",
}
