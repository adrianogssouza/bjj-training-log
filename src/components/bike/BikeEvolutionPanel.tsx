"use client";

import { useMemo } from "react";
import {
  BIKE_PLAN,
  getEvolutionStats,
  readableDate,
  type BikeData,
} from "@/lib/bike-cardio";

type BikeEvolutionPanelProps = {
  data: BikeData;
};

function formatNumber(val: number | null, suffix = ""): string {
  if (val === null || val === undefined) return "—";
  return `${Number.isInteger(val) ? val : val.toFixed(1).replace(".", ",")}${suffix}`;
}

export function BikeEvolutionPanel({ data }: BikeEvolutionPanelProps) {
  const stats = useMemo(() => getEvolutionStats(data), [data]);
  const maxWeeklyMinutes = Math.max(...BIKE_PLAN.map((p) => p.sessions * p.minutes));

  return (
    <div className="space-y-6">
      {/* 1. Indicadores Principais Acumulados */}
      <section className="space-y-3">
        <h3 className="text-lg font-black text-white">Indicadores Gerais</h3>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <div className="rounded-xl border border-zinc-800 bg-zinc-900/70 p-3.5">
            <p className="text-xs text-zinc-400">Total de Pedaladas</p>
            <p className="mt-1 text-2xl font-black text-white">
              {stats.totalCompletedSessions}
            </p>
            <p className="text-[11px] text-zinc-500">sessões concluídas</p>
          </div>

          <div className="rounded-xl border border-zinc-800 bg-zinc-900/70 p-3.5">
            <p className="text-xs text-zinc-400">Minutos Acumulados</p>
            <p className="mt-1 text-2xl font-black text-white">
              {stats.totalCompletedMinutes} min
            </p>
            <p className="text-[11px] text-zinc-500">volume total pedalado</p>
          </div>

          <div className="rounded-xl border border-zinc-800 bg-zinc-900/70 p-3.5">
            <p className="text-xs text-zinc-400">Média Geral FC</p>
            <p className="mt-1 text-2xl font-black text-red-400">
              {formatNumber(stats.averageBpm, " BPM")}
            </p>
            <p className="text-[11px] text-zinc-500">apenas medições reais</p>
          </div>

          <div className="rounded-xl border border-zinc-800 bg-zinc-900/70 p-3.5">
            <p className="text-xs text-zinc-400">Esforço Médio (PSE)</p>
            <p className="mt-1 text-2xl font-black text-amber-400">
              {formatNumber(stats.averageRpe, "/10")}
            </p>
            <p className="text-[11px] text-zinc-500">alvo: 3–4/10 moderado</p>
          </div>
        </div>

        {stats.averageLegFatigue !== null && (
          <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-3 text-xs text-zinc-300 flex items-center justify-between">
            <span>Fadiga média nas pernas (0–10):</span>
            <span className="font-bold text-zinc-100">
              {formatNumber(stats.averageLegFatigue)}/10
              {stats.averageLegFatigue >= 6 && (
                <span className="ml-2 text-amber-300 font-semibold">(atenção à recuperação com Treinos A/B)</span>
              )}
            </span>
          </div>
        )}
      </section>

      {/* 2. Evolução Semanal de Duração e Cumprimento */}
      <section className="space-y-3 rounded-2xl border border-zinc-800 bg-zinc-900/40 p-4 sm:p-5">
        <div>
          <h3 className="text-lg font-black text-white">Evolução do Volume Semanal</h3>
          <p className="text-xs text-zinc-400">
            Minutos planejados (cinza) comparados ao volume efetivamente registrado (vermelho).
          </p>
        </div>

        <div className="space-y-3.5 pt-1">
          {stats.weeklyProgress.map((item) => {
            const widthPct = Math.min(100, Math.round((item.completedMinutes / maxWeeklyMinutes) * 100));
            const targetWidthPct = Math.min(100, Math.round((item.plannedMinutes / maxWeeklyMinutes) * 100));

            return (
              <div key={item.week} className="space-y-1.5">
                <div className="flex flex-wrap items-center justify-between gap-1 text-xs sm:text-sm">
                  <span className="font-bold text-zinc-200">
                    Semana {item.week} · {item.completedSessions}/{item.plannedSessions} sessões
                  </span>
                  <span className="text-zinc-400">
                    <strong className="text-zinc-200">{item.completedMinutes} min</strong> de {item.plannedMinutes} min ({item.percent}%)
                  </span>
                </div>

                <div className="relative h-3.5 overflow-hidden rounded-full bg-zinc-950 border border-zinc-800">
                  {/* Meta planejada */}
                  <div
                    className="absolute inset-y-0 left-0 bg-zinc-700/60"
                    style={{ width: `${targetWidthPct}%` }}
                    title={`Meta: ${item.plannedMinutes} min`}
                  />
                  {/* Realizado */}
                  <div
                    className="absolute inset-y-0 left-0 bg-red-600 transition-all duration-300"
                    style={{ width: `${widthPct}%` }}
                    title={`Realizado: ${item.completedMinutes} min`}
                  />
                </div>

                <div className="flex justify-between text-[11px] text-zinc-500">
                  <span>
                    {item.averageBpm !== null ? `Média: ${item.averageBpm} BPM` : "Sem FC registrada"}
                    {item.averageRpe !== null ? ` · PSE ${item.averageRpe}` : ""}
                  </span>
                  {item.anySymptoms && (
                    <span className="font-bold text-rose-300">Sintoma registrado nesta semana</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        <div className="border-t border-zinc-800 pt-3 text-[11px] leading-relaxed text-zinc-500">
          <strong className="text-zinc-400">Nota técnica sobre FC e calorias:</strong> Comparações de frequência cardíaca devem considerar fatores como intensidade, duração, temperatura, sono e hidratação. Uma eventual queda de FC não deve ser interpretada isoladamente como melhora do condicionamento. O aplicativo não inventa dados de calorias gastas nem usa fórmulas arbitrárias.
        </div>
      </section>

      {/* 3. Evolução de Peso e Medidas Corporais */}
      <section className="space-y-3 rounded-2xl border border-zinc-800 bg-zinc-900/40 p-4 sm:p-5">
        <div>
          <h3 className="text-lg font-black text-white">Evolução do Peso e Composição Corporal</h3>
          <p className="text-xs text-zinc-400">
            Acompanhamento das medições físicas ao longo do programa de 6 semanas.
          </p>
        </div>

        {stats.latestMeasurement ? (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <div className="rounded-xl border border-zinc-800 bg-zinc-950/70 p-3.5">
              <p className="text-xs text-zinc-400">Último Peso Registrado</p>
              <p className="mt-1 text-2xl font-black text-white">
                {formatNumber(stats.latestMeasurement.weightKg, " kg")}
              </p>
              <p className="text-[11px] text-zinc-400">
                Data: {readableDate(stats.latestMeasurement.date)}
              </p>
              {stats.weightDiffKg !== null && stats.weightDiffKg !== 0 && (
                <p className={`mt-1 text-xs font-semibold ${stats.weightDiffKg < 0 ? "text-emerald-400" : "text-amber-400"}`}>
                  {stats.weightDiffKg > 0 ? `+${stats.weightDiffKg}` : stats.weightDiffKg} kg desde o início
                </p>
              )}
            </div>

            <div className="rounded-xl border border-zinc-800 bg-zinc-950/70 p-3.5">
              <p className="text-xs text-zinc-400">Meta de Peso</p>
              <p className="mt-1 text-2xl font-black text-white">
                {formatNumber(data.goalWeightKg, " kg")}
              </p>
              {stats.distanceToGoalWeightKg !== null && (
                <p className="mt-1 text-xs text-zinc-300">
                  {stats.distanceToGoalWeightKg <= 0
                    ? "✓ Meta atingida!"
                    : `Faltam ${formatNumber(stats.distanceToGoalWeightKg, " kg")}`}
                </p>
              )}
            </div>

            <div className="rounded-xl border border-zinc-800 bg-zinc-950/70 p-3.5">
              <p className="text-xs text-zinc-400">Gordura / Cintura</p>
              <p className="mt-1 text-lg font-bold text-zinc-200">
                {formatNumber(stats.latestMeasurement.bodyFatPct, "% GC")}
              </p>
              <p className="text-xs text-zinc-400">
                Cintura: {formatNumber(stats.latestMeasurement.waistCm, " cm")}
              </p>
              {stats.bodyFatDiffPct !== null && stats.bodyFatDiffPct !== 0 && (
                <p className="text-[11px] text-zinc-500 mt-0.5">
                  Variação GC: {stats.bodyFatDiffPct > 0 ? `+${stats.bodyFatDiffPct}` : stats.bodyFatDiffPct}%
                </p>
              )}
            </div>
          </div>
        ) : (
          <p className="text-xs text-zinc-500">
            Nenhuma medição corporal cadastrada ainda. Registre seu peso e composição na seção de Medidas para acompanhar a evolução.
          </p>
        )}
      </section>
    </div>
  );
}
