// 画面下に数秒だけ出るお知らせ（「元に戻す」ボタン付きにもできる）
import { useEffect } from 'react';

export interface ToastData {
  id: number;
  message: string;
  actionLabel?: string;
  onAction?: () => void;
}

interface Props {
  toast: ToastData | null;
  onClose: () => void;
  /** 下にボタンがある画面では、ボタンに重ならないよう上にずらす */
  offset: 'none' | 'nav' | 'add';
}

export function Toast({ toast, onClose, offset }: Props) {
  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(onClose, toast.onAction ? 5000 : 2500);
    return () => clearTimeout(timer);
  }, [toast, onClose]);

  return (
    <div className={`toast-area toast-area--${offset}`} role="status" aria-live="polite">
      {toast ? (
        <div className="toast" key={toast.id}>
          <span className="toast-message">{toast.message}</span>
          {toast.onAction && toast.actionLabel ? (
            <button
              type="button"
              className="toast-action"
              onClick={() => {
                toast.onAction?.();
                onClose();
              }}
            >
              {toast.actionLabel}
            </button>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
