"use client";

import { useState } from "react";

import type { WorkoutBlock } from "@/types";
import { AppCard } from "@/components/ui/AppCard";
import { VideoModal } from "@/components/ui/VideoModal";
import { getBlockTypeLabel } from "@/lib/workouts";

type WorkoutBlockListProps = {
  blocks: WorkoutBlock[];
  categoryLabel?: string;
  formatLabel?: string;
  variant?: "monthly" | "complementary";
};

function getComplementaryBlockLabel({
  categoryLabel,
  formatLabel,
  type,
}: {
  categoryLabel?: string;
  formatLabel?: string;
  type: WorkoutBlock["type"];
}) {
  if (categoryLabel === "Anti-lesão") {
    return "Anti-lesão / prevenção";
  }

  if (categoryLabel === "Cardio" || type === "cardio") {
    return "Cardio guiado";
  }

  if (categoryLabel === "Core" || type === "circuit") {
    return "Circuito / combo";
  }

  return formatLabel ?? "Sequência / combo";
}

export function WorkoutBlockList({
  blocks,
  categoryLabel,
  formatLabel,
  variant = "monthly",
}: WorkoutBlockListProps) {
  const [selectedVideo, setSelectedVideo] = useState<{
    title: string;
    videoUrl: string;
  } | null>(null);
  const isComplementary = variant === "complementary";

  return (
    <>
      <ol className="flex flex-col gap-3">
        {blocks.map((block) => {
          const isCardio = block.type === "cardio";
          const blockTypeLabel = isComplementary
            ? getComplementaryBlockLabel({
                categoryLabel,
                formatLabel,
                type: block.type,
              })
            : getBlockTypeLabel(block.type);
          const cardClassName = isCardio
            ? "border-cyan-500/50 bg-cyan-950/20 p-4"
            : "p-4";
          const orderClassName = isCardio
            ? "bg-cyan-400 text-cyan-950"
            : "bg-red-500 text-white";
          const typeClassName = isCardio ? "text-cyan-200" : "text-red-300";

          return (
            <li key={block.id}>
              <AppCard className={cardClassName}>
                <div className="flex flex-col gap-3">
                  <div className="flex gap-3">
                    <span
                      className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-sm font-black ${orderClassName}`}
                    >
                      {block.order}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p
                        className={`text-xs font-semibold uppercase tracking-wide ${typeClassName}`}
                      >
                        {blockTypeLabel}
                      </p>
                      <h3 className="mt-1 break-words text-[15px] font-bold leading-snug text-white sm:text-base">
                        {block.title}
                      </h3>
                      {block.notes ? (
                        <p className="mt-2 text-sm leading-6 text-zinc-400">
                          {block.notes}
                        </p>
                      ) : null}
                    </div>
                  </div>

                  <dl className="grid grid-cols-2 gap-2 text-sm">
                    <div className="rounded-md border border-zinc-800 bg-zinc-900 px-3 py-2">
                      <dt className="text-xs text-zinc-500">Sets</dt>
                      <dd className="font-semibold text-zinc-100">
                        {block.sets}
                      </dd>
                    </div>
                    <div className="rounded-md border border-zinc-800 bg-zinc-900 px-3 py-2">
                      <dt className="text-xs text-zinc-500">
                        {isComplementary ? "Etapas" : "Exercícios"}
                      </dt>
                      <dd className="font-semibold text-zinc-100">
                        {block.items.length}
                      </dd>
                    </div>
                  </dl>

                  <ul className="flex flex-col gap-2">
                    {block.items.map((item) => {
                      const videoUrl = item.videoUrl?.trim();

                      return (
                        <li
                          key={item.id}
                          className={`rounded-md border p-3 ${
                            isCardio
                              ? "border-cyan-700/70 bg-cyan-950/30"
                              : "border-zinc-800 bg-zinc-900/80"
                          }`}
                        >
                          <div className="flex flex-col gap-3">
                            <div className="flex flex-col gap-2">
                              <h4 className="break-words text-[15px] font-bold leading-snug text-white">
                                {isComplementary
                                  ? `${item.name} - sequência guiada`
                                  : item.name}
                              </h4>
                              {videoUrl ? (
                                <button
                                  type="button"
                                  onClick={() =>
                                    setSelectedVideo({
                                      title: item.name,
                                      videoUrl,
                                    })
                                  }
                                  className="min-h-10 self-start rounded-lg border border-zinc-700 bg-zinc-950 px-3 text-sm font-bold text-zinc-100 transition-colors hover:border-red-400 hover:text-red-100"
                                >
                                  Ver vídeo
                                </button>
                              ) : null}
                            </div>
                            <dl className="grid grid-cols-3 gap-2 text-sm">
                              <div>
                                <dt className="text-xs text-zinc-500">Reps</dt>
                                <dd className="font-semibold text-zinc-100">
                                  {item.reps ??
                                    (isComplementary ? "Etapa" : "-")}
                                </dd>
                              </div>
                              <div>
                                <dt className="text-xs text-zinc-500">Tempo</dt>
                                <dd className="font-semibold text-zinc-100">
                                  {item.time ?? "-"}
                                </dd>
                              </div>
                              <div>
                                <dt className="text-xs text-zinc-500">PSE</dt>
                                <dd
                                  className={`mt-1 inline-flex min-h-6 items-center rounded-full px-2.5 text-xs font-black ${
                                    isCardio
                                      ? "bg-cyan-300 text-cyan-950"
                                      : "bg-red-500/20 text-red-200 ring-1 ring-red-500/40"
                                  }`}
                                >
                                  {item.targetPse ?? "-"}
                                </dd>
                              </div>
                            </dl>
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              </AppCard>
            </li>
          );
        })}
      </ol>

      {selectedVideo ? (
        <VideoModal
          title={selectedVideo.title}
          videoUrl={selectedVideo.videoUrl}
          onClose={() => setSelectedVideo(null)}
        />
      ) : null}
    </>
  );
}
