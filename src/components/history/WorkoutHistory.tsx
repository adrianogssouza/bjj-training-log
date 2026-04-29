"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

import type { WorkoutHistoryEntry, WorkoutSessionLog } from "@/types";
import { seedWorkouts } from "@/data/seed-workouts";
import { AppCard } from "@/components/ui/AppCard";
import { clearWorkoutHistory, readWorkoutHistory } from "@/lib/workout-storage";

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date(value));
}

function formatDuration(totalSeconds: number) {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;

  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(
    2,
    "0",
  )}`;
}

function getPseValues(logs: WorkoutSessionLog[]) {
  return logs
    .map((log) => Number.parseFloat(log.actualPse.replace(",", ".")))
    .filter((value) => Number.isFinite(value));
}

function formatPse(value: number) {
  return value.toFixed(1).replace(".", ",");
}

function getAveragePse(logs: WorkoutSessionLog[]) {
  const pseValues = getPseValues(logs);

  if (pseValues.length === 0) {
    return null;
  }

  const total = pseValues.reduce((sum, value) => sum + value, 0);

  return formatPse(total / pseValues.length);
}

function getEntryTime(entry: WorkoutHistoryEntry) {
  const timestamp = new Date(entry.completedAt ?? entry.startedAt).getTime();

  return Number.isFinite(timestamp) ? timestamp : 0;
}

function StatCard({
  label,
  value,
  tone = "default",
}: {
  label: string;
  value: string | number;
  tone?: "default" | "red" | "amber" | "emerald";
}) {
  const toneClass = {
    default: "border-zinc-800 bg-zinc-900",
    red: "border-red-500/40 bg-red-500/10",
    amber: "border-amber-300/30 bg-amber-300/10",
    emerald: "border-emerald-300/30 bg-emerald-300/10",
  }[tone];

  return (
    <div className={`rounded-lg border px-3 py-3 ${toneClass}`}>
      <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
        {label}
      </p>
      <p className="mt-1 text-xl font-black text-white">{value}</p>
    </div>
  );
}

function ExerciseDetail({
  entry,
  log,
}: {
  entry: WorkoutHistoryEntry;
  log: WorkoutSessionLog;
}) {
  const exercise = resolveExercise(entry, log);
  const isSkipped = Boolean(log.skipped);

  return (
    <div
      className={`rounded-lg border p-3 ${
        isSkipped
          ? "border-amber-300/30 bg-amber-300/10"
          : "border-emerald-300/25 bg-emerald-300/10"
      }`}
    >
      <div className="flex flex-col gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
            {exercise.blockTitle}
          </p>
          <h3 className="mt-1 text-base font-bold leading-6 text-white">
            {exercise.exerciseName}
          </h3>
        </div>

        <div className="grid grid-cols-2 gap-2 text-sm">
          <div>
            <p className="text-xs text-zinc-500">Realizado</p>
            <p className="font-semibold text-zinc-100">{log.reps || "-"}</p>
          </div>
          <div>
            <p className="text-xs text-zinc-500">Carga / método</p>
            <p className="font-semibold text-zinc-100">{log.load || "-"}</p>
          </div>
          <div>
            <p className="text-xs text-zinc-500">PSE real</p>
            <p className="font-semibold text-zinc-100">
              {log.actualPse || "-"}
            </p>
          </div>
          <div>
            <p className="text-xs text-zinc-500">Status</p>
            <p
              className={`font-semibold ${
                isSkipped ? "text-amber-100" : "text-emerald-100"
              }`}
            >
              {isSkipped ? "Pulado" : "Concluído"}
            </p>
          </div>
        </div>

        {isSkipped && log.skipReason ? (
          <p className="rounded-md border border-amber-300/30 bg-black/20 px-3 py-2 text-sm font-semibold text-amber-100">
            Motivo: {log.skipReason}
          </p>
        ) : null}
      </div>
    </div>
  );
}

function ExerciseGroup({
  title,
  logs,
  entry,
  tone,
}: {
  title: string;
  logs: WorkoutSessionLog[];
  entry: WorkoutHistoryEntry;
  tone: "emerald" | "amber";
}) {
  if (logs.length === 0) {
    return null;
  }

  const titleClass = tone === "emerald" ? "text-emerald-200" : "text-amber-200";

  return (
    <section className="flex flex-col gap-3">
      <div className="flex items-center justify-between gap-3">
        <h3 className={`text-sm font-black uppercase tracking-wide ${titleClass}`}>
          {title}
        </h3>
        <span className="rounded-full border border-zinc-700 px-2.5 py-1 text-xs font-black text-zinc-300">
          {logs.length}
        </span>
      </div>
      <div className="flex flex-col gap-3">
        {logs.map((log) => (
          <ExerciseDetail
            key={`${log.blockId}:${log.itemId}`}
            entry={entry}
            log={log}
          />
        ))}
      </div>
    </section>
  );
}

function getOverallAveragePse(history: WorkoutHistoryEntry[]) {
  const pseValues = history.flatMap((entry) =>
    getPseValues(Object.values(entry.logs)),
  );

  if (pseValues.length === 0) {
    return null;
  }

  const total = pseValues.reduce((sum, value) => sum + value, 0);

  return formatPse(total / pseValues.length);
}

function resolveExercise(entry: WorkoutHistoryEntry, log: WorkoutSessionLog) {
  const workout = resolveWorkout(entry);
  const block = workout?.blocks.find((item) => item.id === log.blockId);
  const exercise = block?.items.find((item) => item.id === log.itemId);

  return {
    blockTitle: block?.title ?? "Bloco não encontrado",
    exerciseName: exercise?.name ?? "Exercício não encontrado",
  };
}

function resolveWorkout(entry: WorkoutHistoryEntry) {
  return seedWorkouts.find((item) => item.id === entry.workoutId);
}

function getWorkoutTypeBadge(entry: WorkoutHistoryEntry) {
  const workout = resolveWorkout(entry);
  const isComplementary = workout?.type === "complementary";

  return {
    label: isComplementary ? "Complementar" : "Principal",
    className: isComplementary
      ? "border-cyan-300/30 bg-cyan-300/10 text-cyan-100"
      : "border-red-400/40 bg-red-500/10 text-red-100",
  };
}

export function WorkoutHistory() {
  const [history, setHistory] = useState<WorkoutHistoryEntry[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      setHistory(
        [...readWorkoutHistory()].sort((a, b) => getEntryTime(b) - getEntryTime(a)),
      );
      setIsLoaded(true);
    }, 0);

    return () => window.clearTimeout(timeout);
  }, []);

  const summary = useMemo(() => {
    return history.map((entry) => {
      const logs = Object.values(entry.logs);
      const completedLogs = logs.filter((log) => log.completed);
      const skippedLogs = logs.filter((log) => log.skipped);

      return {
        entry,
        logs,
        completedLogs,
        skippedLogs,
        completedCount: completedLogs.length,
        skippedCount: skippedLogs.length,
        averagePse: getAveragePse(logs),
      };
    });
  }, [history]);

  const metrics = useMemo(() => {
    const allLogs = history.flatMap((entry) => Object.values(entry.logs));
    const completedCount = allLogs.filter((log) => log.completed).length;
    const skippedCount = allLogs.filter((log) => log.skipped).length;
    const totalDurationSeconds = history.reduce(
      (total, entry) => total + entry.durationSeconds,
      0,
    );

    return {
      totalWorkouts: history.length,
      totalDuration: formatDuration(totalDurationSeconds),
      averagePse: getOverallAveragePse(history),
      completedCount,
      skippedCount,
    };
  }, [history]);

  function clearHistory() {
    clearWorkoutHistory();
    setHistory([]);
    setExpandedId(null);
    setShowClearConfirm(false);
  }

  if (!isLoaded) {
    return (
      <main className="flex flex-1 flex-col gap-5 py-8">
        <AppCard>
          <p className="text-sm font-bold text-zinc-300">
            Carregando histórico...
          </p>
        </AppCard>
      </main>
    );
  }

  if (history.length === 0) {
    return (
      <main className="flex flex-1 flex-col gap-6 py-8">
        <section>
          <p className="text-sm font-semibold uppercase tracking-wide text-red-300">
            Histórico
          </p>
          <h1 className="mt-2 text-3xl font-black text-white">
            Nenhum treino registrado ainda.
          </h1>
          <p className="mt-3 text-sm leading-6 text-zinc-400">
            Conclua um treino para ver seus registros neste dispositivo.
          </p>
        </section>
        <Link
          href="/workouts"
          className="flex min-h-14 w-full items-center justify-center rounded-lg border border-red-400 bg-red-500 px-5 text-center text-base font-bold text-white shadow-lg shadow-red-950/40 transition-colors hover:bg-red-400"
        >
          Ver treinos
        </Link>
      </main>
    );
  }

  return (
    <main className="flex flex-1 flex-col gap-5 py-8">
      <section className="flex flex-col gap-3">
        <p className="text-sm font-semibold uppercase tracking-wide text-red-300">
          Histórico
        </p>
        <div>
          <h1 className="text-3xl font-black text-white">
            Treinos registrados
          </h1>
          <p className="mt-2 text-sm leading-6 text-zinc-400">
            Métricas locais simples calculadas a partir das sessões salvas neste
            dispositivo.
          </p>
        </div>
      </section>

      <section className="grid grid-cols-2 gap-2 sm:grid-cols-5">
        <StatCard
          label="Treinos"
          value={metrics.totalWorkouts}
          tone="red"
        />
        <StatCard label="Tempo total" value={metrics.totalDuration} />
        <StatCard label="PSE geral" value={metrics.averagePse ?? "-"} />
        <StatCard
          label="Registrados"
          value={metrics.completedCount}
          tone="emerald"
        />
        <StatCard
          label="Pulados"
          value={metrics.skippedCount}
          tone="amber"
        />
      </section>

      <div className="flex flex-col gap-4">
        {summary.map(
          ({
            entry,
            completedLogs,
            skippedLogs,
            completedCount,
            skippedCount,
            averagePse,
          }) => {
            const isExpanded = expandedId === entry.id;
            const typeBadge = getWorkoutTypeBadge(entry);

            return (
              <AppCard key={entry.id} className="p-4">
                <article className="flex flex-col gap-4">
                  <button
                    type="button"
                    onClick={() => setExpandedId(isExpanded ? null : entry.id)}
                    className="flex w-full flex-col gap-4 text-left"
                  >
                    <div className="flex flex-col gap-2">
                      <p className="text-xs font-semibold uppercase tracking-wide text-red-300">
                        {formatDateTime(entry.completedAt)}
                      </p>
                      <span
                        className={`w-fit rounded-full border px-2.5 py-1 text-xs font-black ${typeBadge.className}`}
                      >
                        {typeBadge.label}
                      </span>
                      <h2 className="text-xl font-black leading-7 text-white">
                        {entry.workoutTitle}
                      </h2>
                    </div>

                    <dl className="grid grid-cols-2 gap-2 text-sm">
                      <div className="rounded-md border border-zinc-800 bg-zinc-900 px-3 py-2">
                        <dt className="text-xs text-zinc-500">Duração</dt>
                        <dd className="font-semibold text-zinc-100">
                          {formatDuration(entry.durationSeconds)}
                        </dd>
                      </div>
                      <div className="rounded-md border border-zinc-800 bg-zinc-900 px-3 py-2">
                        <dt className="text-xs text-zinc-500">PSE médio</dt>
                        <dd className="font-semibold text-zinc-100">
                          {averagePse ?? "-"}
                        </dd>
                      </div>
                      <div className="rounded-md border border-emerald-300/25 bg-emerald-300/10 px-3 py-2">
                        <dt className="text-xs text-zinc-500">Concluídos</dt>
                        <dd className="font-semibold text-emerald-100">
                          {completedCount}
                        </dd>
                      </div>
                      <div className="rounded-md border border-amber-300/25 bg-amber-300/10 px-3 py-2">
                        <dt className="text-xs text-zinc-500">Pulados</dt>
                        <dd className="font-semibold text-amber-100">
                          {skippedCount}
                        </dd>
                      </div>
                    </dl>

                    <span className="flex min-h-11 items-center justify-center rounded-lg border border-zinc-700 bg-zinc-900 px-4 text-sm font-bold text-zinc-100 transition-colors hover:border-zinc-500">
                      {isExpanded ? "Ocultar detalhes" : "Ver detalhes"}
                    </span>
                  </button>

                  {isExpanded ? (
                    <div className="flex flex-col gap-5 border-t border-zinc-800 pt-4">
                      <ExerciseGroup
                        title="Exercícios concluídos"
                        logs={completedLogs}
                        entry={entry}
                        tone="emerald"
                      />
                      <ExerciseGroup
                        title="Exercícios pulados"
                        logs={skippedLogs}
                        entry={entry}
                        tone="amber"
                      />
                    </div>
                  ) : null}
                </article>
              </AppCard>
            );
          },
        )}
      </div>

      <button
        type="button"
        onClick={() => setShowClearConfirm(true)}
        className="min-h-10 self-center rounded-lg px-4 text-sm font-bold text-zinc-500 transition-colors hover:text-red-200"
      >
        Limpar histórico
      </button>

      {showClearConfirm ? (
        <div className="fixed inset-0 z-30 flex items-end bg-black/75 px-4 pb-4 sm:items-center sm:justify-center">
          <AppCard className="w-full max-w-md p-4">
            <div className="flex flex-col gap-4">
              <div>
                <h2 className="text-lg font-black text-white">
                  Limpar histórico
                </h2>
                <p className="mt-2 text-sm leading-6 text-zinc-300">
                  Tem certeza que deseja apagar todos os treinos registrados
                  neste dispositivo?
                </p>
              </div>
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                <button
                  type="button"
                  onClick={() => setShowClearConfirm(false)}
                  className="min-h-12 rounded-lg border border-zinc-700 bg-zinc-900 px-4 text-sm font-bold text-zinc-100"
                >
                  Manter histórico
                </button>
                <button
                  type="button"
                  onClick={clearHistory}
                  className="min-h-12 rounded-lg border border-red-400 bg-red-500 px-4 text-sm font-bold text-white"
                >
                  Limpar histórico
                </button>
              </div>
            </div>
          </AppCard>
        </div>
      ) : null}
    </main>
  );
}
