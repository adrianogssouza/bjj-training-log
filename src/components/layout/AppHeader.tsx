"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { AppIcon } from "@/components/ui/AppIcon";
import { useAccount } from "@/components/auth/AccountContext";

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
    <header className="sticky top-0 z-30 flex h-[60px] md:h-[64px] w-full items-center justify-between border-b border-[#3F3F46] bg-[#09090B] px-4 sm:px-6">
      <div className="mx-auto flex w-full max-w-[960px] items-center justify-between">
        {/* Brand */}
        <Link
          href="/"
          className="flex items-center gap-2 text-[18px] font-extrabold tracking-wider text-[#F4F4F5] hover:text-white transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#93C5FD] rounded-[8px] px-1"
        >
          MEU TREINO
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
                className={`min-h-[44px] px-3.5 py-2 text-[14px] font-medium rounded-[10px] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#93C5FD] ${
                  isActive
                    ? "bg-[#450A0A] text-[#F4F4F5]"
                    : "text-[#A1A1AA] hover:text-[#F4F4F5] hover:bg-[#18181B]"
                }`}
              >
                {link.name}
              </Link>
            );
          })}
        </nav>

        {/* Account Button */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={openAccountModal}
            aria-label="Minha conta"
            title={`Minha conta (${syncStatus})`}
            className="flex min-h-[44px] min-w-[44px] items-center justify-center gap-2 rounded-[10px] border border-[#3F3F46] bg-[#18181B] px-3 text-[#F4F4F5] transition-colors hover:bg-[#27272A] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#93C5FD]"
          >
            <AppIcon name="user" size={20} />
            <span className="hidden sm:inline text-[13px] font-medium">Conta</span>
          </button>
        </div>
      </div>
    </header>
  );
}
