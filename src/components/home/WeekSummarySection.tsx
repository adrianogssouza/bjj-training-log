"use client";

import { useEffect, useState } from "react";
import { AppCard } from "@/components/ui/AppCard";
import { AppStat } from "@/components/ui/AppStat";
import { AppIcon } from "@/components/ui/AppIcon";
import { readWorkoutHistory } from "@/lib/workout-storage";
import {
  loadBikeData,
  getEffectiveWeek,
  summarizeWeek,
  type BikeData,
} from "@/lib/bike-cardio";
import { getSaoPauloWeekRange } from "@/lib/date-utils";
import type { WorkoutHistoryEntry } from "@/types";

export function WeekSummarySection() {
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
    window.addEventListener("storage", load);
    return () => {
      window.removeEventListener("bjj-storage-updated", load);
      window.removeEventListener("bjj-bike-updated", load);
      window.removeEventListener("storage", load);
    };
  }, []);

  const { start, end } = getSaoPauloWeekRange();
  const startTime = start.getTime();
  const endTime = end.getTime();

  // Musculação: sessões concluídas na semana
  const weeklyWorkoutSessions = history.filter((entry) => {
    const timestamp = new Date(entry.completedAt || entry.startedAt).getTime();
    return Number.isFinite(timestamp) && timestamp >= startTime && timestamp <= endTime;
  }).length;

  // Bike: minutos realizados na semana e meta
  const hasBike = Boolean(bikeData && bikeData.sessions && bikeData.sessions.length > 0);
  const bikeSummary = hasBike && bikeData ? summarizeWeek(bikeData, getEffectiveWeek(bikeData)) : null;
  const bikeMinutes = bikeSummary ? bikeSummary.minutes : 0;
  const bikeGoal = bikeSummary ? bikeSummary.plannedMinutes : null;

  return (
    <section className="space-y-3" aria-labelledby="week-summary-heading">
      <h2
        id="week-summary-heading"
        className="text-[20px] font-bold leading-[28px] text-[#F4F4F5]"
      >
        Resumo da semana
      </h2>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {/* Musculação */}
        <AppCard className="p-4">
          <AppStat
            icon={<AppIcon name="dumbbell" size={18} />}
            label="Musculação"
            value={`${weeklyWorkoutSessions} ${
              weeklyWorkoutSessions === 1 ? "sessão" : "sessões"
            }`}
            subtext="Concluídas nesta semana"
            color="primary"
          />
        </AppCard>

        {/* Bike */}
        <AppCard className="p-4">
          <AppStat
            icon={<AppIcon name="bike" size={18} />}
            label="Bike"
            value={`${bikeMinutes} min`}
            subtext={
              bikeGoal !== null
                ? `Meta: ${bikeGoal} min`
                : "Sem programa ativo"
            }
            color="success"
          />
        </AppCard>
      </div>
    </section>
  );
}
