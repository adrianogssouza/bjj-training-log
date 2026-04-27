import Link from "next/link";
import type { ReactNode } from "react";

type AppShellProps = {
  children: ReactNode;
};

export function AppShell({ children }: AppShellProps) {
  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-50">
      <div className="mx-auto flex min-h-screen w-full max-w-3xl flex-col px-4 py-5 sm:px-6">
        <header className="flex items-center justify-between border-b border-zinc-800 pb-4">
          <Link href="/" className="text-sm font-bold uppercase tracking-wide">
            BJJ Training Log
          </Link>
          <nav className="flex items-center gap-4 text-sm font-medium text-zinc-300">
            <Link href="/workouts" className="hover:text-white">
              Treinos
            </Link>
            <Link href="/history" className="hover:text-white">
              Histórico
            </Link>
          </nav>
        </header>
        {children}
      </div>
    </div>
  );
}
