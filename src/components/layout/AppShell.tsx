"use client";

import type { ReactNode } from "react";
import { AppHeader } from "./AppHeader";
import { PrimaryNavigation } from "./PrimaryNavigation";
import { CloudWorkspace } from "@/components/auth/CloudWorkspace";
import { useAccount } from "@/components/auth/AccountContext";

/** Aviso da conta (ex.: modo local), logo abaixo do cabeçalho fixo. */
function ShellNotice() {
  const { notice } = useAccount();
  if (!notice) return null;
  return (
    <div className="mx-auto w-full max-w-[960px] px-4 pt-4 sm:px-6">
      <div className="rounded-[10px] border border-[var(--warning)]/40 bg-[var(--warning)]/10 p-3 text-[13px] text-[var(--warning)]" role="status">
        {notice}
      </div>
    </div>
  );
}

export interface AppShellProps {
  children: ReactNode;
}

export function AppShell({ children }: AppShellProps) {
  return (
    <CloudWorkspace>
      <div className="flex min-h-screen flex-col bg-[var(--background)] text-[var(--foreground)]">
        <a href="#main-content" className="skip-link">
          Pular para o conteúdo
        </a>

        <AppHeader />
        {/* O cabeçalho é fixo (fica sempre visível ao rolar); este espaço evita
            que ele cubra o conteúdo, incluindo a área do relógio/notch no iPhone. */}
        <div aria-hidden="true" className="h-[calc(60px+env(safe-area-inset-top))] shrink-0 md:h-[calc(64px+env(safe-area-inset-top))]" />
        <ShellNotice />

        <main
          id="main-content"
          className="mx-auto flex w-full max-w-[960px] flex-1 flex-col px-4 sm:px-6 py-6 pb-[calc(5.5rem+env(safe-area-inset-bottom))] md:pb-8"
        >
          {children}
        </main>

        <PrimaryNavigation />
      </div>
    </CloudWorkspace>
  );
}
