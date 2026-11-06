"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import type {
  Workout,
  WorkoutHistoryEntry,
  WorkoutSession,
  WorkoutSessionLog,
} from "@/types";
import { AppCard } from "@/components/ui/AppCard";
import { AppIcon } from "@/components/ui/AppIcon";
import { AppModal } from "@/components/ui/AppModal";
import { AppButton } from "@/components/ui/AppButton";
import { AppProgress } from "@/components/ui/AppProgress";
import { VideoModal } from "@/components/ui/VideoModal";
import { ExerciseListSheet } from "@/components/workout/ExerciseListSheet";
import { RestPanel } from "@/components/workout/RestPanel";
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
  getWorkoutCategoryLabel,
  getWorkoutFormatLabel,
} from "@/lib/workouts";
import {
  buildWorkoutSteps,
  deferStep,
  findPreviousLog,
  getBlockRestSeconds,
  getStepStatus,
  groupStepsByBlock,
  isRoundComplete,
  isStepResolved,
  moveStepToCurrent,
  orderSteps,
  skipSteps,
  type WorkoutStep,
} from "@/lib/workout-steps";
import {
  readAutoRestPreference,
  saveAutoRestPreference,
} from "@/lib/rest-preference";

type RunnerStep = WorkoutStep;

type WorkoutRunnerProps = {
  workout: Workout;
  autoStart?: boolean;
};

type FieldName = "reps" | "load" | "actualPse";
type RunnerStatus = "idle" | "active" | "completed";
type RunnerView = "overview" | "running";
type SkipAction = "skip-set" | "skip-exercise";
type RestState = {
  endsAt: number;
  totalSeconds: number;
  roundLabel: string;
};
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

function formatRestDuration(totalSeconds: number) {
  if (totalSeconds < 60) return `${totalSeconds}s`;
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return seconds ? `${minutes}min${String(seconds).padStart(2, "0")}` : `${minutes} min`;
}

function emptyLog(step: RunnerStep): WorkoutSessionLog {
  return {
    blockId: step.block.id,
    itemId: step.item.id,
    reps: "",
    load: "",
    actualPse: "",
    completed: false,
    set: step.set,
  };
}

/**
 * Ao chegar numa nova série do mesmo exercício, repete a carga usada na
 * série anterior desta sessão (o usuário pode trocar).
 */
function carryLoadInto(
  logs: Record<string, WorkoutSessionLog>,
  step: RunnerStep | undefined,
  allSteps: RunnerStep[],
) {
  if (!step || logs[step.id] || step.set <= 1) return logs;
  const previousLoad = allSteps
    .filter(
      (candidate) =>
        candidate.block.id === step.block.id &&
        candidate.item.id === step.item.id &&
        candidate.set < step.set,
    )
    .map((candidate) => logs[candidate.id])
    .reverse()
    .find((log) => log?.completed && log.load.trim())?.load;

  return previousLoad
    ? { ...logs, [step.id]: { ...emptyLog(step), load: previousLoad } }
    : logs;
}

function createRestState(totalSeconds: number, roundLabel: string): RestState {
  return { endsAt: Date.now() + totalSeconds * 1000, totalSeconds, roundLabel };
}

function describeStep(step: RunnerStep) {
  return step.totalSets > 1
    ? `${step.item.name} · série ${step.set} de ${step.totalSets}`
    : step.item.name;
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

  const steps = useMemo<RunnerStep[]>(() => buildWorkoutSteps(workout), [
    workout,
  ]);

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
  const [showList, setShowList] = useState(false);
  const [autoRest, setAutoRest] = useState(false);
  const [rest, setRest] = useState<RestState | null>(null);
  const [now, setNow] = useState(() => Date.now());

  const orderedSteps = useMemo(
    () => orderSteps(steps, session.stepOrder),
    [session.stepOrder, steps],
  );
  const blockGroups = useMemo(() => groupStepsByBlock(steps), [steps]);

  const currentStep = orderedSteps[session.currentStepIndex];
  const progressedCount = orderedSteps.filter((step) =>
    isStepResolved(session.logs[step.id]),
  ).length;
  const progressPercent =
    orderedSteps.length > 0
      ? Math.round((progressedCount / orderedSteps.length) * 100)
      : 0;

  const previousExecutionLog = useMemo(() => {
    if (!currentStep) return null;
    return findPreviousLog(readWorkoutHistory(), workout.id, currentStep);
  }, [workout.id, currentStep]);

  const nextStepIndex = session.currentStepIndex + 1;
  const nextStep =
    nextStepIndex < orderedSteps.length ? orderedSteps[nextStepIndex] : null;
  const isPaused = Boolean(session.pausedAt) && runnerStatus === "active";
  const currentLog = currentStep ? session.logs[currentStep.id] : undefined;
  const restRemainingSeconds = rest
    ? Math.max(0, Math.ceil((rest.endsAt - now) / 1000))
    : 0;
  const isResting = Boolean(rest);
  const canPauseSession =
    runnerStatus === "active" &&
    runnerView === "running" &&
    Boolean(currentStep) &&
    !isPaused &&
    !isResting;
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
  const progressUnitLabel = isComplementaryWorkout ? "etapas" : "séries";
  const progressRecordLabel = isComplementaryWorkout
    ? "etapas registradas"
    : "séries registradas";
  const currentExerciseSteps = currentStep
    ? steps.filter(
        (step) =>
          step.block.id === currentStep.block.id &&
          step.item.id === currentStep.item.id,
      )
    : [];
  const currentRestSeconds = currentStep
    ? getBlockRestSeconds(currentStep.block)
    : null;
  const restAfterCurrent = (() => {
    if (!autoRest || !currentStep || !nextStep || !currentRestSeconds) {
      return null;
    }
    const logsIfDone = {
      ...session.logs,
      [currentStep.id]: { ...emptyLog(currentStep), completed: true },
    };
    return isRoundComplete(
      steps,
      currentStep.block.id,
      currentStep.set,
      logsIfDone,
    )
      ? currentRestSeconds
      : null;
  })();
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
      setRest(null);
      setShowList(false);
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
    const timeout = window.setTimeout(() => {
      setAutoRest(readAutoRestPreference());
    }, 0);
    return () => window.clearTimeout(timeout);
  }, []);

  useEffect(() => {
    if (!rest) {
      return;
    }

    const tick = () => {
      const current = Date.now();
      setNow(current);
      if (current >= rest.endsAt) {
        setRest(null);
        setActionFeedback("Descanso terminado. Bora!");
        try {
          navigator.vibrate?.([200, 100, 200]);
        } catch {
          // Vibração não suportada (ex.: iPhone).
        }
      }
    };

    tick();
    const interval = window.setInterval(tick, 250);
    return () => window.clearInterval(interval);
  }, [rest]);

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
      isResting ||
      showList ||
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
    isResting,
    runnerStatus,
    runnerView,
    showList,
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
    setShowList(false);
    setRest(null);
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
            set: currentStep.set,
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
    const nextIndex = isLastStep
      ? session.currentStepIndex
      : session.currentStepIndex + 1;
    const completedLogs = {
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
        set: currentStep.set,
      },
    };
    const nextSession = {
      ...session,
      currentStepIndex: nextIndex,
      logs: isLastStep
        ? completedLogs
        : carryLoadInto(completedLogs, orderedSteps[nextIndex], steps),
    };

    setValidationMessage("");
    setShowSkipOptions(false);

    if (isLastStep) {
      finishSession(nextSession);
      return;
    }

    setSession(nextSession);

    const roundDone = isRoundComplete(
      steps,
      currentStep.block.id,
      currentStep.set,
      completedLogs,
    );
    const restSeconds = getBlockRestSeconds(currentStep.block);

    if (autoRest && roundDone && restSeconds) {
      const nextRest = createRestState(
        restSeconds,
        currentStep.totalSets > 1
          ? `rodada ${currentStep.set} de ${currentStep.totalSets} feita`
          : `bloco ${currentStep.block.order} feito`,
      );
      setNow(nextRest.endsAt - restSeconds * 1000);
      setRest(nextRest);
    } else {
      showActionFeedback(
        currentStep.totalSets > 1 ? "Série registrada." : "Próximo exercício.",
      );
    }

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
        currentStep.totalSets > 1
          ? "Esta série já é a última da fila. Faça agora ou pule."
          : "Este exercício já está no final da fila. Faça agora ou escolha Não farei hoje.",
      );
      return;
    }

    const nextStepOrder = deferStep(
      orderedSteps.map((step) => step.id),
      currentStep.id,
    );
    const nextCurrent = orderSteps(steps, nextStepOrder)[session.currentStepIndex];

    setSession({
      ...session,
      stepOrder: nextStepOrder,
      logs: carryLoadInto(session.logs, nextCurrent, steps),
    });
    resetUiState();
    showActionFeedback("Série movida para o final.");
  }

  function skipCurrentExercise() {
    if (!currentStep || !skipAction) {
      return;
    }

    const skipReason =
      selectedSkipReason === "Outro"
        ? customSkipReason.trim()
        : selectedSkipReason;
    const orderedIds = orderedSteps.map((step) => step.id);
    const pendingIds = orderedSteps
      .slice(session.currentStepIndex)
      .filter((step) => !isStepResolved(session.logs[step.id]));
    const idsToSkip =
      skipAction === "skip-exercise"
        ? pendingIds
            .filter(
              (step) =>
                step.block.id === currentStep.block.id &&
                step.item.id === currentStep.item.id,
            )
            .map((step) => step.id)
        : [currentStep.id];
    const { stepOrder, currentStepIndex } = skipSteps(
      orderedIds,
      session.currentStepIndex,
      idsToSkip,
    );
    const stepById = new Map(steps.map((step) => [step.id, step]));
    const skippedLogs = { ...session.logs };

    for (const stepId of idsToSkip) {
      const step = stepById.get(stepId);
      if (!step) continue;
      const existingLog = session.logs[stepId];
      skippedLogs[stepId] = {
        blockId: step.block.id,
        itemId: step.item.id,
        reps: existingLog?.reps ?? "",
        load: existingLog?.load ?? "",
        actualPse: existingLog?.actualPse ?? "",
        completed: false,
        skipped: true,
        skipReason: skipReason || undefined,
        set: step.set,
      };
    }

    const isFinished = currentStepIndex >= orderedIds.length;
    const nextSession = {
      ...session,
      stepOrder,
      currentStepIndex: isFinished ? orderedIds.length - 1 : currentStepIndex,
      logs: isFinished
        ? skippedLogs
        : carryLoadInto(
            skippedLogs,
            orderSteps(steps, stepOrder)[currentStepIndex],
            steps,
          ),
    };

    resetUiState();

    if (isFinished) {
      finishSession(nextSession);
      return;
    }

    setSession(nextSession);
    showActionFeedback(
      idsToSkip.length > 1
        ? `${idsToSkip.length} séries puladas.`
        : currentStep.totalSets > 1
          ? "Série pulada."
          : "Exercício pulado.",
    );
  }

  function doStepNow(stepId: string) {
    const moved = moveStepToCurrent(
      orderedSteps.map((step) => step.id),
      session.currentStepIndex,
      stepId,
      session.logs,
    );
    const target = steps.find((step) => step.id === stepId);

    if (!moved || !target) {
      setShowList(false);
      return;
    }

    setSession({
      ...session,
      stepOrder: moved.stepOrder,
      currentStepIndex: moved.currentStepIndex,
      logs: carryLoadInto(moved.logs, target, steps),
    });
    resetUiState();
    showActionFeedback(`Agora: ${describeStep(target)}.`);
  }

  function toggleAutoRest() {
    const enabled = !autoRest;
    setAutoRest(enabled);
    saveAutoRestPreference(enabled);
    if (!enabled) setRest(null);
  }

  function addRestTime(seconds: number) {
    setRest((current) =>
      current
        ? {
            ...current,
            endsAt: current.endsAt + seconds * 1000,
            totalSeconds: current.totalSeconds + seconds,
          }
        : current,
    );
  }

  function skipRest() {
    setRest(null);
    showActionFeedback("Descanso encerrado.");
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

  const isLastInQueue = session.currentStepIndex >= orderedSteps.length - 1;
  const primaryActionLabel = isAdvancing
    ? "Salvando..."
    : isLastInQueue
      ? "Concluir treino"
      : currentStep.totalSets > 1
        ? "Concluir série"
        : "Concluir e próximo";
  const remainingSetsOfExercise = orderedSteps
    .slice(session.currentStepIndex)
    .filter(
      (step) =>
        step.block.id === currentStep.block.id &&
        step.item.id === currentStep.item.id &&
        !isStepResolved(session.logs[step.id]),
    ).length;
  const inputClassName =
    "min-h-[48px] rounded-[10px] border border-[var(--border)] bg-[var(--surface-elevated)] px-3.5 py-2.5 text-[16px] text-[var(--foreground)] outline-none transition-colors placeholder:text-[var(--muted)] focus:border-[var(--focus)] focus:ring-2 focus:ring-[var(--focus)]";

  return (
    <main className="flex flex-1 flex-col gap-3 pb-[calc(8.5rem+env(safe-area-inset-bottom))] pt-1 sm:pb-40">
      {/* Modo foco: só o essencial; a lista completa fica em "Ver lista". */}
      <section className="flex items-end justify-between gap-3">
        <div className="min-w-0">
          <Link
            href={`/workouts/${workout.id}`}
            className="text-[13px] font-semibold text-[var(--muted)] transition-colors hover:text-[var(--foreground)]"
          >
            Voltar ao treino
          </Link>
          <h1 className="mt-0.5 truncate text-[17px] font-bold leading-6 text-[var(--foreground)]">
            {workout.title}
          </h1>
        </div>
        <button
          type="button"
          onClick={() => setShowList(true)}
          aria-haspopup="dialog"
          className="inline-flex min-h-[44px] shrink-0 items-center gap-2 rounded-[12px] border border-[var(--border-strong)] bg-[var(--surface-elevated)] px-3.5 text-[14px] font-bold text-[var(--foreground)] transition-colors hover:border-[var(--primary-line)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus)]"
        >
          <AppIcon name="list" size={18} />
          Ver lista
        </button>
      </section>

      {/* Aviso rápido flutuante: não empurra o conteúdo a cada série. */}
      {actionFeedback ? (
        <div
          role="status"
          className="pointer-events-none fixed inset-x-0 top-[calc(68px+env(safe-area-inset-top))] z-30 flex justify-center px-4"
        >
          <p className="rounded-full border border-[var(--success)]/60 bg-[var(--surface-elevated)] px-4 py-2 text-[14px] font-bold text-[var(--success-text)] shadow-lg">
            {actionFeedback}
          </p>
        </div>
      ) : null}

      <AppCard className="px-3 pb-1 pt-2.5">
        <div className="flex items-center justify-between gap-4">
          <p className="text-[14px] text-[var(--muted)]">
            <span className="text-[18px] font-black text-[var(--foreground)]">
              {progressedCount}/{orderedSteps.length}
            </span>{" "}
            {progressUnitLabel}
          </p>
          <p
            className="text-[20px] font-black tabular-nums text-[var(--foreground)]"
            aria-label={`Tempo de treino ${formatDuration(elapsedSeconds)}`}
          >
            {formatDuration(elapsedSeconds)}
          </p>
        </div>
        <AppProgress value={progressPercent} color="primary" size="sm" className="mt-1.5" />

        <button
          type="button"
          role="switch"
          aria-checked={autoRest}
          onClick={toggleAutoRest}
          className="mt-0.5 flex min-h-[44px] w-full items-center justify-between gap-3 rounded-[10px] text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus)]"
        >
          <span className="min-w-0 truncate text-[14px] font-medium text-[var(--foreground)]">
            Descanso automático
            <span className="font-normal text-[var(--muted)]">
              {autoRest
                ? currentRestSeconds
                  ? ` · ${formatRestDuration(currentRestSeconds)} por rodada`
                  : " · por rodada"
                : " · desligado"}
            </span>
          </span>
          <span
            aria-hidden="true"
            className={`relative h-7 w-12 shrink-0 rounded-full border transition-colors ${
              autoRest
                ? "border-[var(--primary)] bg-[var(--primary)]"
                : "border-[var(--border-strong)] bg-[var(--surface-elevated)]"
            }`}
          >
            <span
              className={`absolute top-0.5 h-[22px] w-[22px] rounded-full transition-[left] ${
                autoRest
                  ? "left-[22px] bg-[var(--on-primary)]"
                  : "left-0.5 bg-[var(--muted)]"
              }`}
            />
          </span>
        </button>

        {isPaused ? (
          <div className="mb-2 rounded-lg border border-[var(--warning)]/40 bg-[var(--warning)]/10 px-3 py-2">
            <p className="text-sm font-bold text-[var(--warning)]">Treino pausado</p>
          </div>
        ) : null}
      </AppCard>

      {rest ? (
        <RestPanel
          remainingSeconds={restRemainingSeconds}
          totalSeconds={rest.totalSeconds}
          roundLabel={rest.roundLabel}
          nextLabel={describeStep(currentStep)}
        />
      ) : (
        <>
          <AppCard
            className={`p-3.5 ${
              isCurrentCardio ? "border-cyan-500/50 bg-cyan-950/20" : ""
            }`}
          >
            <p
              className={`text-xs font-semibold uppercase tracking-wide ${
                isCurrentCardio ? "text-cyan-200" : "text-[var(--primary-text)]"
              }`}
            >
              {currentBlockTypeLabel} · Bloco {currentStep.block.order}
            </p>
            <div className="mt-1 flex items-start justify-between gap-3">
              <div className="min-w-0">
                <h2 className="break-words text-[21px] font-bold leading-[26px] text-[var(--foreground)]">
                  {currentStep.item.name}
                </h2>
                {currentStep.block.title !== currentStep.item.name ? (
                  <p className="mt-0.5 truncate text-[13px] leading-[18px] text-[var(--muted)]">
                    {currentStep.block.title}
                  </p>
                ) : null}
              </div>
              {currentVideoUrl ? (
                <button
                  type="button"
                  onClick={() => setShowCurrentVideo(true)}
                  aria-label={`Assistir execução de ${currentStep.item.name}`}
                  className="inline-flex min-h-[44px] shrink-0 items-center gap-1.5 rounded-[10px] border border-[var(--border)] bg-[var(--surface-elevated)] px-3 text-[13px] font-bold text-[var(--foreground)] transition-colors hover:border-[var(--primary-line)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus)]"
                >
                  <AppIcon name="play" size={16} />
                  Vídeo
                </button>
              ) : null}
            </div>

            <div className="mt-2.5 flex flex-wrap items-center gap-x-3 gap-y-2">
              {currentStep.totalSets > 1 ? (
                <div className="flex items-center gap-2.5">
                  <p className="text-[15px] font-bold text-[var(--foreground)]">
                    Série {currentStep.set}{" "}
                    <span className="font-medium text-[var(--muted)]">
                      de {currentStep.totalSets}
                    </span>
                  </p>
                  <ol
                    aria-label="Séries deste exercício"
                    className="flex items-center gap-1.5"
                  >
                    {currentExerciseSteps.map((step) => {
                      const status = getStepStatus(
                        step,
                        currentStep.id,
                        session.logs,
                      );
                      const label = {
                        done: "feita",
                        skipped: "pulada",
                        current: "agora",
                        pending: "pendente",
                      }[status];
                      return (
                        <li
                          key={step.id}
                          aria-label={`Série ${step.set}: ${label}`}
                          className={`h-2.5 rounded-full ${
                            status === "current" ? "w-7" : "w-4"
                          } ${
                            status === "done"
                              ? "bg-[var(--success-text)]"
                              : status === "skipped"
                                ? "border border-dashed border-[var(--warning)]"
                                : status === "current"
                                  ? "bg-[var(--primary)]"
                                  : "bg-[var(--border-strong)]"
                          }`}
                        />
                      );
                    })}
                  </ol>
                </div>
              ) : null}

              {/* Meta da série numa linha só. */}
              <dl className="flex flex-wrap items-center gap-1.5 text-[13px]">
                <div className="flex gap-1 rounded-full border border-[var(--border)] bg-[var(--surface-elevated)] px-2.5 py-1">
                  <dt className="text-[var(--muted)]">Meta</dt>
                  <dd className="font-semibold text-[var(--foreground)]">
                    {currentStep.item.reps ?? currentStep.item.time ?? "-"}
                  </dd>
                </div>
                {currentStep.item.targetPse ? (
                  <div className="flex gap-1 rounded-full border border-[var(--primary-line)] bg-[var(--primary-tint)] px-2.5 py-1">
                    <dt className="text-[var(--muted)]">PSE</dt>
                    <dd className="font-semibold text-[var(--primary-text)]">
                      {currentStep.item.targetPse}
                    </dd>
                  </div>
                ) : null}
                {!/^\d+\s*x?$/i.test(currentStep.block.sets.trim()) ? (
                  <div className="flex gap-1 rounded-full border border-[var(--border)] bg-[var(--surface-elevated)] px-2.5 py-1">
                    <dt className="text-[var(--muted)]">Séries</dt>
                    <dd className="font-semibold text-[var(--foreground)]">
                      {currentStep.block.sets}
                    </dd>
                  </div>
                ) : null}
              </dl>
            </div>

            {currentStep.item.notes ? (
              <p className="mt-2 break-words text-[13px] leading-[18px] text-[var(--foreground-soft)]">
                {currentStep.item.notes}
              </p>
            ) : null}
          </AppCard>

          <AppCard className="p-3.5">
            {previousExecutionLog ? (
              <p className="mb-3 text-[13px] text-[var(--muted)]">
                Última vez
                {currentStep.totalSets > 1 ? ` (série ${currentStep.set})` : ""}:{" "}
                <span className="font-semibold text-[var(--foreground)]">
                  {[
                    previousExecutionLog.reps || "-",
                    previousExecutionLog.load || "sem carga",
                    `PSE ${previousExecutionLog.actualPse || "-"}`,
                  ].join(" · ")}
                </span>
              </p>
            ) : null}

            <div className="grid grid-cols-[minmax(0,1fr)_7rem] gap-3">
              <label className="flex min-w-0 flex-col justify-end gap-1.5">
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
                  className={inputClassName}
                />
              </label>

              <label className="flex min-w-0 flex-col justify-end gap-1.5">
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
                  className={inputClassName}
                />
              </label>

              <label className="col-span-2 flex min-w-0 flex-col gap-1.5">
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
                  className={inputClassName}
                />
              </label>
            </div>
          </AppCard>

          <div className="rounded-[12px] border border-[var(--border)] bg-[var(--surface)] p-3 text-[14px]">
            <p className="text-[12px] text-[var(--muted)]">Próximo</p>
            {restAfterCurrent ? (
              <p className="mt-0.5 text-[13px] font-semibold text-[var(--primary-text)]">
                Descanso de {formatRestDuration(restAfterCurrent)} antes
              </p>
            ) : null}
            <p className="mt-0.5 font-bold text-[var(--foreground)]">
              {nextStep ? describeStep(nextStep) : "Último do treino"}
            </p>
          </div>
        </>
      )}

      {validationMessage ? (
        <div className="rounded-[10px] border border-[var(--primary-hover)] bg-[var(--primary-soft)]/40 p-3">
          <p className="text-[14px] font-medium text-[var(--primary-text)]">{validationMessage}</p>
        </div>
      ) : null}

      {/* Fora da barra fixa: libera espaço para os campos da série. */}
      <button
        type="button"
        onClick={() => setShowCancelConfirm(true)}
        className="mx-auto min-h-[44px] rounded-[10px] px-3 text-[13px] font-bold text-[var(--muted)] transition-colors hover:text-[var(--primary-text)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus)]"
      >
        Cancelar treino
      </button>

      <ExerciseListSheet
        isOpen={showList}
        onClose={() => setShowList(false)}
        groups={blockGroups}
        currentStepId={currentStep.id}
        logs={session.logs}
        onDoNow={doStepNow}
      />

      <AppModal
        isOpen={showSkipOptions}
        onClose={() => {
          setShowSkipOptions(false);
          setSkipAction(null);
        }}
        title={currentStep.totalSets > 1 ? "Opções da série" : "Opções do exercício"}
        description={
          currentStep.totalSets > 1
            ? "Mova esta série para o fim, pule só ela ou deixe o exercício para outro dia."
            : "Escolha se este exercício volta no fim da sessão ou se não será feito hoje."
        }
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
              {currentStep.totalSets > 1 ? (
                <AppButton
                  type="button"
                  variant="secondary"
                  onClick={() => setSkipAction("skip-set")}
                  fullWidth
                >
                  Pular esta série
                </AppButton>
              ) : null}
              <AppButton
                type="button"
                variant="secondary"
                onClick={() => setSkipAction("skip-exercise")}
                fullWidth
              >
                {remainingSetsOfExercise > 1
                  ? `Não farei hoje (${remainingSetsOfExercise} séries)`
                  : "Não farei hoje"}
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
                    className={inputClassName}
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
                  {skipAction === "skip-set" ? "Pular série" : "Não farei hoje"}
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
          <div className="grid grid-cols-1 gap-2 pt-2 sm:grid-cols-2">
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

      {!showSkipOptions && !showList && (
        <div className="sticky bottom-0 -mx-4 border-t border-[var(--border)] bg-[var(--background)]/95 px-4 pb-[calc(0.5rem+env(safe-area-inset-bottom))] pt-2 backdrop-blur sm:-mx-6 sm:px-6 sm:pb-3">
          <div className="mx-auto flex max-w-[960px] flex-col gap-2">
            {rest ? (
              <>
                <AppButton
                  type="button"
                  variant="primary"
                  onClick={skipRest}
                  fullWidth
                >
                  Pular descanso
                </AppButton>
                <AppButton
                  type="button"
                  variant="secondary"
                  onClick={() => addRestTime(30)}
                  fullWidth
                >
                  Mais 30 segundos
                </AppButton>
              </>
            ) : (
              <>
                <AppButton
                  type="button"
                  variant="primary"
                  onClick={completeAndGoNext}
                  disabled={isPaused || isAdvancing}
                  fullWidth
                >
                  {primaryActionLabel}
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
                    {currentStep.totalSets > 1 ? "Opções da série" : "Opções do exercício"}
                  </AppButton>
                </div>
              </>
            )}

          </div>
        </div>
      )}
    </main>
  );
}
