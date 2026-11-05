"use client";

import { useEffect, useState } from "react";
import { AppCard } from "@/components/ui/AppCard";
import { AppButton } from "@/components/ui/AppButton";
import { AppBadge } from "@/components/ui/AppBadge";
import { AppIcon } from "@/components/ui/AppIcon";
import {
  loadBikeData,
  getEffectiveWeek,
  summarizeWeek,
  type BikeData,
} from "@/lib/bike-cardio";

export function BikeCardioHomeCard() {
  const [data, setData] = useState<BikeData | null>(null);

  useEffect(() => {
    function read() {
      setData(loadBikeData());
    }
    read();
    window.addEventListener("bjj-bike-updated", read);
    window.addEventListener("bjj-cloud-updated", read);
    window.addEventListener("storage", read);
    return () => {
      window.removeEventListener("bjj-bike-updated", read);
      window.removeEventListener("bjj-cloud-updated", read);
      window.removeEventListener("storage", read);
    };
  }, []);

  const hasSessions = Boolean(data && data.sessions && data.sessions.length > 0);
  const effectiveWeek = data ? getEffectiveWeek(data) : 1;
  const summary = data ? summarizeWeek(data, effectiveWeek) : null;

  return (
    <section aria-labelledby="bike-cardio-home-heading">
      <AppCard className="space-y-4 border-[var(--success)]/40 bg-[var(--surface)] p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-[var(--success-text)]">
                <AppIcon name="bike" size={20} />
              </span>
              <span className="text-[13px] font-bold uppercase tracking-wider text-[var(--success-text)]">
                Cardio na Bike
              </span>
            </div>
            <h3
              id="bike-cardio-home-heading"
              className="text-[18px] font-bold leading-[25px] text-[var(--foreground)]"
            >
              Programa Progressivo
            </h3>
          </div>
          {hasSessions && (
            <AppBadge variant="success">
              Semana {effectiveWeek} de 6
            </AppBadge>
          )}
        </div>

        {hasSessions && summary ? (
          <div className="grid grid-cols-2 gap-3 rounded-[12px] border border-[var(--border)] bg-[var(--surface-elevated)] p-3 text-center sm:text-left">
            <div>
              <p className="text-[13px] font-medium text-[var(--muted)]">Realizados</p>
              <p className="text-[20px] font-extrabold text-[var(--success-text)]">
                {summary.minutes} min
              </p>
            </div>
            <div>
              <p className="text-[13px] font-medium text-[var(--muted)]">Meta semanal</p>
              <p className="text-[20px] font-extrabold text-[var(--foreground)]">
                {summary.plannedMinutes} min
              </p>
            </div>
          </div>
        ) : (
          <p className="text-[14px] font-medium text-[var(--muted)]">
            Nenhuma sessão registrada
          </p>
        )}

        <div className="pt-1">
          <AppButton href="/bike" variant="secondary" fullWidth>
            Abrir Bike
          </AppButton>
        </div>
      </AppCard>
    </section>
  );
}
