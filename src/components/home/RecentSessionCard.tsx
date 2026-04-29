"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

import type { WorkoutHistoryEntry } from "@/types";
import { AppCard } from "@/components/ui/AppCard";
import { seedWorkouts } from "@/data/seed-workouts";
import { readWorkoutHistory } from "@/lib/workout-storage";

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

function getEntryTime(entry: WorkoutHistoryEntry) {
  const timestamp = new Date(entry.completedAt ?? entry.startedAt).getTime();

  return Number.isFinite(timestamp) ? timestamp : 0;
}

export function RecentSessionCard() {
  const [history, setHistory] = useState<WorkoutHistoryEntry[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      setHistory(
        [...readWorkoutHistory()].sort(
          (firstEntry, secondEntry) =>
            getEntryTime(secondEntry) - getEntryTime(firstEntry),
        ),
      );
      setIsLoaded(true);
    }, 0);

    return () => window.clearTimeout(timeout);
  }, []);

  const latestSession = history[0];
  const latestWorkout = latestSession
    ? seedWorkouts.find((workout) => workout.id === latestSession.workoutId)
    : undefined;
  const completedCount = useMemo(() => {
    if (!latestSession) {
      return 0;
    }

    return Object.values(latestSession.logs).filter((log) => log.completed)
      .length;
  }, [latestSession]);

  return (
    <AppCard className="p-4">
      <div className="flex flex-col gap-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-red-300">
              Última sessão
            </p>
            <h2 className="mt-1 text-xl font-black text-white">Histórico</h2>
          </div>
          <Link
            href="/history"
            className="min-h-10 shrink-0 rounded-lg border border-zinc-700 px-3 text-sm font-bold leading-10 text-zinc-100 transition-colors hover:border-zinc-500 hover:bg-zinc-900"
          >
            Abrir
          </Link>
        </div>

        {!isLoaded ? (
          <p className="text-sm font-semibold text-zinc-400">
            Carregando histórico...
          </p>
        ) : latestSession ? (
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div className="col-span-2 rounded-md border border-zinc-800 bg-zinc-900 px-3 py-3">
              <p className="text-xs text-zinc-500">
                {formatDateTime(latestSession.completedAt)}
              </p>
              <p className="mt-1 text-base font-black leading-6 text-white">
                {latestSession.workoutTitle}
              </p>
            </div>
            <div className="rounded-md border border-zinc-800 bg-zinc-900 px-3 py-2">
              <p className="text-xs text-zinc-500">Duração</p>
              <p className="font-semibold text-zinc-100">
                {formatDuration(latestSession.durationSeconds)}
              </p>
            </div>
            <div className="rounded-md border border-emerald-300/25 bg-emerald-300/10 px-3 py-2">
              <p className="text-xs text-zinc-500">Concluídos</p>
              <p className="font-semibold text-emerald-100">
                {completedCount}
              </p>
            </div>
            {latestWorkout ? (
              <Link
                href={`/workouts/${latestWorkout.id}/start?start=1`}
                className="col-span-2 flex min-h-12 items-center justify-center rounded-lg border border-red-400 bg-red-500 px-4 text-center text-sm font-black text-white shadow-md shadow-red-950/30 transition-colors hover:bg-red-400"
              >
                Repetir último treino
              </Link>
            ) : null}
          </div>
        ) : (
          <p className="text-sm leading-6 text-zinc-400">
            Nenhuma sessão salva ainda neste dispositivo.
          </p>
        )}
      </div>
    </AppCard>
  );
}
