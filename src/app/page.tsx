"use client";

import { useEffect, useState } from "react";
import { readActiveWorkoutSessions } from "@/lib/workout-storage";
import type { WorkoutSession } from "@/types";
import { TodayHeader } from "@/components/home/TodayHeader";
import { ActiveWorkoutSection } from "@/components/home/ActiveWorkoutSection";
import { PrincipalWorkoutsSection } from "@/components/home/PrincipalWorkoutsSection";
import { BikeCardioHomeCard } from "@/components/home/BikeCardioHomeCard";
import { WeekSummarySection } from "@/components/home/WeekSummarySection";
import { LastSessionSection } from "@/components/home/LastSessionSection";
import { AppButton } from "@/components/ui/AppButton";

export default function HomePage() {
  const [activeSessions, setActiveSessions] = useState<WorkoutSession[]>([]);

  useEffect(() => {
    function load() {
      setActiveSessions(readActiveWorkoutSessions());
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

  return (
    <div className="flex flex-1 flex-col gap-6">
      {/* 1. Cabeçalho 'Hoje' */}
      <TodayHeader />

      {/* 2. Treino em andamento, quando existir */}
      <ActiveWorkoutSection sessions={activeSessions} />

      {/* 3. Acesso ao treino principal */}
      <PrincipalWorkoutsSection />

      {/* 4. Cartão Bike Cardio */}
      <BikeCardioHomeCard />

      {/* 5. Resumo da semana */}
      <WeekSummarySection />

      {/* 6. Última sessão */}
      <LastSessionSection />

      {/* 7. Link para todos os treinos */}
      <section className="pt-2">
        <AppButton href="/workouts" variant="secondary" fullWidth>
          Ver todos os treinos
        </AppButton>
      </section>
    </div>
  );
}
