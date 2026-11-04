import type { ReactNode } from "react";
import { AppButton } from "./AppButton";
import { AppIcon, type IconName } from "./AppIcon";

export interface AppEmptyStateProps {
  icon?: IconName;
  title?: string;
  message: string;
  actionLabel?: string;
  actionHref?: string;
  onAction?: () => void;
  actionVariant?: "primary" | "secondary";
  children?: ReactNode;
  className?: string;
}

export function AppEmptyState({
  icon,
  title,
  message,
  actionLabel,
  actionHref,
  onAction,
  actionVariant = "secondary",
  children,
  className = "",
}: AppEmptyStateProps) {
  return (
    <div
      className={`flex flex-col items-center justify-center rounded-[16px] border border-[#3F3F46] bg-[#18181B] p-8 text-center text-[#F4F4F5] ${className}`}
    >
      {icon && (
        <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-[#27272A] text-[#A1A1AA]">
          <AppIcon name={icon} size={24} />
        </div>
      )}
      {title && (
        <h3 className="mb-1 text-[18px] font-bold leading-[25px] text-[#F4F4F5]">
          {title}
        </h3>
      )}
      <p className="max-w-md text-[14px] font-normal leading-[21px] text-[#A1A1AA]">
        {message}
      </p>

      {actionLabel && (actionHref || onAction) && (
        <div className="mt-5">
          {actionHref ? (
            <AppButton href={actionHref} variant={actionVariant}>
              {actionLabel}
            </AppButton>
          ) : (
            <AppButton onClick={onAction} variant={actionVariant}>
              {actionLabel}
            </AppButton>
          )}
        </div>
      )}

      {children && <div className="mt-4">{children}</div>}
    </div>
  );
}
