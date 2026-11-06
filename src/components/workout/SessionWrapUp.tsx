"use client";

import { useState } from "react";
import { AppButton } from "@/components/ui/AppButton";
import { AppIcon } from "@/components/ui/AppIcon";
import {
  FEELING_OPTIONS,
  NO_PAIN_LABEL,
  NOTE_MAX_LENGTH,
  PAIN_OPTIONS,
  formatVolume,
  normalizeSessionFeedback,
  type Feeling,
  type SessionFeedback,
  type SessionSummary,
} from "@/lib/session-feedback";

function formatClock(totalSeconds: number) {
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  if (hours > 0) return `${hours}h${String(minutes).padStart(2, "0")}`;
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

export interface SessionWrapUpProps {
  workoutTitle: string;
  summary: SessionSummary;
  /** Grava a avaliação (pode estar vazia) e segue para o destino escolhido. */
  onSave: (feedback: SessionFeedback, next: "home" | "history" | "repeat") => void;
}

export function SessionWrapUp({ workoutTitle, summary, onSave }: SessionWrapUpProps) {
  const [feeling, setFeeling] = useState<Feeling | null>(null);
  /** null = não respondido; [] = "Nenhum". */
  const [pains, setPains] = useState<string[] | null>(null);
  const [note, setNote] = useState("");

  function togglePain(option: string) {
    if (option === NO_PAIN_LABEL) {
      setPains((current) => (current && current.length === 0 ? null : []));
      return;
    }
    setPains((current) => {
      const list = current ?? [];
      const next = list.includes(option) ? list.filter((p) => p !== option) : [...list, option];
      return next.length === 0 ? null : next;
    });
  }

  function save(next: "home" | "history" | "repeat") {
    onSave(normalizeSessionFeedback({ feeling, pains, note }), next);
  }

  const stats = [
    { label: "Tempo total", value: formatClock(summary.durationSeconds), tone: "text-[var(--foreground)]" },
    { label: "Séries feitas", value: String(summary.doneSets), tone: "text-[var(--success-text)]" },
    {
      label: "Séries puladas",
      value: String(summary.skippedSets),
      tone: summary.skippedSets > 0 ? "text-[var(--warning)]" : "text-[var(--foreground)]",
    },
    {
      label: "Volume",
      value: summary.volumeKg > 0 ? formatVolume(summary.volumeKg) : "-",
      tone: "text-[var(--foreground)]",
    },
  ];

  const chipBase =
    "min-h-[40px] rounded-full border px-3 text-[13px] font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus)]";
  const chipOn = "border-[var(--primary)] bg-[var(--primary)] text-[var(--on-primary)]";
  const chipOff =
    "border-[var(--border)] bg-[var(--surface-elevated)] text-[var(--foreground-soft)] hover:border-[var(--border-strong)]";

  return (
    <div className="flex flex-col gap-4">
      <div>
        <p className="flex items-center gap-1.5 text-[13px] font-semibold text-[var(--success-text)]">
          <AppIcon name="check" size={16} />
          Sessão salva
        </p>
        <h2 className="mt-1 text-[24px] font-extrabold leading-[30px] text-[var(--foreground)]">
          Treino concluído
        </h2>
        <p className="mt-0.5 text-[14px] text-[var(--muted)]">{workoutTitle}</p>
      </div>

      <dl className="grid grid-cols-2 gap-2" aria-label="Resumo da sessão">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className="rounded-[10px] border border-[var(--border)] bg-[var(--surface-elevated)] px-3 py-2"
          >
            <dt className="text-[12px] text-[var(--muted)]">{stat.label}</dt>
            <dd className={`text-[18px] font-bold leading-[24px] ${stat.tone}`}>{stat.value}</dd>
          </div>
        ))}
      </dl>

      <fieldset className="space-y-2">
        <legend className="mb-2 text-[14px] font-semibold text-[var(--foreground)]">
          Sensação geral <span className="font-normal text-[var(--muted)]">(opcional)</span>
        </legend>
        <div role="radiogroup" aria-label="Sensação geral" className="grid grid-cols-5 gap-1.5">
          {FEELING_OPTIONS.map((option) => {
            const active = feeling === option.value;
            return (
              <button
                key={option.value}
                type="button"
                role="radio"
                aria-checked={active}
                aria-label={`${option.value} · ${option.label}`}
                onClick={() => setFeeling(active ? null : option.value)}
                className={`flex min-h-[52px] flex-col items-center justify-center rounded-[10px] border transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus)] ${
                  active ? chipOn : chipOff
                }`}
              >
                <span className="text-[16px] font-bold leading-[20px]">{option.value}</span>
                <span className="text-[11px] leading-[14px]">{option.label}</span>
              </button>
            );
          })}
        </div>
      </fieldset>

      <fieldset>
        <legend className="mb-2 text-[14px] font-semibold text-[var(--foreground)]">
          Algum incômodo? <span className="font-normal text-[var(--muted)]">(opcional)</span>
        </legend>
        <div className="flex flex-wrap gap-1.5">
          {[NO_PAIN_LABEL, ...PAIN_OPTIONS].map((option) => {
            const active =
              option === NO_PAIN_LABEL ? pains !== null && pains.length === 0 : Boolean(pains?.includes(option));
            return (
              <button
                key={option}
                type="button"
                aria-pressed={active}
                onClick={() => togglePain(option)}
                className={`${chipBase} ${active ? chipOn : chipOff}`}
              >
                {option}
              </button>
            );
          })}
        </div>
      </fieldset>

      <div>
        <label
          htmlFor="session-note"
          className="mb-2 block text-[14px] font-semibold text-[var(--foreground)]"
        >
          Observações <span className="font-normal text-[var(--muted)]">(opcional)</span>
        </label>
        <textarea
          id="session-note"
          rows={2}
          maxLength={NOTE_MAX_LENGTH}
          value={note}
          onChange={(event) => setNote(event.target.value)}
          placeholder="Ex.: dormi mal, treinei depois do jiu"
          className="w-full resize-none rounded-[10px] border border-[var(--border)] bg-[var(--surface-elevated)] px-3 py-2.5 text-[16px] text-[var(--foreground)] placeholder-[var(--muted)] focus:border-[var(--focus)] focus:outline-none focus:ring-2 focus:ring-[var(--focus)]"
        />
      </div>

      <div className="space-y-2">
        <AppButton onClick={() => save("home")} variant="primary" fullWidth>
          Salvar e voltar para Hoje
        </AppButton>
        <div className="grid grid-cols-2 gap-2">
          <AppButton onClick={() => save("history")} variant="secondary" fullWidth>
            Ver histórico
          </AppButton>
          <AppButton onClick={() => save("repeat")} variant="ghost" fullWidth>
            Repetir treino
          </AppButton>
        </div>
      </div>
    </div>
  );
}
