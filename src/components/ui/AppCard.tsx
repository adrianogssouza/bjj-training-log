import type { ElementType, HTMLAttributes, ReactNode } from "react";

export type AppCardVariant = "primary" | "secondary";

export interface AppCardProps extends HTMLAttributes<HTMLElement> {
  children: ReactNode;
  variant?: AppCardVariant;
  className?: string;
  as?: ElementType;
}

export function AppCard({
  children,
  variant = "primary",
  className = "",
  as: Component = "section",
  ...props
}: AppCardProps) {
  const radiusClass = variant === "primary" ? "rounded-[16px]" : "rounded-[12px]";

  return (
    <Component
      className={`border border-[var(--border)] bg-[var(--surface)] p-4 text-[var(--foreground)] ${radiusClass} ${className}`}
      {...props}
    >
      {children}
    </Component>
  );
}
