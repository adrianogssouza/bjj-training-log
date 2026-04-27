import Link from "next/link";
import type { ReactNode } from "react";

type AppButtonProps = {
  href: string;
  children: ReactNode;
  variant?: "primary" | "secondary";
};

export function AppButton({
  href,
  children,
  variant = "primary",
}: AppButtonProps) {
  const variantClasses =
    variant === "primary"
      ? "border-red-400 bg-red-500 text-white shadow-lg shadow-red-950/40 hover:bg-red-400"
      : "border-zinc-700 bg-zinc-900 text-zinc-100 hover:border-zinc-500 hover:bg-zinc-800";

  return (
    <Link
      href={href}
      className={`flex min-h-14 w-full items-center justify-center rounded-lg border px-5 text-center text-base font-bold transition-colors ${variantClasses}`}
    >
      {children}
    </Link>
  );
}
