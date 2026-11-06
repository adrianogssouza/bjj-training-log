"use client";

import { useId } from "react";
import { formatKg, formatNumber, shortDayLabel, type LoadPoint } from "@/lib/progress";
import { useElementWidth } from "./useElementWidth";

/** Quantas sessões aparecem no gráfico (as mais recentes). */
export const LOAD_CHART_MAX_POINTS = 8;

const HEIGHT = 168;
const PAD_TOP = 26;
const PAD_BOTTOM = 26;
const PAD_X = 22;

export function LoadLineChart({ points }: { points: LoadPoint[] }) {
  const [ref, width] = useElementWidth<HTMLDivElement>();
  const gradientId = useId().replace(/:/g, "");

  if (points.length === 0) {
    return (
      <div className="flex h-[120px] items-center justify-center rounded-[10px] border border-dashed border-[var(--border)] text-center text-[13px] text-[var(--muted)]">
        Sem carga registrada para este exercício.
      </div>
    );
  }

  const shown = points.slice(-LOAD_CHART_MAX_POINTS);
  const loads = shown.map((point) => point.load);
  const min = Math.min(...loads);
  const max = Math.max(...loads);
  const spread = max - min;
  const yMin = spread === 0 ? min - Math.max(1, min * 0.2) : min - spread * 0.15;
  const yMax = spread === 0 ? max + Math.max(1, max * 0.2) : max + spread * 0.15;

  const plotHeight = HEIGHT - PAD_TOP - PAD_BOTTOM;
  const plotWidth = Math.max(1, width - PAD_X * 2);
  const x = (index: number) =>
    shown.length === 1 ? width / 2 : PAD_X + (plotWidth * index) / (shown.length - 1);
  const y = (load: number) => PAD_TOP + plotHeight * (1 - (load - yMin) / (yMax - yMin));

  const coords = shown.map((point, index) => ({ ...point, cx: x(index), cy: y(point.load) }));
  const line = coords.map((c, i) => `${i === 0 ? "M" : "L"}${c.cx.toFixed(1)},${c.cy.toFixed(1)}`).join(" ");
  const baseline = HEIGHT - PAD_BOTTOM;
  const area =
    coords.length > 1
      ? `${line} L${coords[coords.length - 1].cx.toFixed(1)},${baseline} L${coords[0].cx.toFixed(1)},${baseline} Z`
      : "";

  const description = coords
    .map((c) => `${shortDayLabel(c.date)}: ${formatKg(c.load)}`)
    .join(", ");

  return (
    <div ref={ref} className="w-full">
      <svg
        width={width}
        height={HEIGHT}
        viewBox={`0 0 ${width} ${HEIGHT}`}
        role="img"
        aria-label={`Carga por sessão. ${description}`}
        className="block max-w-full"
      >
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" style={{ stopColor: "var(--primary)", stopOpacity: 0.28 }} />
            <stop offset="100%" style={{ stopColor: "var(--primary)", stopOpacity: 0 }} />
          </linearGradient>
        </defs>

        <line
          x1={0}
          x2={width}
          y1={baseline}
          y2={baseline}
          style={{ stroke: "var(--border)" }}
          strokeWidth={1}
        />

        {area && <path d={area} style={{ fill: `url(#${gradientId})` }} />}
        {coords.length > 1 && (
          <path
            d={line}
            style={{ fill: "none", stroke: "var(--primary)" }}
            strokeWidth={2.5}
            strokeLinejoin="round"
            strokeLinecap="round"
          />
        )}

        {coords.map((c, index) => {
          const isLast = index === coords.length - 1;
          return (
            <g key={`${c.sessionId}-${index}`}>
              <circle
                cx={c.cx}
                cy={c.cy}
                r={isLast ? 5 : 4}
                style={{ fill: "var(--primary)", stroke: "var(--surface)" }}
                strokeWidth={2}
              />
              <text
                x={c.cx}
                y={c.cy - 10}
                textAnchor="middle"
                fontSize={12}
                fontWeight={isLast ? 800 : 600}
                style={{ fill: isLast ? "var(--foreground)" : "var(--foreground-soft)" }}
              >
                {formatNumber(c.load)}
              </text>
              <text
                x={c.cx}
                y={HEIGHT - 8}
                textAnchor="middle"
                fontSize={11}
                style={{ fill: "var(--muted)" }}
              >
                {shortDayLabel(c.date)}
              </text>
            </g>
          );
        })}
      </svg>
      {points.length > shown.length && (
        <p className="mt-1 text-[12px] text-[var(--muted)]">
          Mostrando as últimas {shown.length} de {points.length} sessões.
        </p>
      )}
    </div>
  );
}
