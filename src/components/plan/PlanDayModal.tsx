"use client";

import { AppModal } from "@/components/ui/AppModal";
import { AppButton } from "@/components/ui/AppButton";
import { AppIcon } from "@/components/ui/AppIcon";
import { PLAN_GROUPS, PLAN_OPTIONS, shortDate, weekdayIndex } from "@/lib/weekly-plan";

export const WEEKDAY_NAMES = ["Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado", "Domingo"];
export const WEEKDAY_SHORT = ["SEG", "TER", "QUA", "QUI", "SEX", "SÁB", "DOM"];

export function dayLabel(date: string) {
  return `${WEEKDAY_NAMES[weekdayIndex(date)]}, ${shortDate(date)}`;
}

export interface PlanDayModalProps {
  date: string | null;
  items: string[];
  onToggle: (key: string) => void;
  onClose: () => void;
}

/** Seleção de um ou mais treinos para um dia. Cada toque salva na hora. */
export function PlanDayModal({ date, items, onToggle, onClose }: PlanDayModalProps) {
  return (
    <AppModal
      isOpen={date !== null}
      onClose={onClose}
      title={date ? dayLabel(date) : ""}
      description="Toque para marcar um ou mais treinos. Salva automaticamente."
      className="max-h-[88vh] overflow-y-auto"
    >
      {PLAN_GROUPS.map((group) => (
        <fieldset key={group} className="space-y-2">
          <legend className="mb-2 text-[12px] font-bold uppercase tracking-[0.05em] text-[var(--muted)]">
            {group}
          </legend>
          <div className="grid grid-cols-2 gap-2">
            {PLAN_OPTIONS.filter((option) => option.group === group).map((option) => {
              const selected = items.includes(option.key);
              return (
                <button
                  key={option.key}
                  type="button"
                  aria-pressed={selected}
                  onClick={() => onToggle(option.key)}
                  className={`flex min-h-[48px] items-center justify-between gap-2 rounded-[12px] border px-3 text-left text-[14px] font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus)] ${
                    selected
                      ? "border-[var(--primary-hover)] bg-[var(--primary-soft)] text-[var(--primary-text)]"
                      : "border-[var(--border)] bg-[var(--surface-elevated)] text-[var(--foreground)] hover:border-[var(--border-strong)]"
                  }`}
                >
                  <span>{option.title}</span>
                  {selected && <AppIcon name="check" size={16} className="shrink-0" />}
                </button>
              );
            })}
          </div>
        </fieldset>
      ))}
      <AppButton onClick={onClose} fullWidth>
        Pronto
      </AppButton>
    </AppModal>
  );
}
