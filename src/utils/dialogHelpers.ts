/**
 * Dialog 설정을 위한 헬퍼 함수들
 */

export interface DialogConfig {
  isOpen: boolean;
  title: string;
  message: string;
  onConfirm: () => void;
}

/**
 * Dialog 생성 헬퍼
 */
export const createDialog = (
  title: string,
  message: string,
  onConfirm: () => void
): DialogConfig => ({
  isOpen: true,
  title,
  message,
  onConfirm,
});

/**
 * 에러 Dialog 생성
 * @param title 다이얼로그 제목 (번역된 텍스트 사용)
 * @param message 에러 메시지 (번역된 텍스트 사용)
 * @param onClose 닫기 콜백
 */
export const createErrorDialog = (
  title: string,
  message: string,
  onClose: () => void
): DialogConfig => createDialog(title, message, onClose);

/**
 * 경고 Dialog 생성
 * @param title 다이얼로그 제목 (번역된 텍스트 사용)
 * @param message 경고 메시지 (번역된 텍스트 사용)
 * @param onClose 닫기 콜백
 */
export const createWarningDialog = (
  title: string,
  message: string,
  onClose: () => void
): DialogConfig => createDialog(title, message, onClose);

/**
 * 빈 Dialog (닫힌 상태)
 */
export const emptyDialog = (): DialogConfig => ({
  isOpen: false,
  title: "",
  message: "",
  onConfirm: () => {},
});
