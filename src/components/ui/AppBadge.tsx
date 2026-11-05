import type { HTMLAttributes, ReactNode } from "react";

export type AppBadgeVariant = "neutral" | "primary" | "success" | "warning" | "danger";

export interface AppBadgeProps extends HTMLAttributes<HTMLSpanElement> {
  children: ReactNode;
  variant?: AppBadgeVariant;
  className?: string;
}

export function AppBadge({
  children,
  variant = "neutral",
  className = "",
  ...props
}: AppBadgeProps) {
  let variantClasses = "";
  switch (variant) {
    case "neutral":
      variantClasses = "bg-[var(--surface-elevated)] border border-[var(--border)] text-[var(--muted)]";
      break;
    case "primary":
      variantClasses = "bg-[var(--primary-soft)] border border-[var(--primary-hover)] text-[var(--primary-text)]";
      break;
    case "success":
      variantClasses = "bg-[var(--success)]/20 border border-[var(--success)] text-[var(--success-text)]";
      break;
    case "warning":
      variantClasses = "bg-[var(--warning)]/10 border border-[var(--warning)]/40 text-[var(--warning)]";
      break;
    case "danger":
      variantClasses = "bg-[var(--danger-soft)] border border-[var(--danger)] text-[var(--danger-text)]";
      break;
  }

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[13px] font-medium leading-[18px] ${variantClasses} ${className}`}
      {...props}
    >
      {children}
    </span>
  );
}
