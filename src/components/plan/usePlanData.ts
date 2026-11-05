"use client";

import { useCallback, useEffect, useState } from "react";
import { loadBikeData, type BikeSession } from "@/lib/bike-cardio";
import { readActiveWorkoutSessions, readWorkoutHistory } from "@/lib/workout-storage";
import {
  PLAN_EVENT,
  emptyPlans,
  loadWeeklyPlans,
  mondayOf,
  storeWeeklyPlans,
  todayIso,
  type WeeklyPlans,
} from "@/lib/weekly-plan";
import type { WorkoutHistoryEntry, WorkoutSession } from "@/types";

const EVENTS = [PLAN_EVENT, "bjj-storage-updated", "bjj-bike-updated", "bjj-cloud-updated", "storage"];

export type PlanData = {
  ready: boolean;
  plans: WeeklyPlans;
  history: WorkoutHistoryEntry[];
  bikeSessions: BikeSession[];
  activeSessions: WorkoutSession[];
  today: string;
  currentMonday: string;
  savePlans: (plans: WeeklyPlans) => void;
};

/** Plano semanal + histórico + Bike, atualizados quando qualquer um muda (inclusive pela nuvem). */
export function usePlanData(): PlanData {
  const [state, setState] = useState(() => ({
    ready: false,
    plans: emptyPlans(),
    history: [] as WorkoutHistoryEntry[],
    bikeSessions: [] as BikeSession[],
    activeSessions: [] as WorkoutSession[],
    today: todayIso(),
  }));

  useEffect(() => {
    function load() {
      let bikeSessions: BikeSession[] = [];
      try {
        bikeSessions = loadBikeData().sessions;
      } catch {
        // Dados da Bike inválidos não devem impedir o plano de aparecer.
      }
      setState({
        ready: true,
        plans: loadWeeklyPlans(),
        history: readWorkoutHistory(),
        bikeSessions,
        activeSessions: readActiveWorkoutSessions(),
        today: todayIso(),
      });
    }
    load();
    EVENTS.forEach((name) => window.addEventListener(name, load));
    return () => EVENTS.forEach((name) => window.removeEventListener(name, load));
  }, []);

  const savePlans = useCallback((plans: WeeklyPlans) => {
    storeWeeklyPlans(plans);
  }, []);

  return { ...state, currentMonday: mondayOf(state.today), savePlans };
}
