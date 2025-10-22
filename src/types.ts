export interface VocabularyItem {
  id: string;
  word: string;
  reading: string;
  meanings: string[];
}

export interface WrongAnswerItem extends VocabularyItem {
  missCount: number;
}

export enum GameMode {
  MultipleChoice = 'multiple-choice',
  DirectInput = 'direct-input',
}

export enum AppView {
  Home = 'home',
  Game = 'game',
  WrongAnswers = 'wrong-answers',
}
