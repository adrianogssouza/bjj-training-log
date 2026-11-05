"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { AppIcon } from "@/components/ui/AppIcon";
import { useAccount } from "@/components/auth/AccountContext";
import { ThemePicker } from "./ThemePicker";

const DESKTOP_LINKS = [
  { name: "Hoje", href: "/" },
  { name: "Treinos", href: "/workouts" },
  { name: "Bike", href: "/bike" },
  { name: "Histórico", href: "/history" },
];

export function AppHeader({ currentPath }: { currentPath?: string } = {}) {
  const routerPath = usePathname();
  const pathname = currentPath || routerPath || "/";
  const { openAccountModal, syncStatus } = useAccount();

  return (
    <header className="fixed inset-x-0 top-0 z-30 w-full border-b border-[var(--border)] bg-[var(--background-glass)] px-4 pt-[env(safe-area-inset-top)] backdrop-blur sm:px-6">
      <div className="mx-auto flex h-[60px] w-full max-w-[960px] items-center justify-between md:h-[64px]">
        {/* Brand */}
        <Link
          href="/"
          className="flex items-center gap-2 text-[18px] font-extrabold tracking-wider text-[var(--foreground)] hover:opacity-90 transition-opacity focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus)] rounded-[8px] px-1"
        >
          <span aria-hidden="true" className="h-5 w-1.5 rounded-full bg-[var(--primary)]" />
          <span style={{ fontFamily: "var(--font-heading)" }}>MEU TREINO</span>
        </Link>

        {/* Desktop Navigation */}
        <nav
          aria-label="Navegação desktop"
          className="hidden md:flex items-center gap-1"
        >
          {DESKTOP_LINKS.map((link) => {
            const isActive =
              link.href === "/"
                ? pathname === "/"
                : pathname.startsWith(link.href);
            return (
              <Link
                key={link.href}
                href={link.href}
                aria-current={isActive ? "page" : undefined}
                className={`min-h-[44px] px-3.5 py-2 text-[14px] font-medium rounded-[10px] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus)] ${
                  isActive
                    ? "bg-[var(--primary-soft)] text-[var(--foreground)]"
                    : "text-[var(--muted)] hover:text-[var(--foreground)] hover:bg-[var(--surface)]"
                }`}
              >
                {link.name}
              </Link>
            );
          })}
        </nav>

        {/* Aparência + Conta */}
        <div className="flex items-center gap-2">
          <ThemePicker />
          <button
            type="button"
            onClick={openAccountModal}
            aria-label="Minha conta"
            title={`Minha conta (${syncStatus})`}
            className="flex min-h-[44px] min-w-[44px] items-center justify-center gap-2 rounded-[10px] border border-[var(--border)] bg-[var(--surface)] px-3 text-[var(--foreground)] transition-colors hover:bg-[var(--surface-elevated)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus)]"
          >
            <AppIcon name="user" size={20} />
            <span className="hidden sm:inline text-[13px] font-medium">Conta</span>
          </button>
        </div>
      </div>
    </header>
  );
}
