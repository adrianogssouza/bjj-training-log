"use client";

import Link from "next/link";
import { useState } from "react";
import { AppButton } from "@/components/ui/AppButton";
import { AppIcon } from "@/components/ui/AppIcon";
import { AppToast } from "@/components/ui/AppToast";
import {
  addDaysIso,
  estimatedMinutes,
  getPlanOption,
  getWeek,
  isPlanItemDone,
  isTrainingKey,
  shortDate,
  toggleDayItem,
  withWeek,
} from "@/lib/weekly-plan";
import { PlanDayModal, WEEKDAY_NAMES } from "./PlanDayModal";
import { usePlanData } from "./usePlanData";

function weekTag(offset: number) {
  if (offset === 0) return "Semana atual";
  if (offset === 1) return "Próxima semana";
  if (offset === -1) return "Semana passada";
  return offset > 0 ? `Daqui a ${offset} semanas` : `Há ${-offset} semanas`;
}

/** Tela "Planejar semana": semana a semana, vários treinos por dia. */
export function WeekPlanner() {
  const data = usePlanData();
  const [offset, setOffset] = useState(0);
  const [editing, setEditing] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  const monday = addDaysIso(data.currentMonday, offset * 7);
  const week = getWeek(data.plans, monday);
  const previousWeek = data.plans.weeks[addDaysIso(monday, -7)];
  const sources = { history: data.history, bikeSessions: data.bikeSessions };

  const trainingCount = week.flat().filter(isTrainingKey).length;
  const minutes = week.flat().reduce((total, key) => total + estimatedMinutes(key), 0);

  function saveWeek(next: string[][]) {
    data.savePlans(withWeek(data.plans, monday, next));
  }

  function toggle(date: string, key: string) {
    const index = Math.round((Date.parse(date) - Date.parse(monday)) / 86_400_000);
    const next = getWeek(data.plans, monday);
    next[index] = toggleDayItem(next[index], key);
    saveWeek(next);
  }

  function copyPrevious() {
    if (!previousWeek) {
      setToast("A semana anterior não tem plano para copiar.");
      return;
    }
    saveWeek(previousWeek.map((day) => [...day]));
    setToast("Plano copiado da semana anterior.");
  }

  function clearWeek() {
    saveWeek(getWeek({ version: 1, weeks: {} }, monday));
    setToast("Semana limpa.");
  }

  const editingIndex = editing ? Math.round((Date.parse(editing) - Date.parse(monday)) / 86_400_000) : -1;

  return (
    <div className="flex flex-1 flex-col gap-5">
      <Link
        href="/"
        className="flex min-h-[44px] items-center gap-1 self-start pr-2 text-[15px] font-semibold text-[var(--muted)] hover:text-[var(--foreground)]"
      >
        <AppIcon name="arrow" direction="left" size={20} />
        Hoje
      </Link>

      <header className="space-y-1">
        <h1 className="text-[28px] font-extrabold leading-[34px] text-[var(--foreground)]">
          Planejar semana
        </h1>
        <p className="text-[14px] leading-[21px] text-[var(--muted)]">
          Escolha um ou mais treinos para cada dia. A tela Hoje segue este plano.
        </p>
      </header>

      <div className="grid grid-cols-[44px_1fr_44px] items-center gap-2">
        <button
          type="button"
          aria-label="Semana anterior"
          onClick={() => setOffset((value) => value - 1)}
          className="flex h-11 items-center justify-center rounded-[10px] border border-[var(--border)] bg-[var(--surface)] text-[var(--foreground)] hover:bg-[var(--surface-elevated)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus)]"
        >
          <AppIcon name="arrow" direction="left" size={18} />
        </button>
        <div className="text-center" aria-live="polite">
          <div className="text-[17px] font-extrabold text-[var(--foreground)]">
            {shortDate(monday)} – {shortDate(addDaysIso(monday, 6))}
          </div>
          <div className="text-[12px] font-bold text-[var(--primary-text)]">{weekTag(offset)}</div>
        </div>
        <button
          type="button"
          aria-label="Próxima semana"
          onClick={() => setOffset((value) => value + 1)}
          className="flex h-11 items-center justify-center rounded-[10px] border border-[var(--border)] bg-[var(--surface)] text-[var(--foreground)] hover:bg-[var(--surface-elevated)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus)]"
        >
          <AppIcon name="arrow" size={18} />
        </button>
      </div>

      <div className="grid grid-cols-[1.4fr_1fr] gap-2">
        <AppButton variant="secondary" onClick={copyPrevious} className="text-[14px]">
          Copiar semana anterior
        </AppButton>
        <AppButton variant="ghost" onClick={clearWeek} className="text-[14px]" disabled={!week.some((d) => d.length)}>
          Limpar semana
        </AppButton>
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        {week.map((items, index) => {
          const date = addDaysIso(monday, index);
          const isToday = date === data.today;
          return (
            <section
              key={date}
              aria-label={`${WEEKDAY_NAMES[index]}, ${shortDate(date)}`}
              className={`flex flex-col gap-2.5 rounded-[16px] border p-3.5 ${
                isToday
                  ? "border-[var(--primary-line)] bg-[var(--primary-tint)]"
                  : "border-[var(--border)] bg-[var(--surface)]"
              }`}
            >
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-baseline gap-2">
                  <span className="text-[17px] font-extrabold text-[var(--foreground)]">{WEEKDAY_NAMES[index]}</span>
                  <span className="text-[13px] text-[var(--muted)]">{shortDate(date)}</span>
                </div>
                {isToday && (
                  <span className="rounded-full border border-[var(--primary-hover)] bg-[var(--primary-soft)] px-2.5 py-px text-[12px] font-bold text-[var(--primary-text)]">
                    Hoje
                  </span>
                )}
              </div>
              <div className="flex flex-wrap gap-1.5">
                {items.map((key) => {
                  const option = getPlanOption(key);
                  if (!option) return null;
                  const done = isPlanItemDone(key, date, sources);
                  const training = option.kind !== "rest";
                  return (
                    <button
                      key={key}
                      type="button"
                      aria-label={`Remover ${option.title} de ${WEEKDAY_NAMES[index]}`}
                      onClick={() => toggle(date, key)}
                      className={`flex min-h-[38px] items-center gap-2 rounded-[10px] border pl-3 pr-2.5 text-[14px] font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus)] ${
                        training
                          ? "border-[var(--primary-hover)] bg-[var(--primary-soft)] text-[var(--primary-text)]"
                          : "border-[var(--border)] bg-[var(--surface-elevated)] text-[var(--muted)]"
                      }`}
                    >
                      {done && <AppIcon name="check" size={14} className="text-[var(--success-text)]" />}
                      <span>{option.title}</span>
                      <span aria-hidden="true" className="text-[18px] leading-none text-[var(--muted-strong)]">×</span>
                    </button>
                  );
                })}
                <button
                  type="button"
                  onClick={() => setEditing(date)}
                  className="flex min-h-[38px] items-center gap-1 rounded-[10px] border border-dashed border-[var(--primary-hover)] px-3 text-[14px] font-bold text-[var(--primary-text)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus)]"
                >
                  <AppIcon name="plus" size={16} />
                  Adicionar
                </button>
              </div>
            </section>
          );
        })}
      </div>

      <p className="rounded-[12px] border border-[var(--border)] bg-[var(--surface)] px-3.5 py-3 text-[14px] leading-[21px] text-[var(--foreground-soft)]">
        {trainingCount
          ? `${trainingCount} ${trainingCount === 1 ? "treino planejado" : "treinos planejados"} nesta semana · ~${String(Math.round((minutes / 60) * 10) / 10).replace(".", ",")} h no total`
          : "Nenhum treino planejado nesta semana."}
      </p>

      <PlanDayModal
        date={editing}
        items={editingIndex >= 0 ? week[editingIndex] ?? [] : []}
        onToggle={(key) => editing && toggle(editing, key)}
        onClose={() => setEditing(null)}
      />

      {toast && <AppToast message={toast} onClose={() => setToast(null)} />}
    </div>
  );
}
