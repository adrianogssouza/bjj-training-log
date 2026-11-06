"use client";

import { useEffect, useState } from "react";
import { AppCard } from "@/components/ui/AppCard";
import { AppStat } from "@/components/ui/AppStat";
import { AppIcon } from "@/components/ui/AppIcon";
import { readWorkoutHistory } from "@/lib/workout-storage";
import {
  loadBikeData,
  getEffectiveWeek,
  BIKE_PLAN,
  type BikeData,
} from "@/lib/bike-cardio";
import { getSaoPauloWeekRange } from "@/lib/date-utils";
import { averageFeeling, feelingLabel } from "@/lib/session-feedback";
import { formatNumber } from "@/lib/progress";
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
    window.addEventListener("bjj-cloud-updated", load);
    window.addEventListener("storage", load);
    return () => {
      window.removeEventListener("bjj-storage-updated", load);
      window.removeEventListener("bjj-bike-updated", load);
      window.removeEventListener("bjj-cloud-updated", load);
      window.removeEventListener("storage", load);
    };
  }, []);

  const { start, end, startIsoDate, endIsoDate } = getSaoPauloWeekRange();
  const startTime = start.getTime();
  const endTime = end.getTime();

  // Musculação: sessões concluídas na semana (Seg-Dom em America/Sao_Paulo)
  const weeklyEntries = history.filter((entry) => {
    const timestamp = new Date(entry.completedAt || entry.startedAt).getTime();
    return Number.isFinite(timestamp) && timestamp >= startTime && timestamp <= endTime;
  });
  const weeklyWorkoutSessions = weeklyEntries.length;
  // Sensação média das sessões avaliadas na semana (avaliação é opcional).
  const weeklyFeeling = averageFeeling(weeklyEntries);

  // Bike: minutos realizados na semana de calendário (Segunda a Domingo, America/Sao_Paulo)
  // Somar apenas sessões com status === "completed"
  const weeklyBikeMinutes = (bikeData?.sessions ?? [])
    .filter((session) => {
      if (session.status !== "completed") return false;
      const sessionDate = session.date;
      return sessionDate >= startIsoDate && sessionDate <= endIsoDate;
    })
    .reduce((sum, s) => sum + (s.minutes || 0), 0);

  // Meta do ciclo baseada no plano progressivo da semana vigente do programa
  const hasBike = Boolean(bikeData && bikeData.sessions && bikeData.sessions.length > 0);
  const effectiveWeek = bikeData ? getEffectiveWeek(bikeData) : 1;
  const currentPlan = BIKE_PLAN[effectiveWeek - 1];
  const bikeCycleGoal = hasBike && currentPlan ? currentPlan.sessions * currentPlan.minutes : null;

  return (
    <section className="space-y-3" aria-labelledby="week-summary-heading">
      <h2
        id="week-summary-heading"
        className="text-[20px] font-bold leading-[28px] text-[var(--foreground)]"
      >
        Resumo da semana
      </h2>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
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
            value={`${weeklyBikeMinutes} min`}
            subtext={
              bikeCycleGoal !== null
                ? `Meta do ciclo: ${bikeCycleGoal} min`
                : "Sem programa ativo"
            }
            color="success"
          />
        </AppCard>

        {/* Sensação média (avaliação ao concluir o treino) */}
        <AppCard className="col-span-2 p-4 sm:col-span-1">
          <AppStat
            label="Sensação média"
            value={
              weeklyFeeling ? (
                <span>
                  {formatNumber(weeklyFeeling.average)}
                  <span className="ml-1.5 text-[16px] font-semibold text-[var(--muted)]">
                    {feelingLabel(weeklyFeeling.average)}
                  </span>
                </span>
              ) : (
                "-"
              )
            }
            subtext={
              weeklyFeeling
                ? `${weeklyFeeling.count} ${weeklyFeeling.count === 1 ? "treino avaliado" : "treinos avaliados"} de 1 a 5`
                : "Avalie ao concluir o treino"
            }
          />
        </AppCard>
      </div>
    </section>
  );
}
