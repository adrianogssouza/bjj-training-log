import type {
  Workout,
  WorkoutBlock,
  WorkoutBlockItem,
  WorkoutSessionLog,
} from "@/types";
import { getOrderedWorkoutBlocks } from "./workouts";

/**
 * Uma etapa da execução guiada = uma série de um exercício.
 *
 * Em bi-sets, tri-sets e circuitos as séries são intercaladas por rodada
 * (A1 s1, A2 s1, A1 s2, A2 s2...). Uma rodada termina quando todas as
 * séries daquele número no bloco foram feitas ou puladas.
 */
export type WorkoutStep = {
  id: string;
  block: WorkoutBlock;
  item: WorkoutBlockItem;
  /** Número da série/rodada, começando em 1. */
  set: number;
  totalSets: number;
};

export type StepStatus = "done" | "skipped" | "current" | "pending";

/** Descanso usado quando o bloco tem várias séries mas não informa o tempo. */
export const DEFAULT_REST_SECONDS = 60;

/**
 * A 1ª série mantém o id antigo (`bloco:item`), assim o histórico e as
 * sessões em andamento criadas antes das séries continuam válidos.
 */
export function getStepId(blockId: string, itemId: string, set: number) {
  const baseId = `${blockId}:${itemId}`;
  return set <= 1 ? baseId : `${baseId}#${set}`;
}

/** "3", "3x", "5", "1 válida" → número; faixa "2-3" → maior valor. */
export function parseSetCount(sets: string | undefined): number {
  const numbers = (sets ?? "").match(/\d+/g)?.map(Number) ?? [];
  const count = numbers.length > 0 ? Math.max(...numbers) : 1;
  return Math.min(Math.max(count, 1), 20);
}

/**
 * Lê o descanso prescrito nas notas do bloco, ex.:
 * `Descanso entre séries: 60–90"` → 60, `2–3'` → 120, `90"–2'` → 90.
 * Usa o menor valor da faixa. Sem prescrição, retorna null.
 */
export function parseRestSeconds(notes: string | undefined): number | null {
  if (!notes) return null;
  const match = notes.match(/descanso[^:]*:\s*([^.\n]+)/i);
  if (!match) return null;

  const tokens = [
    ...match[1].matchAll(/(\d+(?:[.,]\d+)?)\s*(min|s\b|seg|["”″]|['’′])?/gi),
  ].map((token) => ({
    value: Number(token[1].replace(",", ".")),
    unit: token[2]?.toLowerCase() ?? "",
  }));
  if (tokens.length === 0) return null;

  // Um número sem unidade herda a unidade do próximo ("60–90\"" → 60s).
  let nextUnit = "";
  const seconds: number[] = [];
  for (let index = tokens.length - 1; index >= 0; index--) {
    const unit = tokens[index].unit || nextUnit;
    nextUnit = unit;
    const isMinutes = unit === "min" || /['’′]/.test(unit);
    seconds.unshift(Math.round(tokens[index].value * (isMinutes ? 60 : 1)));
  }

  const valid = seconds.filter((value) => value > 0);
  return valid.length > 0 ? Math.min(...valid) : null;
}

/** Descanso ao fim de uma rodada do bloco, ou null quando não se aplica. */
export function getBlockRestSeconds(block: WorkoutBlock): number | null {
  const prescribed = parseRestSeconds(block.notes);
  if (prescribed) return prescribed;
  return parseSetCount(block.sets) > 1 ? DEFAULT_REST_SECONDS : null;
}

/**
 * Complementares (mobilidade, core, cardio, anti-lesão) seguem um vídeo:
 * registram uma etapa por exercício, e o "3x" fica só como informação.
 */
export function getTrackedSetCount(workout: Workout, block: WorkoutBlock) {
  return workout.type === "complementary" ? 1 : parseSetCount(block.sets);
}

/** Descanso automático só existe nos treinos principais. */
export function getWorkoutRestSeconds(workout: Workout, block: WorkoutBlock) {
  return workout.type === "complementary" ? null : getBlockRestSeconds(block);
}

export function buildWorkoutSteps(workout: Workout): WorkoutStep[] {
  return getOrderedWorkoutBlocks(workout).flatMap((block) => {
    const totalSets = getTrackedSetCount(workout, block);
    const steps: WorkoutStep[] = [];
    for (let set = 1; set <= totalSets; set++) {
      for (const item of block.items) {
        steps.push({
          id: getStepId(block.id, item.id, set),
          block,
          item,
          set,
          totalSets,
        });
      }
    }
    return steps;
  });
}

export function countWorkoutSteps(workout: Workout) {
  return getOrderedWorkoutBlocks(workout).reduce(
    (total, block) => total + getTrackedSetCount(workout, block) * block.items.length,
    0,
  );
}

/** Aplica a fila salva na sessão; etapas novas entram no fim. */
export function orderSteps(steps: WorkoutStep[], stepOrder?: string[]) {
  const stepById = new Map(steps.map((step) => [step.id, step]));
  const sessionIds = stepOrder ?? steps.map((step) => step.id);
  const seen = new Set<string>();
  const ordered: WorkoutStep[] = [];

  for (const stepId of sessionIds) {
    const step = stepById.get(stepId);
    if (step && !seen.has(stepId)) {
      ordered.push(step);
      seen.add(stepId);
    }
  }

  return [...ordered, ...steps.filter((step) => !seen.has(step.id))];
}

/**
 * Sessão salva com etapas que não existem mais (ex.: séries extras de um
 * complementar aberto antes deste ajuste): remove essas etapas e refaz a
 * fila com as resolvidas primeiro, sem perder o que já foi registrado.
 */
export function normalizeSessionQueue<
  T extends {
    stepOrder?: string[];
    currentStepIndex: number;
    logs: Record<string, WorkoutSessionLog>;
  },
>(session: T, steps: WorkoutStep[]): T {
  const knownIds = new Set(steps.map((step) => step.id));
  const hasStale =
    (session.stepOrder ?? []).some((id) => !knownIds.has(id)) ||
    Object.keys(session.logs).some((id) => !knownIds.has(id));
  if (!hasStale) return session;

  const logs = Object.fromEntries(
    Object.entries(session.logs).filter(([id]) => knownIds.has(id)),
  );
  const ordered = orderSteps(steps, session.stepOrder);
  const resolved = ordered.filter((step) => isStepResolved(logs[step.id]));
  const pending = ordered.filter((step) => !isStepResolved(logs[step.id]));

  return {
    ...session,
    logs,
    stepOrder: [...resolved, ...pending].map((step) => step.id),
    currentStepIndex: Math.min(resolved.length, Math.max(steps.length - 1, 0)),
  };
}

export function isStepResolved(log: WorkoutSessionLog | undefined) {
  return Boolean(log?.completed || log?.skipped);
}

export function getStepStatus(
  step: WorkoutStep,
  currentStepId: string | undefined,
  logs: Record<string, WorkoutSessionLog>,
): StepStatus {
  const log = logs[step.id];
  if (log?.completed) return "done";
  if (log?.skipped) return "skipped";
  return step.id === currentStepId ? "current" : "pending";
}

/**
 * Leva uma etapa para a posição atual da fila ("fazer agora").
 * Pendentes saem de onde estão; uma série pulada volta a ser pendente.
 * Etapas já feitas não mudam.
 */
export function moveStepToCurrent(
  orderedIds: string[],
  currentStepIndex: number,
  stepId: string,
  logs: Record<string, WorkoutSessionLog>,
): { stepOrder: string[]; currentStepIndex: number; logs: Record<string, WorkoutSessionLog> } | null {
  const fromIndex = orderedIds.indexOf(stepId);
  const log = logs[stepId];
  if (fromIndex < 0 || fromIndex === currentStepIndex || log?.completed) {
    return null;
  }

  const stepOrder = orderedIds.filter((id) => id !== stepId);
  const nextLogs = { ...logs };
  let nextIndex = currentStepIndex;

  if (fromIndex < currentStepIndex) {
    // Estava entre as resolvidas (pulada): a fila resolvida encolhe uma posição.
    nextIndex = currentStepIndex - 1;
    if (log) {
      nextLogs[stepId] = {
        ...log,
        completed: false,
        skipped: false,
        skipReason: undefined,
      };
    }
  }

  stepOrder.splice(nextIndex, 0, stepId);
  return { stepOrder, currentStepIndex: nextIndex, logs: nextLogs };
}

/** Move a etapa atual para o fim da fila ("fazer depois"). */
export function deferStep(orderedIds: string[], stepId: string) {
  return [...orderedIds.filter((id) => id !== stepId), stepId];
}

/**
 * Marca como puladas as etapas indicadas, colocando-as logo antes das
 * pendentes para manter a fila "resolvidas primeiro".
 */
export function skipSteps(
  orderedIds: string[],
  currentStepIndex: number,
  stepIds: string[],
) {
  const toSkip = new Set(stepIds);
  const resolved = orderedIds.slice(0, currentStepIndex);
  const pending = orderedIds.slice(currentStepIndex);
  const skipped = pending.filter((id) => toSkip.has(id));
  const remaining = pending.filter((id) => !toSkip.has(id));

  return {
    stepOrder: [...resolved, ...skipped, ...remaining],
    currentStepIndex: resolved.length + skipped.length,
  };
}

/** A rodada `set` do bloco ficou toda resolvida? */
export function isRoundComplete(
  steps: WorkoutStep[],
  blockId: string,
  set: number,
  logs: Record<string, WorkoutSessionLog>,
) {
  const roundSteps = steps.filter(
    (step) => step.block.id === blockId && step.set === set,
  );
  return roundSteps.length > 0 && roundSteps.every((step) => isStepResolved(logs[step.id]));
}

export type BlockGroup = {
  block: WorkoutBlock;
  totalSets: number;
  exercises: {
    item: WorkoutBlockItem;
    steps: WorkoutStep[];
  }[];
};

/** Agrupa as etapas por bloco e exercício, na ordem do treino. */
export function groupStepsByBlock(steps: WorkoutStep[]): BlockGroup[] {
  const groups: BlockGroup[] = [];
  const byBlock = new Map<string, BlockGroup>();

  for (const step of steps) {
    let group = byBlock.get(step.block.id);
    if (!group) {
      group = { block: step.block, totalSets: step.totalSets, exercises: [] };
      byBlock.set(step.block.id, group);
      groups.push(group);
    }
    let exercise = group.exercises.find((entry) => entry.item.id === step.item.id);
    if (!exercise) {
      exercise = { item: step.item, steps: [] };
      group.exercises.push(exercise);
    }
    exercise.steps.push(step);
  }

  for (const group of groups) {
    for (const exercise of group.exercises) {
      exercise.steps.sort((first, second) => first.set - second.set);
    }
  }

  return groups.sort((first, second) => first.block.order - second.block.order);
}

/**
 * Última execução registrada desta série no histórico. Registros antigos
 * (sem número de série) valem para qualquer série do exercício.
 */
export function findPreviousLog(
  history: { workoutId: string; logs?: Record<string, WorkoutSessionLog> }[],
  workoutId: string,
  step: WorkoutStep,
) {
  for (const entry of history) {
    if (entry.workoutId !== workoutId || !entry.logs) continue;
    const exact = entry.logs[step.id];
    if (exact && !exact.skipped && hasValues(exact)) return exact;

    const fallback = Object.values(entry.logs).find(
      (log) =>
        log.blockId === step.block.id &&
        log.itemId === step.item.id &&
        !log.skipped &&
        hasValues(log) &&
        (log.set ?? 1) === 1 &&
        step.set > 1,
    );
    if (fallback) return fallback;
  }
  return null;
}

function hasValues(log: WorkoutSessionLog) {
  return Boolean(log.reps || log.load || log.actualPse);
}
