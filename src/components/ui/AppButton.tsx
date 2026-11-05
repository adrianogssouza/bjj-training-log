import Link from "next/link";
import type { ButtonHTMLAttributes, ReactNode } from "react";

export type AppButtonVariant = "primary" | "secondary" | "ghost" | "danger";

interface BaseButtonProps {
  children: ReactNode;
  variant?: AppButtonVariant;
  fullWidth?: boolean;
  loading?: boolean;
  className?: string;
}

type ButtonAsButton = BaseButtonProps &
  Omit<ButtonHTMLAttributes<HTMLButtonElement>, keyof BaseButtonProps> & {
    href?: undefined;
  };

type ButtonAsLink = BaseButtonProps & {
  href: string;
  onClick?: () => void;
  disabled?: boolean;
  target?: string;
  rel?: string;
  type?: undefined;
  id?: string;
  "aria-label"?: string;
};

export type AppButtonProps = ButtonAsButton | ButtonAsLink;

export function AppButton({
  children,
  variant = "primary",
  fullWidth = false,
  loading = false,
  className = "",
  disabled = false,
  ...rest
}: AppButtonProps) {
  const isDisabled = disabled || loading;

  let variantClasses = "";
  switch (variant) {
    case "primary":
      variantClasses =
        "bg-[var(--primary)] text-[var(--on-primary)] font-bold hover:bg-[var(--primary-hover)] active:bg-[var(--primary-active)] min-h-[48px]";
      break;
    case "secondary":
      variantClasses =
        "bg-[var(--surface-elevated)] border border-[var(--border)] text-[var(--foreground)] font-medium hover:bg-[var(--border)] active:bg-[var(--border-strong)] min-h-[44px]";
      break;
    case "ghost":
      variantClasses =
        "bg-transparent text-[var(--muted)] hover:text-[var(--foreground)] hover:bg-[var(--surface-elevated)]/50 font-medium min-h-[44px]";
      break;
    case "danger":
      variantClasses =
        "bg-[var(--danger)] text-white font-bold hover:bg-[var(--danger-hover)] active:bg-[var(--danger-active)] min-h-[48px]";
      break;
  }

  const baseClasses = [
    "inline-flex items-center justify-center gap-2 rounded-[12px] px-4 py-2.5 text-center text-base transition-colors",
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--background)]",
    fullWidth ? "w-full" : "",
    variantClasses,
    isDisabled ? "opacity-50 cursor-not-allowed pointer-events-none" : "",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  if ("href" in rest && rest.href) {
    if (isDisabled) {
      return (
        <span
          className={baseClasses}
          aria-disabled="true"
          role="link"
          id={rest.id}
          aria-label={rest["aria-label"]}
        >
          {loading ? "Carregando..." : children}
        </span>
      );
    }
    return (
      <Link
        href={rest.href}
        className={baseClasses}
        onClick={rest.onClick}
        target={rest.target}
        rel={rest.rel}
        id={rest.id}
        aria-label={rest["aria-label"]}
      >
        {loading ? "Carregando..." : children}
      </Link>
    );
  }

  const buttonProps = rest as ButtonHTMLAttributes<HTMLButtonElement>;

  return (
    <button
      {...buttonProps}
      type={buttonProps.type || "button"}
      disabled={isDisabled}
      aria-busy={loading ? "true" : undefined}
      className={baseClasses}
    >
      {loading ? "Carregando..." : children}
    </button>
  );
}
