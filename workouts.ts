import type { BlockType, Workout, WorkoutBlock } from "@/types";

export type WorkoutMetadata = {
  monthYear: string;
  type: string;
  blockCount: number;
  itemCount: number;
  category: string;
  format: string;
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
  const category = getWorkoutCategoryLabel(workout);
  const format = getWorkoutFormatLabel(workout);

  return {
    monthYear: `${workout.month}/${String(workout.year).slice(-2)}`,
    type: workout.type === "monthly" ? "Treino mensal" : "Complementar",
    blockCount: workout.blocks.length,
    itemCount: workout.blocks.reduce(
      (total, block) => total + block.items.length,
      0,
    ),
    category,
    format,
  };
}

export function getBlockTypeLabel(type: BlockType): string {
  return blockTypeLabels[type];
}

export function getWorkoutCategoryLabel(workout: Workout): string {
  const normalizedTitle = workout.title.toLocaleLowerCase("pt-BR");
  const hasCardioBlock = workout.blocks.some((block) => block.type === "cardio");
  const hasCircuitBlock = workout.blocks.some(
    (block) => block.type === "circuit",
  );

  if (workout.type === "monthly") {
    return "Principal";
  }

  if (normalizedTitle.includes("anti-lesão")) {
    return "Anti-lesão";
  }

  if (hasCardioBlock || normalizedTitle.includes("cardio")) {
    return "Cardio";
  }

  if (hasCircuitBlock || normalizedTitle.includes("core")) {
    return "Core";
  }

  return "Mobilidade";
}

export function getWorkoutFormatLabel(workout: Workout): string {
  const category = getWorkoutCategoryLabel(workout);

  if (workout.type === "monthly") {
    return "Blocos de treino";
  }

  if (category === "Cardio") {
    return "Cardio guiado";
  }

  if (category === "Core") {
    return "Circuito guiado";
  }

  if (category === "Anti-lesão") {
    return "Prevenção guiada";
  }

  return "Sequência guiada";
}

export function getOrderedWorkoutBlocks(workout: Workout): WorkoutBlock[] {
  return [...workout.blocks].sort(
    (firstBlock, secondBlock) => firstBlock.order - secondBlock.order,
  );
}
