export interface TrainingCycle {
  id: string;
  name: string;
  startDate: string; // ISO date YYYY-MM-DD
  endDate: string; // ISO date YYYY-MM-DD
  workoutAId: string;
  workoutBId: string;
}

export const OFFICIAL_CYCLES: TrainingCycle[] = [
  {
    id: "ciclo-4",
    name: "Ciclo 4",
    startDate: "2026-10-11",
    endDate: "2026-11-15",
    workoutAId: "treino-a-prime-ciclo-4",
    workoutBId: "treino-b-prime-ciclo-4",
  },
];

export function getActiveCycle(currentDate = new Date()): {
  cycle: TrainingCycle;
  statusLabel: string;
  isExpired: boolean;
} {
  const cycle = OFFICIAL_CYCLES[0];
  const now = currentDate.toISOString().slice(0, 10);

  if (now > cycle.endDate) {
    return {
      cycle,
      statusLabel: "Último ciclo disponível · encerrado",
      isExpired: true,
    };
  }

  return {
    cycle,
    statusLabel: `${cycle.name} · Vigente`,
    isExpired: false,
  };
}
