import type { WorkoutHistoryEntry } from "@/types";
import { parseLoadKg } from "./progress";

/* ------------------------------------------------------------------ */
/* Avaliação da sessão                                                 */
/* ------------------------------------------------------------------ */

export type Feeling = 1 | 2 | 3 | 4 | 5;

export const FEELING_OPTIONS: { value: Feeling; label: string }[] = [
  { value: 1, label: "Péssimo" },
  { value: 2, label: "Ruim" },
  { value: 3, label: "Ok" },
  { value: 4, label: "Bom" },
  { value: 5, label: "Ótimo" },
];

/** "Nenhum" não é guardado como texto: vira a lista vazia (`pains: []`). */
export const NO_PAIN_LABEL = "Nenhum";
export const PAIN_OPTIONS = ["Ombro", "Joelho", "Lombar", "Pescoço", "Cotovelo", "Punho"] as const;

export const NOTE_MAX_LENGTH = 500;
const PAIN_MAX_LENGTH = 40;
const PAINS_MAX_ITEMS = 12;

export type SessionFeedback = {
  feeling?: Feeling;
  /** [] = "Nenhum" marcado; ausente = não respondido. */
  pains?: string[];
  note?: string;
};

export function feelingLabel(value: number): string {
  const rounded = Math.min(5, Math.max(1, Math.round(value)));
  return FEELING_OPTIONS[rounded - 1].label;
}

export const isFeeling = (value: unknown): value is Feeling =>
  Number.isInteger(value) && Number(value) >= 1 && Number(value) <= 5;

/**
 * Valida os campos opcionais de avaliação de uma entrada do histórico
 * (backup, nuvem ou localStorage). Ausentes são aceitos; tipos errados
 * invalidam o estado, como os demais campos do histórico.
 */
export function parseSessionFeedbackFields(entry: Record<string, unknown>): SessionFeedback {
  const result: SessionFeedback = {};
  if (entry.feeling !== undefined) {
    if (!isFeeling(entry.feeling)) throw Error("Sensação da sessão inválida.");
    result.feeling = entry.feeling;
  }
  if (entry.pains !== undefined) {
    if (
      !Array.isArray(entry.pains) ||
      entry.pains.length > PAINS_MAX_ITEMS ||
      !entry.pains.every((p) => typeof p === "string" && p.trim() !== "" && p.length <= PAIN_MAX_LENGTH)
    ) {
      throw Error("Incômodos da sessão inválidos.");
    }
    result.pains = [...new Set((entry.pains as string[]).map((p) => p.trim()))];
  }
  if (entry.note !== undefined) {
    if (typeof entry.note !== "string" || entry.note.length > NOTE_MAX_LENGTH * 4) {
      throw Error("Observação da sessão inválida.");
    }
    result.note = entry.note;
  }
  return result;
}

/**
 * Normaliza o que a tela de conclusão enviou: tira espaços, descarta vazios
 * e devolve só os campos respondidos.
 */
export function normalizeSessionFeedback(input: {
  feeling?: number | null;
  pains?: string[] | null;
  note?: string | null;
}): SessionFeedback {
  const feedback: SessionFeedback = {};
  if (isFeeling(input.feeling)) feedback.feeling = input.feeling;
  if (Array.isArray(input.pains)) {
    const pains = [...new Set(input.pains.map((p) => p.trim()).filter((p) => p && p !== NO_PAIN_LABEL))];
    feedback.pains = pains;
  }
  const note = input.note?.trim().slice(0, NOTE_MAX_LENGTH);
  if (note) feedback.note = note;
  return feedback;
}

/** Média de sensação das sessões avaliadas (null se nenhuma tiver). */
export function averageFeeling(entries: WorkoutHistoryEntry[]): { average: number; count: number } | null {
  const values = entries.map((e) => e.feeling).filter(isFeeling);
  if (values.length === 0) return null;
  const average = Math.round((values.reduce((sum, v) => sum + v, 0) / values.length) * 10) / 10;
  return { average, count: values.length };
}

/* ------------------------------------------------------------------ */
/* Resumo da conclusão                                                 */
/* ------------------------------------------------------------------ */

/**
 * Número de repetições do texto livre ("8", "6 c/lado", "12 totais").
 * Registros de tempo ("30s", "1 min", "45\"") não contam como repetições.
 */
export function parseRepsCount(text: string | undefined | null): number | null {
  if (!text) return null;
  if (/\d\s*(s\b|seg|min|'|"|″|′)/i.test(text)) return null;
  const match = text.match(/\d+/);
  if (!match) return null;
  const reps = Number.parseInt(match[0], 10);
  return reps > 0 ? reps : null;
}

export type SessionSummary = {
  durationSeconds: number;
  doneSets: number;
  skippedSets: number;
  /** Soma de reps × carga (kg) das séries feitas com os dois números. */
  volumeKg: number;
};

export function summarizeSession(entry: WorkoutHistoryEntry): SessionSummary {
  const logs = Object.values(entry.logs);
  let volumeKg = 0;
  for (const log of logs) {
    if (!log.completed || log.skipped) continue;
    const reps = parseRepsCount(log.reps);
    const load = parseLoadKg(log.load);
    if (reps !== null && load !== null) volumeKg += reps * load;
  }
  return {
    durationSeconds: entry.durationSeconds,
    doneSets: logs.filter((log) => log.completed && !log.skipped).length,
    skippedSets: logs.filter((log) => log.skipped).length,
    volumeKg: Math.round(volumeKg * 10) / 10,
  };
}

/** "1.240 kg" */
export function formatVolume(volumeKg: number): string {
  return `${volumeKg.toLocaleString("pt-BR", { maximumFractionDigits: 1 })} kg`;
}
