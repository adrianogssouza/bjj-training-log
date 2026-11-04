import Link from "next/link";
import { AppButton } from "@/components/ui/AppButton";
import { AppCard } from "@/components/ui/AppCard";
import { AppBadge } from "@/components/ui/AppBadge";
import { AppIcon } from "@/components/ui/AppIcon";
import { WorkoutBlockList } from "@/components/workout/WorkoutBlockList";
import { WorkoutDetailPageActions } from "@/components/workout/WorkoutDetailPageActions";
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
      <div className="flex flex-1 flex-col gap-6 py-8">
        <AppCard className="flex flex-col gap-4">
          <div>
            <h1 className="text-[24px] font-bold text-[#F4F4F5]">
              Treino não encontrado
            </h1>
            <p className="mt-2 text-[14px] text-[#A1A1AA]">
              O treino solicitado não existe no catálogo oficial.
            </p>
          </div>
          <AppButton href="/workouts" variant="secondary">
            Voltar para treinos
          </AppButton>
        </AppCard>
      </div>
    );
  }

  const metadata = getWorkoutMetadata(workout);
  const blocks = getOrderedWorkoutBlocks(workout);
  const isComplementary = workout.type === "complementary";
  const exerciseCount = workout.blocks.reduce(
    (total, block) => total + block.items.length,
    0
  );

  return (
    <div className="flex flex-1 flex-col gap-5 pb-32">
      {/* Header */}
      <section className="flex flex-col gap-3">
        <Link
          href="/workouts"
          className="inline-flex items-center gap-1.5 text-[14px] font-medium text-[#A1A1AA] hover:text-[#F4F4F5] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#93C5FD] rounded w-fit"
        >
          <AppIcon name="arrow" direction="left" size={16} />
          Voltar para treinos
        </Link>
        <div>
          <div className="flex items-center gap-2">
            <AppBadge variant={workout.type === "monthly" ? "primary" : "neutral"}>
              {workout.type === "monthly" ? "Ciclo 4" : metadata.type}
            </AppBadge>
            <span className="text-[13px] text-[#A1A1AA]">
              {exerciseCount} {exerciseCount === 1 ? "exercício" : "exercícios"}
            </span>
          </div>
          <h1 className="mt-2 break-words text-[28px] font-extrabold leading-[34px] text-[#F4F4F5]">
            {workout.title}
          </h1>
          {workout.description ? (
            <p className="mt-2 text-[14px] leading-[21px] text-[#A1A1AA]">
              {workout.description}
            </p>
          ) : null}
        </div>
      </section>

      {/* Summary Stat Card */}
      <AppCard variant="secondary">
        <dl className="grid grid-cols-2 gap-3 text-[14px] sm:grid-cols-4">
          <div className="rounded-[10px] border border-[#3F3F46] bg-[#27272A] p-3">
            <dt className="text-[12px] text-[#A1A1AA]">Tipo</dt>
            <dd className="mt-0.5 font-bold text-[#F4F4F5]">{metadata.type}</dd>
          </div>
          <div className="rounded-[10px] border border-[#3F3F46] bg-[#27272A] p-3">
            <dt className="text-[12px] text-[#A1A1AA]">Blocos</dt>
            <dd className="mt-0.5 font-bold text-[#F4F4F5]">{metadata.blockCount}</dd>
          </div>
          <div className="rounded-[10px] border border-[#3F3F46] bg-[#27272A] p-3">
            <dt className="text-[12px] text-[#A1A1AA]">Exercícios</dt>
            <dd className="mt-0.5 font-bold text-[#F4F4F5]">{exerciseCount}</dd>
          </div>
          {isComplementary ? (
            <div className="rounded-[10px] border border-[#3F3F46] bg-[#27272A] p-3">
              <dt className="text-[12px] text-[#A1A1AA]">Formato</dt>
              <dd className="mt-0.5 font-bold text-[#F4F4F5]">{metadata.format}</dd>
            </div>
          ) : (
            <div className="rounded-[10px] border border-[#3F3F46] bg-[#27272A] p-3">
              <dt className="text-[12px] text-[#A1A1AA]">Ciclo</dt>
              <dd className="mt-0.5 font-bold text-[#F4F4F5]">Ciclo 4</dd>
            </div>
          )}
        </dl>
      </AppCard>

      {/* Blocks Sequence */}
      <section className="flex flex-col gap-3">
        <div>
          <h2 className="text-[20px] font-bold leading-[28px] text-[#F4F4F5]">
            {isComplementary ? "Sequência guiada" : "Blocos do treino"}
          </h2>
          <p className="text-[14px] text-[#A1A1AA]">
            {isComplementary
              ? "Sequência guiada por vídeo, formato e PSE alvo."
              : "Ordem, tipo do bloco, exercícios combinados, volume e PSE alvo."}
          </p>
        </div>
        <WorkoutBlockList
          blocks={blocks}
          categoryLabel={metadata.category}
          formatLabel={metadata.format}
          variant={workout.type}
        />
      </section>

      {/* Bottom Sticky Action */}
      <WorkoutDetailPageActions workoutId={workout.id} />
    </div>
  );
}
