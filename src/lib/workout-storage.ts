import type { WorkoutHistoryEntry, WorkoutSession } from "@/types";

export const workoutStorageKeys = {
  history: "bjj-training-log:workout-history",
  activeSession: (workoutId: string) =>
    `bjj-training-log:active-session:${workoutId}`,
  legacySession: (workoutId: string) => `bjj-training-log:session:${workoutId}`,
};

function readJson<T>(key: string, fallback: T): T {
  try {
    const storedValue = window.localStorage.getItem(key);

    return storedValue ? (JSON.parse(storedValue) as T) : fallback;
  } catch {
    return fallback;
  }
}

export function createWorkoutSession(workoutId: string): WorkoutSession {
  return {
    workoutId,
    startedAt: new Date().toISOString(),
    currentStepIndex: 0,
    logs: {},
  };
}

export function hasWorkoutSessionProgress(session: WorkoutSession) {
  const hasLoggedProgress = Object.values(session.logs).some(
    (log) => log.completed || log.skipped,
  );

  return (
    hasLoggedProgress ||
    (session.currentStepIndex > 0 && Object.keys(session.logs).length > 0)
  );
}

export function createWorkoutHistoryEntry(
  session: WorkoutSession,
  workoutTitle: string,
  completedAt: string,
): WorkoutHistoryEntry {
  const pausedSeconds = session.totalPausedSeconds ?? 0;
  const durationSeconds = Math.max(
    0,
    Math.floor(
      (new Date(completedAt).getTime() -
        new Date(session.startedAt).getTime()) /
        1000,
    ) - pausedSeconds,
  );

  return {
    ...session,
    id: `${session.workoutId}:${session.startedAt}`,
    completedAt,
    finishedAt: completedAt,
    durationSeconds,
    workoutTitle,
  };
}

export function readWorkoutHistory() {
  return readJson<WorkoutHistoryEntry[]>(workoutStorageKeys.history, []);
}

export function saveWorkoutHistoryEntry(entry: WorkoutHistoryEntry) {
  const history = readWorkoutHistory();
  const alreadyExists = history.some(
    (historyEntry) =>
      historyEntry.workoutId === entry.workoutId &&
      historyEntry.startedAt === entry.startedAt,
  );

  if (alreadyExists) {
    return history;
  }

  const nextHistory = [entry, ...history];
  window.localStorage.setItem(
    workoutStorageKeys.history,
    JSON.stringify(nextHistory),
  );

  return nextHistory;
}

export function clearWorkoutHistory() {
  window.localStorage.removeItem(workoutStorageKeys.history);
}

export function readActiveWorkoutSession(workoutId: string) {
  const activeKey = workoutStorageKeys.activeSession(workoutId);
  const legacyKey = workoutStorageKeys.legacySession(workoutId);

  const session =
    readJson<WorkoutSession | null>(activeKey, null) ??
    readJson<WorkoutSession | null>(legacyKey, null);

  return session?.workoutId === workoutId ? session : null;
}

export function saveActiveWorkoutSession(session: WorkoutSession) {
  window.localStorage.setItem(
    workoutStorageKeys.activeSession(session.workoutId),
    JSON.stringify(session),
  );
  window.localStorage.removeItem(
    workoutStorageKeys.legacySession(session.workoutId),
  );
}

export function removeActiveWorkoutSession(workoutId: string) {
  window.localStorage.removeItem(workoutStorageKeys.activeSession(workoutId));
  window.localStorage.removeItem(workoutStorageKeys.legacySession(workoutId));
}
