import type { WorkoutHistoryEntry, WorkoutSession } from "../types/index";
import { sanitizeWorkoutSessionPse } from "./workout-validation";

export type TrainingState = {
  version: 1;
  history: WorkoutHistoryEntry[];
  activeSessions: Record<string, WorkoutSession>;
};

export const emptyTrainingState = (): TrainingState => ({ version: 1, history: [], activeSessions: {} });
const record = (v: unknown): v is Record<string, unknown> => !!v && typeof v === "object" && !Array.isArray(v);
const date = (v: unknown): v is string => typeof v === "string" && Number.isFinite(Date.parse(v));
const nonNegative = (v: unknown) => typeof v === "number" && Number.isFinite(v) && v >= 0;

function parseSession(value: unknown): WorkoutSession {
  if (!record(value) || typeof value.workoutId !== "string" || !date(value.startedAt) ||
      !Number.isSafeInteger(value.currentStepIndex) || Number(value.currentStepIndex) < 0 || !record(value.logs)) throw Error("Sessão inválida no backup.");
  if ((value.pausedAt !== undefined && !date(value.pausedAt)) ||
      (value.finishedAt !== undefined && !date(value.finishedAt)) ||
      (value.totalPausedSeconds !== undefined && !nonNegative(value.totalPausedSeconds)) ||
      (value.stepOrder !== undefined && (!Array.isArray(value.stepOrder) || !value.stepOrder.every(x => typeof x === "string")))) throw Error("Sessão inválida no backup.");
  for (const log of Object.values(value.logs)) {
    if (!record(log) || ![log.blockId, log.itemId, log.reps, log.load, log.actualPse].every(x => typeof x === "string") ||
        typeof log.completed !== "boolean" || (log.skipped !== undefined && typeof log.skipped !== "boolean") ||
        (log.skipReason !== undefined && typeof log.skipReason !== "string")) throw Error("Registro de exercício inválido.");
  }
  return sanitizeWorkoutSessionPse(value as unknown as WorkoutSession);
}

export function parseTrainingState(value: unknown): TrainingState {
  if (!record(value) || value.version !== 1 || !Array.isArray(value.history) || !record(value.activeSessions)) throw Error("Formato de backup inválido.");
  const history = value.history.map(entry => {
    const session = parseSession(entry);
    if (!record(entry) || typeof entry.id !== "string" || !date(entry.completedAt) || !nonNegative(entry.durationSeconds) || typeof entry.workoutTitle !== "string") throw Error("Histórico inválido.");
    return { ...entry, ...session } as WorkoutHistoryEntry;
  });
  const activeSessions = Object.fromEntries(Object.entries(value.activeSessions).map(([id, session]) => {
    const parsed = parseSession(session);
    if (parsed.workoutId !== id) throw Error("Identificador de treino inválido.");
    return [id, parsed];
  }));
  return { version: 1, history, activeSessions };
}

/** Explicit import only: retain cloud entries when the same session already exists. */
export function mergeTrainingState(current: TrainingState, incoming: TrainingState): TrainingState {
  const key = (entry: WorkoutHistoryEntry) => `${entry.workoutId}:${entry.startedAt}`;
  const sessions = new Map(incoming.history.map(entry => [key(entry), entry]));
  for (const entry of current.history) sessions.set(key(entry), entry);
  const history = [...sessions.values()].sort((a, b) => Date.parse(b.completedAt) - Date.parse(a.completedAt));
  const activeSessions = { ...incoming.activeSessions, ...current.activeSessions };
  for (const [id, session] of Object.entries(activeSessions)) {
    if (sessions.has(`${id}:${session.startedAt}`)) delete activeSessions[id];
  }
  return { version: 1, history, activeSessions };
}
