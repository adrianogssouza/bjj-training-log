"use client";

import { useState } from "react";
import type { WorkoutBlock } from "@/types";
import { AppCard } from "@/components/ui/AppCard";
import { AppBadge } from "@/components/ui/AppBadge";
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
          const blockTypeLabel = isComplementary
            ? getComplementaryBlockLabel({
                categoryLabel,
                formatLabel,
                type: block.type,
              })
            : getBlockTypeLabel(block.type);

          return (
            <li key={block.id}>
              <AppCard variant="secondary" className="space-y-4 p-4">
                <div className="flex items-start gap-3">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[8px] bg-[#DC2626] text-white text-[14px] font-bold">
                    {block.order}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-[12px] font-semibold uppercase tracking-wider text-[#FCA5A5]">
                      {blockTypeLabel}
                    </p>
                    <h3 className="text-[16px] font-bold leading-snug text-[#F4F4F5]">
                      {block.title}
                    </h3>
                    {block.notes && (
                      <p className="mt-1 text-[13px] leading-[18px] text-[#A1A1AA]">
                        {block.notes}
                      </p>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 text-[13px]">
                  <div className="rounded-[8px] border border-[#3F3F46] bg-[#27272A] px-3 py-1.5">
                    <span className="text-[#A1A1AA]">Sets: </span>
                    <strong className="text-[#F4F4F5]">{block.sets}</strong>
                  </div>
                  <div className="rounded-[8px] border border-[#3F3F46] bg-[#27272A] px-3 py-1.5">
                    <span className="text-[#A1A1AA]">
                      {isComplementary ? "Etapas: " : "Exercícios: "}
                    </span>
                    <strong className="text-[#F4F4F5]">{block.items.length}</strong>
                  </div>
                </div>

                <ul className="flex flex-col gap-2">
                  {block.items.map((item) => {
                    const videoUrl = item.videoUrl?.trim();

                    return (
                      <li
                        key={item.id}
                        className="rounded-[10px] border border-[#3F3F46] bg-[#27272A]/70 p-3 space-y-2.5"
                      >
                        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                          <h4 className="text-[15px] font-bold text-[#F4F4F5]">
                            {isComplementary ? `${item.name} (guiado)` : item.name}
                          </h4>
                          {videoUrl && (
                            <button
                              type="button"
                              onClick={() =>
                                setSelectedVideo({
                                  title: item.name,
                                  videoUrl,
                                })
                              }
                              className="self-start rounded-[8px] border border-[#3F3F46] bg-[#18181B] px-2.5 py-1 text-[12px] font-bold text-[#F4F4F5] hover:border-[#DC2626] hover:text-white transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#93C5FD]"
                            >
                              Ver vídeo
                            </button>
                          )}
                        </div>

                        <dl className="grid grid-cols-3 gap-2 text-[12px]">
                          <div>
                            <dt className="text-[#A1A1AA]">Reps</dt>
                            <dd className="font-semibold text-[#F4F4F5]">
                              {item.reps ?? (isComplementary ? "Etapa" : "-")}
                            </dd>
                          </div>
                          <div>
                            <dt className="text-[#A1A1AA]">Tempo</dt>
                            <dd className="font-semibold text-[#F4F4F5]">
                              {item.time ?? "-"}
                            </dd>
                          </div>
                          <div>
                            <dt className="text-[#A1A1AA]">PSE alvo</dt>
                            <dd className="mt-0.5">
                              {item.targetPse ? (
                                <AppBadge variant="primary">
                                  {item.targetPse}
                                </AppBadge>
                              ) : (
                                <span className="text-[#A1A1AA]">-</span>
                              )}
                            </dd>
                          </div>
                        </dl>
                      </li>
                    );
                  })}
                </ul>
              </AppCard>
            </li>
          );
        })}
      </ol>

      {selectedVideo && (
        <VideoModal
          title={selectedVideo.title}
          videoUrl={selectedVideo.videoUrl}
          onClose={() => setSelectedVideo(null)}
        />
      )}
    </>
  );
}
