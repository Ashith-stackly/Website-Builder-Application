"use client";

import { useEffect, useRef, useState, useCallback } from "react";

interface BlogToastProps {
  message: string | null;
  type?: "success" | "error";
  duration?: number;
  onDismiss: () => void;
}

/**
 * Auto-dismissing toast notification.
 * Follows the same toast pattern used in portfolio and e-commerce pages.
 */
export default function BlogToast({
  message,
  type = "success",
  duration = 3500,
  onDismiss,
}: BlogToastProps) {
  const [visible, setVisible] = useState(false);
  const timerRef = useRef<number | null>(null);

  const clearTimer = useCallback(() => {
    if (timerRef.current) {
      window.clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  useEffect(() => {
    if (!message) {
      setVisible(false);
      return;
    }

    setVisible(true);
    clearTimer();

    timerRef.current = window.setTimeout(() => {
      setVisible(false);
      timerRef.current = null;
      // Allow exit animation before calling onDismiss
      window.setTimeout(onDismiss, 300);
    }, duration);

    return clearTimer;
  }, [message, duration, onDismiss, clearTimer]);

  if (!message) return null;

  const isSuccess = type === "success";

  return (
    <div
      role="status"
      aria-live="polite"
      className={`fixed bottom-6 left-1/2 z-[200] -translate-x-1/2 transition-all duration-300 ease-out ${
        visible
          ? "translate-y-0 opacity-100"
          : "translate-y-4 opacity-0 pointer-events-none"
      }`}
    >
      <div
        className={`flex items-center gap-3 rounded-xl px-5 py-3 shadow-lg backdrop-blur-sm text-sm font-semibold ${
          isSuccess
            ? "bg-emerald-50 border border-emerald-200 text-emerald-800"
            : "bg-red-50 border border-red-200 text-red-800"
        }`}
      >
        <span className="text-base" aria-hidden>
          {isSuccess ? "✓" : "✕"}
        </span>
        <span>{message}</span>
        <button
          type="button"
          onClick={() => {
            clearTimer();
            setVisible(false);
            window.setTimeout(onDismiss, 300);
          }}
          className="ml-2 text-current opacity-60 hover:opacity-100 transition-opacity bg-transparent border-none cursor-pointer text-base leading-none p-0"
          aria-label="Dismiss notification"
        >
          ×
        </button>
      </div>
    </div>
  );
}
