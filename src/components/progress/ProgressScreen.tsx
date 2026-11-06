"use client";

import { useRef, useState, type KeyboardEvent } from "react";
import { WorkoutHistory } from "@/components/history/WorkoutHistory";
import { LoadProgressTab } from "./LoadProgressTab";
import type { ProgressTab } from "@/lib/progress-tab";

const TABS: { id: ProgressTab; label: string }[] = [
  { id: "cargas", label: "Cargas" },
  { id: "historico", label: "Histórico" },
];

export function ProgressScreen({ initialTab = "cargas" }: { initialTab?: ProgressTab }) {
  const [tab, setTab] = useState<ProgressTab>(initialTab);
  const tabRefs = useRef<Record<ProgressTab, HTMLButtonElement | null>>({ cargas: null, historico: null });

  function selectTab(next: ProgressTab, focus = false) {
    setTab(next);
    if (focus) tabRefs.current[next]?.focus();
    // Mantém a aba no endereço (voltar, recarregar e compartilhar caem nela).
    try {
      const url = next === "historico" ? "/progresso?aba=historico" : "/progresso";
      window.history.replaceState(window.history.state, "", url);
    } catch {
      // Sem history API (ex.: testes) a troca de aba continua funcionando.
    }
  }

  function handleKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if (event.key !== "ArrowRight" && event.key !== "ArrowLeft") return;
    event.preventDefault();
    const index = TABS.findIndex((t) => t.id === tab);
    const delta = event.key === "ArrowRight" ? 1 : -1;
    selectTab(TABS[(index + delta + TABS.length) % TABS.length].id, true);
  }

  return (
    <div className="flex flex-1 flex-col gap-4">
      <h1 className="text-[28px] font-extrabold leading-[34px] text-[var(--foreground)]">Progresso</h1>

      <div
        role="tablist"
        aria-label="Seções do progresso"
        onKeyDown={handleKeyDown}
        className="grid grid-cols-2 gap-1 rounded-[12px] border border-[var(--border)] bg-[var(--surface)] p-1"
      >
        {TABS.map((item) => {
          const active = item.id === tab;
          return (
            <button
              key={item.id}
              ref={(el) => {
                tabRefs.current[item.id] = el;
              }}
              type="button"
              role="tab"
              id={`progress-tab-${item.id}`}
              aria-selected={active}
              aria-controls={`progress-panel-${item.id}`}
              tabIndex={active ? 0 : -1}
              onClick={() => selectTab(item.id)}
              className={`min-h-[40px] rounded-[9px] text-[15px] font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus)] ${
                active
                  ? "bg-[var(--surface-elevated)] text-[var(--foreground)] shadow-[inset_0_-2px_0_var(--primary)]"
                  : "text-[var(--muted)] hover:text-[var(--foreground)]"
              }`}
            >
              {item.label}
            </button>
          );
        })}
      </div>

      <div
        role="tabpanel"
        id={`progress-panel-${tab}`}
        aria-labelledby={`progress-tab-${tab}`}
        className="flex flex-1 flex-col"
      >
        {tab === "cargas" ? <LoadProgressTab /> : <WorkoutHistory embedded />}
      </div>
    </div>
  );
}
