import Link from "next/link";

import { AppCard } from "@/components/ui/AppCard";

export function BikeEntryCard() {
  return (
    <AppCard className="border-emerald-700/50 bg-emerald-950/10 p-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-wide text-emerald-300">Novo módulo independente</p>
          <h2 className="mt-1 text-xl font-black text-white">Cardio na Bike · 6 semanas</h2>
          <p className="mt-1 text-sm leading-6 text-zinc-300">Treino progressivo, registro de BPM e esforço, evolução semanal e histórico de medidas.</p>
        </div>
        <Link href="/bike" className="flex min-h-12 shrink-0 items-center justify-center rounded-lg border border-emerald-500 bg-emerald-700 px-4 text-sm font-black text-white hover:bg-emerald-600">
          Abrir Bike
        </Link>
      </div>
    </AppCard>
  );
}
