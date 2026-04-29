import Link from "next/link";

import { AppCard } from "@/components/ui/AppCard";
import { RecentSessionCard } from "@/components/home/RecentSessionCard";
import { seedWorkouts } from "@/data/seed-workouts";
import type { Workout } from "@/types";

const monthlyWorkoutIds = ["treino-a-abril-26", "treino-b-abril-26"];
const complementaryGroups = [
  {
    label: "Mobilidade",
    ids: ["mobilidade-com-peso", "mobilidade-sem-peso", "mobilidade-3"],
  },
  {
    label: "Core",
    ids: ["core-1", "core-2"],
  },
  {
    label: "Cardio",
    ids: [
      "cardio-1",
      "cardio-2",
      "cardio-3",
      "cardio-4",
      "cardio-5",
      "cardio-6",
    ],
  },
  {
    label: "Anti-lesão",
    ids: ["anti-lesao"],
  },
];

function getWorkoutsById(ids: string[]) {
  return ids
    .map((id) => seedWorkouts.find((workout) => workout.id === id))
    .filter((workout): workout is Workout => Boolean(workout));
}

function WorkoutMetric({
  label,
  value,
}: {
  label: string;
  value: string | number;
}) {
  return (
    <div className="rounded-md border border-zinc-800 bg-zinc-900 px-3 py-2">
      <p className="text-xs text-zinc-500">{label}</p>
      <p className="mt-0.5 font-semibold text-zinc-100">{value}</p>
    </div>
  );
}

function MonthlyWorkoutCard({ workout }: { workout: Workout }) {
  const itemCount = workout.blocks.reduce(
    (total, block) => total + block.items.length,
    0,
  );

  return (
    <Link href={`/workouts/${workout.id}`} className="group block">
      <AppCard className="flex h-full flex-col gap-5 border-red-500/40 bg-red-950/20 p-5 transition-colors group-hover:border-red-300 group-hover:bg-red-950/30">
        <div className="flex flex-col gap-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-red-200">
            Treino do mês
          </p>
          <div>
            <h3 className="break-words text-2xl font-black leading-8 text-white">
              {workout.title}
            </h3>
            <p className="mt-2 text-sm leading-6 text-zinc-300">
              {workout.description}
            </p>
          </div>
        </div>
        <div className="mt-auto grid grid-cols-2 gap-2 text-sm">
          <WorkoutMetric label="Blocos" value={workout.blocks.length} />
          <WorkoutMetric label="Exercícios" value={itemCount} />
        </div>
        <span className="flex min-h-12 items-center justify-center rounded-lg border border-red-400 bg-red-500 px-4 text-center text-sm font-black text-white shadow-md shadow-red-950/40 transition-colors group-hover:bg-red-400">
          Abrir treino
        </span>
      </AppCard>
    </Link>
  );
}

function TopActionPanel({ workouts }: { workouts: Workout[] }) {
  const primaryWorkout = workouts[0];
  const secondaryWorkout = workouts[1];

  if (!primaryWorkout) {
    return null;
  }

  return (
    <AppCard className="border-red-500/40 bg-red-950/20 p-4">
      <div className="flex flex-col gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-red-200">
            Próximo passo
          </p>
          <h2 className="mt-1 text-xl font-black text-white">
            Abrir treino principal
          </h2>
          <p className="mt-2 text-sm leading-6 text-zinc-300">
            Para entrar rápido no treino do mês e revisar os blocos antes de
            começar.
          </p>
        </div>

        <div className="grid gap-2 sm:grid-cols-[1fr_auto]">
          <Link
            href={`/workouts/${primaryWorkout.id}`}
            className="flex min-h-12 items-center justify-center rounded-lg border border-red-400 bg-red-500 px-4 text-center text-sm font-black text-white shadow-md shadow-red-950/40 transition-colors hover:bg-red-400"
          >
            {primaryWorkout.title}
          </Link>
          {secondaryWorkout ? (
            <Link
              href={`/workouts/${secondaryWorkout.id}`}
              className="flex min-h-12 items-center justify-center rounded-lg border border-zinc-700 bg-zinc-900 px-4 text-center text-sm font-bold text-zinc-100 transition-colors hover:border-zinc-500"
            >
              {secondaryWorkout.title}
            </Link>
          ) : null}
        </div>
      </div>
    </AppCard>
  );
}

function ComplementaryGroupCard({
  label,
  workouts,
}: {
  label: string;
  workouts: Workout[];
}) {
  return (
    <AppCard className="p-4">
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between gap-3">
          <h3 className="text-sm font-black uppercase tracking-wide text-zinc-200">
            {label}
          </h3>
          <span className="rounded-full border border-zinc-700 px-2.5 py-1 text-xs font-black text-zinc-400">
            {workouts.length}
          </span>
        </div>

        <div className="grid grid-cols-1 gap-2 min-[360px]:grid-cols-2">
          {workouts.map((workout) => (
            <Link
              key={workout.id}
              href={`/workouts/${workout.id}`}
              className="flex min-h-11 items-center justify-center rounded-lg border border-zinc-800 bg-zinc-900 px-3 text-center text-sm font-bold text-zinc-100 transition-colors hover:border-red-400 hover:text-red-100"
            >
              {workout.title}
            </Link>
          ))}
        </div>
      </div>
    </AppCard>
  );
}

export default function HomePage() {
  const monthlyWorkouts = getWorkoutsById(monthlyWorkoutIds);
  const complementaryWorkoutCount = complementaryGroups.reduce(
    (total, group) => total + getWorkoutsById(group.ids).length,
    0,
  );

  return (
    <main className="flex flex-1 flex-col gap-6 pb-10 pt-6">
      <section className="flex flex-col gap-5">
        <div className="flex flex-col gap-3">
          <p className="text-sm font-semibold uppercase tracking-wide text-red-300">
            Abril/26
          </p>
          <h1 className="text-[34px] font-black leading-10 tracking-normal text-white">
            APP JIU / BJJ Training Log
          </h1>
          <p className="max-w-2xl text-base leading-7 text-zinc-300">
            Escolha o treino do dia sem caçar link: força do mês no topo,
            complementares logo abaixo e histórico sempre à mão.
          </p>
        </div>
        <TopActionPanel workouts={monthlyWorkouts} />
        <div className="grid grid-cols-3 gap-2">
          <div className="rounded-lg border border-red-500/40 bg-red-500/10 px-3 py-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-red-200">
              Mês
            </p>
            <p className="mt-1 text-xl font-black text-white">2</p>
          </div>
          <div className="rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
              Extras
            </p>
            <p className="mt-1 text-xl font-black text-white">
              {complementaryWorkoutCount}
            </p>
          </div>
          <div className="rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
              Foco
            </p>
            <p className="mt-1 text-xl font-black text-white">4</p>
          </div>
        </div>
      </section>

      <section className="flex flex-col gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-red-300">
            Treinos do mês
          </p>
          <h2 className="mt-1 text-2xl font-black text-white">
            Abril/26
          </h2>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          {monthlyWorkouts.map((workout) => (
            <MonthlyWorkoutCard key={workout.id} workout={workout} />
          ))}
        </div>
      </section>

      <section className="flex flex-col gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-red-300">
            Complementares
          </p>
          <h2 className="mt-1 text-2xl font-black text-white">
            Rotina semanal
          </h2>
          <p className="mt-2 text-sm leading-6 text-zinc-400">
            Atalhos compactos para encaixar o extra certo no dia.
          </p>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          {complementaryGroups.map((group) => {
            const workouts = getWorkoutsById(group.ids);

            if (workouts.length === 0) {
              return null;
            }

            return (
              <ComplementaryGroupCard
                key={group.label}
                label={group.label}
                workouts={workouts}
              />
            );
          })}
        </div>
      </section>

      <section className="flex flex-col gap-3">
        <RecentSessionCard />
        <div className="flex flex-col gap-3 rounded-lg border border-zinc-800 bg-zinc-900/60 px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-bold text-white">Lista completa</p>
            <p className="mt-1 text-sm leading-6 text-zinc-400">
              Visão antiga com todos os treinos em uma lista única.
            </p>
          </div>
          <Link
            href="/workouts"
            className="flex min-h-11 items-center justify-center rounded-lg border border-zinc-700 px-4 text-sm font-bold text-zinc-100 transition-colors hover:border-zinc-500 hover:bg-zinc-950"
          >
            Ver todos
          </Link>
        </div>
      </section>
    </main>
  );
}
