"use client";

import type { ReactNode } from "react";
import { AppHeader } from "./AppHeader";
import { PrimaryNavigation } from "./PrimaryNavigation";
import { CloudWorkspace } from "@/components/auth/CloudWorkspace";

export interface AppShellProps {
  children: ReactNode;
}

export function AppShell({ children }: AppShellProps) {
  return (
    <CloudWorkspace>
      <div className="flex min-h-screen flex-col bg-[#09090B] text-[#F4F4F5]">
        <a href="#main-content" className="skip-link">
          Pular para o conteúdo
        </a>

        <AppHeader />

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
