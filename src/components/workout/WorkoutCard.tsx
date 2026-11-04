import type { Workout } from "@/types";
import { AppButton } from "@/components/ui/AppButton";
import { AppCard } from "@/components/ui/AppCard";
import { AppBadge } from "@/components/ui/AppBadge";

type WorkoutCardProps = {
  workout: Workout;
};

function getWorkoutCategoryLabel(workout: Workout): {
  label: string;
  variant: "primary" | "neutral" | "success" | "warning";
} {
  if (workout.type === "monthly") {
    return { label: "Principal", variant: "primary" };
  }
  if (workout.id.startsWith("mobilidade")) {
    return { label: "Mobilidade", variant: "neutral" };
  }
  if (workout.id.startsWith("core")) {
    return { label: "Core", variant: "neutral" };
  }
  return { label: "Complementar", variant: "neutral" };
}

export function WorkoutCard({ workout }: WorkoutCardProps) {
  const category = getWorkoutCategoryLabel(workout);
  const exerciseCount = workout.blocks.reduce(
    (total, block) => total + block.items.length,
    0
  );

  return (
    <AppCard className="flex flex-col justify-between gap-4 p-5">
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between gap-2">
          <AppBadge variant={category.variant}>{category.label}</AppBadge>
          {workout.type === "monthly" ? (
            <span className="text-[13px] font-medium text-[#A1A1AA]">
              Ciclo 4
            </span>
          ) : (
            <span className="text-[13px] font-medium text-[#A1A1AA]">
              {workout.month} {workout.year}
            </span>
          )}
        </div>

        <div>
          <h2 className="text-[18px] font-bold leading-[25px] text-[#F4F4F5]">
            {workout.title}
          </h2>
          <div className="mt-1 flex items-center gap-2 text-[13px] font-medium text-[#A1A1AA]">
            <span>{workout.blocks.length} {workout.blocks.length === 1 ? "bloco" : "blocos"}</span>
            <span>·</span>
            <span>{exerciseCount} {exerciseCount === 1 ? "exercício" : "exercícios"}</span>
          </div>
        </div>

        {workout.description && (
          <p className="line-clamp-3 text-[14px] leading-[21px] text-[#A1A1AA]">
            {workout.description}
          </p>
        )}
      </div>

      <div className="pt-2">
        <AppButton href={`/workouts/${workout.id}`} variant="primary" fullWidth>
          Ver treino
        </AppButton>
      </div>
    </AppCard>
  );
}
