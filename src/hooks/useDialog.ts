import { useState, useCallback } from "react";

export interface DialogState {
  isOpen: boolean;
  title: string;
  message: string;
  onConfirm: () => void;
  danger?: boolean;
}

const initialDialogState: DialogState = {
  isOpen: false,
  title: "",
  message: "",
  onConfirm: () => {},
  danger: false,
};

/**
 * 다이얼로그 상태를 관리하는 커스텀 훅
 */
export function useDialog() {
  const [dialog, setDialog] = useState<DialogState>(initialDialogState);

  const showDialog = useCallback(
    (
      title: string,
      message: string,
      onConfirm: () => void,
      danger: boolean = false
    ) => {
      setDialog({
        isOpen: true,
        title,
        message,
        onConfirm,
        danger,
      });
    },
    []
  );

  const hideDialog = useCallback(() => {
    setDialog(initialDialogState);
  }, []);

  return {
    dialog,
    showDialog,
    hideDialog,
  };
}
