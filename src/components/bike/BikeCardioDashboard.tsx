"use client";

import { useEffect, useMemo, useState, type FormEvent } from "react";
import {
  BIKE_PLAN,
  BikeData,
  BikeMeasurement,
  BikeSession,
  dayNumber,
  getEffectiveWeek,
  getWeekRange,
  loadBikeData,
  localDate,
  progressionAdvice,
  readableDate,
  sanitizeBikeData,
  storeBikeData,
  summarizeWeek,
  weekForDate,
} from "@/lib/bike-cardio";
import { TodayWorkoutCard } from "@/components/bike/TodayWorkoutCard";
import { BikeGuidedRunner } from "@/components/bike/BikeGuidedRunner";
import {
  BikeSessionForm,
  blankSessionForm,
  type SessionFormData,
} from "@/components/bike/BikeSessionForm";
import { BikeEvolutionPanel } from "@/components/bike/BikeEvolutionPanel";
import { BikeGuidelines } from "@/components/bike/BikeGuidelines";

type MeasureForm = {
  date: string;
  weightKg: string;
  bodyFatPct: string;
  waistCm: string;
  systolic: string;
  diastolic: string;
  notes: string;
};

type ActiveTab =
  | "today"
  | "plan"
  | "evolution"
  | "history"
  | "measures"
  | "guide"
  | "backup";

const fieldClass =
  "min-h-11 w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-base text-zinc-100 outline-none focus:border-red-400";
const labelClass = "block text-xs font-semibold text-zinc-300";
const mutedClass = "text-xs leading-relaxed text-zinc-400";
const buttonClass =
  "min-h-11 rounded-lg border border-zinc-700 bg-zinc-900 px-4 py-2 text-xs font-bold text-zinc-100 hover:border-red-400 disabled:cursor-not-allowed disabled:opacity-40";

function blankMeasure(): MeasureForm {
  return {
    date: localDate(),
    weightKg: "",
    bodyFatPct: "",
    waistCm: "",
    systolic: "",
    diastolic: "",
    notes: "",
  };
}

function optionalNumber(
  value: string,
  min: number,
  max: number,
): number | null | undefined {
  if (value.trim() === "") return null;
  const num = Number(value.replace(",", "."));
  return Number.isFinite(num) && num >= min && num <= max ? num : undefined;
}

function numberText(value: number | null, suffix = "") {
  return value === null
    ? "—"
    : `${Number.isInteger(value) ? value : value.toFixed(1).replace(".", ",")}${suffix}`;
}

function download(name: string, content: string, mimeType: string) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = name;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 500);
}

function makeCsv(data: BikeData) {
  const headers = [
    "data",
    "estado",
    "minutos",
    "fc_media_bpm",
    "fc_pico_bpm",
    "esforco_0_10",
    "fadiga_pernas_0_10",
    "teste_fala",
    "distancia_km",
    "resistencia",
    "sintomas",
    "notas",
  ];
  const escape = (value: unknown) => {
    const raw = String(value ?? "");
    // Impede execução acidental de fórmulas ao abrir anotações em planilhas.
    const safe = /^[=+@\-\t\r]/.test(raw) ? `'${raw}` : raw;
    return `"${safe.replaceAll('"', '""')}"`;
  };
  const rows = data.sessions.map((s) => [
    s.date,
    s.status,
    s.minutes,
    s.averageBpm,
    s.peakBpm,
    s.rpe,
    s.legFatigue,
    s.talkTest,
    s.distanceKm,
    s.resistance,
    s.symptoms ? "sim" : "não",
    s.notes,
  ]);
  return (
    "\uFEFF" +
    [headers, ...rows].map((row) => row.map(escape).join(";")).join("\r\n")
  );
}

export function BikeCardioDashboard() {
  const [data, setData] = useState<BikeData | null>(null);
  const [activeTab, setActiveTab] = useState<ActiveTab>("today");
  const [selectedWeek, setSelectedWeek] = useState<number | null>(null);
  const [sessionForm, setSessionForm] = useState<SessionFormData>(() =>
    blankSessionForm(),
  );
  const [measure, setMeasure] = useState<MeasureForm>(() => blankMeasure());
  const [editingSession, setEditingSession] = useState<string | null>(null);
  const [editingMeasure, setEditingMeasure] = useState<string | null>(null);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");
  const [importing, setImporting] = useState(false);
  const [goalDraft, setGoalDraft] = useState("");

  // Modo de execução guiada com cronômetro
  const [guidedActive, setGuidedActive] = useState(false);
  const [guidedMinutes, setGuidedMinutes] = useState(25);

  useEffect(() => {
    const refresh = () => {
      try {
        const saved = loadBikeData();
        setData(saved);
        setGoalDraft(saved.goalWeightKg?.toString() ?? "");
      } catch {
        setError(
          "Não foi possível ler os registros de bike. Exporte um backup da conta antes de substituir os dados.",
        );
      }
    };
    const handle = window.setTimeout(refresh, 0);
    window.addEventListener("bjj-cloud-updated", refresh);
    return () => {
      window.clearTimeout(handle);
      window.removeEventListener("bjj-cloud-updated", refresh);
    };
  }, []);

  const currentWeek = data ? getEffectiveWeek(data) : 1;
  const week = Math.min(6, Math.max(1, selectedWeek ?? currentWeek));
  const phase = BIKE_PLAN[week - 1];
  const weekly = useMemo(
    () => (data ? BIKE_PLAN.map((p) => summarizeWeek(data, p.week)) : []),
    [data],
  );

  const sessions = useMemo(
    () =>
      (data?.sessions ?? [])
        .slice()
        .sort(
          (a, b) =>
            b.date.localeCompare(a.date) ||
            b.recordedAt.localeCompare(a.recordedAt),
        ),
    [data],
  );

  const measurements = useMemo(
    () =>
      (data?.measurements ?? [])
        .slice()
        .sort((a, b) => b.date.localeCompare(a.date)),
    [data],
  );

  const done = sessions.filter((s) => s.status === "completed");
  const totalMinutes = done.reduce((sum, item) => sum + item.minutes, 0);
  const lastWeight = measurements.find((m) => m.weightKg !== null);

  function saveData(next: BikeData, success: string) {
    try {
      storeBikeData(next);
      setData(next);
      setNotice(success);
      setError("");
    } catch {
      setError(
        "Não foi possível salvar neste navegador. Verifique se o armazenamento está habilitado e exporte um backup.",
      );
    }
  }

  function patchSessionForm<K extends keyof SessionFormData>(
    name: K,
    value: SessionFormData[K],
  ) {
    setSessionForm((old) => ({ ...old, [name]: value }));
  }

  function patchMeasure<K extends keyof MeasureForm>(
    name: K,
    value: MeasureForm[K],
  ) {
    setMeasure((old) => ({ ...old, [name]: value }));
  }

  function handleStartGuided(minutes: number) {
    setGuidedMinutes(minutes);
    setGuidedActive(true);
    // Rolagem suave para o topo
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function handleOpenQuickLog(minutes: number) {
    setSessionForm({
      ...blankSessionForm(minutes),
      date: localDate(),
    });
    setEditingSession(null);
    setActiveTab("today");
    window.setTimeout(() => {
      document
        .getElementById("bike-session-form")
        ?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 50);
  }

  function handleGuidedFinish(result: {
    durationMinutes: number;
    observedBpm: number | null;
  }) {
    setGuidedActive(false);
    setSessionForm({
      ...blankSessionForm(result.durationMinutes),
      date: localDate(),
      averageBpm: result.observedBpm ? String(result.observedBpm) : "",
    });
    setEditingSession(null);
    setActiveTab("today");
    setNotice(
      `Treino guiado finalizado (${result.durationMinutes} min). Preencha as percepções abaixo e salve seu registro.`,
    );
    window.setTimeout(() => {
      document
        .getElementById("bike-session-form")
        ?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 50);
  }

  function handleUpdatePreferredDays(days: number[]) {
    if (!data) return;
    saveData(
      { ...data, preferredDays: days },
      "Dias preferenciais da semana atualizados.",
    );
  }

  function handleToggleRepeatWeek(override: number | null) {
    if (!data) return;
    saveData(
      { ...data, activeWeekOverride: override },
      override
        ? `Semana ${override} definida para repetição. Foque na recuperação!`
        : "Progressão da semana pelo calendário retomada.",
    );
  }

  function saveSession(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!data) return;

    if (!Number.isFinite(dayNumber(sessionForm.date))) {
      setError("Informe uma data válida para a sessão.");
      return;
    }
    const minutes = optionalNumber(sessionForm.minutes, 1, 240);
    const averageBpm = optionalNumber(sessionForm.averageBpm, 30, 240);
    const peakBpm = optionalNumber(sessionForm.peakBpm, 30, 260);
    const rpe = optionalNumber(sessionForm.rpe, 0, 10);
    const legFatigue = optionalNumber(sessionForm.legFatigue, 0, 10);
    const distanceKm = optionalNumber(sessionForm.distanceKm, 0, 200);

    if (
      sessionForm.status === "completed" &&
      (minutes == null || !Number.isFinite(minutes))
    ) {
      setError("Informe uma duração válida entre 1 e 240 minutos.");
      return;
    }
    if (
      [averageBpm, peakBpm, rpe, legFatigue, distanceKm].some(
        (v) => v === undefined,
      )
    ) {
      setError(
        "Confira os valores numéricos inseridos. Deixe em branco o que não souber.",
      );
      return;
    }
    if (
      averageBpm !== null &&
      peakBpm !== null &&
      (averageBpm ?? 0) > (peakBpm ?? 0)
    ) {
      setError("A FC média não pode ser maior que a FC de pico.");
      return;
    }

    const record: BikeSession = {
      id: editingSession ?? crypto.randomUUID(),
      date: sessionForm.date,
      status: sessionForm.status,
      minutes: sessionForm.status === "skipped" ? 0 : minutes ?? 0,
      averageBpm: sessionForm.status === "skipped" ? null : averageBpm ?? null,
      peakBpm: sessionForm.status === "skipped" ? null : peakBpm ?? null,
      rpe: sessionForm.status === "skipped" ? null : rpe ?? null,
      legFatigue: legFatigue ?? null,
      talkTest:
        sessionForm.status === "skipped"
          ? "nao-avaliado"
          : sessionForm.talkTest,
      distanceKm:
        sessionForm.status === "skipped" ? null : distanceKm ?? null,
      resistance: sessionForm.resistance.trim(),
      symptoms: sessionForm.symptoms,
      notes: sessionForm.notes.trim(),
      recordedAt: new Date().toISOString(),
    };

    const next = {
      ...data,
      sessions: [
        record,
        ...data.sessions.filter((s) => s.id !== editingSession),
      ],
    };

    saveData(
      next,
      editingSession ? "Sessão atualizada." : "Sessão registrada.",
    );
    setEditingSession(null);
    setSessionForm(blankSessionForm(phase.minutes));
  }

  function editSession(item: BikeSession) {
    setEditingSession(item.id);
    setSessionForm({
      date: item.date,
      status: item.status,
      minutes: String(item.minutes),
      averageBpm: item.averageBpm?.toString() ?? "",
      peakBpm: item.peakBpm?.toString() ?? "",
      rpe: item.rpe?.toString() ?? "",
      legFatigue: item.legFatigue?.toString() ?? "",
      talkTest: item.talkTest,
      distanceKm: item.distanceKm?.toString() ?? "",
      resistance: item.resistance,
      symptoms: item.symptoms,
      notes: item.notes,
    });
    setActiveTab("today");
    setNotice("Editando sessão selecionada.");
    window.setTimeout(() => {
      document
        .getElementById("bike-session-form")
        ?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 50);
  }

  function removeSession(id: string) {
    if (
      !data ||
      !window.confirm("Excluir definitivamente este registro de bicicleta?")
    )
      return;
    saveData(
      { ...data, sessions: data.sessions.filter((s) => s.id !== id) },
      "Sessão excluída.",
    );
    if (editingSession === id) {
      setEditingSession(null);
      setSessionForm(blankSessionForm(phase.minutes));
    }
  }

  function saveMeasurement(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!data) return;

    if (!Number.isFinite(dayNumber(measure.date))) {
      setError("Informe uma data válida para a medição.");
      return;
    }
    const weightKg = optionalNumber(measure.weightKg, 20, 400);
    const bodyFatPct = optionalNumber(measure.bodyFatPct, 1, 75);
    const waistCm = optionalNumber(measure.waistCm, 30, 250);
    const systolic = optionalNumber(measure.systolic, 60, 260);
    const diastolic = optionalNumber(measure.diastolic, 30, 160);

    if (
      [weightKg, bodyFatPct, waistCm, systolic, diastolic].some(
        (v) => v === undefined,
      )
    ) {
      setError("Verifique as medidas inseridas. Campos desconhecidos podem ficar vazios.");
      return;
    }
    if (
      weightKg === null &&
      bodyFatPct === null &&
      waistCm === null &&
      systolic === null &&
      diastolic === null
    ) {
      setError("Preencha ao menos uma medição.");
      return;
    }
    if ((systolic === null) !== (diastolic === null)) {
      setError(
        "Informe os dois valores da pressão arterial (sistólica e diastólica) ou deixe ambos vazios.",
      );
      return;
    }

    const record: BikeMeasurement = {
      id: editingMeasure ?? crypto.randomUUID(),
      date: measure.date,
      weightKg: weightKg ?? null,
      bodyFatPct: bodyFatPct ?? null,
      waistCm: waistCm ?? null,
      systolic: systolic ?? null,
      diastolic: diastolic ?? null,
      notes: measure.notes.trim(),
    };

    saveData(
      {
        ...data,
        measurements: [
          record,
          ...data.measurements.filter((m) => m.id !== editingMeasure),
        ],
      },
      editingMeasure ? "Medição atualizada." : "Medição registrada.",
    );
    setEditingMeasure(null);
    setMeasure(blankMeasure());
  }

  function editMeasurement(item: BikeMeasurement) {
    setEditingMeasure(item.id);
    setMeasure({
      date: item.date,
      weightKg: item.weightKg?.toString() ?? "",
      bodyFatPct: item.bodyFatPct?.toString() ?? "",
      waistCm: item.waistCm?.toString() ?? "",
      systolic: item.systolic?.toString() ?? "",
      diastolic: item.diastolic?.toString() ?? "",
      notes: item.notes,
    });
    setActiveTab("measures");
    window.setTimeout(() => {
      document
        .getElementById("bike-measures-form")
        ?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 50);
  }

  function removeMeasurement(id: string) {
    if (!data || !window.confirm("Excluir esta medição?")) return;
    saveData(
      {
        ...data,
        measurements: data.measurements.filter((m) => m.id !== id),
      },
      "Medição excluída.",
    );
    if (editingMeasure === id) {
      setEditingMeasure(null);
      setMeasure(blankMeasure());
    }
  }

  async function importBackup(file: File | undefined) {
    if (!file || !data) return;
    if (file.size > 2_000_000) {
      setError("O arquivo de backup deve ter no máximo 2 MB.");
      return;
    }
    setImporting(true);
    try {
      const parsed = JSON.parse(await file.text()) as unknown;
      const next = sanitizeBikeData(parsed);
      if (
        window.confirm(
          "O backup substituirá todos os registros da bicicleta nesta conta ou dispositivo. Exporte a cópia atual antes de continuar. Deseja substituir?",
        )
      ) {
        saveData(next, "Backup importado com sucesso.");
        setEditingMeasure(null);
        setEditingSession(null);
        setSessionForm(blankSessionForm());
        setMeasure(blankMeasure());
        setSelectedWeek(null);
        setGoalDraft(next.goalWeightKg?.toString() ?? "");
      }
    } catch (reason) {
      setError(
        reason instanceof Error
          ? reason.message
          : "Não foi possível ler o backup.",
      );
    } finally {
      setImporting(false);
    }
  }

  if (!data) {
    return (
      <div className="py-16 text-center text-sm text-zinc-400">
        Carregando registros da bicicleta...
      </div>
    );
  }

  const summary = weekly[week - 1];
  const range = getWeekRange(data.startedOn, week);
  const completedPercent = Math.min(
    100,
    Math.round((summary.completedSessions / phase.sessions) * 100),
  );

  return (
    <main className="flex flex-1 flex-col gap-6 pb-16 pt-5">
      {/* 1. Cabeçalho Principal do Módulo */}
      <section className="space-y-2">
        <p className="text-xs font-bold uppercase tracking-wider text-red-300">
          Programa exclusivo · bicicleta ergométrica
        </p>
        <h1 className="text-3xl font-black text-white sm:text-4xl">Cardio na Bike</h1>
        <p className="text-sm leading-6 text-zinc-300">
          Seis semanas progressivas de base aeróbica moderada para condicionamento e emagrecimento sem prejudicar a musculação.
        </p>
        <p className="text-xs text-zinc-500">
          Independente dos seis cardios do BJJ. Sincroniza na conta Supabase quando logado; sem login, persiste neste navegador.
        </p>
      </section>

      {/* Alertas de Notificação e Erro */}
      {error && (
        <div
          role="alert"
          className="flex items-center justify-between rounded-xl border border-rose-700 bg-rose-950/40 p-3 text-xs sm:text-sm text-rose-200"
        >
          <span>{error}</span>
          <button
            type="button"
            onClick={() => setError("")}
            className="ml-2 font-bold hover:text-white"
          >
            ✕
          </button>
        </div>
      )}

      {notice && (
        <div
          role="status"
          className="flex items-center justify-between rounded-xl border border-zinc-700 bg-zinc-900 p-3 text-xs sm:text-sm text-zinc-200"
        >
          <span>{notice}</span>
          <button
            type="button"
            onClick={() => setNotice("")}
            className="ml-2 font-bold hover:text-white"
          >
            ✕
          </button>
        </div>
      )}

      {/* 2. Resumo de Métricas Principais (Cards Compactos e Legíveis) */}
      <section
        className="grid grid-cols-2 gap-2.5 sm:grid-cols-4"
        aria-label="Resumo do cardio"
      >
        {[
          [
            "Semana atual",
            data.activeWeekOverride
              ? `Sem. ${data.activeWeekOverride} (fixada)`
              : currentWeek < 1
                ? "A iniciar"
                : currentWeek > 6
                  ? "Finalizado"
                  : `${currentWeek} de 6`,
          ],
          ["Sessões feitas", String(done.length)],
          ["Tempo acumulado", `${totalMinutes} min`],
          ["Último peso", numberText(lastWeight?.weightKg ?? null, " kg")],
        ].map(([title, value]) => (
          <div
            key={title}
            className="rounded-xl border border-zinc-800 bg-zinc-900/80 p-3"
          >
            <p className="text-xs text-zinc-400">{title}</p>
            <p className="mt-1 text-base font-black text-white sm:text-lg">{value}</p>
          </div>
        ))}
      </section>

      {/* 3. Navegação em Abas Mobile-First (Área de toque adequada, sem scroll horizontal) */}
      <nav
        aria-label="Navegação do módulo da bike"
        className="flex flex-wrap gap-1.5 rounded-xl border border-zinc-800 bg-zinc-900/60 p-1.5"
      >
        {[
          { id: "today", label: "Hoje", badge: done.length > 0 ? undefined : "Novo" },
          { id: "plan", label: "Plano 6 Sem." },
          { id: "evolution", label: "Evolução" },
          { id: "history", label: `Histórico (${sessions.length})` },
          { id: "measures", label: "Medidas" },
          { id: "guide", label: "Dicas" },
          { id: "backup", label: "Backup" },
        ].map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id as ActiveTab)}
              aria-current={isActive ? "page" : undefined}
              className={`flex min-h-11 flex-1 items-center justify-center gap-1 rounded-lg px-2.5 py-2 text-xs font-bold transition sm:min-h-10 sm:text-sm ${
                isActive
                  ? "bg-red-600 text-[var(--on-primary)] shadow-md"
                  : "text-zinc-300 hover:bg-zinc-800/80 hover:text-white"
              }`}
            >
              <span>{tab.label}</span>
              {tab.badge && (
                <span className="rounded bg-white/20 px-1 py-0.2 text-[10px]">
                  {tab.badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* ===================== ABA 1: HOJE ===================== */}
      {activeTab === "today" && (
        <div className="space-y-6">
          {guidedActive ? (
            <BikeGuidedRunner
              plannedMinutes={guidedMinutes}
              onFinish={handleGuidedFinish}
              onCancel={() => setGuidedActive(false)}
            />
          ) : (
            <TodayWorkoutCard
              data={data}
              onStartGuided={handleStartGuided}
              onOpenQuickLog={handleOpenQuickLog}
              onUpdatePreferredDays={handleUpdatePreferredDays}
              onToggleRepeatWeek={handleToggleRepeatWeek}
            />
          )}

          {/* Formulário Rápido de Registro */}
          <BikeSessionForm
            form={sessionForm}
            editingId={editingSession}
            onChange={patchSessionForm}
            onSubmit={saveSession}
            onCancelEdit={() => {
              setEditingSession(null);
              setSessionForm(blankSessionForm(phase.minutes));
            }}
          />
        </div>
      )}

      {/* ===================== ABA 2: PLANO DAS 6 SEMANAS ===================== */}
      {activeTab === "plan" && (
        <div className="space-y-6">
          <section className="space-y-3 rounded-2xl border border-zinc-800 bg-zinc-900/40 p-4 sm:p-5">
            <h2 className="text-lg font-black text-white">Configuração do Ciclo</h2>
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="flex min-w-0 flex-col gap-1.5">
                <span className={labelClass}>Data de início do ciclo</span>
                <input
                  type="date"
                  className={fieldClass}
                  value={data.startedOn}
                  onChange={(e) => {
                    if (!e.target.value) return;
                    saveData(
                      { ...data, startedOn: e.target.value },
                      "Início do ciclo atualizado.",
                    );
                  }}
                />
              </label>

              <label className="flex flex-col gap-1.5">
                <span className={labelClass}>Meta de peso (kg) · opcional</span>
                <div className="flex gap-2">
                  <input
                    type="number"
                    step="0.1"
                    min="20"
                    max="400"
                    className={fieldClass}
                    value={goalDraft}
                    placeholder="Ex.: 97"
                    onChange={(e) => setGoalDraft(e.target.value)}
                  />
                  <button
                    type="button"
                    className={buttonClass}
                    onClick={() => {
                      const parsed = optionalNumber(goalDraft, 20, 400);
                      if (parsed === undefined) {
                        setError("Meta de peso inválida (20–400 kg).");
                        return;
                      }
                      saveData({ ...data, goalWeightKg: parsed }, "Meta atualizada.");
                    }}
                  >
                    Salvar
                  </button>
                </div>
              </label>
            </div>

            <p className={mutedClass}>
              Toque em qualquer semana abaixo para visualizar sua estrutura detalhada.
            </p>

            <div className="grid grid-cols-3 gap-2 sm:grid-cols-6 pt-1">
              {BIKE_PLAN.map((item) => {
                const active = week === item.week;
                return (
                  <button
                    key={item.week}
                    type="button"
                    onClick={() => {
                      setSelectedWeek(item.week);
                      setSessionForm((old) =>
                        editingSession
                          ? old
                          : { ...old, minutes: String(item.minutes) },
                      );
                    }}
                    aria-pressed={active}
                    className={`min-h-16 rounded-xl border px-2 py-2 text-center text-xs font-bold transition ${
                      active
                        ? "border-red-400 bg-red-950/50 text-white shadow-md"
                        : "border-zinc-800 bg-zinc-950 text-zinc-300 hover:border-zinc-700"
                    }`}
                  >
                    Sem. {item.week}
                    <span className="mt-1 block text-[11px] font-normal text-zinc-400">
                      {weekly[item.week - 1].completedSessions}/{item.sessions} feitas
                    </span>
                  </button>
                );
              })}
            </div>
          </section>

          {/* Detalhe da Semana Selecionada */}
          <section className="space-y-4 rounded-2xl border border-red-900/60 bg-red-950/10 p-4 sm:p-5">
            <div className="flex flex-wrap items-start justify-between gap-2 border-b border-zinc-800/80 pb-3">
              <div>
                <p className="text-xs font-bold uppercase tracking-wide text-red-300">
                  Treino selecionado
                </p>
                <h3 className="mt-0.5 text-2xl font-black text-white">
                  Semana {week}: base moderada
                </h3>
                <p className="text-xs text-zinc-400">
                  {readableDate(range.from)} a {readableDate(range.through)}
                </p>
              </div>
              <span className="rounded-full border border-red-500/40 px-3 py-1 text-xs font-bold text-red-200">
                {phase.sessions} × {phase.minutes} min
              </span>
            </div>

            <div className="grid grid-cols-3 gap-2">
              {[
                ["Aquecimento", "5 min", "Leve"],
                ["Parte principal", `${phase.minutes - 10} min`, "Conversável"],
                ["Desaquecimento", "5 min", "Leve"],
              ].map(([title, time, detail]) => (
                <div
                  key={title}
                  className="rounded-xl border border-zinc-800 bg-zinc-950 p-3 text-center"
                >
                  <p className="text-xs text-zinc-400">{title}</p>
                  <p className="mt-1 text-base font-black text-white">{time}</p>
                  <p className="text-[11px] text-zinc-400">{detail}</p>
                </div>
              ))}
            </div>

            <div className="space-y-2 text-xs leading-relaxed text-zinc-300">
              <p>
                <strong className="text-white">Esforço-alvo:</strong> percepção 3–4/10, mantendo a capacidade de conversar. Aumente primeiro o tempo, não a resistência.
              </p>
              <p>
                <strong className="text-white">BPM de referência:</strong> 105–125 é apenas uma estimativa provisória, não uma zona individual definitiva. Priorize sintomas e teste da fala.
              </p>
            </div>

            <div className="space-y-1">
              <div className="h-2 overflow-hidden rounded-full bg-zinc-800">
                <div
                  className="h-full bg-red-500"
                  style={{ width: `${completedPercent}%` }}
                />
              </div>
              <p className="text-xs text-zinc-300">
                {summary.completedSessions}/{phase.sessions} sessões concluídas · {summary.minutes}/{summary.plannedMinutes} minutos
              </p>
            </div>

            <p className="text-xs font-semibold text-zinc-200">
              {progressionAdvice(data, week)}
            </p>

            <button
              type="button"
              onClick={() => handleStartGuided(phase.minutes)}
              className="min-h-12 w-full rounded-xl bg-red-600 px-4 py-3 text-sm font-black text-[var(--on-primary)] hover:bg-red-500"
            >
              Iniciar sessão da Semana {week} no Modo Guiado ({phase.minutes} min)
            </button>
          </section>
        </div>
      )}

      {/* ===================== ABA 3: EVOLUÇÃO ===================== */}
      {activeTab === "evolution" && (
        <BikeEvolutionPanel data={data} />
      )}

      {/* ===================== ABA 4: HISTÓRICO ===================== */}
      {activeTab === "history" && (
        <section className="space-y-4 rounded-2xl border border-zinc-800 p-4 sm:p-5">
          <div className="flex items-center justify-between gap-2 border-b border-zinc-800 pb-3">
            <div>
              <h2 className="text-xl font-black text-white">Histórico da Bike</h2>
              <p className={mutedClass}>
                Todas as sessões concluídas ou puladas com métricas registradas.
              </p>
            </div>
            <button
              type="button"
              onClick={() => handleOpenQuickLog(phase.minutes)}
              className={buttonClass}
            >
              + Nova sessão
            </button>
          </div>

          {sessions.length === 0 ? (
            <p className={mutedClass}>
              Nenhuma sessão registrada ainda. Inicie um treino guiado na aba Hoje para registrar sua primeira pedalada.
            </p>
          ) : (
            <div className="space-y-2.5">
              {sessions.map((item) => (
                <article
                  key={item.id}
                  className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-3.5 transition hover:border-zinc-700"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span
                          className={`size-2 rounded-full ${
                            item.status === "completed"
                              ? "bg-emerald-400"
                              : "bg-zinc-500"
                          }`}
                        />
                        <p className="font-bold text-white text-sm">
                          {readableDate(item.date)} ·{" "}
                          {item.status === "completed"
                            ? `${item.minutes} minutos`
                            : "Não realizado"}
                        </p>
                      </div>

                      <p className="text-xs text-zinc-400">
                        Semana {weekForDate(data.startedOn, item.date)} · FC média{" "}
                        {numberText(item.averageBpm, " BPM")} · PSE {numberText(item.rpe)} · Fadiga {numberText(item.legFatigue)}
                        {item.distanceKm ? ` · ${numberText(item.distanceKm, " km")}` : ""}
                        {item.resistance ? ` · ${item.resistance}` : ""}
                      </p>

                      {item.symptoms && (
                        <p className="text-xs font-bold text-rose-300">
                          ⚠ Sintomas incomuns registrados
                        </p>
                      )}

                      {item.notes && (
                        <p className="text-xs text-zinc-300 bg-zinc-950/50 rounded p-2 mt-1">
                          {item.notes}
                        </p>
                      )}
                    </div>

                    <div className="flex gap-2">
                      <button
                        type="button"
                        className={buttonClass}
                        onClick={() => editSession(item)}
                      >
                        Editar
                      </button>
                      <button
                        type="button"
                        className={buttonClass}
                        onClick={() => removeSession(item.id)}
                      >
                        Excluir
                      </button>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      )}

      {/* ===================== ABA 5: MEDIDAS CORPORAIS ===================== */}
      {activeTab === "measures" && (
        <section
          id="bike-measures-form"
          className="space-y-5 rounded-2xl border border-zinc-800 bg-zinc-900/30 p-4 sm:p-5 scroll-mt-6"
        >
          <div className="border-b border-zinc-800 pb-3">
            <h2 className="text-xl font-black text-white">
              {editingMeasure ? "Editar Medição" : "Medidas e Composição Corporal"}
            </h2>
            <p className={mutedClass}>
              Acompanhe peso, cintura, bioimpedância estimada e pressão arterial. Campos desconhecidos podem ficar vazios.
            </p>
          </div>

          <form className="space-y-3.5" onSubmit={saveMeasurement}>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              <label className="flex min-w-0 flex-col gap-1.5">
                <span className={labelClass}>Data da medição</span>
                <input
                  type="date"
                  className={fieldClass}
                  value={measure.date}
                  onChange={(e) => patchMeasure("date", e.target.value)}
                />
              </label>

              <label className="flex flex-col gap-1.5">
                <span className={labelClass}>Peso (kg)</span>
                <input
                  type="number"
                  min="20"
                  max="400"
                  step="0.1"
                  className={fieldClass}
                  value={measure.weightKg}
                  onChange={(e) => patchMeasure("weightKg", e.target.value)}
                  placeholder="Ex.: 106.6"
                />
              </label>

              <label className="flex flex-col gap-1.5">
                <span className={labelClass}>Gordura estimada (%)</span>
                <input
                  type="number"
                  min="1"
                  max="75"
                  step="0.1"
                  className={fieldClass}
                  value={measure.bodyFatPct}
                  onChange={(e) => patchMeasure("bodyFatPct", e.target.value)}
                  placeholder="Ex.: 27.9"
                />
              </label>

              <label className="flex flex-col gap-1.5">
                <span className={labelClass}>Cintura (cm)</span>
                <input
                  type="number"
                  min="30"
                  max="250"
                  step="0.1"
                  className={fieldClass}
                  value={measure.waistCm}
                  onChange={(e) => patchMeasure("waistCm", e.target.value)}
                  placeholder="Ex.: 112"
                />
              </label>

              <label className="flex flex-col gap-1.5">
                <span className={labelClass}>PA Sistólica (máx)</span>
                <input
                  type="number"
                  min="60"
                  max="260"
                  className={fieldClass}
                  value={measure.systolic}
                  onChange={(e) => patchMeasure("systolic", e.target.value)}
                  placeholder="Ex.: 120"
                />
              </label>

              <label className="flex flex-col gap-1.5">
                <span className={labelClass}>PA Diastólica (mín)</span>
                <input
                  type="number"
                  min="30"
                  max="160"
                  className={fieldClass}
                  value={measure.diastolic}
                  onChange={(e) => patchMeasure("diastolic", e.target.value)}
                  placeholder="Ex.: 80"
                />
              </label>
            </div>

            <label className="flex flex-col gap-1.5">
              <span className={labelClass}>Observações / bioimpedância</span>
              <textarea
                className={fieldClass}
                rows={2}
                maxLength={500}
                value={measure.notes}
                onChange={(e) => patchMeasure("notes", e.target.value)}
                placeholder="Ex.: Bioimpedância RelaxFit matinal em jejum."
              />
            </label>

            <div className="flex flex-wrap gap-2 pt-1">
              <button
                type="submit"
                className="min-h-11 rounded-lg bg-red-600 px-5 text-xs font-bold text-[var(--on-primary)] hover:bg-red-500"
              >
                {editingMeasure ? "Atualizar medida" : "Salvar medida"}
              </button>
              {editingMeasure && (
                <button
                  type="button"
                  className={buttonClass}
                  onClick={() => {
                    setEditingMeasure(null);
                    setMeasure(blankMeasure());
                  }}
                >
                  Cancelar edição
                </button>
              )}
            </div>
          </form>

          {/* Histórico de Medições */}
          <div className="space-y-2 pt-2 border-t border-zinc-800">
            <h3 className="text-sm font-bold text-zinc-200">Registros Anteriores</h3>
            {measurements.length === 0 ? (
              <p className={mutedClass}>Nenhuma medida corporal registrada.</p>
            ) : (
              measurements.map((item) => (
                <article
                  key={item.id}
                  className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-zinc-800 bg-zinc-950/60 p-3"
                >
                  <div>
                    <p className="font-bold text-zinc-100 text-xs sm:text-sm">
                      {readableDate(item.date)}
                    </p>
                    <p className="text-xs text-zinc-400 mt-0.5">
                      Peso {numberText(item.weightKg, " kg")} · Gordura{" "}
                      {numberText(item.bodyFatPct, "%")} · Cintura{" "}
                      {numberText(item.waistCm, " cm")}
                    </p>
                    <p className="text-[11px] text-zinc-400">
                      PA:{" "}
                      {item.systolic !== null && item.diastolic !== null
                        ? `${item.systolic}/${item.diastolic} mmHg`
                        : "—"}
                    </p>
                    {item.notes && (
                      <p className="mt-1 text-xs text-zinc-400 italic">
                        {item.notes}
                      </p>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <button
                      className={buttonClass}
                      type="button"
                      onClick={() => editMeasurement(item)}
                    >
                      Editar
                    </button>
                    <button
                      className={buttonClass}
                      type="button"
                      onClick={() => removeMeasurement(item.id)}
                    >
                      Excluir
                    </button>
                  </div>
                </article>
              ))
            )}
          </div>
        </section>
      )}

      {/* ===================== ABA 6: DICAS E ORIENTAÇÕES ===================== */}
      {activeTab === "guide" && (
        <BikeGuidelines />
      )}

      {/* ===================== ABA 7: BACKUP E PRIVACIDADE ===================== */}
      {activeTab === "backup" && (
        <section className="space-y-4 rounded-2xl border border-zinc-800 bg-zinc-900/40 p-4 sm:p-5">
          <div className="border-b border-zinc-800 pb-3">
            <h2 className="text-lg font-black text-white">Backup e Privacidade</h2>
            <p className={mutedClass}>
              Exporte seus registros em arquivo privado. Em conta Supabase conectada, a sincronização é automática.
            </p>
          </div>

          <div className="flex flex-wrap gap-2.5">
            <button
              type="button"
              className={buttonClass}
              onClick={() =>
                download(
                  "bike-cardio-backup.json",
                  JSON.stringify(data, null, 2),
                  "application/json",
                )
              }
            >
              Exportar backup JSON
            </button>
            <button
              type="button"
              className={buttonClass}
              onClick={() =>
                download(
                  "bike-cardio-sessoes.csv",
                  makeCsv(data),
                  "text/csv;charset=utf-8",
                )
              }
            >
              Exportar sessões CSV
            </button>
            <label
              className={`${buttonClass} inline-flex cursor-pointer items-center`}
            >
              <span>{importing ? "Importando..." : "Importar backup JSON"}</span>
              <input
                type="file"
                accept="application/json,.json"
                className="sr-only"
                disabled={importing}
                onChange={async (event) => {
                  await importBackup(event.target.files?.[0]);
                  event.target.value = "";
                }}
              />
            </label>
          </div>

          <p className="text-[11px] leading-relaxed text-zinc-400">
            Atenção: Os arquivos de backup exportados contêm dados de saúde individuais (peso, FC, datas). Mantenha-os em local seguro e não os compartilhe publicamente.
          </p>
        </section>
      )}

      {/* Nota educativa de rodapé */}
      <footer className="text-[11px] leading-relaxed text-zinc-500 pt-2 border-t border-zinc-800/60">
        Orientação educativa esportiva, não liberação médica. A pressão arterial e exames periódicos devem ser avaliados com o médico que acompanha você. Interrompa imediatamente a pedalada se houver dor ou aperto no peito, desmaio, tontura severa ou falta de ar desproporcional.
      </footer>
    </main>
  );
}
