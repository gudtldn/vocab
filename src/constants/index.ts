/**
 * 애플리케이션 전역 상수
 */

// 키보드 단축키
export const KEYBOARD_SHORTCUTS = {
  HOME: "h",
  WRONG_ANSWERS: "w",
  STATISTICS: "s",
  DARK_MODE: "d",
  HELP: "?",
  ESCAPE: "Escape",
  ENTER: "Enter",
} as const;

// 로컬 스토리지 키
export const STORAGE_KEYS = {
  WRONG_ANSWERS: "wrongAnswers",
  STATISTICS: "statistics",
  VOCABULARY_BOOKS: "vocabularyBooks",
  SETTINGS: "settings",
} as const;

// 오답 학습 관련 상수
export const MASTERY_CONFIG = {
  CORRECT_STREAK_REQUIRED: 3, // 마스터하기 위해 필요한 연속 정답 수
} as const;

// 애니메이션 시간 (ms)
export const ANIMATION_DURATION = {
  FEEDBACK: 1000,
  TRANSITION: 300,
} as const;

// UI 텍스트
export const UI_TEXT = {
  JA: {
    APP_TITLE: "日本語クイズ",
    LOADING: "読み込み中...",
    HOME: "ホーム",
    WRONG_ANSWERS: "誤答ノート",
    STATISTICS: "統計",
    VOCABULARY_COUNT: (count: number) => `📚 ${count}個の単語`,
    SELECTED_BOOKS: (count: number) => 
      count === 1 ? "ファイル" : `ファイル: ${count}個の単語帳`,
  },
  KO: {
    FILE_LOAD_ERROR: "단어장 불러오기 실패",
    SAVE_ERROR: "저장 실패",
  },
} as const;
