import { seedWorkouts } from "@/data/seed-workouts";
import { getActiveCycle } from "@/data/training-cycles";
import { AppCard } from "@/components/ui/AppCard";
import { AppButton } from "@/components/ui/AppButton";
import { AppBadge } from "@/components/ui/AppBadge";

export function PrincipalWorkoutsSection() {
  const { cycle, statusLabel, isExpired } = getActiveCycle();

  const workoutA = seedWorkouts.find((w) => w.id === cycle.workoutAId);
  const workoutB = seedWorkouts.find((w) => w.id === cycle.workoutBId);

  const workouts = [
    {
      simplifiedName: "Treino A",
      workout: workoutA,
      exerciseCount: workoutA
        ? workoutA.blocks.reduce((acc, b) => acc + b.items.length, 0)
        : 11,
    },
    {
      simplifiedName: "Treino B",
      workout: workoutB,
      exerciseCount: workoutB
        ? workoutB.blocks.reduce((acc, b) => acc + b.items.length, 0)
        : 11,
    },
  ];

  return (
    <section className="space-y-3" aria-labelledby="principal-workouts-heading">
      <div className="flex items-center justify-between">
        <h2
          id="principal-workouts-heading"
          className="text-[20px] font-bold leading-[28px] text-[var(--foreground)]"
        >
          Treino principal
        </h2>
        <AppBadge variant={isExpired ? "neutral" : "primary"}>
          {statusLabel}
        </AppBadge>
      </div>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        {workouts.map(({ simplifiedName, workout, exerciseCount }) => {
          if (!workout) return null;

          return (
            <AppCard
              key={workout.id}
              className="flex flex-col justify-between gap-4 p-5"
            >
              <div className="space-y-1.5">
                <span className="text-[13px] font-medium text-[var(--muted)]">
                  {cycle.name}
                </span>
                <h3 className="text-[18px] font-bold leading-[25px] text-[var(--foreground)]">
                  {simplifiedName}
                </h3>
                <p className="text-[14px] text-[var(--muted)]">
                  {exerciseCount} exercícios
                </p>
              </div>

              <div className="pt-2">
                <AppButton
                  href={`/workouts/${workout.id}`}
                  variant="primary"
                  fullWidth
                >
                  Abrir treino
                </AppButton>
              </div>
            </AppCard>
          );
        })}
      </div>
    </section>
  );
}
