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
        "bg-[#DC2626] text-white font-bold hover:bg-[#B91C1C] active:bg-[#991B1B] min-h-[48px]";
      break;
    case "secondary":
      variantClasses =
        "bg-[#27272A] border border-[#3F3F46] text-[#F4F4F5] font-medium hover:bg-[#3F3F46] active:bg-[#52525B] min-h-[44px]";
      break;
    case "ghost":
      variantClasses =
        "bg-transparent text-[#A1A1AA] hover:text-[#F4F4F5] hover:bg-[#27272A]/50 font-medium min-h-[44px]";
      break;
    case "danger":
      variantClasses =
        "bg-[#B91C1C] text-white font-bold hover:bg-[#991B1B] active:bg-[#7F1D1D] min-h-[48px]";
      break;
  }

  const baseClasses = [
    "inline-flex items-center justify-center gap-2 rounded-[12px] px-4 py-2.5 text-center text-base transition-colors",
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#93C5FD] focus-visible:ring-offset-2 focus-visible:ring-offset-[#09090B]",
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
