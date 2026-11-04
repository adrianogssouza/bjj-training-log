"use client";

import { useState } from "react";
import type { WorkoutSession } from "@/types";
import { seedWorkouts } from "@/data/seed-workouts";
import { AppCard } from "@/components/ui/AppCard";
import { AppButton } from "@/components/ui/AppButton";
import { AppProgress } from "@/components/ui/AppProgress";
import { AppBadge } from "@/components/ui/AppBadge";

export interface ActiveWorkoutSectionProps {
  sessions: WorkoutSession[];
}

export function ActiveWorkoutSection({ sessions }: ActiveWorkoutSectionProps) {
  const [showAll, setShowAll] = useState(false);

  if (!sessions || sessions.length === 0) {
    return null;
  }

  // Sort by startedAt descending (most recent first)
  const sortedSessions = [...sessions].sort((a, b) => {
    const timeA = new Date(a.startedAt).getTime() || 0;
    const timeB = new Date(b.startedAt).getTime() || 0;
    return timeB - timeA;
  });

  const primarySession = sortedSessions[0];
  const otherSessions = sortedSessions.slice(1);

  function renderSessionCard(session: WorkoutSession) {
    const workout = seedWorkouts.find((w) => w.id === session.workoutId);
    const workoutTitle = workout?.title || session.workoutId;
    const totalItems = workout
      ? workout.blocks.reduce((acc, b) => acc + b.items.length, 0)
      : Object.keys(session.logs || {}).length;
    const registeredCount = Object.keys(session.logs || {}).length;
    const progressPercent =
      totalItems > 0 ? (registeredCount / totalItems) * 100 : 0;

    return (
      <AppCard
        key={session.workoutId}
        className="space-y-4 border-[#DC2626]/40 bg-[#450A0A]/20 p-5"
      >
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <AppBadge variant="primary">Em andamento</AppBadge>
            </div>
            <h3 className="text-[18px] font-bold leading-[25px] text-[#F4F4F5]">
              {workoutTitle}
            </h3>
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex justify-between text-[13px] font-medium text-[#A1A1AA]">
            <span>
              {registeredCount} de {totalItems} etapas registradas
            </span>
            <span>{Math.round(progressPercent)}%</span>
          </div>
          <AppProgress value={progressPercent} color="primary" />
        </div>

        <div className="pt-1">
          <AppButton
            href={`/workouts/${session.workoutId}/start?continue=1`}
            variant="primary"
            fullWidth
          >
            Continuar treino
          </AppButton>
        </div>
      </AppCard>
    );
  }

  return (
    <section className="space-y-3" aria-labelledby="active-workout-heading">
      <h2
        id="active-workout-heading"
        className="text-[20px] font-bold leading-[28px] text-[#F4F4F5]"
      >
        Treino em andamento
      </h2>

      {renderSessionCard(primarySession)}

      {otherSessions.length > 0 && !showAll && (
        <button
          type="button"
          onClick={() => setShowAll(true)}
          className="text-[14px] font-medium text-[#FCA5A5] hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#93C5FD] rounded px-1"
        >
          Ver outros em andamento ({otherSessions.length})
        </button>
      )}

      {showAll && otherSessions.map((s) => renderSessionCard(s))}
    </section>
  );
}
