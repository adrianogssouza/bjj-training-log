"use client";

import { useEffect } from "react";
import { AppIcon } from "./AppIcon";

export interface AppToastProps {
  message: string;
  type?: "success" | "error" | "info";
  duration?: number; // ms, default 4000 for success/info, null/0 for error (persists)
  onClose?: () => void;
  className?: string;
}

export function AppToast({
  message,
  type = "info",
  duration,
  onClose,
  className = "",
}: AppToastProps) {
  useEffect(() => {
    // Spec: Erros importantes não devem desaparecer automaticamente.
    // Duração informativa: 4 segundos.
    const autoDismiss = duration !== undefined ? duration : type === "error" ? 0 : 4000;
    if (autoDismiss > 0 && onClose) {
      const timer = setTimeout(onClose, autoDismiss);
      return () => clearTimeout(timer);
    }
  }, [type, duration, onClose]);

  let borderBg = "border-[var(--border)] bg-[var(--surface)] text-[var(--foreground)]";
  let iconName: "check" | "alert" | "info" = "info";
  let iconColor = "text-[var(--muted)]";

  if (type === "success") {
    borderBg = "border-[var(--success)] bg-[var(--surface)] text-[var(--success-text)]";
    iconName = "check";
    iconColor = "text-[var(--success-text)]";
  } else if (type === "error") {
    borderBg = "border-[var(--primary-hover)] bg-[var(--surface)] text-red-200";
    iconName = "alert";
    iconColor = "text-[var(--primary-text)]";
  }

  return (
    <div
      role={type === "error" ? "alert" : "status"}
      aria-live={type === "error" ? "assertive" : "polite"}
      className={`flex items-center justify-between gap-3 rounded-[12px] border p-3 shadow-lg ${borderBg} ${className}`}
    >
      <div className="flex items-center gap-2.5">
        <span className={iconColor}>
          <AppIcon name={iconName} size={20} />
        </span>
        <span className="text-[14px] font-medium leading-[21px]">{message}</span>
      </div>
      {onClose && (
        <button
          type="button"
          onClick={onClose}
          aria-label="Fechar notificação"
          className="rounded p-1 text-[var(--muted)] hover:text-[var(--foreground)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus)]"
        >
          <AppIcon name="close" size={16} />
        </button>
      )}
    </div>
  );
}
