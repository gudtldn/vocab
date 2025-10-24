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
 */
export const createErrorDialog = (
  message: string,
  onClose: () => void
): DialogConfig => createDialog("エラー", message, onClose);

/**
 * 경고 Dialog 생성
 */
export const createWarningDialog = (
  message: string,
  onClose: () => void
): DialogConfig => createDialog("警告", message, onClose);

/**
 * 빈 Dialog (닫힌 상태)
 */
export const emptyDialog = (): DialogConfig => ({
  isOpen: false,
  title: "",
  message: "",
  onConfirm: () => {},
});
