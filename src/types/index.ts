export type BlockType =
  | "single"
  | "bi_set"
  | "tri_set"
  | "circuit"
  | "cardio"
  | "mobility";

export type WorkoutBlockItem = {
  id: string;
  name: string;
  reps?: string;
  time?: string;
  targetPse?: string;
  videoUrl?: string;
  notes?: string;
};

export type WorkoutBlock = {
  id: string;
  title: string;
  type: BlockType;
  sets: string;
  order: number;
  items: WorkoutBlockItem[];
  notes?: string;
};

export type Workout = {
  id: string;
  title: string;
  month: string;
  year: number;
  type: "monthly" | "complementary";
  description?: string;
  blocks: WorkoutBlock[];
};

export type WorkoutSessionLog = {
  blockId: string;
  itemId: string;
  reps: string;
  load: string;
  actualPse: string;
  completed: boolean;
  skipped?: boolean;
  skipReason?: string;
  /** Número da série (1, 2, 3...). Registros antigos não têm. */
  set?: number;
};

export type WorkoutSession = {
  workoutId: string;
  startedAt: string;
  finishedAt?: string;
  pausedAt?: string;
  totalPausedSeconds?: number;
  currentStepIndex: number;
  stepOrder?: string[];
  logs: Record<string, WorkoutSessionLog>;
};

export type WorkoutHistoryEntry = WorkoutSession & {
  id: string;
  completedAt: string;
  durationSeconds: number;
  workoutTitle: string;
  /** Sensação geral de 1 (Péssimo) a 5 (Ótimo). Opcional. */
  feeling?: 1 | 2 | 3 | 4 | 5;
  /** Incômodos marcados; [] quando "Nenhum". Ausente = não respondido. */
  pains?: string[];
  /** Observação livre da sessão. Opcional. */
  note?: string;
};
