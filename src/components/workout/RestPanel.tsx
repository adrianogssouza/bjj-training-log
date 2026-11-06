"use client";

type RestPanelProps = {
  remainingSeconds: number;
  totalSeconds: number;
  roundLabel: string;
  nextLabel: string;
};

function formatClock(totalSeconds: number) {
  const safe = Math.max(0, totalSeconds);
  const minutes = Math.floor(safe / 60);
  const seconds = safe % 60;
  return `${minutes}:${String(seconds).padStart(2, "0")}`;
}

/** Contagem regressiva exibida no lugar do exercício enquanto descansa. */
export function RestPanel({
  remainingSeconds,
  totalSeconds,
  roundLabel,
  nextLabel,
}: RestPanelProps) {
  const elapsedShare =
    totalSeconds > 0 ? 1 - Math.max(0, remainingSeconds) / totalSeconds : 1;

  return (
    <section
      aria-label="Descanso"
      className="relative overflow-hidden rounded-[16px] border border-[var(--primary-line)] bg-[var(--surface)] px-5 pb-5 pt-6 text-center"
    >
      {/* A faixa enche da esquerda para a direita conforme o descanso passa. */}
      <div
        aria-hidden="true"
        className="absolute inset-y-0 left-0 bg-[var(--primary-tint)] transition-[width] duration-300 ease-linear"
        style={{ width: `${Math.min(100, elapsedShare * 100)}%` }}
      />
      <div className="relative">
        <p className="text-[14px] font-semibold text-[var(--primary-text)]">
          Descanso · {roundLabel}
        </p>
        <p
          className="mt-1 font-[family-name:var(--font-heading)] text-[72px] font-black leading-none tabular-nums text-[var(--foreground)]"
          role="timer"
          aria-live="off"
          aria-label={`Faltam ${formatClock(remainingSeconds)} de descanso`}
        >
          {formatClock(remainingSeconds)}
        </p>
        <p className="mt-2 text-[13px] text-[var(--muted)]">
          de {formatClock(totalSeconds)}
        </p>
        <div className="mt-5 rounded-[12px] border border-[var(--border)] bg-[var(--surface-elevated)] px-4 py-3 text-left">
          <p className="text-[12px] text-[var(--muted)]">Em seguida</p>
          <p className="mt-0.5 break-words text-[15px] font-bold text-[var(--foreground)]">
            {nextLabel}
          </p>
        </div>
      </div>
    </section>
  );
}
