"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { AppCard } from "@/components/ui/AppCard";
import { AppBadge, type AppBadgeVariant } from "@/components/ui/AppBadge";
import { AppButton } from "@/components/ui/AppButton";
import { AppEmptyState } from "@/components/ui/AppEmptyState";
import { AppIcon } from "@/components/ui/AppIcon";
import { AppInput } from "@/components/ui/AppInput";
import { AppSelect } from "@/components/ui/AppSelect";
import { readWorkoutHistory } from "@/lib/workout-storage";
import { loadBikeData, readableDate, type BikeData, type BikeSession } from "@/lib/bike-cardio";
import { seedWorkouts } from "@/data/seed-workouts";
import type { WorkoutHistoryEntry, WorkoutSessionLog } from "@/types";

type CategoryFilter = "todos" | "principal" | "complementares" | "bike";
type PeriodFilter = "all" | "7d" | "30d" | "90d";

interface UnifiedHistoryItem {
  id: string;
  type: "monthly" | "complementary" | "bike";
  categoryLabel: "Principal" | "Complementar" | "Bike";
  categoryBadgeVariant: AppBadgeVariant;
  title: string;
  effectiveDate: string; // "YYYY-MM-DD"
  secondarySortKey: number;
  formattedDate: string;
  durationSeconds: number;
  formattedDuration: string;
  status: "completed" | "skipped";
  workoutEntry?: WorkoutHistoryEntry;
  bikeSession?: BikeSession;
}

function formatDuration(totalSeconds: number) {
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

function formatAccumulatedWorkoutTime(totalSeconds: number): string {
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  if (hours > 0) {
    return `${hours}h ${minutes}min`;
  }
  return `${minutes} min`;
}

function formatHistoryDate(dateInput: string | number): string {
  try {
    const d = new Date(dateInput);
    return new Intl.DateTimeFormat("pt-BR", {
      dateStyle: "short",
      timeStyle: "short",
    }).format(d);
  } catch {
    return String(dateInput);
  }
}

function resolveExercise(entry: WorkoutHistoryEntry, log: WorkoutSessionLog) {
  const workout = seedWorkouts.find((w) => w.id === entry.workoutId);
  const block = workout?.blocks.find((b) => b.id === log.blockId);
  const item = block?.items.find((i) => i.id === log.itemId);

  return {
    blockTitle: block?.title ?? "Bloco",
    exerciseName: item?.name ?? "Exercício",
  };
}

export function WorkoutHistory() {
  const [history, setHistory] = useState<WorkoutHistoryEntry[]>([]);
  const [bikeData, setBikeData] = useState<BikeData | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<CategoryFilter>("todos");
  const [selectedPeriod, setSelectedPeriod] = useState<PeriodFilter>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [visibleCount, setVisibleCount] = useState(20);
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  const [referenceNow, setReferenceNow] = useState<number>(() => Date.now());

  useEffect(() => {
    function load() {
      setHistory(readWorkoutHistory());
      setBikeData(loadBikeData());
      setReferenceNow(Date.now());
    }
    load();
    window.addEventListener("bjj-storage-updated", load);
    window.addEventListener("bjj-bike-updated", load);
    window.addEventListener("bjj-cloud-updated", load);
    window.addEventListener("storage", load);
    return () => {
      window.removeEventListener("bjj-storage-updated", load);
      window.removeEventListener("bjj-bike-updated", load);
      window.removeEventListener("bjj-cloud-updated", load);
      window.removeEventListener("storage", load);
    };
  }, []);

  function handleCategoryChange(cat: CategoryFilter) {
    setSelectedCategory(cat);
    setVisibleCount(20);
  }

  function handlePeriodChange(p: PeriodFilter) {
    setSelectedPeriod(p);
    setVisibleCount(20);
  }

  function handleSearchChange(q: string) {
    setSearchQuery(q);
    setVisibleCount(20);
  }

  // Combine workout and bike sessions into a unified list
  const unifiedItems = useMemo<UnifiedHistoryItem[]>(() => {
    const list: UnifiedHistoryItem[] = [];

    // Musculação & Complementares
    for (const entry of history) {
      const workout = seedWorkouts.find((w) => w.id === entry.workoutId);
      const isMonthly = workout?.type === "monthly" || entry.workoutId.startsWith("treino-");
      const dt = new Date(entry.completedAt || entry.startedAt);
      const secondarySortKey = Number.isFinite(dt.getTime()) ? dt.getTime() : 0;
      const effectiveDate = Number.isFinite(dt.getTime())
        ? `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, "0")}-${String(dt.getDate()).padStart(2, "0")}`
        : "";

      list.push({
        id: entry.id,
        type: isMonthly ? "monthly" : "complementary",
        categoryLabel: isMonthly ? "Principal" : "Complementar",
        categoryBadgeVariant: isMonthly ? "primary" : "neutral",
        title: entry.workoutTitle,
        effectiveDate,
        secondarySortKey,
        formattedDate: formatHistoryDate(entry.completedAt || entry.startedAt),
        durationSeconds: entry.durationSeconds,
        formattedDuration: formatDuration(entry.durationSeconds),
        status: "completed",
        workoutEntry: entry,
      });
    }

    // Bike sessions
    if (bikeData && bikeData.sessions) {
      for (const session of bikeData.sessions) {
        const effectiveDate = session.date; // effective workout date "YYYY-MM-DD"
        const secondarySortKey = session.recordedAt
          ? (new Date(session.recordedAt).getTime() || 0)
          : 0;
        const isCompleted = session.status === "completed";

        list.push({
          id: session.id,
          type: "bike",
          categoryLabel: "Bike",
          categoryBadgeVariant: "success",
          title: "Cardio na Bike",
          effectiveDate,
          secondarySortKey,
          formattedDate: readableDate(session.date),
          durationSeconds: session.minutes * 60,
          formattedDuration: `${session.minutes} min`,
          status: isCompleted ? "completed" : "skipped",
          bikeSession: session,
        });
      }
    }

    // Sort: primary effectiveDate descending, secondary recordedAt / completion time descending
    return list.sort((a, b) => {
      if (a.effectiveDate !== b.effectiveDate) {
        return b.effectiveDate.localeCompare(a.effectiveDate);
      }
      return b.secondarySortKey - a.secondarySortKey;
    });
  }, [history, bikeData]);

  // Apply filters
  const filteredItems = useMemo(() => {
    const now = new Date(referenceNow);
    let periodDays = 0;
    if (selectedPeriod === "7d") periodDays = 7;
    else if (selectedPeriod === "30d") periodDays = 30;
    else if (selectedPeriod === "90d") periodDays = 90;

    let cutoffDateStr = "";
    if (periodDays > 0) {
      const cutoff = new Date(now);
      cutoff.setDate(cutoff.getDate() - periodDays);
      cutoffDateStr = `${cutoff.getFullYear()}-${String(cutoff.getMonth() + 1).padStart(2, "0")}-${String(cutoff.getDate()).padStart(2, "0")}`;
    }

    const term = searchQuery.trim().toLowerCase();

    return unifiedItems.filter((item) => {
      // Category filter
      if (selectedCategory === "principal" && item.type !== "monthly") return false;
      if (selectedCategory === "complementares" && item.type !== "complementary") return false;
      if (selectedCategory === "bike" && item.type !== "bike") return false;

      // Period filter based on effectiveDate
      if (cutoffDateStr && item.effectiveDate < cutoffDateStr) return false;

      // Text search filter
      if (term) {
        const matchesTitle = item.title.toLowerCase().includes(term);
        const matchesCategory = item.categoryLabel.toLowerCase().includes(term);
        if (!matchesTitle && !matchesCategory) return false;
      }

      return true;
    });
  }, [unifiedItems, selectedCategory, selectedPeriod, searchQuery, referenceNow]);

  // Aggregate stats (Section 11.6: separate Treinos vs Bike)
  const stats = useMemo(() => {
    // Treinos (monthly + complementary)
    const workoutItems = filteredItems.filter((i) => i.type !== "bike");
    const workoutSessionsCount = workoutItems.length;
    const workoutTotalSeconds = workoutItems.reduce((acc, i) => acc + i.durationSeconds, 0);

    // Bike
    const bikeItems = filteredItems.filter((i) => i.type === "bike" && i.status === "completed");
    const bikeSessionsCount = bikeItems.length;
    const bikeTotalMinutes = bikeItems.reduce((acc, i) => acc + (i.bikeSession?.minutes || 0), 0);

    return {
      workoutSessionsCount,
      workoutTotalTime: formatAccumulatedWorkoutTime(workoutTotalSeconds),
      bikeSessionsCount,
      bikeTotalMinutes,
    };
  }, [filteredItems]);

  const visibleItems = filteredItems.slice(0, visibleCount);
  const hasMore = visibleCount < filteredItems.length;

  function toggleExpand(id: string) {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function handleClearFilters() {
    setSelectedCategory("todos");
    setSelectedPeriod("all");
    setSearchQuery("");
  }

  const isGlobalEmpty = unifiedItems.length === 0;
  const isBikeEmpty = selectedCategory === "bike" && filteredItems.length === 0;

  return (
    <div className="flex flex-1 flex-col gap-6">
      {/* Header */}
      <header className="space-y-1">
        <h1 className="text-[28px] font-extrabold leading-[34px] text-[var(--foreground)]">
          Histórico
        </h1>
        <p className="text-[16px] font-normal leading-[24px] text-[var(--muted)]">
          Suas sessões registradas
        </p>
      </header>

      {/* Aggregate Stats (Section 11.6: separate Treinos vs Bike) */}
      {!isGlobalEmpty && (
        <section aria-label="Indicadores do histórico" className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <div className="rounded-[12px] border border-[var(--border)] bg-[var(--surface)] p-3.5 space-y-1">
            <span className="text-[12px] font-medium text-[var(--muted)]">Treinos concluídos</span>
            <p className="text-[22px] font-extrabold text-[var(--foreground)]">{stats.workoutSessionsCount}</p>
          </div>
          <div className="rounded-[12px] border border-[var(--border)] bg-[var(--surface)] p-3.5 space-y-1">
            <span className="text-[12px] font-medium text-[var(--muted)]">Tempo em treino</span>
            <p className="text-[22px] font-extrabold text-[var(--foreground)]">{stats.workoutTotalTime}</p>
          </div>
          <div className="rounded-[12px] border border-[var(--border)] bg-[var(--surface)] p-3.5 space-y-1">
            <span className="text-[12px] font-medium text-[var(--muted)]">Pedaladas</span>
            <p className="text-[22px] font-extrabold text-[var(--success-text)]">{stats.bikeSessionsCount}</p>
          </div>
          <div className="rounded-[12px] border border-[var(--border)] bg-[var(--surface)] p-3.5 space-y-1">
            <span className="text-[12px] font-medium text-[var(--muted)]">Minutos na Bike</span>
            <p className="text-[22px] font-extrabold text-[var(--success-text)]">{stats.bikeTotalMinutes} min</p>
          </div>
        </section>
      )}

      {/* Filters (Section 11.2) */}
      <section aria-label="Filtros do histórico" className="space-y-3">
        {/* Category Filter Pills */}
        <div role="group" aria-label="Filtro por categoria" className="flex flex-wrap gap-2">
          {(
            [
              { id: "todos", label: "Todos" },
              { id: "principal", label: "Principal" },
              { id: "complementares", label: "Complementares" },
              { id: "bike", label: "Bike" },
            ] as const
          ).map((cat) => {
            const isActive = selectedCategory === cat.id;
            return (
              <button
                key={cat.id}
                type="button"
                aria-pressed={isActive}
                onClick={() => handleCategoryChange(cat.id)}
                className={`min-h-[44px] rounded-[10px] px-4 py-2 text-[14px] font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus)] ${
                  isActive
                    ? "bg-[var(--primary-soft)] border border-[var(--primary-hover)] text-[var(--primary-text)]"
                    : "bg-[var(--surface-elevated)] border border-[var(--border)] text-[var(--muted)] hover:text-[var(--foreground)] hover:bg-[var(--border)]"
                }`}
              >
                {cat.label}
              </button>
            );
          })}
        </div>

        {/* Combined Period & Search */}
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-[180px_1fr]">
          <AppSelect
            aria-label="Filtro de período"
            value={selectedPeriod}
            onChange={(e) => handlePeriodChange(e.target.value as PeriodFilter)}
          >
            <option value="all">Todo o período</option>
            <option value="7d">Últimos 7 dias</option>
            <option value="30d">Últimos 30 dias</option>
            <option value="90d">Últimos 90 dias</option>
          </AppSelect>

          <AppInput
            aria-label="Buscar por nome do treino"
            placeholder="Buscar por nome do treino..."
            value={searchQuery}
            onChange={(e) => handleSearchChange(e.target.value)}
          />
        </div>
      </section>

      {/* History List */}
      {visibleItems.length > 0 ? (
        <section aria-label="Lista de sessões registradas" className="space-y-3">
          {visibleItems.map((item) => {
            const isExpanded = expandedIds.has(item.id);

            return (
              <AppCard key={item.id} className="space-y-3 p-4">
                {/* Header summary */}
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <AppBadge variant={item.categoryBadgeVariant}>
                        {item.categoryLabel}
                      </AppBadge>
                      {item.status === "skipped" && (
                        <AppBadge variant="warning">Não realizada</AppBadge>
                      )}
                    </div>
                    <h2 className="text-[18px] font-bold leading-[25px] text-[var(--foreground)]">
                      {item.title}
                    </h2>
                  </div>
                  <span className="text-[13px] font-medium text-[var(--muted)] shrink-0">
                    {item.formattedDate}
                  </span>
                </div>

                {/* Duration & status metrics */}
                <div className="flex items-center gap-4 text-[14px] text-[var(--muted)]">
                  <span>
                    Duração: <strong className="text-[var(--foreground)]">{item.formattedDuration}</strong>
                  </span>
                </div>

                {/* Toggle details action */}
                <div className="pt-1">
                  <button
                    type="button"
                    onClick={() => toggleExpand(item.id)}
                    aria-expanded={isExpanded}
                    className="flex min-h-[44px] w-full items-center justify-center gap-2 rounded-[10px] border border-[var(--border)] bg-[var(--surface-elevated)] px-4 py-2 text-[14px] font-medium text-[var(--foreground)] hover:bg-[var(--border)] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus)]"
                  >
                    <span>{isExpanded ? "Ocultar detalhes" : "Ver detalhes"}</span>
                    <AppIcon
                      name="arrow"
                      direction={isExpanded ? "up" : "down"}
                      size={16}
                    />
                  </button>
                </div>

                {/* Expanded Details */}
                {isExpanded && (
                  <div className="space-y-4 border-t border-[var(--border)] pt-4">
                    {/* Workout Details (Musculação / Complementares) */}
                    {item.workoutEntry && (
                      <div className="space-y-3">
                        <h3 className="text-[14px] font-bold uppercase tracking-wider text-[var(--muted)]">
                          Exercícios registrados
                        </h3>
                        <div className="space-y-2">
                          {Object.entries(item.workoutEntry.logs).map(([logKey, log]) => {
                            const { blockTitle, exerciseName } = resolveExercise(
                              item.workoutEntry!,
                              log
                            );
                            return (
                              <div
                                key={logKey}
                                className={`rounded-[10px] border p-3 text-[13px] ${
                                  log.skipped
                                    ? "border-[var(--warning)]/40 bg-[var(--warning)]/10"
                                    : "border-[var(--border)] bg-[var(--surface-elevated)]"
                                }`}
                              >
                                <div className="flex items-center justify-between gap-2">
                                  <div>
                                    <p className="text-[11px] text-[var(--muted)] uppercase">
                                      {blockTitle}
                                    </p>
                                    <p className="font-bold text-[var(--foreground)]">{exerciseName}</p>
                                  </div>
                                  <span
                                    className={`text-[12px] font-medium ${
                                      log.skipped ? "text-[var(--warning)]" : "text-[var(--success-text)]"
                                    }`}
                                  >
                                    {log.skipped ? "Pulado" : "Concluído"}
                                  </span>
                                </div>

                                {!log.skipped ? (
                                  <div className="mt-2 grid grid-cols-3 gap-2 text-[12px]">
                                    <div>
                                      <span className="text-[var(--muted)]">Realizado: </span>
                                      <strong className="text-[var(--foreground)]">{log.reps || "-"}</strong>
                                    </div>
                                    <div>
                                      <span className="text-[var(--muted)]">Carga: </span>
                                      <strong className="text-[var(--foreground)]">{log.load || "-"}</strong>
                                    </div>
                                    <div>
                                      <span className="text-[var(--muted)]">PSE: </span>
                                      <strong className="text-[var(--foreground)]">{log.actualPse || "-"}</strong>
                                    </div>
                                  </div>
                                ) : (
                                  log.skipReason && (
                                    <p className="mt-1.5 text-[12px] text-[var(--warning)]">
                                      Motivo: {log.skipReason}
                                    </p>
                                  )
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* Bike Details */}
                    {item.bikeSession && (
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <h3 className="text-[14px] font-bold uppercase tracking-wider text-[var(--success-text)]">
                            Dados da pedalada
                          </h3>
                          <Link
                            href="/bike"
                            className="text-[13px] font-medium text-[var(--success-text)] hover:underline"
                          >
                            Ver no módulo Bike
                          </Link>
                        </div>

                        <dl className="grid grid-cols-2 gap-2 text-[13px] sm:grid-cols-4">
                          <div className="rounded-[8px] border border-[var(--border)] bg-[var(--surface-elevated)] p-2.5">
                            <dt className="text-[11px] text-[var(--muted)]">Duração</dt>
                            <dd className="font-bold text-[var(--foreground)]">{item.bikeSession.minutes} min</dd>
                          </div>
                          <div className="rounded-[8px] border border-[var(--border)] bg-[var(--surface-elevated)] p-2.5">
                            <dt className="text-[11px] text-[var(--muted)]">BPM Médio</dt>
                            <dd className="font-bold text-[var(--foreground)]">{item.bikeSession.averageBpm ?? "-"}</dd>
                          </div>
                          <div className="rounded-[8px] border border-[var(--border)] bg-[var(--surface-elevated)] p-2.5">
                            <dt className="text-[11px] text-[var(--muted)]">BPM Máx</dt>
                            <dd className="font-bold text-[var(--foreground)]">{item.bikeSession.peakBpm ?? "-"}</dd>
                          </div>
                          <div className="rounded-[8px] border border-[var(--border)] bg-[var(--surface-elevated)] p-2.5">
                            <dt className="text-[11px] text-[var(--muted)]">PSE / Esforço</dt>
                            <dd className="font-bold text-[var(--foreground)]">{item.bikeSession.rpe ?? "-"}/10</dd>
                          </div>
                          <div className="rounded-[8px] border border-[var(--border)] bg-[var(--surface-elevated)] p-2.5">
                            <dt className="text-[11px] text-[var(--muted)]">Fadiga Pernas</dt>
                            <dd className="font-bold text-[var(--foreground)]">{item.bikeSession.legFatigue ?? "-"}/10</dd>
                          </div>
                          <div className="rounded-[8px] border border-[var(--border)] bg-[var(--surface-elevated)] p-2.5">
                            <dt className="text-[11px] text-[var(--muted)]">Distância</dt>
                            <dd className="font-bold text-[var(--foreground)]">{item.bikeSession.distanceKm ? `${item.bikeSession.distanceKm} km` : "-"}</dd>
                          </div>
                          <div className="rounded-[8px] border border-[var(--border)] bg-[var(--surface-elevated)] p-2.5">
                            <dt className="text-[11px] text-[var(--muted)]">Resistência</dt>
                            <dd className="font-bold text-[var(--foreground)]">{item.bikeSession.resistance || "-"}</dd>
                          </div>
                          <div className="rounded-[8px] border border-[var(--border)] bg-[var(--surface-elevated)] p-2.5">
                            <dt className="text-[11px] text-[var(--muted)]">Sintomas</dt>
                            <dd className="font-bold text-[var(--foreground)]">{item.bikeSession.symptoms ? "Sim" : "Não"}</dd>
                          </div>
                        </dl>

                        {item.bikeSession.notes && (
                          <div className="rounded-[8px] border border-[var(--border)] bg-[var(--surface-elevated)] p-2.5 text-[13px]">
                            <span className="text-[var(--muted)]">Observações: </span>
                            <span className="text-[var(--foreground)]">{item.bikeSession.notes}</span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </AppCard>
            );
          })}

          {/* Carregar mais (Section 11.3) */}
          {hasMore && (
            <div className="pt-2">
              <AppButton
                type="button"
                variant="secondary"
                fullWidth
                onClick={() => setVisibleCount((prev) => prev + 20)}
              >
                Carregar mais ({filteredItems.length - visibleCount} restantes)
              </AppButton>
            </div>
          )}
        </section>
      ) : isGlobalEmpty ? (
        <AppEmptyState
          message="Nenhuma sessão registrada ainda."
          actionLabel="Ver treinos"
          actionHref="/workouts"
        />
      ) : isBikeEmpty ? (
        <AppEmptyState
          message="Você ainda não registrou uma pedalada."
          actionLabel="Abrir Bike"
          actionHref="/bike"
        />
      ) : (
        <AppEmptyState
          message="Nenhum registro encontrado para os filtros selecionados."
          actionLabel="Limpar filtros"
          onAction={handleClearFilters}
        />
      )}
    </div>
  );
}
