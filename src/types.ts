export interface VocabularyItem {
  word: string;
  reading: string;
  meanings: string[];
}

export interface WrongAnswerItem extends VocabularyItem {
  missCount: number;
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
}
