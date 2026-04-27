import { AppButton } from "@/components/ui/AppButton";
import { AppCard } from "@/components/ui/AppCard";
import { WorkoutRunner } from "@/components/workout/WorkoutRunner";
import { seedWorkouts } from "@/data/seed-workouts";

type StartWorkoutPageProps = {
  params: Promise<{
    id: string;
  }>;
};

export function generateStaticParams() {
  return seedWorkouts.map((workout) => ({
    id: workout.id,
  }));
}

export default async function StartWorkoutPage({
  params,
}: StartWorkoutPageProps) {
  const { id } = await params;
  const workout = seedWorkouts.find((seedWorkout) => seedWorkout.id === id);

  if (!workout) {
    return (
      <main className="flex flex-1 flex-col gap-6 py-8">
        <AppCard className="flex flex-col gap-4">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-red-300">
              Erro
            </p>
            <h1 className="mt-2 text-3xl font-black text-white">
              Treino não encontrado
            </h1>
            <p className="mt-3 text-sm leading-6 text-zinc-400">
              Não foi possível iniciar um treino que não existe nos dados
              locais.
            </p>
          </div>
          <AppButton href="/workouts" variant="secondary">
            Voltar para treinos
          </AppButton>
        </AppCard>
      </main>
    );
  }

  return <WorkoutRunner workout={workout} />;
}
