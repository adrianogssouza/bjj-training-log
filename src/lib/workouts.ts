import type { BlockType, Workout, WorkoutBlock } from "@/types";

export type WorkoutMetadata = {
  monthYear: string;
  type: string;
  blockCount: number;
  itemCount: number;
};

const blockTypeLabels: Record<BlockType, string> = {
  single: "Exercício simples",
  bi_set: "Bi-set",
  tri_set: "Tri-set",
  circuit: "Circuito",
  cardio: "Cardio",
  mobility: "Mobilidade",
};

export function getWorkoutMetadata(workout: Workout): WorkoutMetadata {
  return {
    monthYear: `${workout.month}/${String(workout.year).slice(-2)}`,
    type: workout.type === "monthly" ? "Treino mensal" : "Complementar",
    blockCount: workout.blocks.length,
    itemCount: workout.blocks.reduce(
      (total, block) => total + block.items.length,
      0,
    ),
  };
}

export function getBlockTypeLabel(type: BlockType): string {
  return blockTypeLabels[type];
}

export function getOrderedWorkoutBlocks(workout: Workout): WorkoutBlock[] {
  return [...workout.blocks].sort(
    (firstBlock, secondBlock) => firstBlock.order - secondBlock.order,
  );
}
