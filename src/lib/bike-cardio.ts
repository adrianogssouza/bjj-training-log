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

export function newBikeData(): BikeData {
  return {
    version: 1,
    startedOn: localDate(),
    goalWeightKg: null,
    sessions: [],
    measurements: [],
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

  return {
    version: 1,
    startedOn: safeDate(input.startedOn) ?? localDate(),
    goalWeightKg: finiteNumber(input.goalWeightKg, 20, 400),
    sessions,
    measurements,
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

export function summarizeWeek(data: BikeData, week: number) {
  const plan = BIKE_PLAN[week - 1];
  const filtered = data.sessions.filter((s) => weekForDate(data.startedOn, s.date) === week);
  const completed = filtered.filter((s) => s.status === "completed");
  const minutes = completed.reduce((sum, s) => sum + s.minutes, 0);
  const withRpe = completed.filter((s) => s.rpe !== null);
  const averageRpe = withRpe.length
    ? withRpe.reduce((sum, s) => sum + (s.rpe ?? 0), 0) / withRpe.length
    : null;
  return {
    plannedSessions: plan.sessions,
    plannedMinutes: plan.sessions * plan.minutes,
    completedSessions: completed.length,
    skippedSessions: filtered.length - completed.length,
    minutes,
    averageRpe,
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

/** Mescla backup e nuvem por id; mantém a versão atual em caso de duplicidade. */
export function mergeBikeData(current: BikeData | undefined, incoming: BikeData | undefined): BikeData | undefined {
  if (!current) return incoming;
  if (!incoming) return current;
  const mergeById = <T extends { id: string }>(saved: T[], imported: T[]) => {
    const index = new Map(imported.map(item => [item.id, item]));
    for (const item of saved) index.set(item.id, item);
    return [...index.values()];
  };
  return {
    ...incoming,
    ...current,
    sessions: mergeById(current.sessions, incoming.sessions),
    measurements: mergeById(current.measurements, incoming.measurements),
  };
}
