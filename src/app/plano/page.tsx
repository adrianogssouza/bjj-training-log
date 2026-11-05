import type { Metadata } from "next";
import { WeekPlanner } from "@/components/plan/WeekPlanner";

export const metadata: Metadata = {
  title: "Planejar semana · MEU TREINO",
};

export default function PlanPage() {
  return <WeekPlanner />;
}
