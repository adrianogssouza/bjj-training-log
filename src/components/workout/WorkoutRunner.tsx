"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import type {
  Workout,
  WorkoutBlock,
  WorkoutBlockItem,
  WorkoutHistoryEntry,
  WorkoutSession,
} from "@/types";
import { AppCard } from "@/components/ui/AppCard";
import { AppModal } from "@/components/ui/AppModal";
import { AppButton } from "@/components/ui/AppButton";
import { AppBadge } from "@/components/ui/AppBadge";
import { AppProgress } from "@/components/ui/AppProgress";
import { VideoModal } from "@/components/ui/VideoModal";
import {
  createWorkoutHistoryEntry,
  createWorkoutSession,
  hasWorkoutSessionProgress,
  readActiveWorkoutSession,
  readWorkoutHistory,
  removeActiveWorkoutSession,
  saveActiveWorkoutSession,
  saveWorkoutHistoryEntry,
} from "@/lib/workout-storage";
import {
  isAllowedPseInput,
  isValidPseValue,
  pseValidationMessage,
} from "@/lib/workout-validation";
import {
  getBlockTypeLabel,
  getOrderedWorkoutBlocks,
  getWorkoutCategoryLabel,
  getWorkoutFormatLabel,
} from "@/lib/workouts";

type RunnerStep = {
  id: string;
  block: WorkoutBlock;
  item: WorkoutBlockItem;
};

type WorkoutRunnerProps = {
  workout: Workout;
  autoStart?: boolean;
};

type FieldName = "reps" | "load" | "actualPse";
type RunnerStatus = "idle" | "active" | "completed";
type RunnerView = "overview" | "running";
type SkipAction = "defer" | "skip";
type CompletedSummary = {
  workoutTitle: string;
  durationSeconds: number;
  completedCount: number;
  skippedCount?: number;
};

const skipReasons = [
  "Falta de equipamento",
  "Dor/desconforto",
  "Falta de tempo",
  "Muito cansado",
  "Não quis fazer",
  "Outro",
];

function formatDuration(totalSeconds: number) {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;

  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(
    2,
    "0",
  )}`;
}

function createCompletedSummary(
  historyEntry: WorkoutHistoryEntry,
): CompletedSummary {
  return {
    workoutTitle: historyEntry.workoutTitle,
    durationSeconds: historyEntry.durationSeconds,
    completedCount: Object.values(historyEntry.logs).filter(
      (log) => log.completed,
    ).length,
    skippedCount: Object.values(historyEntry.logs).filter(
      (log) => log.skipped,
    ).length,
  };
}

export function WorkoutRunner({
  autoStart = false,
  workout,
}: WorkoutRunnerProps) {
  const router = useRouter();
  const firstInputRef = useRef<HTMLInputElement>(null);
  const loadInputRef = useRef<HTMLInputElement>(null);
  const pseInputRef = useRef<HTMLInputElement>(null);
  const isAdvancingRef = useRef(false);

  const steps = useMemo<RunnerStep[]>(() => {
    return getOrderedWorkoutBlocks(workout).flatMap((block) =>
      block.items.map((item) => ({
        id: `${block.id}:${item.id}`,
        block,
        item,
      })),
    );
  }, [workout]);

  const createQueuedWorkoutSession = useCallback(() => {
    return {
      ...createWorkoutSession(workout.id),
      stepOrder: steps.map((step) => step.id),
    };
  }, [steps, workout.id]);

  const [session, setSession] = useState<WorkoutSession>(() =>
    createQueuedWorkoutSession(),
  );
  const [runnerStatus, setRunnerStatus] = useState<RunnerStatus>("idle");
  const [runnerView, setRunnerView] = useState<RunnerView>("overview");
  const [isLoaded, setIsLoaded] = useState(false);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [validationMessage, setValidationMessage] = useState("");
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [showSkipOptions, setShowSkipOptions] = useState(false);
  const [skipAction, setSkipAction] = useState<SkipAction | null>(null);
  const [selectedSkipReason, setSelectedSkipReason] = useState("");
  const [customSkipReason, setCustomSkipReason] = useState("");
  const [actionFeedback, setActionFeedback] = useState("");
  const [showCurrentVideo, setShowCurrentVideo] = useState(false);
  const [isAdvancing, setIsAdvancing] = useState(false);
  const [completedSummary, setCompletedSummary] =
    useState<CompletedSummary | null>(null);

  const orderedSteps = useMemo(() => {
    const stepById = new Map(steps.map((step) => [step.id, step]));
    const sessionStepIds = session.stepOrder ?? steps.map((step) => step.id);
    const orderedSessionSteps = sessionStepIds
      .map((stepId) => stepById.get(stepId))
      .filter((step): step is RunnerStep => Boolean(step));
    const missingSteps = steps.filter(
      (step) => !sessionStepIds.includes(step.id),
    );

    return [...orderedSessionSteps, ...missingSteps];
  }, [session.stepOrder, steps]);

  const currentStep = orderedSteps[session.currentStepIndex];
  const progressedCount = Object.values(session.logs).filter(
    (log) => log.completed || log.skipped,
  ).length;
  const progressPercent =
    orderedSteps.length > 0
      ? Math.round((progressedCount / orderedSteps.length) * 100)
      : 0;

  const previousExecutionLog = useMemo(() => {
    if (!currentStep) return null;
    const history = readWorkoutHistory();
    for (const entry of history) {
      if (entry.workoutId === workout.id && entry.logs) {
        const log = entry.logs[currentStep.id];
        if (log && !log.skipped && (log.reps || log.load || log.actualPse)) {
          return log;
        }
      }
    }
    return null;
  }, [workout.id, currentStep]);

  const nextStepIndex = session.currentStepIndex + 1;
  const nextStep =
    nextStepIndex < orderedSteps.length ? orderedSteps[nextStepIndex] : null;
  const isPaused = Boolean(session.pausedAt) && runnerStatus === "active";
  const currentLog = currentStep ? session.logs[currentStep.id] : undefined;
  const canPauseSession =
    runnerStatus === "active" &&
    runnerView === "running" &&
    Boolean(currentStep) &&
    !isPaused;
  const isComplementaryWorkout = workout.type === "complementary";
  const isCurrentCardio = currentStep?.block.type === "cardio";
  const complementaryWorkoutCategory = isComplementaryWorkout
    ? getWorkoutCategoryLabel(workout)
    : "";
  const complementaryWorkoutFormat = isComplementaryWorkout
    ? getWorkoutFormatLabel(workout)
    : "";
  const currentBlockTypeLabel = isComplementaryWorkout
    ? `${complementaryWorkoutCategory} · ${complementaryWorkoutFormat}`
    : currentStep
      ? getBlockTypeLabel(currentStep.block.type)
      : "";
  const primaryFieldLabel = isComplementaryWorkout
    ? "Sequência realizada"
    : isCurrentCardio
      ? "Cardio realizado"
      : currentStep?.item.time
        ? "Tempo realizado"
        : "Reps realizadas";
  const primaryFieldPlaceholder = isComplementaryWorkout
    ? "Ex: vídeo completo"
    : isCurrentCardio
      ? "Ex: 4 rounds de 2min / 1min30s"
      : currentStep?.item.time
        ? "Ex: 20s"
        : "Ex: 8";
  const loadFieldLabel = isComplementaryWorkout
    ? "Observação / método"
    : isCurrentCardio
      ? "Equipamento / método"
      : "Carga usada";
  const loadFieldPlaceholder = isComplementaryWorkout
    ? "Ex: completo, leve, sem dor"
    : isCurrentCardio
      ? "Ex: esteira, bike, corrida, remo"
      : "Ex: 24kg, BW ou elástico";
  const pseFieldLabel = isComplementaryWorkout
    ? "PSE real (opcional)"
    : "PSE real";
  const progressUnitLabel = isComplementaryWorkout ? "etapas" : "exercícios";
  const progressRecordLabel = isComplementaryWorkout
    ? "etapas registradas"
    : "exercícios registrados";
  const currentVideoUrl = currentStep?.item.videoUrl?.trim();
  const shouldAutoStart = autoStart;
  const sessionValidationKey = `${workout.id}:${
    shouldAutoStart ? "auto" : "manual"
  }`;
  const [validatedSessionKey, setValidatedSessionKey] = useState("");
  const isSessionValidated = validatedSessionKey === sessionValidationKey;

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      const storedSession = readActiveWorkoutSession(workout.id);

      if (storedSession?.finishedAt) {
        const historyEntry = createWorkoutHistoryEntry(
          storedSession,
          workout.title,
          storedSession.finishedAt,
        );
        saveWorkoutHistoryEntry(
          historyEntry,
        );
        removeActiveWorkoutSession(workout.id);
        setCompletedSummary(null);

        if (shouldAutoStart) {
          const nextSession = createQueuedWorkoutSession();

          setSession(nextSession);
          setElapsedSeconds(0);
          setRunnerStatus("active");
          setRunnerView("running");
        } else {
          setSession(createQueuedWorkoutSession());
          setRunnerStatus("idle");
        }
      } else if (shouldAutoStart && !storedSession) {
        const nextSession = createQueuedWorkoutSession();

        removeActiveWorkoutSession(workout.id);
        setCompletedSummary(null);
        setSession(nextSession);
        setElapsedSeconds(0);
        setRunnerStatus("active");
        setRunnerView("running");
      } else if (
        storedSession &&
        (hasWorkoutSessionProgress(storedSession) ||
          storedSession.pausedAt ||
          storedSession.currentStepIndex === 0)
      ) {
        setSession(storedSession);
        setRunnerStatus("active");
        if (shouldAutoStart) setRunnerView("running");
      } else if (storedSession) {
        removeActiveWorkoutSession(workout.id);
        setRunnerStatus("idle");
      } else {
        setRunnerStatus("idle");
      }

      if (!shouldAutoStart) {
        setRunnerView("overview");
      }
      setIsLoaded(true);
      setValidatedSessionKey(sessionValidationKey);
    }, 0);

    return () => window.clearTimeout(timeout);
  }, [
    createQueuedWorkoutSession,
    sessionValidationKey,
    shouldAutoStart,
    workout.id,
    workout.title,
  ]);

  useEffect(() => {
    if (!isLoaded) {
      return;
    }

    if (runnerStatus === "active") {
      saveActiveWorkoutSession(session);
      return;
    }

    removeActiveWorkoutSession(workout.id);
  }, [isLoaded, runnerStatus, session, workout.id]);

  useEffect(() => {
    const update = () => {
      const stored = readActiveWorkoutSession(workout.id);
      setSession(stored ?? createQueuedWorkoutSession());
      setRunnerStatus(stored ? "active" : "idle");
      setRunnerView("overview");
      setCompletedSummary(null);
    };
    window.addEventListener("bjj-cloud-updated", update);
    return () => window.removeEventListener("bjj-cloud-updated", update);
  }, [workout.id, createQueuedWorkoutSession]);

  useEffect(() => {
    function updateElapsedTime() {
      const endTime = session.pausedAt
        ? new Date(session.pausedAt).getTime()
        : Date.now();
      const startTime = new Date(session.startedAt).getTime();
      const pausedSeconds = session.totalPausedSeconds ?? 0;

      setElapsedSeconds(
        Math.max(0, Math.floor((endTime - startTime) / 1000) - pausedSeconds),
      );
    }

    if (runnerStatus !== "active") {
      return;
    }

    updateElapsedTime();

    if (session.pausedAt) {
      return;
    }

    const interval = window.setInterval(updateElapsedTime, 1000);

    return () => window.clearInterval(interval);
  }, [
    runnerStatus,
    session.pausedAt,
    session.startedAt,
    session.totalPausedSeconds,
  ]);

  useEffect(() => {
    if (!actionFeedback) {
      return;
    }

    const timeout = window.setTimeout(() => {
      setActionFeedback("");
    }, 1600);

    return () => window.clearTimeout(timeout);
  }, [actionFeedback]);

  useEffect(() => {
    if (
      runnerStatus !== "active" ||
      runnerView !== "running" ||
      isPaused ||
      showSkipOptions ||
      showCancelConfirm ||
      showCurrentVideo
    ) {
      return;
    }

    const timeout = window.setTimeout(() => {
      const fieldToFocus =
        firstInputRef.current ?? loadInputRef.current ?? pseInputRef.current;
      fieldToFocus?.focus({ preventScroll: true });
    }, 150);

    return () => window.clearTimeout(timeout);
  }, [
    currentStep?.id,
    isPaused,
    runnerStatus,
    runnerView,
    showCancelConfirm,
    showCurrentVideo,
    showSkipOptions,
  ]);

  function resetUiState() {
    setValidationMessage("");
    setActionFeedback("");
    setShowCancelConfirm(false);
    setShowSkipOptions(false);
    setSkipAction(null);
    setShowCurrentVideo(false);
    isAdvancingRef.current = false;
    setIsAdvancing(false);
    setSelectedSkipReason("");
    setCustomSkipReason("");
  }

  function showActionFeedback(message: string) {
    setActionFeedback(message);
  }

  function startNewSession() {
    const nextSession = createQueuedWorkoutSession();

    removeActiveWorkoutSession(workout.id);
    setCompletedSummary(null);
    setSession(nextSession);
    setRunnerStatus("active");
    setRunnerView("running");
    setElapsedSeconds(0);
    resetUiState();
  }

  function updateCurrentLog(field: FieldName, value: string) {
    if (!currentStep) {
      return;
    }

    if (field === "reps" && value.trim().startsWith("-")) {
      setValidationMessage(`${primaryFieldLabel} não pode ser negativo.`);
      return;
    }

    if (field === "actualPse" && !isAllowedPseInput(value)) {
      setValidationMessage(pseValidationMessage);
      return;
    }

    setValidationMessage("");

    setSession((currentSession) => {
      const existingLog = currentSession.logs[currentStep.id];

      return {
        ...currentSession,
        logs: {
          ...currentSession.logs,
          [currentStep.id]: {
            blockId: currentStep.block.id,
            itemId: currentStep.item.id,
            reps: existingLog?.reps ?? "",
            load: existingLog?.load ?? "",
            actualPse: existingLog?.actualPse ?? "",
            completed: existingLog?.completed ?? false,
            skipped: existingLog?.skipped,
            skipReason: existingLog?.skipReason,
            [field]: value,
          },
        },
      };
    });
  }

  function finishSession(nextSession: WorkoutSession) {
    const completedAt = new Date().toISOString();
    const completedSession = {
      ...nextSession,
      finishedAt: completedAt,
      pausedAt: undefined,
    };

    const historyEntry = createWorkoutHistoryEntry(
      completedSession,
      workout.title,
      completedAt,
    );

    saveWorkoutHistoryEntry(historyEntry);
    removeActiveWorkoutSession(workout.id);
    setCompletedSummary(createCompletedSummary(historyEntry));
    setSession(createQueuedWorkoutSession());
    setRunnerStatus("completed");
    setRunnerView("overview");
    setElapsedSeconds(0);
    resetUiState();
  }

  function completeAndGoNext() {
    if (!currentStep || isAdvancingRef.current) {
      return;
    }

    isAdvancingRef.current = true;
    setIsAdvancing(true);
    const missingFields = getMissingRequiredFields();

    if (missingFields.length > 0) {
      setValidationMessage(
        `Preencha os campos obrigatórios ou pule este exercício: ${missingFields.join(
          ", ",
        )}.`,
      );
      isAdvancingRef.current = false;
      setIsAdvancing(false);
      return;
    }

    if (currentLog?.reps.trim().startsWith("-")) {
      setValidationMessage(`${primaryFieldLabel} não pode ser negativo.`);
      isAdvancingRef.current = false;
      setIsAdvancing(false);
      return;
    }

    if (
      currentLog?.actualPse.trim() &&
      !isValidPseValue(currentLog.actualPse)
    ) {
      setValidationMessage(pseValidationMessage);
      isAdvancingRef.current = false;
      setIsAdvancing(false);
      return;
    }

    const existingLog = session.logs[currentStep.id];
    const isLastStep = session.currentStepIndex >= orderedSteps.length - 1;
    const nextSession = {
      ...session,
      currentStepIndex: isLastStep
        ? session.currentStepIndex
        : session.currentStepIndex + 1,
      logs: {
        ...session.logs,
        [currentStep.id]: {
          blockId: currentStep.block.id,
          itemId: currentStep.item.id,
          reps: existingLog?.reps ?? "",
          load: existingLog?.load ?? "",
          actualPse: existingLog?.actualPse ?? "",
          completed: true,
          skipped: false,
          skipReason: undefined,
        },
      },
    };

    setValidationMessage("");
    setShowSkipOptions(false);

    if (isLastStep) {
      finishSession(nextSession);
      return;
    }

    setSession(nextSession);
    showActionFeedback("Próximo exercício.");
    window.setTimeout(() => {
      isAdvancingRef.current = false;
      setIsAdvancing(false);
    }, 450);
  }

  function getMissingRequiredFields() {
    if (!currentStep) {
      return [];
    }

    const missingFields: string[] = [];

    if (!currentLog?.reps.trim()) {
      missingFields.push(primaryFieldLabel);
    }

    if (!isComplementaryWorkout && !currentLog?.actualPse.trim()) {
      missingFields.push("PSE real");
    }

    return missingFields;
  }

  function pauseSession() {
    if (!canPauseSession) {
      return;
    }

    setSession((currentSession) => {
      if (currentSession.pausedAt) {
        return currentSession;
      }

      return {
        ...currentSession,
        pausedAt: new Date().toISOString(),
      };
    });
    showActionFeedback("Treino pausado.");
  }

  function resumeSession() {
    setSession((currentSession) => {
      if (!currentSession.pausedAt) {
        return currentSession;
      }

      const pausedForSeconds = Math.max(
        0,
        Math.floor(
          (Date.now() - new Date(currentSession.pausedAt).getTime()) / 1000,
        ),
      );

      return {
        ...currentSession,
        pausedAt: undefined,
        totalPausedSeconds:
          (currentSession.totalPausedSeconds ?? 0) + pausedForSeconds,
      };
    });
    showActionFeedback("Treino retomado.");
  }

  function cancelSession() {
    removeActiveWorkoutSession(workout.id);
    router.push(`/workouts/${workout.id}`);
  }

  function deferCurrentExercise() {
    if (!currentStep) {
      return;
    }

    if (session.currentStepIndex >= orderedSteps.length - 1) {
      resetUiState();
      setValidationMessage(
        "Este exercício já está no final da fila. Faça agora ou escolha Não farei hoje.",
      );
      return;
    }

    const currentStepId = currentStep.id;
    const nextStepOrder = orderedSteps
      .map((step) => step.id)
      .filter((stepId) => stepId !== currentStepId);

    nextStepOrder.push(currentStepId);

    setSession({
      ...session,
      stepOrder: nextStepOrder,
    });
    resetUiState();
    showActionFeedback("Exercício movido para o final.");
  }

  function skipCurrentExercise() {
    if (!currentStep) {
      return;
    }

    const skipReason =
      selectedSkipReason === "Outro"
        ? customSkipReason.trim()
        : selectedSkipReason;

    const existingLog = session.logs[currentStep.id];
    const isLastStep = session.currentStepIndex >= orderedSteps.length - 1;
    const nextSession = {
      ...session,
      currentStepIndex: isLastStep
        ? session.currentStepIndex
        : session.currentStepIndex + 1,
      logs: {
        ...session.logs,
        [currentStep.id]: {
          blockId: currentStep.block.id,
          itemId: currentStep.item.id,
          reps: existingLog?.reps ?? "",
          load: existingLog?.load ?? "",
          actualPse: existingLog?.actualPse ?? "",
          completed: false,
          skipped: true,
          skipReason: skipReason || undefined,
        },
      },
    };

    resetUiState();

    if (isLastStep) {
      finishSession(nextSession);
      return;
    }

    setSession(nextSession);
    showActionFeedback("Exercício pulado.");
  }

  if (!isLoaded || !isSessionValidated) {
    return (
      <main className="flex flex-1 flex-col gap-5 py-8">
        <AppCard>
          <p className="text-sm font-bold text-zinc-300">Carregando treino...</p>
        </AppCard>
      </main>
    );
  }

  if (runnerView === "overview" || runnerStatus !== "active") {
    return (
      <main className="flex flex-1 flex-col gap-5 pb-8 pt-6">
        <section className="flex flex-col gap-3">
          <Link
            href={`/workouts/${workout.id}`}
            className="text-sm font-semibold text-zinc-400 transition-colors hover:text-white"
          >
            Voltar ao treino
          </Link>
          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-red-300">
              Execução
            </p>
            <h1 className="mt-2 break-words text-[28px] font-black leading-9 text-white">
              {workout.title}
            </h1>
          </div>
        </section>

        <AppCard className="p-5">
          {runnerStatus === "idle" ? (
            <div className="flex flex-col gap-4">
              <div>
                <h2 className="text-[20px] font-bold text-[var(--foreground)]">
                  Pronto para começar
                </h2>
                <p className="mt-1 text-[14px] text-[var(--muted)]">
                  Nenhuma sessão ativa foi encontrada neste dispositivo.
                </p>
              </div>
              <AppButton
                onClick={startNewSession}
                variant="primary"
                fullWidth
              >
                Iniciar treino
              </AppButton>
            </div>
          ) : null}

          {runnerStatus === "active" ? (
            <div className="flex flex-col gap-4">
              <div>
                <h2 className="text-[20px] font-bold text-[var(--foreground)]">
                  Treino em andamento
                </h2>
                <p className="mt-1 text-[14px] text-[var(--muted)]">
                  Continue de onde parou ou reinicie a sessão atual.
                </p>
              </div>
              <div className="rounded-[10px] border border-[var(--border)] bg-[var(--surface-elevated)] px-4 py-3">
                <p className="text-[14px] font-bold text-[var(--foreground)]">
                  {progressedCount}/{orderedSteps.length} {progressRecordLabel}
                </p>
              </div>
              <div className="space-y-2">
                <AppButton
                  onClick={() => setRunnerView("running")}
                  variant="primary"
                  fullWidth
                >
                  Continuar treino
                </AppButton>
                <AppButton
                  onClick={startNewSession}
                  variant="secondary"
                  fullWidth
                >
                  Reiniciar treino
                </AppButton>
              </div>
            </div>
          ) : null}

          {runnerStatus === "completed" ? (
            <div className="flex flex-col gap-4">
              <div>
                <p className="text-[13px] font-semibold uppercase tracking-wide text-[var(--success-text)]">
                  Sessão salva
                </p>
                <h2 className="mt-1 text-[24px] font-extrabold text-[var(--foreground)]">
                  Treino concluído
                </h2>
                <p className="mt-1 text-[14px] text-[var(--muted)]">
                  {completedSummary?.workoutTitle ?? workout.title}
                </p>
              </div>

              <dl className="grid grid-cols-2 gap-3 text-[14px]">
                <div className="rounded-[10px] border border-[var(--border)] bg-[var(--surface-elevated)] p-3">
                  <dt className="text-[12px] text-[var(--muted)]">Tempo total</dt>
                  <dd className="mt-0.5 font-bold text-[var(--foreground)]">
                    {formatDuration(completedSummary?.durationSeconds ?? 0)}
                  </dd>
                </div>
                <div className="rounded-[10px] border border-[var(--border)] bg-[var(--surface-elevated)] p-3">
                  <dt className="text-[12px] text-[var(--muted)]">Concluídos</dt>
                  <dd className="mt-0.5 font-bold text-[var(--success-text)]">
                    {completedSummary?.completedCount ?? 0}
                  </dd>
                </div>
                {Boolean(completedSummary?.skippedCount) && (
                  <div className="col-span-2 rounded-[10px] border border-[var(--border)] bg-[var(--surface-elevated)] p-3">
                    <dt className="text-[12px] text-[var(--muted)]">Pulados</dt>
                    <dd className="mt-0.5 font-bold text-[var(--warning)]">
                      {completedSummary?.skippedCount}
                    </dd>
                  </div>
                )}
              </dl>

              <div className="space-y-2 pt-2">
                <AppButton
                  href="/"
                  variant="primary"
                  fullWidth
                >
                  Voltar para Hoje
                </AppButton>
                <AppButton
                  href="/history"
                  variant="secondary"
                  fullWidth
                >
                  Ver histórico
                </AppButton>
                <AppButton
                  onClick={startNewSession}
                  variant="ghost"
                  fullWidth
                >
                  Repetir este treino
                </AppButton>
              </div>
            </div>
          ) : null}
        </AppCard>
      </main>
    );
  }

  if (!currentStep) {
    return (
      <main className="flex flex-1 flex-col gap-5 py-8">
        <AppCard>
          <h1 className="text-2xl font-black text-white">Treino vazio</h1>
          <p className="mt-2 text-sm leading-6 text-zinc-400">
            Este treino ainda não possui exercícios cadastrados.
          </p>
        </AppCard>
      </main>
    );
  }

  return (
    <main className="flex flex-1 flex-col gap-3 pb-[calc(11rem+env(safe-area-inset-bottom))] pt-4 sm:pb-48">
      <section className="flex flex-col gap-2">
        <Link
          href={`/workouts/${workout.id}`}
          className="text-sm font-semibold text-zinc-400 transition-colors hover:text-white"
        >
          Voltar ao treino
        </Link>
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-red-300">
            Execução
          </p>
          <h1 className="mt-1 break-words text-2xl font-black leading-8 text-white">
            {workout.title}
          </h1>
        </div>
      </section>

      <AppCard className="p-3">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
              Progresso
            </p>
            <p className="mt-0.5 text-base font-black text-white">
              {progressedCount}/{orderedSteps.length} {progressUnitLabel}
            </p>
          </div>
          <div className="rounded-lg border border-red-500/40 bg-red-500/10 px-3 py-1.5 text-right">
            <p className="text-xs font-semibold uppercase tracking-wide text-red-200">
              Tempo
            </p>
            <p className="font-mono text-lg font-black text-white">
              {formatDuration(elapsedSeconds)}
            </p>
          </div>
        </div>
        <AppProgress value={progressPercent} color="primary" className="mt-3" />
        {actionFeedback ? (
          <div className="mt-3 rounded-lg border border-emerald-300/30 bg-emerald-300/10 px-3 py-2">
            <p className="text-sm font-bold text-emerald-100">
              {actionFeedback}
            </p>
          </div>
        ) : null}
        {isPaused ? (
          <div className="mt-3 rounded-lg border border-amber-400/40 bg-amber-400/10 px-3 py-2">
            <p className="text-sm font-bold text-amber-100">Treino pausado</p>
          </div>
        ) : null}
      </AppCard>

      <AppCard
        className={`p-3 ${
          isCurrentCardio ? "border-cyan-500/50 bg-cyan-950/20" : ""
        }`}
      >
        <div className="flex flex-col gap-3">
          <div>
            <p
              className={`text-xs font-semibold uppercase tracking-wide ${
                isCurrentCardio ? "text-cyan-200" : "text-red-300"
              }`}
            >
              {currentBlockTypeLabel} · Bloco {currentStep.block.order}
            </p>
            <h2 className="mt-1 break-words text-[20px] font-bold leading-[28px] text-white">
              {currentStep.item.name}
            </h2>
            <p className="mt-1 break-words text-sm leading-5 text-zinc-400">
              {currentStep.block.title}
            </p>
            {currentVideoUrl ? (
              <button
                type="button"
                onClick={() => setShowCurrentVideo(true)}
                className="mt-3 min-h-10 rounded-lg border border-zinc-700 bg-zinc-950 px-3 text-sm font-bold text-zinc-100 transition-colors hover:border-red-400 hover:text-red-100"
              >
                Assistir execução
              </button>
            ) : null}
          </div>

          <dl className="grid grid-cols-3 gap-2 text-sm">
            <div className="rounded-md border border-zinc-800 bg-zinc-900 px-2.5 py-2">
              <dt className="text-xs text-zinc-500">Previsto</dt>
              <dd className="font-semibold text-zinc-100">
                {currentStep.item.reps ?? currentStep.item.time ?? "-"}
              </dd>
            </div>
            <div className="rounded-md border border-zinc-800 bg-zinc-900 px-2.5 py-2">
              <dt className="text-xs text-zinc-500">Sets</dt>
              <dd className="font-semibold text-zinc-100">
                {currentStep.block.sets}
              </dd>
            </div>
            <div className="rounded-md border border-zinc-800 bg-zinc-900 px-2.5 py-2">
              <dt className="text-xs text-zinc-500">PSE alvo</dt>
              <dd className="mt-0.5">
                <AppBadge variant="primary">
                  {currentStep.item.targetPse ?? "-"}
                </AppBadge>
              </dd>
            </div>
          </dl>
        </div>
      </AppCard>

      {/* Referência anterior (Última execução) */}
      {previousExecutionLog && (
        <AppCard variant="secondary" className="p-3 border-[var(--border)] bg-[var(--surface)] space-y-2">
          <p className="text-[12px] font-bold uppercase tracking-wider text-[var(--muted)]">
            Última execução
          </p>
          <dl className="grid grid-cols-3 gap-2 text-[13px]">
            <div className="rounded-[8px] border border-[var(--border)] bg-[var(--surface-elevated)] px-2.5 py-1.5">
              <dt className="text-[11px] text-[var(--muted)]">Reps / Tempo</dt>
              <dd className="font-semibold text-[var(--foreground)]">
                {previousExecutionLog.reps || "-"}
              </dd>
            </div>
            <div className="rounded-[8px] border border-[var(--border)] bg-[var(--surface-elevated)] px-2.5 py-1.5">
              <dt className="text-[11px] text-[var(--muted)]">Carga</dt>
              <dd className="font-semibold text-[var(--foreground)]">
                {previousExecutionLog.load || "-"}
              </dd>
            </div>
            <div className="rounded-[8px] border border-[var(--border)] bg-[var(--surface-elevated)] px-2.5 py-1.5">
              <dt className="text-[11px] text-[var(--muted)]">PSE</dt>
              <dd className="font-semibold text-[var(--foreground)]">
                {previousExecutionLog.actualPse || "-"}
              </dd>
            </div>
          </dl>
        </AppCard>
      )}

      <AppCard className="p-4">
        <div className="flex flex-col gap-4">
          <label className="flex flex-col gap-2">
            <span className="text-[14px] font-medium text-[var(--foreground)]">
              {primaryFieldLabel}
            </span>
            <input
              ref={firstInputRef}
              type="text"
              inputMode={
                isComplementaryWorkout || isCurrentCardio ? "text" : "numeric"
              }
              autoComplete="off"
              value={currentLog?.reps ?? ""}
              onChange={(event) => updateCurrentLog("reps", event.target.value)}
              placeholder={primaryFieldPlaceholder}
              className="min-h-[48px] rounded-[10px] border border-[var(--border)] bg-[var(--surface-elevated)] px-3.5 py-2.5 text-[16px] text-[var(--foreground)] outline-none transition-colors placeholder:text-[var(--muted)] focus:border-[var(--focus)] focus:ring-2 focus:ring-[var(--focus)]"
            />
          </label>

          <label className="flex flex-col gap-2">
            <span className="text-[14px] font-medium text-[var(--foreground)]">
              {loadFieldLabel}
            </span>
            <input
              ref={loadInputRef}
              type="text"
              inputMode="text"
              autoComplete="off"
              value={currentLog?.load ?? ""}
              onChange={(event) => updateCurrentLog("load", event.target.value)}
              placeholder={loadFieldPlaceholder}
              className="min-h-[48px] rounded-[10px] border border-[var(--border)] bg-[var(--surface-elevated)] px-3.5 py-2.5 text-[16px] text-[var(--foreground)] outline-none transition-colors placeholder:text-[var(--muted)] focus:border-[var(--focus)] focus:ring-2 focus:ring-[var(--focus)]"
            />
          </label>

          <label className="flex flex-col gap-2">
            <span className="text-[14px] font-medium text-[var(--foreground)]">
              {pseFieldLabel}
            </span>
            <input
              ref={pseInputRef}
              type="text"
              inputMode="decimal"
              autoComplete="off"
              value={currentLog?.actualPse ?? ""}
              onChange={(event) =>
                updateCurrentLog("actualPse", event.target.value)
              }
              placeholder="0 a 10"
              className="min-h-[48px] rounded-[10px] border border-[var(--border)] bg-[var(--surface-elevated)] px-3.5 py-2.5 text-[16px] text-[var(--foreground)] outline-none transition-colors placeholder:text-[var(--muted)] focus:border-[var(--focus)] focus:ring-2 focus:ring-[var(--focus)]"
            />
          </label>
        </div>
      </AppCard>

      {/* Próximo exercício */}
      <div className="rounded-[12px] border border-[var(--border)] bg-[var(--surface)] p-3 text-[14px]">
        <p className="text-[12px] font-semibold uppercase tracking-wider text-[var(--muted)]">
          Próximo exercício
        </p>
        <p className="mt-0.5 font-bold text-[var(--foreground)]">
          {nextStep ? nextStep.item.name : "Último exercício do treino"}
        </p>
      </div>

      {validationMessage ? (
        <div className="rounded-[10px] border border-[var(--primary-hover)] bg-[var(--primary-soft)]/40 p-3">
          <p className="text-[14px] font-medium text-[var(--primary-text)]">{validationMessage}</p>
        </div>
      ) : null}

      <AppModal
        isOpen={showSkipOptions}
        onClose={() => {
          setShowSkipOptions(false);
          setSkipAction(null);
        }}
        title="Opções do exercício"
        description="Escolha se este exercício volta no fim da sessão ou se não será feito hoje."
        maxWidth="max-w-[460px]"
      >
        <div className="space-y-4">
          {!skipAction ? (
            <div className="grid gap-2">
              <AppButton
                type="button"
                variant="primary"
                onClick={deferCurrentExercise}
                fullWidth
              >
                Fazer depois
              </AppButton>
              <AppButton
                type="button"
                variant="secondary"
                onClick={() => setSkipAction("skip")}
                fullWidth
              >
                Não farei hoje
              </AppButton>
              <AppButton
                type="button"
                variant="ghost"
                onClick={() => {
                  setShowSkipOptions(false);
                  setSkipAction(null);
                }}
                fullWidth
              >
                Cancelar
              </AppButton>
            </div>
          ) : (
            <div className="space-y-4">
              <div>
                <p className="text-[14px] font-medium text-[var(--foreground)]">
                  Motivo opcional
                </p>
                <div className="mt-2 grid grid-cols-1 gap-1.5 sm:grid-cols-2">
                  {skipReasons.map((reason) => (
                    <button
                      key={reason}
                      type="button"
                      onClick={() => {
                        setSelectedSkipReason(reason);
                        if (reason !== "Outro") {
                          setCustomSkipReason("");
                        }
                      }}
                      className={`min-h-[44px] rounded-[10px] border px-3 text-left text-[13px] font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus)] ${
                        selectedSkipReason === reason
                          ? "border-[var(--primary-hover)] bg-[var(--primary-soft)] text-[var(--primary-text)]"
                          : "border-[var(--border)] bg-[var(--surface-elevated)] text-[var(--muted)] hover:text-[var(--foreground)]"
                      }`}
                    >
                      {reason}
                    </button>
                  ))}
                </div>
              </div>

              {selectedSkipReason === "Outro" && (
                <label className="flex flex-col gap-2">
                  <span className="text-[14px] font-medium text-[var(--foreground)]">
                    Descreva o motivo
                  </span>
                  <input
                    value={customSkipReason}
                    onChange={(event) =>
                      setCustomSkipReason(event.target.value)
                    }
                    placeholder="Ex: agenda apertada, equipamento ocupado"
                    className="min-h-[48px] rounded-[10px] border border-[var(--border)] bg-[var(--surface-elevated)] px-3.5 py-2.5 text-[16px] text-[var(--foreground)] outline-none transition-colors placeholder:text-[var(--muted)] focus:border-[var(--focus)] focus:ring-2 focus:ring-[var(--focus)]"
                  />
                </label>
              )}

              <div className="grid grid-cols-2 gap-2 pt-2">
                <AppButton
                  type="button"
                  variant="secondary"
                  onClick={() => {
                    setSkipAction(null);
                    setSelectedSkipReason("");
                    setCustomSkipReason("");
                  }}
                >
                  Voltar
                </AppButton>
                <AppButton
                  type="button"
                  variant="primary"
                  onClick={skipCurrentExercise}
                >
                  Não farei hoje
                </AppButton>
              </div>
            </div>
          )}
        </div>
      </AppModal>

      <AppModal
        isOpen={showCancelConfirm}
        onClose={() => setShowCancelConfirm(false)}
        title="Cancelar treino"
        description="O progresso atual será perdido."
        isDestructive={true}
        maxWidth="max-w-[440px]"
      >
        <div className="space-y-4">
          <p className="text-[14px] leading-[21px] text-[var(--muted)]">
            Tem certeza que deseja cancelar este treino? O progresso desta sessão será perdido.
          </p>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 pt-2">
            <AppButton
              type="button"
              variant="secondary"
              onClick={() => setShowCancelConfirm(false)}
            >
              Continuar treino
            </AppButton>
            <AppButton
              type="button"
              variant="danger"
              onClick={cancelSession}
            >
              Cancelar treino
            </AppButton>
          </div>
        </div>
      </AppModal>

      {showCurrentVideo && currentVideoUrl && (
        <VideoModal
          title={currentStep.item.name}
          videoUrl={currentVideoUrl}
          onClose={() => setShowCurrentVideo(false)}
        />
      )}

      {!showSkipOptions && (
        <div className="sticky bottom-0 -mx-4 border-t border-[var(--border)] bg-[var(--background)]/95 px-4 pb-[calc(0.5rem+env(safe-area-inset-bottom))] pt-2 backdrop-blur sm:-mx-6 sm:px-6 sm:pb-3">
          <div className="mx-auto flex max-w-[960px] flex-col gap-2">
            <AppButton
              type="button"
              variant="primary"
              onClick={completeAndGoNext}
              disabled={isPaused || isAdvancing}
              fullWidth
            >
              {isAdvancing
                ? "Salvando..."
                : session.currentStepIndex >= orderedSteps.length - 1
                  ? "Concluir treino"
                  : "Concluir e próximo"}
            </AppButton>

            <div className="grid grid-cols-2 gap-2">
              {isPaused ? (
                <AppButton
                  type="button"
                  variant="secondary"
                  onClick={resumeSession}
                >
                  Retomar treino
                </AppButton>
              ) : (
                <AppButton
                  type="button"
                  variant="secondary"
                  onClick={pauseSession}
                  disabled={!canPauseSession}
                >
                  Pausar treino
                </AppButton>
              )}
              <AppButton
                type="button"
                variant="secondary"
                onClick={() => setShowSkipOptions(true)}
                disabled={isPaused}
              >
                Opções do exercício
              </AppButton>
            </div>

            <button
              type="button"
              onClick={() => setShowCancelConfirm(true)}
              className="min-h-[44px] rounded-[10px] px-3 text-[13px] font-bold text-[var(--muted)] transition-colors hover:text-[var(--primary-text)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus)]"
            >
              Cancelar treino
            </button>
          </div>
        </div>
      )}
    </main>
  );
}
