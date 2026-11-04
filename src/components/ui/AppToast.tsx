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

  let borderBg = "border-[#3F3F46] bg-[#18181B] text-[#F4F4F5]";
  let iconName: "check" | "alert" | "info" = "info";
  let iconColor = "text-[#A1A1AA]";

  if (type === "success") {
    borderBg = "border-[#047857] bg-[#18181B] text-[#6EE7B7]";
    iconName = "check";
    iconColor = "text-[#6EE7B7]";
  } else if (type === "error") {
    borderBg = "border-[#B91C1C] bg-[#18181B] text-red-200";
    iconName = "alert";
    iconColor = "text-[#FCA5A5]";
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
          className="rounded p-1 text-[#A1A1AA] hover:text-[#F4F4F5] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#93C5FD]"
        >
          <AppIcon name="close" size={16} />
        </button>
      )}
    </div>
  );
}
