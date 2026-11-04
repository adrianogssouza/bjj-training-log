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
      variantClasses = "bg-[#27272A] border border-[#3F3F46] text-[#A1A1AA]";
      break;
    case "primary":
      variantClasses = "bg-[#450A0A] border border-[#B91C1C] text-[#FCA5A5]";
      break;
    case "success":
      variantClasses = "bg-[#047857]/20 border border-[#047857] text-[#6EE7B7]";
      break;
    case "warning":
      variantClasses = "bg-[#FBBF24]/10 border border-[#FBBF24]/40 text-[#FBBF24]";
      break;
    case "danger":
      variantClasses = "bg-[#450A0A] border border-[#B91C1C] text-red-200";
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
