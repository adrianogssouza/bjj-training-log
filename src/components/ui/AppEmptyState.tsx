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
      className={`flex flex-col items-center justify-center rounded-[16px] border border-[var(--border)] bg-[var(--surface)] p-8 text-center text-[var(--foreground)] ${className}`}
    >
      {icon && (
        <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-[var(--surface-elevated)] text-[var(--muted)]">
          <AppIcon name={icon} size={24} />
        </div>
      )}
      {title && (
        <h3 className="mb-1 text-[18px] font-bold leading-[25px] text-[var(--foreground)]">
          {title}
        </h3>
      )}
      <p className="max-w-md text-[14px] font-normal leading-[21px] text-[var(--muted)]">
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
