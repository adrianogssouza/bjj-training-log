"use client";

import type { WorkoutSessionLog } from "@/types";
import { AppModal } from "@/components/ui/AppModal";
import { AppIcon } from "@/components/ui/AppIcon";
import { getBlockTypeLabel } from "@/lib/workouts";
import {
  getStepStatus,
  type BlockGroup,
  type StepStatus,
} from "@/lib/workout-steps";

type ExerciseListSheetProps = {
  isOpen: boolean;
  onClose: () => void;
  groups: BlockGroup[];
  currentStepId?: string;
  logs: Record<string, WorkoutSessionLog>;
  onDoNow: (stepId: string) => void;
};

const statusLabel: Record<StepStatus, string> = {
  done: "feita",
  skipped: "pulada",
  current: "em andamento",
  pending: "pendente",
};

const chipClass: Record<StepStatus, string> = {
  done: "border-[var(--success)] bg-[var(--success)]/25 text-[var(--success-text)]",
  skipped:
    "border-dashed border-[var(--warning)]/70 bg-transparent text-[var(--warning)] hover:bg-[var(--warning)]/10",
  current:
    "border-[var(--primary)] bg-[var(--primary-soft)] text-[var(--primary-text)] ring-2 ring-[var(--primary-line)]",
  pending:
    "border-[var(--border-strong)] bg-[var(--surface-elevated)] text-[var(--foreground)] hover:border-[var(--primary-line)]",
};

export function ExerciseListSheet({
  isOpen,
  onClose,
  groups,
  currentStepId,
  logs,
  onDoNow,
}: ExerciseListSheetProps) {
  return (
    <AppModal
      isOpen={isOpen}
      onClose={onClose}
      title="Lista do treino"
      description="Toque numa série pendente ou pulada para fazer agora."
      maxWidth="max-w-[560px]"
    >
      <div className="flex flex-wrap gap-x-4 gap-y-1 text-[12px] text-[var(--muted)]" aria-hidden="true">
        <span className="inline-flex items-center gap-1.5">
          <span className="flex h-4 w-4 items-center justify-center rounded-full border border-[var(--success)] bg-[var(--success)]/25 text-[var(--success-text)]">
            <AppIcon name="check" size={10} />
          </span>
          Feita
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="h-4 w-4 rounded-full border border-dashed border-[var(--warning)]/70" />
          Pulada
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="h-4 w-4 rounded-full border border-[var(--primary)] bg-[var(--primary-soft)]" />
          Agora
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="h-4 w-4 rounded-full border border-[var(--border-strong)] bg-[var(--surface-elevated)]" />
          Pendente
        </span>
      </div>

      <div className="-mx-1 max-h-[62vh] space-y-3 overflow-y-auto overscroll-contain px-1 pb-1">
        {groups.map((group) => {
          const allSteps = group.exercises.flatMap((exercise) => exercise.steps);
          const doneCount = allSteps.filter((step) => logs[step.id]?.completed).length;
          const skippedCount = allSteps.filter((step) => logs[step.id]?.skipped).length;
          const isCurrentBlock = allSteps.some((step) => step.id === currentStepId);

          return (
            <section
              key={group.block.id}
              aria-label={`Bloco ${group.block.order}: ${group.block.title}`}
              className={`rounded-[14px] border p-3 ${
                isCurrentBlock
                  ? "border-[var(--primary-line)] bg-[var(--primary-tint)]"
                  : "border-[var(--border)] bg-[var(--surface-elevated)]/40"
              }`}
            >
              <header className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-[12px] font-semibold text-[var(--muted)]">
                    Bloco {group.block.order} · {getBlockTypeLabel(group.block.type)}
                    {group.totalSets > 1 ? ` · ${group.totalSets} rodadas` : ""}
                  </p>
                  <h3 className="mt-0.5 break-words text-[15px] font-bold leading-5 text-[var(--foreground)]">
                    {group.block.title}
                  </h3>
                </div>
                <p className="shrink-0 text-right text-[12px] leading-4 text-[var(--muted)]">
                  <span className="block font-bold text-[var(--foreground)]">
                    {doneCount}/{allSteps.length}
                  </span>
                  {skippedCount > 0 ? `${skippedCount} pulada${skippedCount > 1 ? "s" : ""}` : "feitas"}
                </p>
              </header>

              <ul className="mt-3 space-y-3">
                {group.exercises.map((exercise) => (
                  <li key={exercise.item.id}>
                    <p className="break-words text-[14px] font-medium leading-5 text-[var(--foreground-soft)]">
                      {exercise.item.name}
                      {exercise.item.reps || exercise.item.time ? (
                        <span className="text-[var(--muted)]">
                          {" "}— {exercise.item.reps ?? exercise.item.time}
                        </span>
                      ) : null}
                    </p>
                    <div className="mt-1.5 flex flex-wrap gap-2">
                      {exercise.steps.map((step) => {
                        const status = getStepStatus(step, currentStepId, logs);
                        const canDoNow = status === "pending" || status === "skipped";
                        const setName =
                          step.totalSets > 1 ? `Série ${step.set}` : "Série única";
                        const actionHint = canDoNow ? ", fazer agora" : "";

                        return (
                          <button
                            key={step.id}
                            type="button"
                            disabled={!canDoNow}
                            onClick={() => onDoNow(step.id)}
                            aria-label={`${setName} de ${exercise.item.name}: ${statusLabel[status]}${actionHint}`}
                            className={`flex min-h-[44px] min-w-[44px] items-center justify-center gap-1 rounded-full border px-3 text-[14px] font-bold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus)] disabled:cursor-default ${chipClass[status]}`}
                          >
                            {status === "done" ? <AppIcon name="check" size={14} /> : null}
                            <span className={status === "skipped" ? "line-through" : ""}>
                              {step.totalSets > 1 ? step.set : "1"}
                            </span>
                            {status === "current" ? (
                              <span className="text-[11px] font-semibold">agora</span>
                            ) : null}
                          </button>
                        );
                      })}
                    </div>
                  </li>
                ))}
              </ul>
            </section>
          );
        })}
      </div>
    </AppModal>
  );
}
