"use client";

import { useEffect, useMemo, useState } from "react";
import { AppCard } from "@/components/ui/AppCard";
import { AppEmptyState } from "@/components/ui/AppEmptyState";
import { AppLoadingState } from "@/components/ui/AppLoadingState";
import { seedWorkouts } from "@/data/seed-workouts";
import { getActiveCycle } from "@/data/training-cycles";
import { readWorkoutHistory } from "@/lib/workout-storage";
import {
  formatKgDelta,
  formatNumber,
  getCycleWeeklyFrequency,
  getExerciseProgress,
  shortDayLabel,
  type CycleWorkout,
  type ExerciseProgress,
} from "@/lib/progress";
import type { WorkoutHistoryEntry } from "@/types";
import { LoadLineChart } from "./LoadLineChart";
import { WeeklyFrequencyChart, WeeklyFrequencyLegend } from "./WeeklyFrequencyChart";

function useHistory() {
  const [history, setHistory] = useState<WorkoutHistoryEntry[] | null>(null);
  useEffect(() => {
    function load() {
      setHistory(readWorkoutHistory());
    }
    load();
    window.addEventListener("bjj-storage-updated", load);
    window.addEventListener("bjj-cloud-updated", load);
    window.addEventListener("storage", load);
    return () => {
      window.removeEventListener("bjj-storage-updated", load);
      window.removeEventListener("bjj-cloud-updated", load);
      window.removeEventListener("storage", load);
    };
  }, []);
  return history;
}

function DeltaPill({ exercise }: { exercise: ExerciseProgress }) {
  let text: string;
  let tone: string;
  if (exercise.delta > 0) {
    text = `${formatKgDelta(exercise.delta)} no ciclo`;
    tone = "border-[var(--success)] bg-[var(--success)]/20 text-[var(--success-text)]";
  } else if (exercise.delta < 0) {
    text = `${formatKgDelta(exercise.delta)} no ciclo`;
    tone = "border-[var(--border)] bg-[var(--surface-elevated)] text-[var(--muted)]";
  } else {
    text = exercise.sessions === 1 ? "Primeira carga do ciclo" : "Mesma carga do início";
    tone = "border-[var(--border)] bg-[var(--surface-elevated)] text-[var(--muted)]";
  }
  return (
    <span
      data-testid="load-delta"
      className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-[13px] font-semibold leading-[18px] ${tone}`}
    >
      {text}
    </span>
  );
}

function ExerciseCard({ exercise }: { exercise: ExerciseProgress }) {
  const last = exercise.points[exercise.points.length - 1];
  return (
    <AppCard className="space-y-3 p-4" aria-labelledby="exercise-progress-heading">
      <div className="space-y-0.5">
        <p className="text-[13px] font-medium text-[var(--muted)]">Treino {exercise.workoutLabel}</p>
        <h2
          id="exercise-progress-heading"
          className="text-[18px] font-bold leading-[24px] text-[var(--foreground)]"
        >
          {exercise.name}
        </h2>
      </div>

      <div className="flex flex-wrap items-end gap-x-3 gap-y-1">
        <p className="leading-none text-[var(--foreground)]" data-testid="last-load">
          <span className="text-[40px] font-extrabold tracking-tight">{formatNumber(exercise.lastLoad)}</span>
          <span className="ml-1 text-[16px] font-semibold text-[var(--muted)]">kg</span>
        </p>
        <div className="pb-1">
          <DeltaPill exercise={exercise} />
        </div>
      </div>
      <p className="-mt-1 text-[12px] text-[var(--muted)]">Última carga, em {shortDayLabel(last.date)}</p>

      <LoadLineChart points={exercise.points} />

      <dl className="grid grid-cols-3 gap-2 border-t border-[var(--border)] pt-3">
        <div>
          <dt className="text-[12px] text-[var(--muted)]">Sessões</dt>
          <dd className="text-[18px] font-bold text-[var(--foreground)]">{exercise.sessions}</dd>
        </div>
        <div>
          <dt className="text-[12px] text-[var(--muted)]">Melhor carga</dt>
          <dd className="text-[18px] font-bold text-[var(--foreground)]">
            {formatNumber(exercise.bestLoad)}
            <span className="ml-0.5 text-[13px] font-semibold text-[var(--muted)]">kg</span>
          </dd>
        </div>
        <div>
          <dt className="text-[12px] text-[var(--muted)]">PSE médio</dt>
          <dd className="text-[18px] font-bold text-[var(--foreground)]">
            {exercise.averagePse === null ? "-" : formatNumber(exercise.averagePse)}
          </dd>
        </div>
      </dl>
    </AppCard>
  );
}

export function LoadProgressTab({ now }: { now?: Date } = {}) {
  const history = useHistory();
  const [selectedKey, setSelectedKey] = useState<string | null>(null);
  const { cycle } = getActiveCycle(now);

  const cycleWorkouts = useMemo<CycleWorkout[]>(() => {
    const list: CycleWorkout[] = [];
    const a = seedWorkouts.find((w) => w.id === cycle.workoutAId);
    const b = seedWorkouts.find((w) => w.id === cycle.workoutBId);
    if (a) list.push({ label: "A", workout: a });
    if (b) list.push({ label: "B", workout: b });
    return list;
  }, [cycle.workoutAId, cycle.workoutBId]);

  const exercises = useMemo(
    () => (history ? getExerciseProgress(history, cycleWorkouts) : []),
    [history, cycleWorkouts],
  );
  const weeks = useMemo(
    () => (history ? getCycleWeeklyFrequency(history, cycle, seedWorkouts, now) : []),
    [history, cycle, now],
  );

  if (!history) {
    return <AppLoadingState message="Carregando progresso..." rows={2} />;
  }

  const selected = exercises.find((e) => e.key === selectedKey) ?? exercises[0];
  const cycleTotal = weeks.reduce((sum, week) => sum + week.total, 0);

  return (
    <div className="flex flex-col gap-4">
      {selected ? (
        <>
          <div
            role="group"
            aria-label="Escolher exercício"
            className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 sm:mx-0 sm:flex-wrap sm:px-0"
          >
            {exercises.map((exercise) => {
              const active = exercise.key === selected.key;
              return (
                <button
                  key={exercise.key}
                  type="button"
                  aria-pressed={active}
                  onClick={() => setSelectedKey(exercise.key)}
                  className={`flex min-h-[40px] shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full border px-3.5 text-[14px] font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus)] ${
                    active
                      ? "border-[var(--primary)] bg-[var(--primary)] text-[var(--on-primary)]"
                      : "border-[var(--border)] bg-[var(--surface)] text-[var(--foreground-soft)] hover:bg-[var(--surface-elevated)]"
                  }`}
                >
                  <span className={`text-[12px] font-bold ${active ? "opacity-75" : "text-[var(--muted)]"}`}>
                    {exercise.workoutLabel}
                  </span>
                  {exercise.name}
                </button>
              );
            })}
          </div>
          <ExerciseCard exercise={selected} />
        </>
      ) : (
        <AppEmptyState
          icon="chart"
          title="Nenhuma carga registrada"
          message={`Anote a carga (ex.: 24 kg) ao fazer o Treino A ou B do ${cycle.name} e a evolução de cada exercício aparece aqui.`}
          actionLabel="Ver treinos"
          actionHref="/workouts"
        />
      )}

      <AppCard className="space-y-3 p-4" aria-labelledby="weekly-frequency-heading">
        <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
          <h2
            id="weekly-frequency-heading"
            className="text-[18px] font-bold leading-[24px] text-[var(--foreground)]"
          >
            Frequência semanal
          </h2>
          <span className="text-[13px] text-[var(--muted)]">
            {cycleTotal} {cycleTotal === 1 ? "sessão" : "sessões"} no {cycle.name}
          </span>
        </div>
        {cycleTotal > 0 ? (
          <>
            <WeeklyFrequencyChart weeks={weeks} />
            <WeeklyFrequencyLegend />
          </>
        ) : (
          <p className="rounded-[10px] border border-dashed border-[var(--border)] p-4 text-center text-[13px] text-[var(--muted)]">
            Nenhum treino concluído neste ciclo ainda. Cada sessão concluída entra na semana em que foi feita.
          </p>
        )}
      </AppCard>
    </div>
  );
}
