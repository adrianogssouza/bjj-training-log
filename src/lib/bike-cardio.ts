/**
 * Módulo de bicicleta — independente dos seis cardios legados do BJJ.
 * Sem dados pessoais no código: usa a conta Supabase quando conectada
 * ou armazenamento local quando o aplicativo está em modo local.
 */
export const BIKE_STORAGE_KEY = "bjj-training-log:bike-cardio:v1";

/** Integração opcional com o mesmo estado versionado da conta BJJ. */
type BikeStorageAdapter = {
  read: () => BikeData;
  write: (data: BikeData) => void;
};
let accountStorage: BikeStorageAdapter | null = null;
export function bindBikeStorage(adapter: BikeStorageAdapter | null) {
  accountStorage = adapter;
}

export const BIKE_PLAN = [
  { week: 1, sessions: 3, minutes: 25 },
  { week: 2, sessions: 3, minutes: 30 },
  { week: 3, sessions: 4, minutes: 30 },
  { week: 4, sessions: 4, minutes: 35 },
  { week: 5, sessions: 5, minutes: 35 },
  { week: 6, sessions: 5, minutes: 40 },
] as const;

export const DAY_NAMES = [
  "Domingo",
  "Segunda-feira",
  "Terça-feira",
  "Quarta-feira",
  "Quinta-feira",
  "Sexta-feira",
  "Sábado",
] as const;

export const DAY_SHORT_NAMES = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"] as const;

export type BikeStatus = "completed" | "skipped";
export type TalkTest = "normal" | "frases" | "dificil" | "nao-avaliado";

export type BikeSession = {
  id: string;
  date: string;
  status: BikeStatus;
  minutes: number;
  averageBpm: number | null;
  peakBpm: number | null;
  rpe: number | null;
  legFatigue: number | null;
  talkTest: TalkTest;
  distanceKm: number | null;
  resistance: string;
  symptoms: boolean;
  notes: string;
  recordedAt: string;
};

export type BikeMeasurement = {
  id: string;
  date: string;
  weightKg: number | null;
  waistCm: number | null;
  bodyFatPct: number | null;
  systolic: number | null;
  diastolic: number | null;
  notes: string;
};

export type BikeData = {
  version: 1;
  startedOn: string;
  goalWeightKg: number | null;
  sessions: BikeSession[];
  measurements: BikeMeasurement[];
  /** Dias preferenciais da semana (0 = Dom, 1 = Seg, ..., 6 = Sáb) */
  preferredDays?: number[];
  /** Semana congelada ou repetida manualmente pelo usuário (1 a 6) */
  activeWeekOverride?: number | null;
};

export function localDate(value: Date = new Date()) {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${value.getFullYear()}-${pad(value.getMonth() + 1)}-${pad(value.getDate())}`;
}

export function readableDate(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return value;
  const [year, month, day] = value.split("-");
  return `${day}/${month}/${year}`;
}

export function dayNumber(isoDate: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(isoDate)) return NaN;
  const [year, month, day] = isoDate.split("-").map(Number);
  const stamp = Date.UTC(year, month - 1, day);
  if (new Date(stamp).toISOString().slice(0, 10) !== isoDate) return NaN;
  return Math.floor(stamp / 86_400_000);
}

export function dayOfWeekFromIso(isoDate: string): number {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(isoDate)) return 0;
  const [year, month, day] = isoDate.split("-").map(Number);
  return new Date(Date.UTC(year, month - 1, day, 12, 0, 0)).getUTCDay();
}

/** Retorna 0 se ainda não começou e 7+ após o fim do ciclo. */
export function weekForDate(startedOn: string, date: string) {
  const diff = dayNumber(date) - dayNumber(startedOn);
  if (!Number.isFinite(diff)) return 0;
  return diff < 0 ? 0 : Math.floor(diff / 7) + 1;
}

export function getWeekRange(startedOn: string, week: number) {
  const start = dayNumber(startedOn) + (week - 1) * 7;
  return {
    from: new Date(start * 86_400_000).toISOString().slice(0, 10),
    through: new Date((start + 6) * 86_400_000).toISOString().slice(0, 10),
  };
}

export function getDefaultPreferredDays(sessionsCount: number): number[] {
  if (sessionsCount <= 3) return [1, 3, 5]; // Seg, Qua, Sex
  if (sessionsCount === 4) return [1, 2, 4, 5]; // Seg, Ter, Qui, Sex
  return [1, 2, 3, 4, 5]; // Seg a Sex
}

export function newBikeData(): BikeData {
  return {
    version: 1,
    startedOn: localDate(),
    goalWeightKg: null,
    sessions: [],
    measurements: [],
    preferredDays: [1, 3, 5],
    activeWeekOverride: null,
  };
}

const isRecord = (v: unknown): v is Record<string, unknown> =>
  typeof v === "object" && v !== null && !Array.isArray(v);

function finiteNumber(value: unknown, min: number, max: number) {
  return typeof value === "number" && Number.isFinite(value) && value >= min && value <= max
    ? value
    : null;
}

function safeText(value: unknown, limit = 500) {
  return typeof value === "string" ? value.slice(0, limit) : "";
}

function safeDate(value: unknown): string | null {
  return typeof value === "string" && Number.isFinite(dayNumber(value)) ? value : null;
}

/** Mesmo backups antigos ou parcialmente inválidos não quebram a interface. */
export function sanitizeBikeData(input: unknown): BikeData {
  if (!isRecord(input) || input.version !== 1) throw new Error("Arquivo não é um backup de Bike Cardio v1.");
  if (!Array.isArray(input.sessions) || !Array.isArray(input.measurements)) {
    throw new Error("Backup sem listas válidas de sessões e medidas.");
  }
  if (input.sessions.length > 5000 || input.measurements.length > 5000) {
    throw new Error("Backup excede o limite permitido.");
  }

  const sessions: BikeSession[] = [];
  for (const raw of input.sessions) {
    if (!isRecord(raw)) continue;
    const date = safeDate(raw.date);
    if (!date || !["completed", "skipped"].includes(String(raw.status))) continue;
    sessions.push({
      id: safeText(raw.id, 120) || `${date}-${sessions.length}`,
      date,
      status: raw.status as BikeStatus,
      minutes: raw.status === "skipped" ? 0 : finiteNumber(raw.minutes, 1, 240) ?? 0,
      averageBpm: finiteNumber(raw.averageBpm, 30, 240),
      peakBpm: finiteNumber(raw.peakBpm, 30, 260),
      rpe: finiteNumber(raw.rpe, 0, 10),
      legFatigue: finiteNumber(raw.legFatigue, 0, 10),
      talkTest: ["normal", "frases", "dificil", "nao-avaliado"].includes(String(raw.talkTest))
        ? raw.talkTest as TalkTest
        : "nao-avaliado",
      distanceKm: finiteNumber(raw.distanceKm, 0, 200),
      resistance: safeText(raw.resistance, 80),
      symptoms: raw.symptoms === true,
      notes: safeText(raw.notes),
      recordedAt: typeof raw.recordedAt === "string" ? safeText(raw.recordedAt, 40) : "",
    });
  }

  const measurements: BikeMeasurement[] = [];
  for (const raw of input.measurements) {
    if (!isRecord(raw)) continue;
    const date = safeDate(raw.date);
    if (!date) continue;
    measurements.push({
      id: safeText(raw.id, 120) || `${date}-m-${measurements.length}`,
      date,
      weightKg: finiteNumber(raw.weightKg, 20, 400),
      waistCm: finiteNumber(raw.waistCm, 30, 250),
      bodyFatPct: finiteNumber(raw.bodyFatPct, 1, 75),
      systolic: finiteNumber(raw.systolic, 60, 260),
      diastolic: finiteNumber(raw.diastolic, 30, 160),
      notes: safeText(raw.notes),
    });
  }

  const preferredDays = Array.isArray(input.preferredDays)
    ? input.preferredDays.filter((d): d is number => typeof d === "number" && Number.isInteger(d) && d >= 0 && d <= 6)
    : undefined;
  const activeWeekOverride = finiteNumber(input.activeWeekOverride, 1, 6);

  return {
    version: 1,
    startedOn: safeDate(input.startedOn) ?? localDate(),
    goalWeightKg: finiteNumber(input.goalWeightKg, 20, 400),
    sessions,
    measurements,
    ...(preferredDays ? { preferredDays } : {}),
    ...(activeWeekOverride ? { activeWeekOverride } : {}),
  };
}

export function loadBikeData(): BikeData {
  if (accountStorage) return sanitizeBikeData(accountStorage.read());
  const raw = window.localStorage.getItem(BIKE_STORAGE_KEY);
  // Dados corrompidos não devem ser silenciosamente substituídos por um plano vazio.
  return raw ? sanitizeBikeData(JSON.parse(raw) as unknown) : newBikeData();
}

export function storeBikeData(data: BikeData) {
  const safe = sanitizeBikeData(data);
  if (accountStorage) { accountStorage.write(safe); return; }
  window.localStorage.setItem(BIKE_STORAGE_KEY, JSON.stringify(safe));
}

export function getEffectiveWeek(data: BikeData, dateStr: string = localDate()): number {
  if (data.activeWeekOverride && data.activeWeekOverride >= 1 && data.activeWeekOverride <= 6) {
    return data.activeWeekOverride;
  }
  const natural = weekForDate(data.startedOn, dateStr);
  return Math.min(6, Math.max(1, natural));
}

export function summarizeWeek(data: BikeData, week: number) {
  const plan = BIKE_PLAN[week - 1];
  const filtered = data.sessions.filter((s) => weekForDate(data.startedOn, s.date) === week);
  const completed = filtered.filter((s) => s.status === "completed");
  const minutes = completed.reduce((sum, s) => sum + s.minutes, 0);
  const withRpe = completed.filter((s) => s.rpe !== null);
  const averageRpe = withRpe.length
    ? withRpe.reduce((sum, s) => sum + (s.rpe ?? 0), 0) / withRpe.length
    : null;
  const withBpm = completed.filter((s) => s.averageBpm !== null);
  const averageBpm = withBpm.length
    ? Math.round(withBpm.reduce((sum, s) => sum + (s.averageBpm ?? 0), 0) / withBpm.length)
    : null;

  return {
    plannedSessions: plan.sessions,
    plannedMinutes: plan.sessions * plan.minutes,
    completedSessions: completed.length,
    skippedSessions: filtered.length - completed.length,
    minutes,
    averageRpe: averageRpe !== null ? Number(averageRpe.toFixed(1)) : null,
    averageBpm,
    anySymptoms: filtered.some((s) => s.symptoms),
    highFatigue: completed.some((s) => (s.legFatigue ?? 0) >= 7),
  };
}

export function progressionAdvice(data: BikeData, week: number) {
  if (week < 1 || week > 6) return "Sem avaliação para este período.";
  const summary = summarizeWeek(data, week);
  if (summary.anySymptoms) return "Sintomas registrados: interrompa a progressão e procure avaliação médica.";
  if (summary.highFatigue || (summary.averageRpe !== null && summary.averageRpe > 5)) {
    return "Recuperação ou esforço acima do planejado: considere repetir ou reduzir a semana.";
  }
  if (summary.completedSessions < summary.plannedSessions || summary.minutes < summary.plannedMinutes * 0.85) {
    return "Volume ou frequência abaixo do planejado: repita ou ajuste a semana conforme a recuperação.";
  }
  return "Meta registrada. Se a recuperação estiver boa, você pode considerar a próxima semana.";
}

export type TodayWorkoutInfo = {
  date: string;
  readableDate: string;
  dayName: string;
  effectiveWeek: number;
  isWeekOverridden: boolean;
  phase: (typeof BIKE_PLAN)[number];
  weekRange: { from: string; through: string };
  weekSummary: ReturnType<typeof summarizeWeek>;
  todaySession: BikeSession | undefined;
  isTodayCompleted: boolean;
  preferredDays: number[];
  isPreferredDay: boolean;
  sessionNumber: number;
  isWeekGoalMet: boolean;
  warmupMinutes: number;
  mainMinutes: number;
  cooldownMinutes: number;
  targetIntensity: string;
  referenceBpm: string;
  targetRpe: string;
  talkTestGuidance: string;
};

export function getTodayWorkoutInfo(data: BikeData, dateStr: string = localDate()): TodayWorkoutInfo {
  const effectiveWeek = getEffectiveWeek(data, dateStr);
  const phase = BIKE_PLAN[effectiveWeek - 1];
  const weekRange = getWeekRange(data.startedOn, effectiveWeek);
  const weekSummary = summarizeWeek(data, effectiveWeek);
  const todaySession = data.sessions.find((s) => s.date === dateStr);
  const isTodayCompleted = todaySession?.status === "completed";
  const dayOfWeek = dayOfWeekFromIso(dateStr);
  const preferredDays = data.preferredDays ?? getDefaultPreferredDays(phase.sessions);
  const isPreferredDay = preferredDays.includes(dayOfWeek);
  const sessionNumber = Math.min(phase.sessions, weekSummary.completedSessions + (isTodayCompleted ? 0 : 1));
  const isWeekGoalMet = weekSummary.completedSessions >= phase.sessions;

  return {
    date: dateStr,
    readableDate: readableDate(dateStr),
    dayName: DAY_NAMES[dayOfWeek],
    effectiveWeek,
    isWeekOverridden: Boolean(data.activeWeekOverride),
    phase,
    weekRange,
    weekSummary,
    todaySession,
    isTodayCompleted,
    preferredDays,
    isPreferredDay,
    sessionNumber,
    isWeekGoalMet,
    warmupMinutes: 5,
    mainMinutes: phase.minutes - 10,
    cooldownMinutes: 5,
    targetIntensity: "Leve a moderada, mantendo capacidade de conversar",
    referenceBpm: "105–125 BPM (referência exploratória provisória)",
    targetRpe: "PSE 3–4/10",
    talkTestGuidance: "Conseguir falar frases completas com facilidade, sem interrupção por falta de ar.",
  };
}

export type EvolutionStats = {
  totalCompletedMinutes: number;
  totalCompletedSessions: number;
  averageBpm: number | null;
  maxPeakBpm: number | null;
  averageRpe: number | null;
  averageLegFatigue: number | null;
  latestMeasurement: BikeMeasurement | null;
  firstMeasurement: BikeMeasurement | null;
  weightDiffKg: number | null;
  waistDiffCm: number | null;
  bodyFatDiffPct: number | null;
  distanceToGoalWeightKg: number | null;
  weeklyProgress: Array<{
    week: number;
    plannedSessions: number;
    plannedMinutes: number;
    completedSessions: number;
    completedMinutes: number;
    percent: number;
    averageBpm: number | null;
    averageRpe: number | null;
    anySymptoms: boolean;
  }>;
};

export function getEvolutionStats(data: BikeData): EvolutionStats {
  const completed = data.sessions.filter((s) => s.status === "completed");
  const totalCompletedMinutes = completed.reduce((sum, s) => sum + s.minutes, 0);
  const totalCompletedSessions = completed.length;

  const withBpm = completed.filter((s) => s.averageBpm !== null);
  const averageBpm = withBpm.length
    ? Math.round(withBpm.reduce((sum, s) => sum + (s.averageBpm ?? 0), 0) / withBpm.length)
    : null;

  const withPeak = completed.filter((s) => s.peakBpm !== null);
  const maxPeakBpm = withPeak.length
    ? Math.max(...withPeak.map((s) => s.peakBpm ?? 0))
    : null;

  const withRpe = completed.filter((s) => s.rpe !== null);
  const averageRpe = withRpe.length
    ? Number((withRpe.reduce((sum, s) => sum + (s.rpe ?? 0), 0) / withRpe.length).toFixed(1))
    : null;

  const withFatigue = completed.filter((s) => s.legFatigue !== null);
  const averageLegFatigue = withFatigue.length
    ? Number((withFatigue.reduce((sum, s) => sum + (s.legFatigue ?? 0), 0) / withFatigue.length).toFixed(1))
    : null;

  const sortedMeasures = data.measurements.slice().sort((a, b) => a.date.localeCompare(b.date));
  const firstMeasurement = sortedMeasures[0] ?? null;
  const latestMeasurement = sortedMeasures[sortedMeasures.length - 1] ?? null;

  const weightDiffKg = firstMeasurement?.weightKg != null && latestMeasurement?.weightKg != null
    ? Number((latestMeasurement.weightKg - firstMeasurement.weightKg).toFixed(1))
    : null;

  const waistDiffCm = firstMeasurement?.waistCm != null && latestMeasurement?.waistCm != null
    ? Number((latestMeasurement.waistCm - firstMeasurement.waistCm).toFixed(1))
    : null;

  const bodyFatDiffPct = firstMeasurement?.bodyFatPct != null && latestMeasurement?.bodyFatPct != null
    ? Number((latestMeasurement.bodyFatPct - firstMeasurement.bodyFatPct).toFixed(1))
    : null;

  const distanceToGoalWeightKg = latestMeasurement?.weightKg != null && data.goalWeightKg != null
    ? Number((latestMeasurement.weightKg - data.goalWeightKg).toFixed(1))
    : null;

  const weeklyProgress = BIKE_PLAN.map((item) => {
    const summary = summarizeWeek(data, item.week);
    const percent = Math.min(100, Math.round((summary.completedSessions / item.sessions) * 100));
    return {
      week: item.week,
      plannedSessions: item.sessions,
      plannedMinutes: summary.plannedMinutes,
      completedSessions: summary.completedSessions,
      completedMinutes: summary.minutes,
      percent,
      averageBpm: summary.averageBpm,
      averageRpe: summary.averageRpe,
      anySymptoms: summary.anySymptoms,
    };
  });

  return {
    totalCompletedMinutes,
    totalCompletedSessions,
    averageBpm,
    maxPeakBpm,
    averageRpe,
    averageLegFatigue,
    firstMeasurement,
    latestMeasurement,
    weightDiffKg,
    waistDiffCm,
    bodyFatDiffPct,
    distanceToGoalWeightKg,
    weeklyProgress,
  };
}

/** Mescla backup e nuvem por id; mantém a versão atual em caso de duplicidade. */
export function mergeBikeData(current: BikeData | undefined, incoming: BikeData | undefined): BikeData | undefined {
  if (!current) return incoming;
  if (!incoming) return current;
  const mergeById = <T extends { id: string }>(saved: T[], imported: T[]) => {
    const index = new Map(imported.map((item) => [item.id, item]));
    for (const item of saved) index.set(item.id, item);
    return [...index.values()];
  };
  return {
    ...incoming,
    ...current,
    sessions: mergeById(current.sessions, incoming.sessions),
    measurements: mergeById(current.measurements, incoming.measurements),
    ...(current.preferredDays !== undefined ? { preferredDays: current.preferredDays } : incoming.preferredDays !== undefined ? { preferredDays: incoming.preferredDays } : {}),
    ...(current.activeWeekOverride !== undefined ? { activeWeekOverride: current.activeWeekOverride } : incoming.activeWeekOverride !== undefined ? { activeWeekOverride: incoming.activeWeekOverride } : {}),
  };
}
