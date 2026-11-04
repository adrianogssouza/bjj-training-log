import type { HTMLAttributes } from "react";

export interface AppLoadingStateProps extends HTMLAttributes<HTMLDivElement> {
  rows?: number;
  message?: string;
  variant?: "card" | "list" | "stats";
}

export function AppLoadingState({
  rows = 3,
  message = "Carregando...",
  variant = "card",
  className = "",
  ...props
}: AppLoadingStateProps) {
  return (
    <div
      role="status"
      aria-label={message}
      className={`space-y-3 ${className}`}
      {...props}
    >
      <span className="sr-only">{message}</span>

      {variant === "stats" ? (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {Array.from({ length: 4 }).map((_, idx) => (
            <div
              key={idx}
              className="h-20 animate-pulse rounded-[12px] border border-[#3F3F46] bg-[#18181B] p-4"
            >
              <div className="h-3 w-16 rounded bg-[#27272A]" />
              <div className="mt-3 h-6 w-12 rounded bg-[#27272A]" />
            </div>
          ))}
        </div>
      ) : variant === "card" ? (
        Array.from({ length: rows }).map((_, idx) => (
          <div
            key={idx}
            className="animate-pulse rounded-[16px] border border-[#3F3F46] bg-[#18181B] p-5 space-y-3"
          >
            <div className="h-5 w-1/3 rounded bg-[#27272A]" />
            <div className="h-4 w-2/3 rounded bg-[#27272A]" />
            <div className="h-10 w-full rounded-[10px] bg-[#27272A]" />
          </div>
        ))
      ) : (
        Array.from({ length: rows }).map((_, idx) => (
          <div
            key={idx}
            className="flex items-center justify-between rounded-[12px] border border-[#3F3F46] bg-[#18181B] p-4"
          >
            <div className="space-y-2">
              <div className="h-4 w-32 rounded bg-[#27272A]" />
              <div className="h-3 w-20 rounded bg-[#27272A]" />
            </div>
            <div className="h-8 w-20 rounded-[10px] bg-[#27272A]" />
          </div>
        ))
      )}
    </div>
  );
}
