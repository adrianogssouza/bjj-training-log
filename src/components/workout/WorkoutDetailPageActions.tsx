"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AppButton } from "@/components/ui/AppButton";
import { AppModal } from "@/components/ui/AppModal";
import {
  hasWorkoutSessionProgress,
  readActiveWorkoutSession,
} from "@/lib/workout-storage";
import type { WorkoutSession } from "@/types";

export interface WorkoutDetailPageActionsProps {
  workoutId: string;
}

export function WorkoutDetailPageActions({ workoutId }: WorkoutDetailPageActionsProps) {
  const router = useRouter();
  const [activeSession, setActiveSession] = useState<WorkoutSession | null>(null);
  const [showRestartConfirm, setShowRestartConfirm] = useState(false);

  useEffect(() => {
    function check() {
      setActiveSession(readActiveWorkoutSession(workoutId));
    }
    check();
    window.addEventListener("bjj-storage-updated", check);
    window.addEventListener("bjj-cloud-updated", check);
    return () => {
      window.removeEventListener("bjj-storage-updated", check);
      window.removeEventListener("bjj-cloud-updated", check);
    };
  }, [workoutId]);

  function handleRestartClick() {
    if (activeSession && hasWorkoutSessionProgress(activeSession)) {
      setShowRestartConfirm(true);
    } else {
      router.push(`/workouts/${workoutId}/start?start=1`);
    }
  }

  function confirmRestart() {
    setShowRestartConfirm(false);
    router.push(`/workouts/${workoutId}/start?start=1`);
  }

  return (
    <>
      <div className="sticky bottom-0 -mx-4 border-t border-[var(--border)] bg-[var(--background)]/95 px-4 pb-[calc(1rem+env(safe-area-inset-bottom))] pt-3 backdrop-blur sm:-mx-6 sm:px-6">
        <div className="mx-auto flex max-w-[960px] flex-col gap-2">
          {activeSession ? (
            <>
              <AppButton
                href={`/workouts/${workoutId}/start?continue=1`}
                variant="primary"
                fullWidth
              >
                Continuar treino
              </AppButton>
              <AppButton
                variant="ghost"
                onClick={handleRestartClick}
                fullWidth
              >
                Reiniciar treino
              </AppButton>
            </>
          ) : (
            <AppButton
              href={`/workouts/${workoutId}/start?start=1`}
              variant="primary"
              fullWidth
            >
              Iniciar treino
            </AppButton>
          )}
        </div>
      </div>

      <AppModal
        isOpen={showRestartConfirm}
        onClose={() => setShowRestartConfirm(false)}
        title="Reiniciar treino?"
        description="Esta sessão já possui etapas registradas."
        isDestructive={true}
        maxWidth="max-w-[440px]"
      >
        <div className="space-y-4">
          <p className="text-[14px] leading-[21px] text-[var(--muted)]">
            Reiniciar o treino descartará o progresso registrado nesta sessão em andamento. Deseja reiniciar do começo?
          </p>

          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 pt-2">
            <AppButton
              variant="secondary"
              onClick={() => setShowRestartConfirm(false)}
            >
              Manter sessão
            </AppButton>
            <AppButton variant="danger" onClick={confirmRestart}>
              Reiniciar
            </AppButton>
          </div>
        </div>
      </AppModal>
    </>
  );
}
