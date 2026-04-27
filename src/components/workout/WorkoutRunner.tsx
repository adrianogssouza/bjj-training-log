"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";

import type {
  Workout,
  WorkoutBlock,
  WorkoutBlockItem,
  WorkoutHistoryEntry,
  WorkoutSession,
} from "@/types";
import { AppCard } from "@/components/ui/AppCard";
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
import { getBlockTypeLabel, getOrderedWorkoutBlocks } from "@/lib/workouts";

type RunnerStep = {
  id: string;
  block: WorkoutBlock;
  item: WorkoutBlockItem;
};

type WorkoutRunnerProps = {
  workout: Workout;
};

type FieldName = "reps" | "load" | "actualPse";
type RunnerStatus = "idle" | "active" | "completed";
type RunnerView = "overview" | "running";
type CompletedSummary = {
  workoutTitle: string;
  durationSeconds: number;
  completedCount: number;
};

const skipReasons = [
  "Falta de equipamento",
  "Dor/desconforto",
  "Falta de tempo",
  "Muito cansado",
  "Não quis fazer",
  "Outro",
];

const pseValidationMessage = "PSE real deve ser um número entre 0 e 10.";

function parsePseValue(value: string) {
  const normalizedValue = value.trim().replace(",", ".");

  if (!/^\d+(\.\d+)?$/.test(normalizedValue)) {
    return null;
  }

  const pse = Number.parseFloat(normalizedValue);

  return Number.isFinite(pse) ? pse : null;
}

function isValidPseValue(value: string) {
  const pse = parsePseValue(value);

  return pse !== null && pse >= 0 && pse <= 10;
}

function isAllowedPseInput(value: string) {
  const trimmedValue = value.trim();

  if (!trimmedValue) {
    return true;
  }

  if (!/^\d{0,2}([,.]\d*)?$/.test(trimmedValue)) {
    return false;
  }

  const comparableValue = trimmedValue.replace(/[,.]$/, "");

  if (!comparableValue) {
    return false;
  }

  const pse = parsePseValue(comparableValue);

  return pse !== null && pse >= 0 && pse <= 10;
}

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
  };
}

export function WorkoutRunner({ workout }: WorkoutRunnerProps) {
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

  const [session, setSession] = useState<WorkoutSession>(() =>
    createWorkoutSession(workout.id),
  );
  const [runnerStatus, setRunnerStatus] = useState<RunnerStatus>("idle");
  const [runnerView, setRunnerView] = useState<RunnerView>("overview");
  const [isLoaded, setIsLoaded] = useState(false);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [validationMessage, setValidationMessage] = useState("");
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [showSkipOptions, setShowSkipOptions] = useState(false);
  const [selectedSkipReason, setSelectedSkipReason] = useState("");
  const [customSkipReason, setCustomSkipReason] = useState("");
  const [actionFeedback, setActionFeedback] = useState("");
  const [showCurrentVideo, setShowCurrentVideo] = useState(false);
  const [isAdvancing, setIsAdvancing] = useState(false);
  const [completedSummary, setCompletedSummary] =
    useState<CompletedSummary | null>(null);

  const currentStep = steps[session.currentStepIndex];
  const progressedCount = Object.values(session.logs).filter(
    (log) => log.completed || log.skipped,
  ).length;
  const progressPercent =
    steps.length > 0 ? Math.round((progressedCount / steps.length) * 100) : 0;
  const isPaused = Boolean(session.pausedAt) && runnerStatus === "active";
  const hasPersistableSession =
    hasWorkoutSessionProgress(session) ||
    Boolean(session.pausedAt) ||
    (runnerStatus === "active" && runnerView === "running");
  const currentLog = currentStep ? session.logs[currentStep.id] : undefined;
  const canPauseSession =
    runnerStatus === "active" &&
    runnerView === "running" &&
    Boolean(currentStep) &&
    !isPaused;
  const isCurrentCardio = currentStep?.block.type === "cardio";
  const primaryFieldLabel = isCurrentCardio
    ? "Cardio realizado"
    : currentStep?.item.time
      ? "Tempo realizado"
      : "Reps realizadas";
  const primaryFieldPlaceholder = isCurrentCardio
    ? "Ex: 4 rounds de 2min / 1min30s"
    : currentStep?.item.time
      ? "Ex: 20s"
      : "Ex: 8";
  const loadFieldLabel = isCurrentCardio
    ? "Equipamento / método"
    : "Carga usada";
  const loadFieldPlaceholder = isCurrentCardio
    ? "Ex: esteira, bike, corrida, remo"
    : "Ex: 24kg, BW ou elástico";
  const currentVideoUrl = currentStep?.item.videoUrl?.trim();

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      const storedSession = readActiveWorkoutSession(workout.id);
      const workoutHistory = readWorkoutHistory();
      const latestWorkoutHistory = workoutHistory
        .filter((entry) => entry.workoutId === workout.id)
        .sort(
          (a, b) =>
            new Date(b.completedAt).getTime() -
            new Date(a.completedAt).getTime(),
        )[0];

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
        setCompletedSummary(createCompletedSummary(historyEntry));
        setRunnerStatus("completed");
      } else if (
        storedSession &&
        (hasWorkoutSessionProgress(storedSession) ||
          storedSession.pausedAt ||
          storedSession.currentStepIndex === 0)
      ) {
        setSession(storedSession);
        setRunnerStatus("active");
      } else if (storedSession) {
        removeActiveWorkoutSession(workout.id);
        setRunnerStatus("idle");
      } else if (latestWorkoutHistory) {
        setCompletedSummary(createCompletedSummary(latestWorkoutHistory));
        setRunnerStatus("completed");
      }

      setRunnerView("overview");
      setIsLoaded(true);
    }, 0);

    return () => window.clearTimeout(timeout);
  }, [workout.id, workout.title]);

  useEffect(() => {
    if (!isLoaded) {
      return;
    }

    if (runnerStatus === "active" && hasPersistableSession) {
      saveActiveWorkoutSession(session);
      return;
    }

    removeActiveWorkoutSession(workout.id);
  }, [hasPersistableSession, isLoaded, runnerStatus, session, workout.id]);

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
    const nextSession = createWorkoutSession(workout.id);

    setCompletedSummary(null);
    setSession(nextSession);
    setRunnerStatus("active");
    setRunnerView("running");
    setElapsedSeconds(0);
    resetUiState();
    removeActiveWorkoutSession(workout.id);
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
    setSession(createWorkoutSession(workout.id));
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

    if (!isValidPseValue(currentLog?.actualPse ?? "")) {
      setValidationMessage(pseValidationMessage);
      isAdvancingRef.current = false;
      setIsAdvancing(false);
      return;
    }

    const existingLog = session.logs[currentStep.id];
    const isLastStep = session.currentStepIndex >= steps.length - 1;
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

    if (!currentLog?.actualPse.trim()) {
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

  function skipCurrentExercise() {
    if (!currentStep || !selectedSkipReason) {
      return;
    }

    const skipReason =
      selectedSkipReason === "Outro"
        ? customSkipReason.trim()
        : selectedSkipReason;

    if (!skipReason) {
      setValidationMessage(
        "Descreva o motivo para pular este exercício ou escolha outro motivo.",
      );
      return;
    }

    const existingLog = session.logs[currentStep.id];
    const isLastStep = session.currentStepIndex >= steps.length - 1;
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
          skipReason,
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

  if (!isLoaded) {
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

        <AppCard className="p-4">
          {runnerStatus === "idle" ? (
            <div className="flex flex-col gap-4">
              <div>
                <h2 className="text-xl font-black text-white">
                  Pronto para começar
                </h2>
                <p className="mt-2 text-sm leading-6 text-zinc-400">
                  Nenhuma sessão ativa foi encontrada neste dispositivo.
                </p>
              </div>
              <button
                type="button"
                onClick={startNewSession}
                className="flex min-h-14 w-full items-center justify-center rounded-lg border border-red-400 bg-red-500 px-5 text-center text-base font-bold text-white shadow-lg shadow-red-950/40 transition-colors hover:bg-red-400"
              >
                Iniciar treino
              </button>
            </div>
          ) : null}

          {runnerStatus === "active" ? (
            <div className="flex flex-col gap-4">
              <div>
                <h2 className="text-xl font-black text-white">
                  Treino em andamento
                </h2>
                <p className="mt-2 text-sm leading-6 text-zinc-400">
                  Continue de onde parou ou reinicie a sessão atual.
                </p>
              </div>
              <div className="rounded-lg border border-zinc-800 bg-zinc-900 px-4 py-3">
                <p className="text-sm font-bold text-zinc-100">
                  {progressedCount}/{steps.length} exercícios registrados
                </p>
              </div>
              <button
                type="button"
                onClick={() => setRunnerView("running")}
                className="flex min-h-14 w-full items-center justify-center rounded-lg border border-red-400 bg-red-500 px-5 text-center text-base font-bold text-white shadow-lg shadow-red-950/40 transition-colors hover:bg-red-400"
              >
                Continuar treino
              </button>
              <button
                type="button"
                onClick={startNewSession}
                className="min-h-11 rounded-lg border border-zinc-700 bg-zinc-900 px-4 text-sm font-bold text-zinc-200 transition-colors hover:border-zinc-500"
              >
                Reiniciar treino
              </button>
            </div>
          ) : null}

          {runnerStatus === "completed" ? (
            <div className="flex flex-col gap-4">
              <div>
                <p className="text-sm font-semibold uppercase tracking-wide text-red-300">
                  Sessão salva
                </p>
                <h2 className="mt-1 text-2xl font-black text-white">
                  Treino concluído
                </h2>
                <p className="mt-2 text-sm leading-6 text-zinc-400">
                  {completedSummary?.workoutTitle ?? workout.title}
                </p>
              </div>

              <dl className="grid grid-cols-2 gap-2 text-sm">
                <div className="rounded-md border border-zinc-800 bg-zinc-900 px-3 py-2">
                  <dt className="text-xs text-zinc-500">Tempo total</dt>
                  <dd className="font-semibold text-zinc-100">
                    {formatDuration(completedSummary?.durationSeconds ?? 0)}
                  </dd>
                </div>
                <div className="rounded-md border border-zinc-800 bg-zinc-900 px-3 py-2">
                  <dt className="text-xs text-zinc-500">Concluídos</dt>
                  <dd className="font-semibold text-zinc-100">
                    {completedSummary?.completedCount ?? 0}
                  </dd>
                </div>
              </dl>

              <Link
                href="/history"
                className="flex min-h-14 w-full items-center justify-center rounded-lg border border-red-400 bg-red-500 px-5 text-center text-base font-bold text-white shadow-lg shadow-red-950/40 transition-colors hover:bg-red-400"
              >
                Ver histórico
              </Link>
              <Link
                href="/workouts"
                className="flex min-h-11 items-center justify-center rounded-lg border border-zinc-700 bg-zinc-900 px-4 text-center text-sm font-bold text-zinc-200 transition-colors hover:border-zinc-500"
              >
                Voltar aos treinos
              </Link>
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
    <main className="flex flex-1 flex-col gap-3 pb-48 pt-4">
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
              {progressedCount}/{steps.length} exercícios
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
        <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-zinc-800">
          <div
            className="h-full rounded-full bg-red-500 transition-all"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
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
              {getBlockTypeLabel(currentStep.block.type)} · Bloco{" "}
              {currentStep.block.order}
            </p>
            <h2 className="mt-1 break-words text-lg font-black leading-6 text-white">
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
              <dd className="mt-1 inline-flex min-h-6 items-center rounded-full bg-red-500/20 px-2.5 text-xs font-black text-red-200 ring-1 ring-red-500/40">
                {currentStep.item.targetPse ?? "-"}
              </dd>
            </div>
          </dl>
        </div>
      </AppCard>

      <AppCard className="p-3">
        <div className="flex flex-col gap-3">
          <label className="flex flex-col gap-2">
            <span className="text-sm font-semibold text-zinc-300">
              {primaryFieldLabel}
            </span>
            <input
              ref={firstInputRef}
              type="text"
              inputMode={isCurrentCardio ? "text" : "numeric"}
              autoComplete="off"
              value={currentLog?.reps ?? ""}
              onChange={(event) => updateCurrentLog("reps", event.target.value)}
              placeholder={primaryFieldPlaceholder}
              className="min-h-12 rounded-lg border border-zinc-700 bg-zinc-900 px-4 text-base font-semibold text-white outline-none transition-colors placeholder:text-zinc-600 focus:border-red-400 focus:ring-2 focus:ring-red-500/30"
            />
          </label>

          <label className="flex flex-col gap-2">
            <span className="text-sm font-semibold text-zinc-300">
              {loadFieldLabel}
            </span>
            <input
              ref={loadInputRef}
              type="text"
              inputMode={isCurrentCardio ? "text" : "decimal"}
              autoComplete="off"
              value={currentLog?.load ?? ""}
              onChange={(event) => updateCurrentLog("load", event.target.value)}
              placeholder={loadFieldPlaceholder}
              className="min-h-12 rounded-lg border border-zinc-700 bg-zinc-900 px-4 text-base font-semibold text-white outline-none transition-colors placeholder:text-zinc-600 focus:border-red-400 focus:ring-2 focus:ring-red-500/30"
            />
          </label>

          <label className="flex flex-col gap-2">
            <span className="text-sm font-semibold text-zinc-300">PSE real</span>
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
              className="min-h-12 rounded-lg border border-zinc-700 bg-zinc-900 px-4 text-base font-semibold text-white outline-none transition-colors placeholder:text-zinc-600 focus:border-red-400 focus:ring-2 focus:ring-red-500/30"
            />
          </label>
        </div>
      </AppCard>

      {validationMessage ? (
        <div className="rounded-lg border border-red-500/50 bg-red-500/10 px-4 py-3">
          <p className="text-sm font-bold text-red-100">{validationMessage}</p>
        </div>
      ) : null}

      {showSkipOptions ? (
        <div className="fixed inset-0 z-30 flex items-end bg-black/75 px-4 pb-[calc(1rem+env(safe-area-inset-bottom))] sm:items-center sm:justify-center">
          <AppCard className="max-h-[88vh] w-full max-w-md overflow-y-auto p-3">
            <div className="flex flex-col gap-3">
              <div>
                <h2 className="text-lg font-black text-white">
                  Pular exercício
                </h2>
                <p className="mt-1 text-sm leading-5 text-zinc-400">
                  Escolha um motivo para salvar este exercício como pulado.
                </p>
              </div>
              <div className="grid gap-2">
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
                    className={`min-h-11 rounded-lg border px-3 text-left text-sm font-bold transition-colors ${
                      selectedSkipReason === reason
                        ? "border-red-400 bg-red-500/20 text-red-100"
                        : "border-zinc-800 bg-zinc-900 text-zinc-300"
                    }`}
                  >
                    {reason}
                  </button>
                ))}
              </div>
              {selectedSkipReason === "Outro" ? (
                <label className="flex flex-col gap-2">
                  <span className="text-sm font-semibold text-zinc-300">
                    Descreva o motivo
                  </span>
                  <input
                    value={customSkipReason}
                    onChange={(event) =>
                      setCustomSkipReason(event.target.value)
                    }
                    placeholder="Ex: agenda apertada, equipamento ocupado"
                    className="min-h-12 rounded-lg border border-zinc-700 bg-zinc-900 px-4 text-base font-semibold text-white outline-none transition-colors placeholder:text-zinc-600 focus:border-red-400 focus:ring-2 focus:ring-red-500/30"
                  />
                </label>
              ) : null}
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowSkipOptions(false);
                    setSelectedSkipReason("");
                    setCustomSkipReason("");
                  }}
                  className="min-h-11 rounded-lg border border-zinc-700 bg-zinc-900 px-4 text-sm font-bold text-zinc-200"
                >
                  Voltar
                </button>
                <button
                  type="button"
                  onClick={skipCurrentExercise}
                  disabled={
                    !selectedSkipReason ||
                    (selectedSkipReason === "Outro" &&
                      !customSkipReason.trim())
                  }
                  className="min-h-11 rounded-lg border border-red-400 bg-red-500 px-4 text-sm font-bold text-white disabled:cursor-not-allowed disabled:border-zinc-700 disabled:bg-zinc-800 disabled:text-zinc-500"
                >
                  Confirmar pulo
                </button>
              </div>
            </div>
          </AppCard>
        </div>
      ) : null}

      {showCancelConfirm ? (
        <div className="fixed inset-0 z-20 flex items-end bg-black/70 px-4 pb-[calc(1rem+env(safe-area-inset-bottom))] sm:items-center sm:justify-center">
          <AppCard className="w-full max-w-md p-4">
            <div className="flex flex-col gap-4">
              <div>
                <h2 className="text-lg font-black text-white">
                  Cancelar treino
                </h2>
                <p className="mt-2 text-sm leading-6 text-zinc-300">
                  Tem certeza que deseja cancelar este treino? O progresso atual
                  será perdido.
                </p>
              </div>
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                <button
                  type="button"
                  onClick={() => setShowCancelConfirm(false)}
                  className="min-h-12 rounded-lg border border-zinc-700 bg-zinc-900 px-4 text-sm font-bold text-zinc-100"
                >
                  Continuar treino
                </button>
                <button
                  type="button"
                  onClick={cancelSession}
                  className="min-h-12 rounded-lg border border-red-400 bg-red-500 px-4 text-sm font-bold text-white"
                >
                  Cancelar treino
                </button>
              </div>
            </div>
          </AppCard>
        </div>
      ) : null}

      {showCurrentVideo && currentVideoUrl ? (
        <VideoModal
          title={currentStep.item.name}
          videoUrl={currentVideoUrl}
          onClose={() => setShowCurrentVideo(false)}
        />
      ) : null}

      {!showSkipOptions ? (
        <div className="sticky bottom-0 -mx-4 border-t border-zinc-800 bg-zinc-950/95 px-4 pb-[calc(0.75rem+env(safe-area-inset-bottom))] pt-2.5 backdrop-blur sm:-mx-6 sm:px-6">
          <div className="mx-auto flex max-w-3xl flex-col gap-2">
            <button
              type="button"
              onClick={completeAndGoNext}
              disabled={isPaused || isAdvancing}
              className="flex min-h-[52px] w-full items-center justify-center rounded-lg border border-red-400 bg-red-500 px-5 py-3 text-center text-base font-bold text-white shadow-lg shadow-red-950/40 transition-colors hover:bg-red-400 disabled:cursor-not-allowed disabled:border-zinc-700 disabled:bg-zinc-800 disabled:text-zinc-500 disabled:shadow-none"
            >
              {isAdvancing
                ? "Salvando..."
                : session.currentStepIndex >= steps.length - 1
                  ? "Concluir treino"
                  : "Concluir e próximo"}
            </button>
            <div className="grid grid-cols-2 gap-2">
              {isPaused ? (
                <button
                  type="button"
                  onClick={resumeSession}
                  className="min-h-11 rounded-lg border border-amber-300 bg-amber-300 px-4 text-sm font-black text-amber-950"
                >
                  Retomar treino
                </button>
              ) : (
                <button
                  type="button"
                  onClick={pauseSession}
                  disabled={!canPauseSession}
                  className="min-h-11 rounded-lg border border-zinc-700 bg-zinc-900 px-4 text-sm font-bold text-zinc-200 disabled:cursor-not-allowed disabled:text-zinc-500"
                >
                  Pausar treino
                </button>
              )}
              <button
                type="button"
                onClick={() => setShowSkipOptions(true)}
                disabled={isPaused}
                className="min-h-11 rounded-lg border border-zinc-700 bg-zinc-900 px-4 text-sm font-bold text-zinc-200 disabled:cursor-not-allowed disabled:text-zinc-500"
              >
                Pular exercício
              </button>
            </div>
            <button
              type="button"
              onClick={() => setShowCancelConfirm(true)}
              className="min-h-9 rounded-lg px-4 text-xs font-bold text-zinc-500 transition-colors hover:text-red-200"
            >
              Cancelar treino
            </button>
          </div>
        </div>
      ) : null}
    </main>
  );
}
