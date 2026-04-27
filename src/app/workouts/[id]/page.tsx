import Link from "next/link";

import { AppButton } from "@/components/ui/AppButton";
import { AppCard } from "@/components/ui/AppCard";
import { WorkoutBlockList } from "@/components/workout/WorkoutBlockList";
import { seedWorkouts } from "@/data/seed-workouts";
import { getOrderedWorkoutBlocks, getWorkoutMetadata } from "@/lib/workouts";

type WorkoutPageProps = {
  params: Promise<{
    id: string;
  }>;
};

export function generateStaticParams() {
  return seedWorkouts.map((workout) => ({
    id: workout.id,
  }));
}

export default async function WorkoutPage({ params }: WorkoutPageProps) {
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
              O treino solicitado não existe nos dados locais.
            </p>
          </div>
          <AppButton href="/workouts" variant="secondary">
            Voltar para treinos
          </AppButton>
        </AppCard>
      </main>
    );
  }

  const metadata = getWorkoutMetadata(workout);
  const blocks = getOrderedWorkoutBlocks(workout);

  return (
    <main className="flex flex-1 flex-col gap-5 pb-32 pt-6">
      <section className="flex flex-col gap-4">
        <Link
          href="/workouts"
          className="text-sm font-semibold text-zinc-400 transition-colors hover:text-white"
        >
          Voltar para treinos
        </Link>
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-red-300">
            {metadata.monthYear}
          </p>
          <h1 className="mt-2 break-words text-[28px] font-black leading-9 text-white">
            {workout.title}
          </h1>
          {workout.description ? (
            <p className="mt-3 max-w-xl text-base leading-7 text-zinc-300">
              {workout.description}
            </p>
          ) : null}
        </div>
      </section>

      <AppCard>
        <dl className="grid grid-cols-2 gap-3 text-sm">
          <div className="rounded-md border border-zinc-800 bg-zinc-900 px-4 py-3">
            <dt className="text-xs text-zinc-500">Tipo</dt>
            <dd className="mt-1 font-semibold text-zinc-100">
              {metadata.type}
            </dd>
          </div>
          <div className="rounded-md border border-zinc-800 bg-zinc-900 px-4 py-3">
            <dt className="text-xs text-zinc-500">Exercícios</dt>
            <dd className="mt-1 font-semibold text-zinc-100">
              {metadata.itemCount}
            </dd>
          </div>
          <div className="rounded-md border border-zinc-800 bg-zinc-900 px-4 py-3">
            <dt className="text-xs text-zinc-500">Blocos</dt>
            <dd className="mt-1 font-semibold text-zinc-100">
              {metadata.blockCount}
            </dd>
          </div>
        </dl>
      </AppCard>

      <section className="flex flex-col gap-3">
        <div>
          <h2 className="text-xl font-bold text-white">Blocos do treino</h2>
          <p className="mt-1 text-sm leading-6 text-zinc-400">
            Ordem, tipo do bloco, exercícios combinados, volume e PSE alvo.
          </p>
        </div>
        <WorkoutBlockList blocks={blocks} />
      </section>

      <div className="sticky bottom-0 -mx-4 border-t border-zinc-800 bg-zinc-950/95 px-4 pb-[calc(0.75rem+env(safe-area-inset-bottom))] pt-3 backdrop-blur sm:-mx-6 sm:px-6">
        <div className="mx-auto max-w-3xl">
          <AppButton href={`/workouts/${workout.id}/start`}>
            Iniciar treino
          </AppButton>
        </div>
      </div>
    </main>
  );
}
