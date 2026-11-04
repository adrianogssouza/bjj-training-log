import type { WorkoutHistoryEntry, WorkoutSession } from "@/types";

export const pseValidationMessage = "PSE real deve ser um número entre 0 e 10.";

export function parsePseValue(value: string) {
  const normalizedValue = value.trim().replace(",", ".");

  if (!/^\d+(\.\d+)?$/.test(normalizedValue)) {
    return null;
  }

  const pse = Number.parseFloat(normalizedValue);

  return Number.isFinite(pse) ? pse : null;
}

export function isValidPseValue(value: string) {
  const pse = parsePseValue(value);

  return pse !== null && pse >= 0 && pse <= 10;
}

export function isAllowedPseInput(value: string) {
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

  return isValidPseValue(comparableValue);
}

export function sanitizeWorkoutSessionPse<T extends WorkoutSession>(session: T) {
  const sanitizedLogs = Object.fromEntries(
    Object.entries(session.logs).map(([stepId, log]) => [
      stepId,
      {
        ...log,
        actualPse:
          log.actualPse && !isValidPseValue(log.actualPse)
            ? ""
            : log.actualPse,
      },
    ]),
  );

  return {
    ...session,
    logs: sanitizedLogs,
  };
}

export function sanitizeWorkoutHistory(
  history: WorkoutHistoryEntry[],
): WorkoutHistoryEntry[] {
  return history.map((entry) => sanitizeWorkoutSessionPse(entry));
}
