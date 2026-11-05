/**
 * Plano semanal: o que treinar em cada dia, semana a semana.
 *
 * Formato salvo (no estado da conta em `plans`, ou no navegador no modo local):
 *   { version: 1, weeks: { "2026-11-02": [["a", "cardio-3"], ["tatame"], [], …7 dias] } }
 * A chave de cada semana é a segunda-feira (data ISO, fuso de São Paulo).
 * Cada dia é uma lista de chaves de PLAN_OPTIONS. "a"/"b" valem para o
 * Treino A/B do ciclo vigente, então o plano continua válido quando o ciclo muda.
 */

import { seedWorkouts } from "../data/seed-workouts";
import { OFFICIAL_CYCLES, getActiveCycle } from "../data/training-cycles";
import { getSaoPauloDate } from "./date-utils";
import type { WorkoutHistoryEntry } from "../types/index";

export type WeekPlan = string[][];
export type WeeklyPlans = { version: 1; weeks: Record<string, WeekPlan> };

export type PlanGroup = "Principais" | "Complementares" | "Cardio" | "Outros";
export type PlanOption = {
  key: string;
  /** Rótulo curto para a faixa da semana. */
  tag: string;
  /** Nome completo para cards e chips. */
  title: string;
  /** Sigla do selo do card. */
  badge: string;
  group: PlanGroup;
  kind: "workout" | "bike" | "rest";
};

export const PLAN_STORAGE_KEY = "bjj-training-log:weekly-plans:v1";
export const PLAN_EVENT = "bjj-plan-updated";
export const PLAN_GROUPS: PlanGroup[] = ["Principais", "Complementares", "Cardio", "Outros"];
const MAX_ITEMS_PER_DAY = 8;
const MAX_WEEKS = 260;
const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;
const KEY_PATTERN = /^[a-z0-9-]{1,48}$/;

export const PLAN_OPTIONS: PlanOption[] = [
  { key: "a", tag: "A", title: "Treino A", badge: "A", group: "Principais", kind: "workout" },
  { key: "b", tag: "B", title: "Treino B", badge: "B", group: "Principais", kind: "workout" },
  { key: "core-1", tag: "Core 1", title: "Core 1 · Controle", badge: "C1", group: "Complementares", kind: "workout" },
  { key: "core-2", tag: "Core 2", title: "Core 2 · Resistência", badge: "C2", group: "Complementares", kind: "workout" },
  { key: "mobilidade-com-peso", tag: "Mob +", title: "Mobilidade com peso", badge: "M", group: "Complementares", kind: "workout" },
  { key: "mobilidade-sem-peso", tag: "Mob", title: "Mobilidade sem peso", badge: "M", group: "Complementares", kind: "workout" },
  { key: "mobilidade-3", tag: "Mob G", title: "Mobilidade geral", badge: "M", group: "Complementares", kind: "workout" },
  { key: "anti-lesao", tag: "Anti", title: "Anti-lesão", badge: "AL", group: "Complementares", kind: "workout" },
  { key: "cardio-1", tag: "Cardio", title: "Cardio 1 · Leve", badge: "CD", group: "Cardio", kind: "workout" },
  { key: "cardio-2", tag: "Cardio", title: "Cardio 2 · Base", badge: "CD", group: "Cardio", kind: "workout" },
  { key: "cardio-3", tag: "Cardio", title: "Cardio 3 · Moderado", badge: "CD", group: "Cardio", kind: "workout" },
  { key: "cardio-4", tag: "Cardio", title: "Cardio 4 · Condicionamento", badge: "CD", group: "Cardio", kind: "workout" },
  { key: "cardio-5", tag: "Cardio", title: "Cardio 5 · Forte", badge: "CD", group: "Cardio", kind: "workout" },
  { key: "cardio-6", tag: "Cardio", title: "Cardio 6 · Finalizador", badge: "CD", group: "Cardio", kind: "workout" },
  { key: "bike", tag: "Bike", title: "Bike (programa de cardio)", badge: "BK", group: "Cardio", kind: "bike" },
  { key: "tatame", tag: "Tatame", title: "Dia de tatame", badge: "T", group: "Outros", kind: "rest" },
  { key: "folga", tag: "Folga", title: "Folga", badge: "F", group: "Outros", kind: "rest" },
];

const OPTION_ORDER = new Map(PLAN_OPTIONS.map((option, index) => [option.key, index]));

export function getPlanOption(key: string): PlanOption | undefined {
  return PLAN_OPTIONS.find((option) => option.key === key);
}

export const emptyWeek = (): WeekPlan => [[], [], [], [], [], [], []];
export const emptyPlans = (): WeeklyPlans => ({ version: 1, weeks: {} });

// ---------- Datas (dias de calendário, sem horário) ----------

function validIsoDate(value: string) {
  if (!ISO_DATE.test(value)) return false;
  const [y, m, d] = value.split("-").map(Number);
  const stamp = Date.UTC(y, m - 1, d);
  return new Date(stamp).toISOString().slice(0, 10) === value;
}

export function addDaysIso(iso: string, days: number): string {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d + days)).toISOString().slice(0, 10);
}

/** 0 = segunda … 6 = domingo. */
export function weekdayIndex(iso: string): number {
  const [y, m, d] = iso.split("-").map(Number);
  return (new Date(Date.UTC(y, m - 1, d)).getUTCDay() + 6) % 7;
}

export function mondayOf(iso: string): string {
  return addDaysIso(iso, -weekdayIndex(iso));
}

function toIso(date: Date) {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

/** Data de hoje no fuso de São Paulo. */
export function todayIso(now: Date = new Date()): string {
  return toIso(getSaoPauloDate(now));
}

/** Data (São Paulo) de um instante ISO, ex.: completedAt do histórico. */
export function saoPauloDateOf(instant: string): string | null {
  const stamp = Date.parse(instant);
  return Number.isFinite(stamp) ? toIso(getSaoPauloDate(new Date(stamp))) : null;
}

export function shortDate(iso: string) {
  const [, m, d] = iso.split("-").map(Number);
  return `${d}/${m}`;
}

// ---------- Validação e mescla ----------

const isRecord = (value: unknown): value is Record<string, unknown> =>
  !!value && typeof value === "object" && !Array.isArray(value);

export function normalizeDay(items: string[]): string[] {
  const unique = [...new Set(items.filter((key) => typeof key === "string" && KEY_PATTERN.test(key)))];
  unique.sort((x, y) => (OPTION_ORDER.get(x) ?? 999) - (OPTION_ORDER.get(y) ?? 999));
  return unique.slice(0, MAX_ITEMS_PER_DAY);
}

/**
 * Aceita dados de outra versão do app sem quebrar o restante do estado:
 * semanas ou itens inválidos são descartados em vez de recusar o backup inteiro.
 */
export function sanitizeWeeklyPlans(input: unknown): WeeklyPlans {
  if (!isRecord(input) || input.version !== 1 || !isRecord(input.weeks)) return emptyPlans();
  const weeks: Record<string, WeekPlan> = {};
  const keys = Object.keys(input.weeks)
    .filter((key) => validIsoDate(key) && weekdayIndex(key) === 0)
    .sort()
    .slice(-MAX_WEEKS);
  for (const monday of keys) {
    const days = input.weeks[monday];
    if (!Array.isArray(days) || days.length !== 7) continue;
    const week = days.map((day) => (Array.isArray(day) ? normalizeDay(day as string[]) : []));
    if (week.some((day) => day.length)) weeks[monday] = week;
  }
  return { version: 1, weeks };
}

/** Importação explícita: semanas já existentes no estado atual são mantidas. */
export function mergeWeeklyPlans(current: WeeklyPlans | undefined, incoming: WeeklyPlans | undefined) {
  if (!current) return incoming;
  if (!incoming) return current;
  return sanitizeWeeklyPlans({ version: 1, weeks: { ...incoming.weeks, ...current.weeks } });
}

// ---------- Leitura e escrita ----------

type PlanStorageAdapter = { read: () => WeeklyPlans; write: (plans: WeeklyPlans) => void };
let accountStorage: PlanStorageAdapter | null = null;

/** Com login, o plano vive no mesmo estado sincronizado da conta (sem migração SQL). */
export function bindPlanStorage(adapter: PlanStorageAdapter | null) {
  accountStorage = adapter;
}

export function loadWeeklyPlans(): WeeklyPlans {
  if (accountStorage) return accountStorage.read();
  try {
    const raw = window.localStorage.getItem(PLAN_STORAGE_KEY);
    return raw ? sanitizeWeeklyPlans(JSON.parse(raw)) : emptyPlans();
  } catch {
    return emptyPlans();
  }
}

export function storeWeeklyPlans(plans: WeeklyPlans) {
  const safe = sanitizeWeeklyPlans(plans);
  if (accountStorage) accountStorage.write(safe);
  else window.localStorage.setItem(PLAN_STORAGE_KEY, JSON.stringify(safe));
  if (typeof window !== "undefined" && typeof window.dispatchEvent === "function") {
    window.dispatchEvent(new Event(PLAN_EVENT));
  }
}

// ---------- Operações no plano ----------

export function getWeek(plans: WeeklyPlans, monday: string): WeekPlan {
  return plans.weeks[monday]?.map((day) => [...day]) ?? emptyWeek();
}

export function withWeek(plans: WeeklyPlans, monday: string, week: WeekPlan): WeeklyPlans {
  const weeks = { ...plans.weeks };
  const normalized = week.map(normalizeDay);
  if (normalized.some((day) => day.length)) weeks[monday] = normalized;
  else delete weeks[monday];
  return { version: 1, weeks };
}

/** Liga/desliga um item no dia. "folga" ocupa o dia sozinha. */
export function toggleDayItem(day: string[], key: string): string[] {
  if (day.includes(key)) return day.filter((item) => item !== key);
  if (key === "folga") return ["folga"];
  return normalizeDay([...day.filter((item) => item !== "folga"), key]);
}

// ---------- Resolução para treinos reais ----------

/** Treino concreto de uma chave na data (A/B seguem o ciclo vigente). */
export function resolveWorkoutId(key: string, date?: string): string | null {
  if (key === "a" || key === "b") {
    const cycle =
      (date && OFFICIAL_CYCLES.find((c) => date >= c.startDate && date <= c.endDate)) ||
      getActiveCycle().cycle;
    return key === "a" ? cycle.workoutAId : cycle.workoutBId;
  }
  return seedWorkouts.some((workout) => workout.id === key) ? key : null;
}

/** Ids de histórico que contam como feito para a chave (A/B de qualquer ciclo). */
function workoutIdsFor(key: string): string[] {
  if (key === "a") return OFFICIAL_CYCLES.map((cycle) => cycle.workoutAId);
  if (key === "b") return OFFICIAL_CYCLES.map((cycle) => cycle.workoutBId);
  return [key];
}

export type DoneSources = {
  history: Pick<WorkoutHistoryEntry, "workoutId" | "completedAt">[];
  bikeSessions?: { date: string; status: string }[];
};

export function isPlanItemDone(key: string, date: string, sources: DoneSources): boolean {
  const option = getPlanOption(key);
  if (!option || option.kind === "rest") return false;
  if (option.kind === "bike") {
    return (sources.bikeSessions ?? []).some((s) => s.status === "completed" && s.date === date);
  }
  const ids = workoutIdsFor(key);
  return sources.history.some(
    (entry) => ids.includes(entry.workoutId) && saoPauloDateOf(entry.completedAt) === date,
  );
}

export function isTrainingKey(key: string) {
  const option = getPlanOption(key);
  return !!option && option.kind !== "rest";
}

/** Duração aproximada em minutos para o resumo (estimativa simples por tipo). */
export function estimatedMinutes(key: string): number {
  if (key === "a" || key === "b") return 55;
  if (key === "anti-lesao") return 25;
  if (key.startsWith("core")) return 22;
  if (key.startsWith("mobilidade")) return 18;
  if (key.startsWith("cardio")) return 15;
  if (key === "bike") return 30;
  return 0;
}
