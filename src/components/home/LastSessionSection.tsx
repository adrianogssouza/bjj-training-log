"use client";

import { useEffect, useState } from "react";
import { AppCard } from "@/components/ui/AppCard";
import { AppButton } from "@/components/ui/AppButton";
import { AppBadge } from "@/components/ui/AppBadge";
import { readWorkoutHistory } from "@/lib/workout-storage";
import { loadBikeData, type BikeData, type BikeSession } from "@/lib/bike-cardio";
import { formatShortDatePTBR } from "@/lib/date-utils";
import type { WorkoutHistoryEntry } from "@/types";

interface MostRecentSession {
  type: "Musculação" | "Cardio na Bike";
  title: string;
  formattedDate: string;
  formattedDuration: string;
  timestamp: number;
}

function formatDurationSeconds(totalSeconds: number): string {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  if (minutes === 0) return `${seconds}s`;
  return `${minutes} min${seconds > 0 ? ` ${seconds}s` : ""}`;
}

export function LastSessionSection() {
  const [history, setHistory] = useState<WorkoutHistoryEntry[]>([]);
  const [bikeData, setBikeData] = useState<BikeData | null>(null);

  useEffect(() => {
    function load() {
      setHistory(readWorkoutHistory());
      setBikeData(loadBikeData());
    }
    load();
    window.addEventListener("bjj-storage-updated", load);
    window.addEventListener("bjj-bike-updated", load);
    window.addEventListener("bjj-cloud-updated", load);
    window.addEventListener("storage", load);
    return () => {
      window.removeEventListener("bjj-storage-updated", load);
      window.removeEventListener("bjj-bike-updated", load);
      window.removeEventListener("bjj-cloud-updated", load);
      window.removeEventListener("storage", load);
    };
  }, []);

  // Find most recent workout entry
  let mostRecentWorkout: MostRecentSession | null = null;
  if (history.length > 0) {
    const latestWorkout = history.reduce((latest, current) => {
      const timeLatest = new Date(latest.completedAt || latest.startedAt).getTime() || 0;
      const timeCurrent = new Date(current.completedAt || current.startedAt).getTime() || 0;
      return timeCurrent > timeLatest ? current : latest;
    }, history[0]);

    const timestamp = new Date(latestWorkout.completedAt || latestWorkout.startedAt).getTime() || 0;
    mostRecentWorkout = {
      type: "Musculação",
      title: latestWorkout.workoutTitle,
      formattedDate: formatShortDatePTBR(latestWorkout.completedAt || latestWorkout.startedAt),
      formattedDuration: formatDurationSeconds(latestWorkout.durationSeconds),
      timestamp,
    };
  }

  // Find most recent bike session
  let mostRecentBike: MostRecentSession | null = null;
  if (bikeData && bikeData.sessions && bikeData.sessions.length > 0) {
    const completedBikeSessions = bikeData.sessions.filter((s: BikeSession) => s.status === "completed");
    if (completedBikeSessions.length > 0) {
      const latestBike = completedBikeSessions.reduce((latest: BikeSession, current: BikeSession) => {
        const timeLatest = new Date(latest.date).getTime() || 0;
        const timeCurrent = new Date(current.date).getTime() || 0;
        return timeCurrent > timeLatest ? current : latest;
      }, completedBikeSessions[0]);

      const timestamp = new Date(latestBike.date).getTime() || 0;
      mostRecentBike = {
        type: "Cardio na Bike",
        title: "Cardio na Bike",
        formattedDate: formatShortDatePTBR(latestBike.date),
        formattedDuration: `${latestBike.minutes} min`,
        timestamp,
      };
    }
  }

  // Pick whichever is newer
  let latestSession: MostRecentSession | null = null;
  if (mostRecentWorkout && mostRecentBike) {
    latestSession = mostRecentWorkout.timestamp >= mostRecentBike.timestamp ? mostRecentWorkout : mostRecentBike;
  } else {
    latestSession = mostRecentWorkout || mostRecentBike;
  }

  return (
    <section className="space-y-3" aria-labelledby="last-session-heading">
      <h2
        id="last-session-heading"
        className="text-[20px] font-bold leading-[28px] text-[var(--foreground)]"
      >
        Última sessão
      </h2>

      <AppCard className="space-y-3 p-4">
        {latestSession ? (
          <>
            <div className="flex items-start justify-between gap-2">
              <div className="space-y-1">
                <AppBadge variant={latestSession.type === "Cardio na Bike" ? "success" : "primary"}>
                  {latestSession.type}
                </AppBadge>
                <h3 className="text-[18px] font-bold leading-[25px] text-[var(--foreground)]">
                  {latestSession.title}
                </h3>
              </div>
              <span className="text-[13px] font-medium text-[var(--muted)]">
                {latestSession.formattedDate}
              </span>
            </div>

            <div className="text-[14px] text-[var(--muted)]">
              Duração: <strong className="text-[var(--foreground)]">{latestSession.formattedDuration}</strong>
            </div>

            <div className="pt-1">
              <AppButton href="/history" variant="secondary" fullWidth>
                Ver histórico
              </AppButton>
            </div>
          </>
        ) : (
          <div className="space-y-3 py-2 text-center sm:text-left">
            <p className="text-[14px] font-medium text-[var(--muted)]">
              Nenhum treino concluído ainda
            </p>
            <div>
              <AppButton href="/history" variant="ghost">
                Ver histórico
              </AppButton>
            </div>
          </div>
        )}
      </AppCard>
    </section>
  );
}
