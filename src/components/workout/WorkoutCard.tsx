import type { Workout } from "@/types";
import { AppButton } from "@/components/ui/AppButton";
import { AppCard } from "@/components/ui/AppCard";
import { getWorkoutMetadata } from "@/lib/workouts";

type WorkoutCardProps = {
  workout: Workout;
};

export function WorkoutCard({ workout }: WorkoutCardProps) {
  const metadata = getWorkoutMetadata(workout);
  const isComplementary = workout.type === "complementary";

  return (
    <AppCard className="flex flex-col gap-5 p-5">
      <div className="flex flex-col gap-4">
        <p className="text-xs font-semibold uppercase tracking-wide text-red-300">
          {metadata.monthYear}
        </p>
        <div>
          <h3 className="text-xl font-black leading-7 text-white">
            {workout.title}
          </h3>
          <p className="mt-2 text-sm leading-6 text-zinc-400">
            {isComplementary
              ? `${metadata.type} de ${metadata.category} em ${metadata.format.toLocaleLowerCase(
                  "pt-BR",
                )} com ${metadata.blockCount} bloco guiado.`
              : `${metadata.type} com ${metadata.blockCount} blocos e ${metadata.itemCount} exercícios.`}
          </p>
        </div>
        <p className="text-sm leading-6 text-zinc-500">
          {workout.description}
        </p>
      </div>
      <AppButton href={`/workouts/${workout.id}`}>
        Abrir {metadata.type}
      </AppButton>
    </AppCard>
  );
}
