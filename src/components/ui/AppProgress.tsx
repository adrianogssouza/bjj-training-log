import type { HTMLAttributes } from "react";

export interface AppProgressProps extends HTMLAttributes<HTMLDivElement> {
  value: number; // 0 to 100
  color?: "primary" | "success";
  size?: "sm" | "md" | "lg";
  label?: string;
}

export function AppProgress({
  value,
  color = "primary",
  size = "md",
  label = "Progresso",
  className = "",
  ...props
}: AppProgressProps) {
  const clampedValue = Math.min(100, Math.max(0, Math.round(value)));

  let heightClass = "h-2"; // 8px default
  if (size === "sm") heightClass = "h-1.5"; // 6px
  if (size === "lg") heightClass = "h-3"; // 12px

  const fillBg = color === "primary" ? "bg-[#DC2626]" : "bg-[#047857]";

  return (
    <div
      role="progressbar"
      aria-label={label}
      aria-valuenow={clampedValue}
      aria-valuemin={0}
      aria-valuemax={100}
      className={`w-full overflow-hidden rounded-full bg-[#27272A] ${heightClass} ${className}`}
      {...props}
    >
      <div
        className={`h-full rounded-full transition-all duration-300 ease-out ${fillBg}`}
        style={{ width: `${clampedValue}%` }}
      />
    </div>
  );
}
