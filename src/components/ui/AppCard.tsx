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
      className={`border border-[#3F3F46] bg-[#18181B] p-4 text-[#F4F4F5] ${radiusClass} ${className}`}
      {...props}
    >
      {children}
    </Component>
  );
}
