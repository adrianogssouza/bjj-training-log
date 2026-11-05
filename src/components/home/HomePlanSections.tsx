"use client";

import Link from "next/link";
import { useState } from "react";
import { seedWorkouts } from "@/data/seed-workouts";
import { getActiveCycle } from "@/data/training-cycles";
import { AppBadge } from "@/components/ui/AppBadge";
import { AppButton } from "@/components/ui/AppButton";
import { AppIcon } from "@/components/ui/AppIcon";
import { PlanDayModal, WEEKDAY_SHORT } from "@/components/plan/PlanDayModal";
import { usePlanData } from "@/components/plan/usePlanData";
import {
  addDaysIso,
  estimatedMinutes,
  getPlanOption,
  getWeek,
  isPlanItemDone,
  isTrainingKey,
  resolveWorkoutId,
  saoPauloDateOf,
  toggleDayItem,
  weekdayIndex,
  withWeek,
} from "@/lib/weekly-plan";

function formatLast(date: string) {
  const [, m, d] = date.split("-").map(Number);
  const months = ["jan.", "fev.", "mar.", "abr.", "mai.", "jun.", "jul.", "ago.", "set.", "out.", "nov.", "dez."];
  return `${d} de ${months[m - 1]}`;
}

/** Home: "Plano de hoje" (o que treinar agora) e a faixa da semana. */
export function HomePlanSections() {
  const data = usePlanData();
  const [editing, setEditing] = useState<string | null>(null);
  const { cycle } = getActiveCycle();

  const monday = data.currentMonday;
  const week = getWeek(data.plans, monday);
  const todayIndex = weekdayIndex(data.today);
  const todayItems = week[todayIndex];
  const sources = { history: data.history, bikeSessions: data.bikeSessions };

  const trainingToday = todayItems.filter(isTrainingKey);
  const doneToday = trainingToday.filter((key) => isPlanItemDone(key, data.today, sources)).length;
  const minutesToday = trainingToday.reduce((total, key) => total + estimatedMinutes(key), 0);

  const cycleLength = Math.round((Date.parse(cycle.endDate) - Date.parse(cycle.startDate)) / 86_400_000) + 1;
  const cycleDay = Math.min(cycleLength, Math.max(1, Math.round((Date.parse(data.today) - Date.parse(cycle.startDate)) / 86_400_000) + 1));

  const plannedThisWeek = week.reduce((total, day) => total + day.filter(isTrainingKey).length, 0);
  const doneThisWeek = week.reduce(
    (total, day, index) =>
      total + day.filter((key) => isTrainingKey(key) && isPlanItemDone(key, addDaysIso(monday, index), sources)).length,
    0,
  );

  function toggle(date: string, key: string) {
    const index = Math.round((Date.parse(date) - Date.parse(monday)) / 86_400_000);
    const next = getWeek(data.plans, monday);
    next[index] = toggleDayItem(next[index], key);
    data.savePlans(withWeek(data.plans, monday, next));
  }

  // O primeiro treino ainda não feito ganha o botão principal.
  const primaryKey = todayItems.find((key) => isTrainingKey(key) && !isPlanItemDone(key, data.today, sources));
  const editingIndex = editing ? Math.round((Date.parse(editing) - Date.parse(monday)) / 86_400_000) : -1;

  return (
    <>
      {/* Plano de hoje */}
      <section
        aria-labelledby="today-plan-heading"
        className="flex flex-col gap-4 rounded-[16px] border border-[var(--border)] bg-[var(--surface)] p-5"
      >
        <div className="flex items-center justify-between gap-2">
          <h2
            id="today-plan-heading"
            className="text-[13px] font-bold uppercase tracking-[0.05em] text-[var(--primary-text)]"
          >
            Plano de hoje
          </h2>
          <AppBadge variant="primary">
            {cycle.name} · dia {cycleDay} de {cycleLength}
          </AppBadge>
        </div>

        {data.ready && (
          <p className="-mt-1 text-[14px] leading-[21px] text-[var(--muted)]">
            {trainingToday.length
              ? `${trainingToday.length} ${trainingToday.length === 1 ? "treino" : "treinos"} · ~${minutesToday} min${
                  doneToday ? ` · ${doneToday} ${doneToday === 1 ? "concluído" : "concluídos"}` : ""
                }`
              : todayItems.length
                ? "Sem musculação planejada para hoje."
                : "Nenhum treino planejado para hoje."}
          </p>
        )}

        {todayItems.map((key) => {
          const option = getPlanOption(key);
          if (!option) return null;

          if (option.kind === "rest") {
            return (
              <div key={key} className="flex items-center gap-3 rounded-[14px] border border-[var(--border)] bg-[var(--surface-elevated)] p-3.5">
                <PlanBadge text={option.badge} />
                <div className="min-w-0 flex-1">
                  <p className="text-[18px] font-extrabold leading-[23px] text-[var(--foreground)]">{option.title}</p>
                  <p className="text-[13px] leading-[18px] text-[var(--muted)]">
                    {key === "tatame" ? "Sem musculação planejada. Bom treino no tatame." : "Recuperação. Nada planejado."}
                  </p>
                </div>
              </div>
            );
          }

          const done = isPlanItemDone(key, data.today, sources);
          const primary = key === primaryKey;

          if (option.kind === "bike") {
            return (
              <PlanItemCard
                key={key}
                badge={option.badge}
                title={option.title}
                meta="Sessão do programa de Bike"
                done={done}
                active={false}
                primary={primary}
                href="/bike"
                cta="Abrir Bike"
              />
            );
          }

          const workoutId = resolveWorkoutId(key, data.today);
          const workout = seedWorkouts.find((w) => w.id === workoutId);
          if (!workout) return null;
          const active = data.activeSessions.some((s) => s.workoutId === workout.id);
          const exercises = workout.blocks.reduce((total, block) => total + block.items.length, 0);
          const last = data.history.find((entry) => entry.workoutId === workout.id);
          const lastDate = last ? saoPauloDateOf(last.completedAt) : null;
          const meta = [
            workout.type === "monthly" ? cycle.name : null,
            `${exercises} ${exercises === 1 ? "exercício" : "exercícios"}`,
            `~${estimatedMinutes(key)} min`,
            lastDate && lastDate !== data.today ? `última ${formatLast(lastDate)}` : null,
          ]
            .filter(Boolean)
            .join(" · ");

          return (
            <PlanItemCard
              key={key}
              badge={option.badge}
              title={option.title}
              meta={meta}
              done={done}
              active={active}
              primary={primary}
              href={`/workouts/${workout.id}/start?${active ? "continue" : "start"}=1`}
              cta={`${active ? "Continuar" : "Iniciar"} ${option.title.split(" · ")[0]}`}
              detailsHref={`/workouts/${workout.id}`}
            />
          );
        })}

        {data.ready && todayItems.length === 0 && (
          <div className="flex flex-col gap-2.5 rounded-[14px] border border-dashed border-[var(--border)] p-3.5">
            <p className="text-[14px] leading-[21px] text-[var(--muted)]">
              Monte o dia com um ou mais treinos (ex.: Treino A + Cardio).
            </p>
            <AppButton onClick={() => setEditing(data.today)}>Planejar hoje</AppButton>
          </div>
        )}

        {data.ready && trainingToday.length === 0 && (
          <div className="grid grid-cols-2 gap-2">
            <AppButton href={`/workouts/${cycle.workoutAId}`} variant="secondary" className="text-[15px]">
              Treinar A mesmo assim
            </AppButton>
            <AppButton href={`/workouts/${cycle.workoutBId}`} variant="secondary" className="text-[15px]">
              Treinar B mesmo assim
            </AppButton>
          </div>
        )}
      </section>

      {/* Plano da semana */}
      <section aria-labelledby="week-plan-heading" className="space-y-3">
        <div className="flex items-center justify-between gap-2">
          <h2 id="week-plan-heading" className="text-[20px] font-bold leading-[28px] text-[var(--foreground)]">
            Plano da semana
          </h2>
          <Link
            href="/plano"
            className="flex min-h-[36px] items-center rounded-[10px] border border-[var(--primary-hover)] bg-[var(--primary-soft)] px-3 text-[13px] font-bold text-[var(--primary-text)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus)]"
          >
            Planejar semana
          </Link>
        </div>

        <div className="grid grid-cols-7 gap-1.5">
          {week.map((items, index) => {
            const date = addDaysIso(monday, index);
            const isToday = index === todayIndex;
            const trainingKeys = items.filter(isTrainingKey);
            const doneCount = trainingKeys.filter((key) => isPlanItemDone(key, date, sources)).length;
            const allDone = trainingKeys.length > 0 && doneCount === trainingKeys.length;
            const missed = !allDone && trainingKeys.length > 0 && date < data.today;
            const tags = items.length <= 2 ? items : [items[0], `+${items.length - 1}`];
            const dayName = WEEKDAY_SHORT[index];
            const summary = items.map((key) => getPlanOption(key)?.title ?? key).join(", ") || "nada planejado";

            return (
              <button
                key={date}
                type="button"
                onClick={() => setEditing(date)}
                aria-label={`${dayName} ${Number(date.slice(8))}: ${summary}${allDone ? ", concluído" : ""}. Toque para ajustar.`}
                className={`flex flex-col items-center gap-1.5 rounded-[12px] border px-0 pb-2 pt-2.5 text-[var(--foreground)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus)] ${
                  isToday
                    ? "border-[var(--primary-hover)] bg-[var(--primary-soft)]"
                    : "border-[var(--border)] bg-[var(--surface)]"
                }`}
              >
                <span className={`text-[11px] font-bold tracking-[0.05em] ${isToday ? "text-[var(--primary-text)]" : "text-[var(--muted)]"}`}>
                  {dayName}
                </span>
                <span className="text-[16px] font-extrabold">{Number(date.slice(8))}</span>
                <span className="flex min-h-[27px] flex-col items-center gap-px">
                  {items.length === 0 ? (
                    <span className="text-[10.5px] font-bold leading-[13px] text-[var(--muted-strong)]">—</span>
                  ) : (
                    tags.map((key) => {
                      const option = getPlanOption(key);
                      const color = !option
                        ? "text-[var(--muted)]"
                        : key === "a" || key === "b"
                          ? "text-[var(--primary-text)]"
                          : option.kind === "rest"
                            ? "text-[var(--muted-strong)]"
                            : "text-[var(--foreground)]";
                      return (
                        <span key={key} className={`text-[10.5px] font-bold leading-[13px] ${color}`}>
                          {option?.tag ?? key}
                        </span>
                      );
                    })
                  )}
                </span>
                <span
                  aria-hidden="true"
                  className={`flex h-4 w-4 items-center justify-center rounded-full text-[var(--background)] ${
                    allDone
                      ? "bg-[var(--success-text)]"
                      : doneCount > 0
                        ? "bg-[var(--success-text)]/40"
                        : missed
                          ? "bg-[var(--warning)]/30"
                          : "bg-[var(--surface-elevated)]"
                  }`}
                >
                  {allDone && <AppIcon name="check" size={11} strokeWidth={3.5} />}
                </span>
              </button>
            );
          })}
        </div>

        <p className="text-[13px] text-[var(--muted)]">
          {plannedThisWeek
            ? `${doneThisWeek} de ${plannedThisWeek} treinos planejados feitos nesta semana.`
            : "Nenhum treino planejado nesta semana. Toque num dia para montar."}
        </p>
      </section>

      <PlanDayModal
        date={editing}
        items={editingIndex >= 0 ? week[editingIndex] ?? [] : []}
        onToggle={(key) => editing && toggle(editing, key)}
        onClose={() => setEditing(null)}
      />
    </>
  );
}

function PlanBadge({ text }: { text: string }) {
  return (
    <span
      aria-hidden="true"
      className={`flex h-11 min-w-11 shrink-0 items-center justify-center rounded-[12px] border border-[var(--primary-hover)] bg-[var(--primary-soft)] px-1 font-black text-[var(--primary-text)] ${
        text.length > 1 ? "text-[15px]" : "text-[22px]"
      }`}
    >
      {text}
    </span>
  );
}

function PlanItemCard({
  badge,
  title,
  meta,
  done,
  active,
  primary,
  href,
  cta,
  detailsHref,
}: {
  badge: string;
  title: string;
  meta: string;
  done: boolean;
  active: boolean;
  primary: boolean;
  href: string;
  cta: string;
  detailsHref?: string;
}) {
  return (
    <div
      className={`flex flex-col gap-3 rounded-[14px] border p-3.5 ${
        active ? "border-[var(--primary-line)] bg-[var(--primary-tint)]" : "border-[var(--border)] bg-[var(--surface-elevated)]"
      }`}
    >
      <div className="flex items-center gap-3">
        <PlanBadge text={badge} />
        <div className="min-w-0 flex-1">
          {detailsHref ? (
            <Link href={detailsHref} className="text-[18px] font-extrabold leading-[23px] text-[var(--foreground)] hover:underline">
              {title}
            </Link>
          ) : (
            <p className="text-[18px] font-extrabold leading-[23px] text-[var(--foreground)]">{title}</p>
          )}
          <p className="text-[13px] leading-[18px] text-[var(--muted)]">{meta}</p>
        </div>
        {done && <AppBadge variant="success">Feito ✓</AppBadge>}
        {!done && active && <AppBadge variant="primary">Em andamento</AppBadge>}
      </div>
      {!done && (
        <AppButton href={href} variant={primary ? "primary" : "secondary"} fullWidth>
          <AppIcon name="play" size={16} />
          {cta}
        </AppButton>
      )}
    </div>
  );
}
