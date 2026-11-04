import Link from "next/link";
import type { ReactNode } from "react";
import { CloudWorkspace } from "@/components/auth/CloudWorkspace";

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
          <nav className="flex flex-wrap items-center justify-end gap-2 text-xs font-medium text-zinc-300 sm:gap-4 sm:text-sm">
            <Link href="/bike" className="hover:text-white">
              Bike
            </Link>
            <Link href="/workouts" className="hover:text-white">
              Treinos
            </Link>
            <Link href="/history" className="hover:text-white">
              Histórico
            </Link>
          </nav>
        </header>
        <CloudWorkspace>{children}</CloudWorkspace>
      </div>
    </div>
  );
}
