import type { Workout, WorkoutHistoryEntry } from "@/types";
import type { TrainingCycle } from "@/data/training-cycles";
import { isValidPseValue, parsePseValue } from "./workout-validation";

/* ------------------------------------------------------------------ */
/* Carga                                                               */
/* ------------------------------------------------------------------ */

const NUMBER_WITH_UNIT = /(\d+(?:[.,]\d+)?)\s*(kg|quilos?|kilos?)?/gi;

/**
 * Extrai a carga em kg do texto livre do registro.
 *
 * - "24 kg", "24kg", "24,5 kg" → 24 / 24 / 24,5
 * - Quando há número seguido de "kg", só esses contam ("2x12kg" → 12,
 *   "BW + 10kg" → 10); havendo mais de um, vale o maior ("16/20 kg" → 20).
 * - Sem "kg", vale o maior número do texto ("24" → 24).
 * - Sem número ("BW", "elástico", "") ou só zero → null (fica de fora).
 */
export function parseLoadKg(text: string | undefined | null): number | null {
  if (!text) return null;
  const withUnit: number[] = [];
  const plain: number[] = [];
  for (const match of text.matchAll(NUMBER_WITH_UNIT)) {
    const value = Number.parseFloat(match[1].replace(",", "."));
    if (!Number.isFinite(value)) continue;
    (match[2] ? withUnit : plain).push(value);
  }
  const candidates = withUnit.length > 0 ? withUnit : plain;
  if (candidates.length === 0) return null;
  const load = Math.max(...candidates);
  return load > 0 ? load : null;
}

/** "22.5" → "22,5 kg" (pt-BR, no máximo uma casa). */
export function formatKg(value: number): string {
  return `${formatNumber(value)} kg`;
}

export function formatNumber(value: number, maximumFractionDigits = 1): string {
  return value.toLocaleString("pt-BR", { maximumFractionDigits });
}

/** Diferença assinada: "+2,5 kg", "−5 kg", "0 kg". */
export function formatKgDelta(value: number): string {
  if (value > 0) return `+${formatKg(value)}`;
  if (value < 0) return `−${formatKg(Math.abs(value))}`;
  return "0 kg";
}

/* ------------------------------------------------------------------ */
/* Datas no fuso de São Paulo                                          */
/* ------------------------------------------------------------------ */

const spDateFormatter = new Intl.DateTimeFormat("en-CA", {
  timeZone: "America/Sao_Paulo",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

/** Data de calendário (YYYY-MM-DD) do instante no fuso de São Paulo. */
export function toSaoPauloIsoDate(input: string | number | Date): string | null {
  const date = input instanceof Date ? input : new Date(input);
  if (!Number.isFinite(date.getTime())) return null;
  return spDateFormatter.format(date);
}

function isoToUtc(iso: string): Date {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d));
}

function utcToIso(date: Date): string {
  return date.toISOString().slice(0, 10);
}

export function addDaysIso(iso: string, days: number): string {
  const date = isoToUtc(iso);
  date.setUTCDate(date.getUTCDate() + days);
  return utcToIso(date);
}

/** Segunda-feira da semana (seg–dom) que contém a data. */
export function weekStartIso(iso: string): string {
  const day = isoToUtc(iso).getUTCDay(); // 0 = domingo
  return addDaysIso(iso, -((day + 6) % 7));
}

/** "2026-10-12" → "12/10" */
export function shortDayLabel(iso: string): string {
  const [, m, d] = iso.split("-");
  return `${d}/${m}`;
}

const entryTime = (entry: WorkoutHistoryEntry) =>
  Date.parse(entry.completedAt || entry.startedAt) || 0;

/* ------------------------------------------------------------------ */
/* Evolução da carga por exercício                                     */
/* ------------------------------------------------------------------ */

export type LoadPoint = {
  sessionId: string;
  /** Data do treino (YYYY-MM-DD, São Paulo). */
  date: string;
  /** Maior carga numérica entre as séries feitas na sessão. */
  load: number;
};

export type ExerciseProgress = {
  key: string;
  workoutId: string;
  /** "A" ou "B" (treino do ciclo). */
  workoutLabel: string;
  blockId: string;
  itemId: string;
  name: string;
  /** Sessões com carga numérica, da mais antiga para a mais recente. */
  points: LoadPoint[];
  lastLoad: number;
  firstLoad: number;
  /** Última carga − primeira carga do ciclo. */
  delta: number;
  bestLoad: number;
  sessions: number;
  /** Média do PSE das séries feitas nessas sessões (null sem PSE). */
  averagePse: number | null;
};

export type CycleWorkout = { label: string; workout: Workout };

const round1 = (value: number) => Math.round(value * 10) / 10;

/**
 * Exercícios dos treinos do ciclo que têm carga numérica registrada.
 * A ordem segue o treino (A antes de B, blocos e itens na ordem do plano).
 */
export function getExerciseProgress(
  history: WorkoutHistoryEntry[],
  cycleWorkouts: CycleWorkout[],
): ExerciseProgress[] {
  const result: ExerciseProgress[] = [];

  for (const { label, workout } of cycleWorkouts) {
    const entries = history
      .filter((entry) => entry.workoutId === workout.id)
      .sort((a, b) => entryTime(a) - entryTime(b));
    const blocks = [...workout.blocks].sort((a, b) => a.order - b.order);

    for (const block of blocks) {
      for (const item of block.items) {
        const points: LoadPoint[] = [];
        const pses: number[] = [];

        for (const entry of entries) {
          const logs = Object.values(entry.logs).filter(
            (log) =>
              log.blockId === block.id &&
              log.itemId === item.id &&
              !log.skipped,
          );
          const loads = logs
            .map((log) => parseLoadKg(log.load))
            .filter((value): value is number => value !== null);
          const date = toSaoPauloIsoDate(entry.completedAt || entry.startedAt);
          if (loads.length === 0 || !date) continue;

          points.push({ sessionId: entry.id, date, load: Math.max(...loads) });
          for (const log of logs) {
            if (log.actualPse && isValidPseValue(log.actualPse)) {
              pses.push(parsePseValue(log.actualPse) as number);
            }
          }
        }

        if (points.length === 0) continue;
        const firstLoad = points[0].load;
        const lastLoad = points[points.length - 1].load;
        result.push({
          key: `${workout.id}:${block.id}:${item.id}`,
          workoutId: workout.id,
          workoutLabel: label,
          blockId: block.id,
          itemId: item.id,
          name: item.name,
          points,
          firstLoad,
          lastLoad,
          delta: round1(lastLoad - firstLoad),
          bestLoad: Math.max(...points.map((point) => point.load)),
          sessions: points.length,
          averagePse:
            pses.length > 0
              ? round1(pses.reduce((sum, value) => sum + value, 0) / pses.length)
              : null,
        });
      }
    }
  }

  return result;
}

/* ------------------------------------------------------------------ */
/* Frequência semanal do ciclo                                         */
/* ------------------------------------------------------------------ */

export type WeekFrequency = {
  /** Segunda-feira da semana (YYYY-MM-DD). */
  weekStart: string;
  /** Primeiro dia da semana dentro do ciclo, ex.: "12/10". */
  label: string;
  principal: number;
  complementary: number;
  total: number;
  isCurrent: boolean;
};

export function isPrincipalEntry(
  entry: WorkoutHistoryEntry,
  workouts: Workout[],
): boolean {
  const workout = workouts.find((w) => w.id === entry.workoutId);
  return workout ? workout.type === "monthly" : entry.workoutId.startsWith("treino-");
}

/**
 * Sessões concluídas por semana (seg–dom, fuso de São Paulo) dentro do
 * ciclo, separando Principal e Complementar. Vai da semana do início do
 * ciclo até a semana atual (ou até o fim do ciclo, se já acabou).
 */
export function getCycleWeeklyFrequency(
  history: WorkoutHistoryEntry[],
  cycle: Pick<TrainingCycle, "startDate" | "endDate">,
  workouts: Workout[],
  now: Date = new Date(),
): WeekFrequency[] {
  const today = toSaoPauloIsoDate(now) ?? cycle.startDate;
  const lastDay = today < cycle.endDate ? today : cycle.endDate;
  const firstWeek = weekStartIso(cycle.startDate);
  const lastWeek = weekStartIso(lastDay < cycle.startDate ? cycle.startDate : lastDay);
  const currentWeek = weekStartIso(today);

  const weeks: WeekFrequency[] = [];
  for (let week = firstWeek; week <= lastWeek; week = addDaysIso(week, 7)) {
    const firstDay = week < cycle.startDate ? cycle.startDate : week;
    weeks.push({
      weekStart: week,
      label: shortDayLabel(firstDay),
      principal: 0,
      complementary: 0,
      total: 0,
      isCurrent: week === currentWeek,
    });
  }

  for (const entry of history) {
    const date = toSaoPauloIsoDate(entry.completedAt || entry.startedAt);
    if (!date || date < cycle.startDate || date > cycle.endDate) continue;
    const week = weeks.find((w) => w.weekStart === weekStartIso(date));
    if (!week) continue;
    if (isPrincipalEntry(entry, workouts)) week.principal += 1;
    else week.complementary += 1;
    week.total += 1;
  }

  return weeks;
}
