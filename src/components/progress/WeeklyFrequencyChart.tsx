"use client";

import type { WeekFrequency } from "@/lib/progress";
import { useElementWidth } from "./useElementWidth";

const HEIGHT = 150;
const PAD_TOP = 20;
const PAD_BOTTOM = 24;

const PRINCIPAL_COLOR = "var(--primary)";
const COMPLEMENTARY_COLOR = "var(--primary-line)";

export function WeeklyFrequencyLegend() {
  return (
    <ul className="flex flex-wrap gap-x-4 gap-y-1 text-[12px] text-[var(--muted)]" aria-label="Legenda">
      <li className="flex items-center gap-1.5">
        <span aria-hidden="true" className="h-2.5 w-2.5 rounded-[3px]" style={{ background: PRINCIPAL_COLOR }} />
        Principal
      </li>
      <li className="flex items-center gap-1.5">
        <span aria-hidden="true" className="h-2.5 w-2.5 rounded-[3px]" style={{ background: COMPLEMENTARY_COLOR }} />
        Complementar
      </li>
    </ul>
  );
}

export function WeeklyFrequencyChart({ weeks }: { weeks: WeekFrequency[] }) {
  const [ref, width] = useElementWidth<HTMLDivElement>();
  const maxTotal = Math.max(1, ...weeks.map((week) => week.total));
  const plotHeight = HEIGHT - PAD_TOP - PAD_BOTTOM;
  const slot = width / Math.max(1, weeks.length);
  const barWidth = Math.min(32, Math.max(12, slot * 0.5));
  const unit = plotHeight / maxTotal;
  const baseline = HEIGHT - PAD_BOTTOM;

  const description = weeks
    .map(
      (week) =>
        `semana de ${week.label}: ${week.principal} principal, ${week.complementary} complementar`,
    )
    .join("; ");

  return (
    <div ref={ref} className="w-full">
      <svg
        width={width}
        height={HEIGHT}
        viewBox={`0 0 ${width} ${HEIGHT}`}
        role="img"
        aria-label={`Sessões por semana do ciclo. ${description}`}
        className="block max-w-full"
      >
        <line x1={0} x2={width} y1={baseline} y2={baseline} style={{ stroke: "var(--border)" }} strokeWidth={1} />

        {weeks.map((week, index) => {
          const cx = slot * index + slot / 2;
          const left = cx - barWidth / 2;
          const principalHeight = week.principal * unit;
          const complementaryHeight = week.complementary * unit;
          const top = baseline - principalHeight - complementaryHeight;
          return (
            <g key={week.weekStart} data-week={week.weekStart}>
              {week.total === 0 && (
                <rect x={left} y={baseline - 2} width={barWidth} height={2} rx={1} style={{ fill: "var(--border-strong)" }} />
              )}
              {week.principal > 0 && (
                <rect
                  x={left}
                  y={baseline - principalHeight}
                  width={barWidth}
                  height={principalHeight}
                  rx={week.complementary > 0 ? 0 : 4}
                  style={{ fill: PRINCIPAL_COLOR }}
                />
              )}
              {week.complementary > 0 && (
                <rect
                  x={left}
                  y={top}
                  width={barWidth}
                  height={complementaryHeight}
                  rx={week.principal > 0 ? 0 : 4}
                  style={{ fill: COMPLEMENTARY_COLOR }}
                />
              )}
              {/* separador fino entre as duas partes da barra */}
              {week.principal > 0 && week.complementary > 0 && (
                <line
                  x1={left}
                  x2={left + barWidth}
                  y1={baseline - principalHeight}
                  y2={baseline - principalHeight}
                  style={{ stroke: "var(--surface)" }}
                  strokeWidth={1.5}
                />
              )}
              <text
                x={cx}
                y={top - 6}
                textAnchor="middle"
                fontSize={12}
                fontWeight={700}
                style={{ fill: week.total === 0 ? "var(--muted)" : "var(--foreground)" }}
              >
                {week.total}
              </text>
              <text
                x={cx}
                y={HEIGHT - 7}
                textAnchor="middle"
                fontSize={11}
                fontWeight={week.isCurrent ? 700 : 400}
                style={{ fill: week.isCurrent ? "var(--foreground)" : "var(--muted)" }}
              >
                {week.label}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}
