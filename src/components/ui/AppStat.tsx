import type { ReactNode } from "react";

export interface AppStatProps {
  label: string;
  value: ReactNode;
  subtext?: ReactNode;
  icon?: ReactNode;
  className?: string;
  color?: "default" | "primary" | "success" | "warning";
}

export function AppStat({
  label,
  value,
  subtext,
  icon,
  className = "",
  color = "default",
}: AppStatProps) {
  let valueColor = "text-[var(--foreground)]";
  if (color === "primary") valueColor = "text-[var(--primary-text)]";
  if (color === "success") valueColor = "text-[var(--success-text)]";
  if (color === "warning") valueColor = "text-[var(--warning)]";

  return (
    <div className={`flex flex-col gap-1 ${className}`}>
      <div className="flex items-center gap-1.5 text-[13px] font-medium leading-[18px] text-[var(--muted)]">
        {icon}
        <span>{label}</span>
      </div>
      <div className={`text-[24px] font-extrabold leading-[30px] tracking-tight ${valueColor}`}>
        {value}
      </div>
      {subtext && (
        <div className="text-[13px] font-normal leading-[18px] text-[var(--muted)]">
          {subtext}
        </div>
      )}
    </div>
  );
}
