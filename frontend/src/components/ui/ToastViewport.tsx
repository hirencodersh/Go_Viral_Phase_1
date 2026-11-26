import { useEffect, useRef, useState } from "react";
import { SUCCESS_TOAST_EVENT } from "../../services/successToast";

interface Toast {
  id: number;
  message: string;
}

const TOAST_DURATION_MS = 4000;
const MAX_VISIBLE_TOASTS = 4;

export function ToastViewport() {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const nextId = useRef(0);
  const timers = useRef(new Map<number, number>());

  useEffect(() => {
    const activeTimers = timers.current;
    const handleSuccessToast = (event: Event) => {
      if (!(event instanceof CustomEvent) || typeof event.detail !== "string") {
        return;
      }

      const message = event.detail.trim();
      if (!message) {
        return;
      }

      const id = nextId.current + 1;
      nextId.current = id;
      setToasts((current) =>
        [...current, { id, message }].slice(-MAX_VISIBLE_TOASTS)
      );

      const timer = window.setTimeout(() => {
        setToasts((current) => current.filter((toast) => toast.id !== id));
        activeTimers.delete(id);
      }, TOAST_DURATION_MS);
      activeTimers.set(id, timer);
    };

    window.addEventListener(SUCCESS_TOAST_EVENT, handleSuccessToast);
    return () => {
      window.removeEventListener(SUCCESS_TOAST_EVENT, handleSuccessToast);
      activeTimers.forEach((timer) => window.clearTimeout(timer));
      activeTimers.clear();
    };
  }, []);

  const dismissToast = (id: number) => {
    const timer = timers.current.get(id);
    if (timer !== undefined) {
      window.clearTimeout(timer);
      timers.current.delete(id);
    }
    setToasts((current) => current.filter((toast) => toast.id !== id));
  };

  return (
    <div className="toast-viewport" aria-live="polite" aria-relevant="additions">
      {toasts.map((toast) => (
        <div className="app-toast" key={toast.id} role="status">
          <span>{toast.message}</span>
          <button
            className="toast-dismiss"
            type="button"
            aria-label="Dismiss notification"
            onClick={() => dismissToast(toast.id)}
          >
            ×
          </button>
        </div>
      ))}
    </div>
  );
}
