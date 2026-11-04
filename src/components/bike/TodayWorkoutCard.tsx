"use client";

import { useMemo, useState } from "react";
import {
  DAY_SHORT_NAMES,
  getTodayWorkoutInfo,
  type BikeData,
} from "@/lib/bike-cardio";

type TodayWorkoutCardProps = {
  data: BikeData;
  onStartGuided: (minutes: number) => void;
  onOpenQuickLog: (minutes: number) => void;
  onUpdatePreferredDays: (days: number[]) => void;
  onToggleRepeatWeek: (week: number | null) => void;
};

export function TodayWorkoutCard({
  data,
  onStartGuided,
  onOpenQuickLog,
  onUpdatePreferredDays,
  onToggleRepeatWeek,
}: TodayWorkoutCardProps) {
  const [showScheduleSettings, setShowScheduleSettings] = useState(false);
  const info = useMemo(() => getTodayWorkoutInfo(data), [data]);

  const toggleDay = (dayIndex: number) => {
    const current = info.preferredDays;
    const next = current.includes(dayIndex)
      ? current.filter((d) => d !== dayIndex)
      : [...current, dayIndex].sort((a, b) => a - b);
    // Deve manter pelo menos 1 dia selecionado
    if (next.length === 0) return;
    onUpdatePreferredDays(next);
  };

  return (
    <section
      aria-label="Treino de Hoje"
      className="relative overflow-hidden rounded-2xl border border-red-500/50 bg-gradient-to-b from-red-950/40 via-zinc-900/90 to-zinc-950 p-5 shadow-xl shadow-red-950/20 sm:p-6"
    >
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-zinc-800 pb-3">
        <div className="flex items-center gap-2">
          <span className="flex size-2.5 rounded-full bg-red-500 animate-pulse" />
          <p className="text-xs font-bold uppercase tracking-wider text-red-300">
            Treino de Hoje · Bike
          </p>
        </div>
        <p className="text-xs font-medium text-zinc-400">
          {info.dayName}, {info.readableDate}
        </p>
      </div>

      <div className="mt-4 flex flex-col gap-4">
        <div>
          <div className="flex flex-wrap items-baseline gap-2">
            <h2 className="text-2xl font-black text-white sm:text-3xl">
              Semana {info.effectiveWeek} · {info.isTodayCompleted ? "Sessão concluída hoje" : `Sessão ${info.sessionNumber} de ${info.phase.sessions}`}
            </h2>
            {info.isWeekOverridden && (
              <span className="rounded-full bg-amber-500/20 px-2.5 py-0.5 text-xs font-semibold text-amber-300 border border-amber-500/30">
                Semana em repetição (recuperação)
              </span>
            )}
          </div>
          <p className="mt-1 text-sm text-zinc-300">
            Meta semanal: {info.phase.sessions} sessões de {info.phase.minutes} min ({info.weekSummary.completedSessions}/{info.phase.sessions} concluídas).
          </p>
        </div>

        {/* Blocos de tempo e estrutura da sessão */}
        <div className="grid grid-cols-3 gap-2 sm:gap-3">
          <div className="rounded-xl border border-zinc-800 bg-zinc-950/80 p-3 text-center">
            <p className="text-xs font-medium text-zinc-400">Aquecimento</p>
            <p className="mt-0.5 text-lg font-black text-amber-400 sm:text-xl">
              {info.warmupMinutes} min
            </p>
            <p className="text-[11px] text-zinc-400">Ritmo leve</p>
          </div>
          <div className="rounded-xl border border-red-500/40 bg-red-950/30 p-3 text-center">
            <p className="text-xs font-semibold text-red-200">Parte principal</p>
            <p className="mt-0.5 text-xl font-black text-white sm:text-2xl">
              {info.mainMinutes} min
            </p>
            <p className="text-[11px] text-red-300 font-medium">Conversável</p>
          </div>
          <div className="rounded-xl border border-zinc-800 bg-zinc-950/80 p-3 text-center">
            <p className="text-xs font-medium text-zinc-400">Desaquecimento</p>
            <p className="mt-0.5 text-lg font-black text-cyan-400 sm:text-xl">
              {info.cooldownMinutes} min
            </p>
            <p className="text-[11px] text-zinc-400">Desacelerar</p>
          </div>
        </div>

        {/* Intensidade e orientações principais */}
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-3.5 space-y-2 text-xs sm:text-sm text-zinc-300">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1">
            <p>
              <strong className="text-white">Intensidade:</strong> {info.targetIntensity} ({info.targetRpe})
            </p>
            <p className="text-zinc-400">
              <strong className="text-zinc-200">Total previsto:</strong> {info.phase.minutes} minutos
            </p>
          </div>
          <p>
            <strong className="text-white">FC de referência provisória:</strong> {info.referenceBpm}. Estimativa exploratória para ritmo de base; não é limite clínico estrito nem zona individual validada. Se divergir, priorize o teste da fala e os sintomas.
          </p>
          <p>
            <strong className="text-white">Teste da fala:</strong> {info.talkTestGuidance}
          </p>
        </div>

        {/* Status contextual do dia */}
        {info.isTodayCompleted ? (
          <div className="rounded-xl border border-emerald-500/40 bg-emerald-950/20 p-3 text-xs sm:text-sm text-emerald-200">
            ✓ <strong>Você já pedalou hoje!</strong> Duração de {info.todaySession?.minutes} min registrada. Bom descanso para os treinos de Jiu-Jitsu e musculação.
          </div>
        ) : !info.isPreferredDay && info.isWeekGoalMet ? (
          <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-3 text-xs sm:text-sm text-zinc-300">
            Hoje não é seu dia preferencial e a meta semanal ({info.phase.sessions} sessões) já foi atingida. Se a musculação e o Jiu-Jitsu exigiram muito, priorize o descanso. Se quiser pedalar leve, você pode iniciar um treino extra.
          </div>
        ) : !info.isPreferredDay ? (
          <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-2.5 text-xs text-zinc-400">
            Hoje não está entre os seus dias preferenciais ({info.preferredDays.map((d) => DAY_SHORT_NAMES[d]).join(", ")}), mas você tem total liberdade para pedalar hoje ou reagendar conforme sua rotina.
          </div>
        ) : null}

        {/* Botões de Ação Principais (Áreas de toque amplas para iPhone) */}
        <div className="flex flex-col gap-2.5 sm:flex-row">
          <button
            type="button"
            onClick={() => onStartGuided(info.phase.minutes)}
            className="flex min-h-12 flex-1 items-center justify-center gap-2 rounded-xl bg-red-600 px-5 py-3 text-base font-black text-white shadow-lg shadow-red-700/30 transition hover:bg-red-500 active:scale-[0.98]"
          >
            <span>▶ Iniciar treino guiado</span>
            <span className="text-xs font-semibold opacity-80">({info.phase.minutes} min)</span>
          </button>
          <button
            type="button"
            onClick={() => onOpenQuickLog(info.phase.minutes)}
            className="flex min-h-12 items-center justify-center rounded-xl border border-zinc-700 bg-zinc-900 px-4 py-3 text-sm font-bold text-zinc-200 transition hover:border-red-400 hover:text-white"
          >
            Registrar treino já realizado
          </button>
        </div>

        {/* Flexibilidade de programação: dias preferenciais e repetição de semana */}
        <div className="border-t border-zinc-800/80 pt-3">
          <button
            type="button"
            onClick={() => setShowScheduleSettings((prev) => !prev)}
            className="flex items-center gap-1.5 text-xs font-medium text-zinc-400 hover:text-zinc-200"
          >
            <span>{showScheduleSettings ? "▲ Ocultar opções de dias e reagendamento" : "▼ Ajustar dias da semana, adiar ou repetir semana"}</span>
          </button>

          {showScheduleSettings && (
            <div className="mt-3 space-y-3 rounded-xl border border-zinc-800 bg-zinc-950/70 p-3 text-xs">
              <div>
                <p className="font-semibold text-zinc-200">
                  Dias preferenciais para pedalar ({info.preferredDays.length} selecionados):
                </p>
                <p className="mt-0.5 text-zinc-400">
                  Marque seus dias favoritos. Nenhum dia é obrigatório: você pode pedalar ou adiar livremente.
                </p>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {DAY_SHORT_NAMES.map((name, idx) => {
                    const selected = info.preferredDays.includes(idx);
                    return (
                      <button
                        key={name}
                        type="button"
                        onClick={() => toggleDay(idx)}
                        aria-pressed={selected}
                        className={`min-h-10 min-w-11 rounded-lg border px-2.5 py-1.5 font-bold transition ${
                          selected
                            ? "border-red-400 bg-red-600 text-white"
                            : "border-zinc-800 bg-zinc-900 text-zinc-400 hover:border-zinc-700"
                        }`}
                      >
                        {name}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="border-t border-zinc-800/60 pt-2 flex flex-wrap items-center justify-between gap-2">
                <div>
                  <p className="font-semibold text-zinc-200">Recuperação insuficiente?</p>
                  <p className="text-zinc-400">
                    Se a musculação pesou ou você sentiu fadiga acumulada, repita esta semana sem culpa.
                  </p>
                </div>
                {info.isWeekOverridden ? (
                  <button
                    type="button"
                    onClick={() => onToggleRepeatWeek(null)}
                    className="min-h-10 rounded-lg border border-amber-500/50 bg-amber-500/20 px-3 py-1.5 font-bold text-amber-200 hover:bg-amber-500/30"
                  >
                    Retomar progressão pelo calendário
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => onToggleRepeatWeek(info.effectiveWeek)}
                    className="min-h-10 rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-1.5 font-bold text-zinc-200 hover:border-amber-400 hover:text-amber-200"
                  >
                    Repetir semana {info.effectiveWeek}
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
