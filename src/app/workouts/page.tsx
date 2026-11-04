"use client";

import { useMemo, useState } from "react";
import { WorkoutCard } from "@/components/workout/WorkoutCard";
import { seedWorkouts } from "@/data/seed-workouts";
import { AppEmptyState } from "@/components/ui/AppEmptyState";
import type { Workout } from "@/types";

type WorkoutCategory = "todos" | "principal" | "mobilidade" | "core" | "complementares";

interface CategoryOption {
  id: WorkoutCategory;
  label: string;
}

const CATEGORIES: CategoryOption[] = [
  { id: "todos", label: "Todos" },
  { id: "principal", label: "Principal" },
  { id: "mobilidade", label: "Mobilidade" },
  { id: "core", label: "Core" },
  { id: "complementares", label: "Complementares" },
];

export default function WorkoutsPage() {
  const [selectedCategory, setSelectedCategory] = useState<WorkoutCategory>("todos");

  const filteredWorkouts = useMemo<Workout[]>(() => {
    switch (selectedCategory) {
      case "principal":
        return seedWorkouts.filter((w) => w.type === "monthly");
      case "mobilidade":
        return seedWorkouts.filter((w) => w.id.startsWith("mobilidade"));
      case "core":
        return seedWorkouts.filter((w) => w.id.startsWith("core"));
      case "complementares":
        return seedWorkouts.filter(
          (w) => w.id.startsWith("cardio") || w.id === "anti-lesao"
        );
      case "todos":
      default:
        return seedWorkouts;
    }
  }, [selectedCategory]);

  return (
    <div className="flex flex-1 flex-col gap-6">
      {/* Header */}
      <header className="space-y-1">
        <h1 className="text-[28px] font-extrabold leading-[34px] text-[#F4F4F5]">
          Meus treinos
        </h1>
        <p className="text-[16px] font-normal leading-[24px] text-[#A1A1AA]">
          Treinos principais e complementares
        </p>
      </header>

      {/* Category Filter */}
      <div
        role="group"
        aria-label="Filtro por categoria"
        className="flex flex-wrap gap-2"
      >
        {CATEGORIES.map((cat) => {
          const isActive = selectedCategory === cat.id;
          return (
            <button
              key={cat.id}
              type="button"
              aria-pressed={isActive}
              onClick={() => setSelectedCategory(cat.id)}
              className={`min-h-[44px] rounded-[10px] px-4 py-2 text-[14px] font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#93C5FD] ${
                isActive
                  ? "bg-[#450A0A] border border-[#B91C1C] text-[#FCA5A5]"
                  : "bg-[#27272A] border border-[#3F3F46] text-[#A1A1AA] hover:text-[#F4F4F5] hover:bg-[#3F3F46]"
              }`}
            >
              {cat.label}
            </button>
          );
        })}
      </div>

      {/* Catalog List */}
      {filteredWorkouts.length > 0 ? (
        <section
          aria-label="Lista de treinos"
          className="grid grid-cols-1 gap-4 md:grid-cols-2"
        >
          {filteredWorkouts.map((workout) => (
            <WorkoutCard key={workout.id} workout={workout} />
          ))}
        </section>
      ) : (
        <AppEmptyState
          message="Nenhum treino disponível nesta categoria."
          actionLabel="Ver todos os treinos"
          onAction={() => setSelectedCategory("todos")}
        />
      )}
    </div>
  );
}
