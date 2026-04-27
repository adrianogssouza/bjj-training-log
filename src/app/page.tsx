import Link from "next/link";

import { AppButton } from "@/components/ui/AppButton";
import { AppCard } from "@/components/ui/AppCard";
import { WorkoutCard } from "@/components/workout/WorkoutCard";
import { seedWorkouts } from "@/data/seed-workouts";

export default function HomePage() {
  return (
    <main className="flex flex-1 flex-col gap-6 py-8">
      <section className="flex flex-col gap-4">
        <p className="text-sm font-semibold uppercase tracking-wide text-red-300">
          Abril/26
        </p>
        <div className="flex flex-col gap-3">
          <h1 className="text-4xl font-black tracking-normal text-white">
            BJJ Training Log
          </h1>
          <p className="max-w-xl text-base leading-7 text-zinc-300">
            Registre seus treinos de Jiu-Jitsu com uma base simples, direta e
            pronta para evoluir sprint a sprint.
          </p>
        </div>
      </section>

      <AppCard className="border-red-500/40 bg-red-950/20">
        <div className="flex flex-col gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-red-200">
              Treino do mês
            </p>
            <h2 className="mt-2 text-2xl font-bold text-white">Abril/26</h2>
            <p className="mt-2 text-sm leading-6 text-zinc-300">
              Escolha entre Treino A e Treino B para visualizar os blocos
              planejados.
            </p>
          </div>
          <AppButton href="/workouts">Ver todos os treinos</AppButton>
        </div>
      </AppCard>

      <section className="grid gap-4 sm:grid-cols-2">
        {seedWorkouts.map((workout) => (
          <WorkoutCard key={workout.id} workout={workout} />
        ))}
      </section>

      <AppCard>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-lg font-bold text-white">Histórico</h2>
            <p className="mt-1 text-sm leading-6 text-zinc-400">
              Acompanhe sessões concluídas salvas neste dispositivo.
            </p>
          </div>
          <Link
            href="/history"
            className="flex min-h-12 items-center justify-center rounded-lg border border-zinc-700 px-5 text-sm font-semibold text-zinc-100 transition-colors hover:border-zinc-500 hover:bg-zinc-900"
          >
            Abrir Histórico
          </Link>
        </div>
      </AppCard>

      <p className="rounded-lg border border-zinc-800 bg-zinc-900/60 px-4 py-3 text-center text-xs leading-5 text-zinc-500">
        MVP local em desenvolvimento. Login, banco de dados e sincronização
        ainda não fazem parte desta etapa.
      </p>
    </main>
  );
}
