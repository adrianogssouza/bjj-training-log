import { WorkoutCard } from "@/components/workout/WorkoutCard";
import { seedWorkouts } from "@/data/seed-workouts";

export default function WorkoutsPage() {
  return (
    <main className="flex flex-1 flex-col gap-6 py-8">
      <section className="flex flex-col gap-3">
        <p className="text-sm font-semibold uppercase tracking-wide text-red-300">
          Treinos
        </p>
        <h1 className="text-3xl font-black text-white">Treinos disponíveis</h1>
        <p className="max-w-xl text-base leading-7 text-zinc-300">
          Escolha um treino para ver blocos combinados, exercícios, volume e PSE
          alvo.
        </p>
      </section>

      <section className="grid gap-4 sm:grid-cols-2">
        {seedWorkouts.map((workout) => (
          <WorkoutCard key={workout.id} workout={workout} />
        ))}
      </section>
    </main>
  );
}
