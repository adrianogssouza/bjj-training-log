"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

type BikeGuidedRunnerProps = {
  plannedMinutes: number;
  onFinish: (result: {
    durationMinutes: number;
    observedBpm: number | null;
  }) => void;
  onCancel: () => void;
};

type Stage = "warmup" | "main" | "cooldown" | "overtime";

function formatSeconds(sec: number): string {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

export function BikeGuidedRunner({
  plannedMinutes,
  onFinish,
  onCancel,
}: BikeGuidedRunnerProps) {
  const [startedAt] = useState<number>(() => Date.now());
  const [pausedAt, setPausedAt] = useState<number | null>(null);
  const [totalPausedSeconds, setTotalPausedSeconds] = useState<number>(0);
  const [elapsedSeconds, setElapsedSeconds] = useState<number>(0);
  const [observedBpm, setObservedBpm] = useState<string>("");
  const [showExitConfirm, setShowExitConfirm] = useState(false);

  // Etapas planejadas
  const warmupSeconds = 5 * 60; // 5 min
  const cooldownSeconds = 5 * 60; // 5 min
  const totalPlannedSeconds = Math.max(10 * 60, plannedMinutes * 60);
  const mainSeconds = totalPlannedSeconds - warmupSeconds - cooldownSeconds;

  // Atualização precisa do tempo decorrido
  const calculateElapsed = useCallback(() => {
    const end = pausedAt ?? Date.now();
    const totalDiff = Math.floor((end - startedAt) / 1000);
    return Math.max(0, totalDiff - totalPausedSeconds);
  }, [pausedAt, startedAt, totalPausedSeconds]);

  // Sincronização periódica e em eventos de visibilidade do iOS Safari
  useEffect(() => {
    const update = () => {
      setElapsedSeconds(calculateElapsed());
    };

    update();
    if (pausedAt !== null) return;

    const timer = window.setInterval(update, 500);
    const onVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        update();
      }
    };
    document.addEventListener("visibilitychange", onVisibilityChange);
    window.addEventListener("focus", update);

    return () => {
      window.clearInterval(timer);
      document.removeEventListener("visibilitychange", onVisibilityChange);
      window.removeEventListener("focus", update);
    };
  }, [calculateElapsed, pausedAt]);

  const isPaused = pausedAt !== null;

  const handlePause = () => {
    if (!isPaused) {
      setPausedAt(Date.now());
    }
  };

  const handleResume = () => {
    if (pausedAt !== null) {
      const pauseDuration = Math.floor((Date.now() - pausedAt) / 1000);
      setTotalPausedSeconds((prev) => prev + Math.max(0, pauseDuration));
      setPausedAt(null);
    }
  };

  // Cálculo da etapa atual
  const stageInfo = useMemo((): {
    stage: Stage;
    name: string;
    description: string;
    intensity: string;
    targetRpe: string;
    remainingInStage: number;
    stageProgressPct: number;
    colorClass: string;
    borderClass: string;
    bgClass: string;
  } => {
    if (elapsedSeconds < warmupSeconds) {
      const remaining = warmupSeconds - elapsedSeconds;
      const progress = Math.min(100, Math.round((elapsedSeconds / warmupSeconds) * 100));
      return {
        stage: "warmup",
        name: "Aquecimento",
        description: "Ritmo leve, pedalada fluida. Prepare as articulações e eleve a respiração suavemente.",
        intensity: "Leve · Cadência confortável",
        targetRpe: "PSE 2–3/10",
        remainingInStage: remaining,
        stageProgressPct: progress,
        colorClass: "text-amber-400",
        borderClass: "border-amber-500/40",
        bgClass: "bg-amber-950/20",
      };
    }

    if (elapsedSeconds < warmupSeconds + mainSeconds) {
      const stageElapsed = elapsedSeconds - warmupSeconds;
      const remaining = mainSeconds - stageElapsed;
      const progress = Math.min(100, Math.round((stageElapsed / mainSeconds) * 100));
      return {
        stage: "main",
        name: "Parte Principal",
        description: "Ritmo contínuo conversável. Mantenha cadência constante (70–85 RPM) sem travar as pernas.",
        intensity: "Moderada · Conversável (105–125 BPM provisório)",
        targetRpe: "PSE 3–4/10",
        remainingInStage: remaining,
        stageProgressPct: progress,
        colorClass: "text-red-400",
        borderClass: "border-red-500/50",
        bgClass: "bg-red-950/30",
      };
    }

    if (elapsedSeconds < totalPlannedSeconds) {
      const stageElapsed = elapsedSeconds - (warmupSeconds + mainSeconds);
      const remaining = cooldownSeconds - stageElapsed;
      const progress = Math.min(100, Math.round((stageElapsed / cooldownSeconds) * 100));
      return {
        stage: "cooldown",
        name: "Desaquecimento",
        description: "Ritmo suave, desacelerando a pedalada para baixar a frequência cardíaca com calma.",
        intensity: "Leve · Recuperação ativa",
        targetRpe: "PSE 2/10",
        remainingInStage: remaining,
        stageProgressPct: progress,
        colorClass: "text-cyan-400",
        borderClass: "border-cyan-500/40",
        bgClass: "bg-cyan-950/20",
      };
    }

    // Se continuar pedalando além do planejado
    return {
      stage: "overtime",
      name: "Tempo extra / Concluído",
      description: "Treino planejado finalizado! Você pode encerrar e salvar o registro a qualquer momento.",
      intensity: "Desacelere gradualmente",
      targetRpe: "PSE 2/10",
      remainingInStage: 0,
      stageProgressPct: 100,
      colorClass: "text-emerald-400",
      borderClass: "border-emerald-500/40",
      bgClass: "bg-emerald-950/20",
    };
  }, [elapsedSeconds, warmupSeconds, mainSeconds, cooldownSeconds, totalPlannedSeconds]);

  const handleFinishWorkout = () => {
    // Calcula minutos realizados reais (arredondado para o minuto mais próximo, mínimo 1 minuto se pedalou mais de 30s)
    const effectiveMinutes = Math.max(1, Math.round(elapsedSeconds / 60));
    const bpmNum = observedBpm.trim() ? Number(observedBpm.replace(",", ".")) : null;
    const validBpm = bpmNum && Number.isFinite(bpmNum) && bpmNum >= 30 && bpmNum <= 240 ? bpmNum : null;

    onFinish({
      durationMinutes: effectiveMinutes,
      observedBpm: validBpm,
    });
  };

  const totalProgressPct = Math.min(100, Math.round((elapsedSeconds / totalPlannedSeconds) * 100));

  return (
    <div
      role="region"
      aria-label="Execução guiada de treino"
      className="rounded-2xl border border-red-500/50 bg-zinc-950 p-4 sm:p-6 shadow-2xl space-y-5"
    >
      {/* Cabeçalho do modo guiado */}
      <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
        <div className="flex items-center gap-2">
          <span className={`size-3 rounded-full ${isPaused ? "bg-amber-400" : "bg-red-500 animate-pulse"}`} />
          <p className="text-xs font-bold uppercase tracking-wider text-zinc-300">
            Modo Guiado · Bike {isPaused ? "(Pausado)" : "(Em andamento)"}
          </p>
        </div>
        <button
          type="button"
          onClick={() => setShowExitConfirm(true)}
          className="text-xs font-semibold text-zinc-400 hover:text-zinc-200"
        >
          Cancelar treino
        </button>
      </div>

      {showExitConfirm && (
        <div className="rounded-xl border border-amber-600/50 bg-amber-950/30 p-3.5 text-xs text-amber-200 space-y-2">
          <p className="font-bold">Deseja realmente cancelar a sessão guiada?</p>
          <p className="text-zinc-300">O tempo decorrido não será salvo no histórico.</p>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={onCancel}
              className="min-h-10 rounded-lg bg-amber-600 px-3 py-1.5 font-bold text-white hover:bg-amber-500"
            >
              Sim, descartar
            </button>
            <button
              type="button"
              onClick={() => setShowExitConfirm(false)}
              className="min-h-10 rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-1.5 font-bold text-zinc-200"
            >
              Voltar ao pedal
            </button>
          </div>
        </div>
      )}

      {/* Cartão de Destaque da Etapa Atual */}
      <div className={`rounded-xl border ${stageInfo.borderClass} ${stageInfo.bgClass} p-4 text-center space-y-2`}>
        <div className="inline-block rounded-full bg-zinc-900/80 px-3 py-1 text-xs font-bold uppercase tracking-wider text-zinc-300 border border-zinc-700">
          Etapa Atual: <span className={stageInfo.colorClass}>{stageInfo.name}</span>
        </div>

        {/* Cronômetro Principal da Etapa (Legível no suporte do celular da bike) */}
        <div>
          <p className="text-xs font-medium text-zinc-400">Tempo restante nesta etapa</p>
          <p className={`text-5xl sm:text-6xl font-black tracking-tight tabular-nums ${stageInfo.colorClass}`}>
            {formatSeconds(stageInfo.remainingInStage)}
          </p>
        </div>

        {/* Barra de progresso da etapa */}
        <div className="h-2 overflow-hidden rounded-full bg-zinc-900 border border-zinc-800">
          <div
            className="h-full bg-red-500 transition-all duration-300"
            style={{ width: `${stageInfo.stageProgressPct}%` }}
          />
        </div>

        <p className="text-xs text-zinc-300 leading-relaxed font-medium">
          {stageInfo.description}
        </p>
      </div>

      {/* Visão do Treino Total e Métricas */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-3 text-center">
          <p className="text-xs text-zinc-400">Tempo total decorrido</p>
          <p className="mt-1 text-2xl font-black text-white tabular-nums">
            {formatSeconds(elapsedSeconds)}
          </p>
          <p className="text-[11px] text-zinc-400">Meta: {plannedMinutes} min</p>
        </div>

        <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-3 text-center">
          <p className="text-xs text-zinc-400">Alvo de Esforço</p>
          <p className="mt-1 text-lg font-black text-zinc-100">
            {stageInfo.targetRpe}
          </p>
          <p className="text-[11px] text-zinc-400">Conversável</p>
        </div>

        <div className="col-span-2 sm:col-span-1 rounded-xl border border-zinc-800 bg-zinc-900/60 p-3 text-center">
          <p className="text-xs text-zinc-400">FC Provisória</p>
          <p className="mt-1 text-lg font-black text-zinc-100">
            105–125 BPM
          </p>
          <p className="text-[11px] text-zinc-400">Referência flexível</p>
        </div>
      </div>

      {/* Progresso Total do Treino */}
      <div className="space-y-1">
        <div className="flex justify-between text-xs text-zinc-400">
          <span>Progresso da sessão</span>
          <span>{totalProgressPct}% concluído</span>
        </div>
        <div className="h-2.5 overflow-hidden rounded-full bg-zinc-900 border border-zinc-800">
          <div
            className="h-full bg-gradient-to-r from-amber-500 via-red-500 to-cyan-500 transition-all duration-300"
            style={{ width: `${totalProgressPct}%` }}
          />
        </div>
      </div>

      {/* Campo Opcional de BPM Observado durante a pedalada */}
      <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-3 space-y-1.5">
        <label className="flex flex-col gap-1 text-xs">
          <span className="font-semibold text-zinc-300">
            BPM observado no momento (opcional):
          </span>
          <input
            type="number"
            min="30"
            max="240"
            value={observedBpm}
            onChange={(e) => setObservedBpm(e.target.value)}
            placeholder="Ex.: 118"
            className="min-h-11 w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-base text-zinc-100 outline-none focus:border-red-400"
          />
        </label>
        <p className="text-[11px] text-zinc-500">
          Se tiver monitor cardíaco, anote agora ou preencha no registro final.
        </p>
      </div>

      {/* Botões de Ação com Área de Toque Adequada (iPhone Friendly) */}
      <div className="flex flex-col gap-2.5 sm:flex-row pt-1">
        {isPaused ? (
          <button
            type="button"
            onClick={handleResume}
            className="flex min-h-12 flex-1 items-center justify-center gap-2 rounded-xl bg-amber-600 px-5 py-3 text-base font-black text-white shadow-lg transition hover:bg-amber-500 active:scale-[0.98]"
          >
            ▶ Retomar pedal
          </button>
        ) : (
          <button
            type="button"
            onClick={handlePause}
            className="flex min-h-12 flex-1 items-center justify-center gap-2 rounded-xl border border-zinc-600 bg-zinc-900 px-5 py-3 text-base font-bold text-zinc-200 transition hover:border-zinc-500 active:scale-[0.98]"
          >
            ⏸ Pausar
          </button>
        )}

        <button
          type="button"
          onClick={handleFinishWorkout}
          className="flex min-h-12 flex-1 items-center justify-center gap-2 rounded-xl bg-red-600 px-5 py-3 text-base font-black text-[var(--on-primary)] shadow-lg shadow-red-700/30 transition hover:bg-red-500 active:scale-[0.98]"
        >
          ✓ Encerrar e salvar ({Math.max(1, Math.round(elapsedSeconds / 60))} min)
        </button>
      </div>

      <p className="text-[11px] text-zinc-500 text-center">
        O cronômetro calcula o tempo com base no relógio real e continua correto mesmo se o iPhone bloquear ou você alternar de aba.
      </p>
    </div>
  );
}
