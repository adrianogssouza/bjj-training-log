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
  let valueColor = "text-[#F4F4F5]";
  if (color === "primary") valueColor = "text-[#FCA5A5]";
  if (color === "success") valueColor = "text-[#6EE7B7]";
  if (color === "warning") valueColor = "text-[#FBBF24]";

  return (
    <div className={`flex flex-col gap-1 ${className}`}>
      <div className="flex items-center gap-1.5 text-[13px] font-medium leading-[18px] text-[#A1A1AA]">
        {icon}
        <span>{label}</span>
      </div>
      <div className={`text-[24px] font-extrabold leading-[30px] tracking-tight ${valueColor}`}>
        {value}
      </div>
      {subtext && (
        <div className="text-[13px] font-normal leading-[18px] text-[#A1A1AA]">
          {subtext}
        </div>
      )}
    </div>
  );
}
