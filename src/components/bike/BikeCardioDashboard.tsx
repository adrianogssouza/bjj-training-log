"use client";

import { useEffect, useMemo, useState, type FormEvent } from "react";
import {
  BIKE_PLAN,
  dayNumber,
  BikeData,
  BikeMeasurement,
  BikeSession,
  BikeStatus,
  TalkTest,
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

type SessionForm = {
  date: string;
  status: BikeStatus;
  minutes: string;
  averageBpm: string;
  peakBpm: string;
  rpe: string;
  legFatigue: string;
  talkTest: TalkTest;
  distanceKm: string;
  resistance: string;
  symptoms: boolean;
  notes: string;
};

type MeasureForm = {
  date: string;
  weightKg: string;
  bodyFatPct: string;
  waistCm: string;
  systolic: string;
  diastolic: string;
  notes: string;
};

const fieldClass = "min-h-11 w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-base text-zinc-100 outline-none focus:border-red-400";
const labelClass = "block text-sm font-semibold text-zinc-300";
const mutedClass = "text-sm leading-6 text-zinc-400";
const buttonClass = "min-h-11 rounded-lg border border-zinc-700 bg-zinc-900 px-4 py-2 text-sm font-bold text-zinc-100 hover:border-red-400 disabled:cursor-not-allowed disabled:opacity-40";

function blankSession(minutes = 25): SessionForm {
  return {
    date: localDate(), status: "completed", minutes: String(minutes), averageBpm: "",
    peakBpm: "", rpe: "4", legFatigue: "", talkTest: "nao-avaliado",
    distanceKm: "", resistance: "", symptoms: false, notes: "",
  };
}

function blankMeasure(): MeasureForm {
  return { date: localDate(), weightKg: "", bodyFatPct: "", waistCm: "", systolic: "", diastolic: "", notes: "" };
}

function optionalNumber(value: string, min: number, max: number): number | null | undefined {
  if (value.trim() === "") return null;
  const num = Number(value.replace(",", "."));
  return Number.isFinite(num) && num >= min && num <= max ? num : undefined;
}

function field(label: string, value: string, onChange: (v: string) => void, props?: { type?: string; min?: string; max?: string; step?: string; placeholder?: string }) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className={labelClass}>{label}</span>
      <input
        className={fieldClass}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        type={props?.type ?? "text"}
        min={props?.min}
        max={props?.max}
        step={props?.step}
        placeholder={props?.placeholder}
      />
    </label>
  );
}

function numberText(value: number | null, suffix = "") {
  return value === null ? "—" : `${Number.isInteger(value) ? value : value.toFixed(1).replace(".", ",")}${suffix}`;
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
  const headers = ["data", "estado", "minutos", "fc_media_bpm", "fc_pico_bpm", "esforco_0_10", "fadiga_pernas_0_10", "teste_fala", "distancia_km", "resistencia", "sintomas", "notas"];
  const escape = (value: unknown) => {
    const raw = String(value ?? "");
    // Impede execução acidental de fórmulas ao abrir anotações em planilhas.
    const safe = /^[=+@\-\t\r]/.test(raw) ? `'${raw}` : raw;
    return `"${safe.replaceAll('"', '""')}"`;
  };
  const rows = data.sessions.map((s) => [s.date, s.status, s.minutes, s.averageBpm, s.peakBpm, s.rpe, s.legFatigue, s.talkTest, s.distanceKm, s.resistance, s.symptoms ? "sim" : "não", s.notes]);
  return "\uFEFF" + [headers, ...rows].map((row) => row.map(escape).join(";")).join("\r\n");
}

export function BikeCardioDashboard() {
  const [data, setData] = useState<BikeData | null>(null);
  const [selectedWeek, setSelectedWeek] = useState<number | null>(null);
  const [form, setForm] = useState<SessionForm>(() => blankSession());
  const [measure, setMeasure] = useState<MeasureForm>(() => blankMeasure());
  const [editingSession, setEditingSession] = useState<string | null>(null);
  const [editingMeasure, setEditingMeasure] = useState<string | null>(null);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");
  const [importing, setImporting] = useState(false);
  const [goalDraft, setGoalDraft] = useState("");

  useEffect(() => {
    const refresh = () => {
      try {
        const saved = loadBikeData();
        setData(saved);
        setGoalDraft(saved.goalWeightKg?.toString() ?? "");
      } catch {
        setError("Não foi possível ler os registros de bike. Exporte um backup da conta antes de substituir os dados.");
      }
    };
    const handle = window.setTimeout(refresh, 0);
    window.addEventListener("bjj-cloud-updated", refresh);
    return () => {
      window.clearTimeout(handle);
      window.removeEventListener("bjj-cloud-updated", refresh);
    };
  }, []);

  const currentWeek = data ? weekForDate(data.startedOn, localDate()) : 1;
  const week = Math.min(6, Math.max(1, selectedWeek ?? currentWeek));
  const phase = BIKE_PLAN[week - 1];
  const weekly = useMemo(() => data ? BIKE_PLAN.map((p) => summarizeWeek(data, p.week)) : [], [data]);
  const sessions = useMemo(() => (data?.sessions ?? []).slice().sort((a, b) => b.date.localeCompare(a.date) || b.recordedAt.localeCompare(a.recordedAt)), [data]);
  const measurements = useMemo(() => (data?.measurements ?? []).slice().sort((a, b) => b.date.localeCompare(a.date)), [data]);
  const done = sessions.filter((s) => s.status === "completed");
  const totalMinutes = done.reduce((sum, item) => sum + item.minutes, 0);
  const lastWeight = measurements.find((m) => m.weightKg !== null);
  const maxWeeklyMinutes = Math.max(...BIKE_PLAN.map((p) => p.sessions * p.minutes));

  function saveData(next: BikeData, success: string) {
    try {
      storeBikeData(next);
      setData(next);
      setNotice(success);
      setError("");
    } catch {
      setError("Não foi possível salvar neste navegador. Verifique se o armazenamento está habilitado e exporte um backup.");
    }
  }

  function patchForm<K extends keyof SessionForm>(name: K, value: SessionForm[K]) {
    setForm((old) => ({ ...old, [name]: value }));
  }

  function patchMeasure<K extends keyof MeasureForm>(name: K, value: MeasureForm[K]) {
    setMeasure((old) => ({ ...old, [name]: value }));
  }

  function saveSession(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!data) return;
    if (!Number.isFinite(dayNumber(form.date))) { setError("Informe uma data válida para a sessão."); return; }
    const minutes = optionalNumber(form.minutes, 1, 240);
    const averageBpm = optionalNumber(form.averageBpm, 30, 240);
    const peakBpm = optionalNumber(form.peakBpm, 30, 260);
    const rpe = optionalNumber(form.rpe, 0, 10);
    const legFatigue = optionalNumber(form.legFatigue, 0, 10);
    const distanceKm = optionalNumber(form.distanceKm, 0, 200);
    if (form.status === "completed" && (minutes == null || !Number.isFinite(minutes))) {
      setError("Informe uma duração válida entre 1 e 240 minutos."); return;
    }
    if ([averageBpm, peakBpm, rpe, legFatigue, distanceKm].some((v) => v === undefined)) {
      setError("Confira os valores de BPM, esforço, fadiga e distância. Deixe em branco o que não souber."); return;
    }
    if (averageBpm !== null && peakBpm !== null && (averageBpm ?? 0) > (peakBpm ?? 0)) {
      setError("A FC média não pode ser maior que a FC de pico."); return;
    }
    const record: BikeSession = {
      id: editingSession ?? crypto.randomUUID(),
      date: form.date,
      status: form.status,
      minutes: form.status === "skipped" ? 0 : (minutes ?? 0),
      averageBpm: form.status === "skipped" ? null : (averageBpm ?? null),
      peakBpm: form.status === "skipped" ? null : (peakBpm ?? null),
      rpe: form.status === "skipped" ? null : (rpe ?? null),
      legFatigue: legFatigue ?? null,
      talkTest: form.status === "skipped" ? "nao-avaliado" : form.talkTest,
      distanceKm: form.status === "skipped" ? null : (distanceKm ?? null),
      resistance: form.resistance.trim(),
      symptoms: form.symptoms,
      notes: form.notes.trim(),
      recordedAt: new Date().toISOString(),
    };
    const next = { ...data, sessions: [record, ...data.sessions.filter((s) => s.id !== editingSession)] };
    saveData(next, editingSession ? "Sessão atualizada." : "Sessão registrada.");
    setEditingSession(null);
    setForm(blankSession(phase.minutes));
  }

  function editSession(item: BikeSession) {
    setEditingSession(item.id);
    setForm({
      date: item.date, status: item.status, minutes: String(item.minutes),
      averageBpm: item.averageBpm?.toString() ?? "", peakBpm: item.peakBpm?.toString() ?? "",
      rpe: item.rpe?.toString() ?? "", legFatigue: item.legFatigue?.toString() ?? "",
      talkTest: item.talkTest, distanceKm: item.distanceKm?.toString() ?? "",
      resistance: item.resistance, symptoms: item.symptoms, notes: item.notes,
    });
    setNotice("Editando sessão selecionada. O formulário está logo acima do histórico.");
    document.getElementById("bike-session-form")?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function removeSession(id: string) {
    if (!data || !window.confirm("Excluir definitivamente este registro de bicicleta?")) return;
    saveData({ ...data, sessions: data.sessions.filter((s) => s.id !== id) }, "Sessão excluída.");
    if (editingSession === id) { setEditingSession(null); setForm(blankSession(phase.minutes)); }
  }

  function saveMeasurement(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!data) return;
    if (!Number.isFinite(dayNumber(measure.date))) { setError("Informe uma data válida para a medição."); return; }
    const weightKg = optionalNumber(measure.weightKg, 20, 400);
    const bodyFatPct = optionalNumber(measure.bodyFatPct, 1, 75);
    const waistCm = optionalNumber(measure.waistCm, 30, 250);
    const systolic = optionalNumber(measure.systolic, 60, 260);
    const diastolic = optionalNumber(measure.diastolic, 30, 160);
    if ([weightKg, bodyFatPct, waistCm, systolic, diastolic].some((v) => v === undefined)) {
      setError("Verifique as medidas inseridas. Campos desconhecidos podem ficar vazios."); return;
    }
    if (weightKg === null && bodyFatPct === null && waistCm === null && systolic === null && diastolic === null) {
      setError("Preencha ao menos uma medição."); return;
    }
    if ((systolic === null) !== (diastolic === null)) {
      setError("Informe os dois valores da pressão arterial (sistólica e diastólica) ou deixe ambos vazios."); return;
    }
    const record: BikeMeasurement = {
      id: editingMeasure ?? crypto.randomUUID(), date: measure.date, weightKg: weightKg ?? null,
      bodyFatPct: bodyFatPct ?? null, waistCm: waistCm ?? null,
      systolic: systolic ?? null, diastolic: diastolic ?? null, notes: measure.notes.trim(),
    };
    saveData({ ...data, measurements: [record, ...data.measurements.filter((m) => m.id !== editingMeasure)] }, editingMeasure ? "Medição atualizada." : "Medição registrada.");
    setEditingMeasure(null); setMeasure(blankMeasure());
  }

  function editMeasurement(item: BikeMeasurement) {
    setEditingMeasure(item.id);
    setMeasure({ date: item.date, weightKg: item.weightKg?.toString() ?? "", bodyFatPct: item.bodyFatPct?.toString() ?? "", waistCm: item.waistCm?.toString() ?? "", systolic: item.systolic?.toString() ?? "", diastolic: item.diastolic?.toString() ?? "", notes: item.notes });
    document.getElementById("bike-measures")?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function removeMeasurement(id: string) {
    if (!data || !window.confirm("Excluir esta medição?")) return;
    saveData({ ...data, measurements: data.measurements.filter((m) => m.id !== id) }, "Medição excluída.");
    if (editingMeasure === id) { setEditingMeasure(null); setMeasure(blankMeasure()); }
  }

  async function importBackup(file: File | undefined) {
    if (!file || !data) return;
    if (file.size > 2_000_000) { setError("O arquivo de backup deve ter no máximo 2 MB."); return; }
    setImporting(true);
    try {
      const parsed = JSON.parse(await file.text()) as unknown;
      const next = sanitizeBikeData(parsed);
      if (window.confirm("O backup substituirá todos os registros da bicicleta nesta conta ou dispositivo. Exporte a cópia atual antes de continuar. Deseja substituir?")) {
        saveData(next, "Backup importado com sucesso.");
        setEditingMeasure(null); setEditingSession(null);
        setForm(blankSession()); setMeasure(blankMeasure()); setSelectedWeek(null);
        setGoalDraft(next.goalWeightKg?.toString() ?? "");
      }
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Não foi possível ler o backup.");
    } finally { setImporting(false); }
  }

  if (!data) {
    return <div className="py-16 text-center text-sm text-zinc-400">Carregando registros da bicicleta...</div>;
  }

  const summary = weekly[week - 1];
  const range = getWeekRange(data.startedOn, week);
  const completedPercent = Math.min(100, Math.round((summary.completedSessions / phase.sessions) * 100));

  return (
    <main className="flex flex-1 flex-col gap-7 pb-12 pt-7">
      <section className="space-y-3">
        <p className="text-xs font-bold uppercase tracking-wider text-red-300">Programa exclusivo · bicicleta ergométrica</p>
        <h1 className="text-3xl font-black text-white sm:text-4xl">Cardio na Bike</h1>
        <p className="text-base leading-7 text-zinc-300">Seis semanas progressivas para criar uma base aeróbica, apoiar o emagrecimento e preservar a recuperação da musculação.</p>
        <p className="text-xs leading-5 text-zinc-500">Módulo independente dos seis cardios do BJJ. Os registros sincronizam com a conta Supabase quando você está logado; em modo local ficam apenas neste navegador.</p>
      </section>

      {error && <div role="alert" className="rounded-lg border border-rose-700 bg-rose-950/30 p-3 text-sm text-rose-200">{error}</div>}
      {notice && <div role="status" className="rounded-lg border border-zinc-700 bg-zinc-900 p-3 text-sm text-zinc-200">{notice}</div>}

      <section className="grid grid-cols-2 gap-3 sm:grid-cols-4" aria-label="Resumo do cardio">
        {[
          ["Semana atual", currentWeek < 1 ? "A iniciar" : currentWeek > 6 ? "Finalizado" : `${currentWeek} de 6`],
          ["Sessões feitas", String(done.length)],
          ["Tempo acumulado", `${totalMinutes} min`],
          ["Último peso", numberText(lastWeight?.weightKg ?? null, " kg")],
        ].map(([title, value]) => (
          <div key={title} className="rounded-xl border border-zinc-800 bg-zinc-900 p-3">
            <p className="text-xs text-zinc-400">{title}</p>
            <p className="mt-1 text-lg font-black text-white">{value}</p>
          </div>
        ))}
      </section>

      <section className="space-y-3 rounded-xl border border-zinc-800 bg-zinc-900/40 p-4">
        <h2 className="text-lg font-black text-white">Seu ciclo de 6 semanas</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          {field("Data de início do ciclo", data.startedOn, (value) => {
            if (!value) return;
            saveData({ ...data, startedOn: value }, "Início do ciclo atualizado. Os registros serão reagrupados por data.");
          }, { type: "date" })}
          <label className="flex flex-col gap-1.5">
            <span className={labelClass}>Meta de peso (kg) · opcional</span>
            <span className="flex gap-2">
              <input className={fieldClass} type="number" step="0.1" min="20" max="400" value={goalDraft} placeholder="Ex.: 97" onChange={(e) => setGoalDraft(e.target.value)} />
              <button type="button" className={buttonClass} onClick={() => {
                const parsed = optionalNumber(goalDraft, 20, 400);
                if (parsed === undefined) { setError("Meta de peso inválida (20–400 kg)."); return; }
                saveData({ ...data, goalWeightKg: parsed }, "Meta atualizada.");
              }}>Salvar</button>
            </span>
          </label>
        </div>
        <p className={mutedClass}>Escolha qualquer semana para consultar a programação. Seu progresso é calculado pelas datas reais das sessões registradas.</p>
        <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
          {BIKE_PLAN.map((item) => {
            const active = week === item.week;
            return (
              <button key={item.week} type="button" onClick={() => { setSelectedWeek(item.week); setForm((old) => editingSession ? old : { ...old, minutes: String(item.minutes) }); }}
                aria-pressed={active}
                className={`min-h-16 rounded-lg border px-2 py-2 text-center text-sm font-bold ${active ? "border-red-400 bg-red-950/40 text-white" : "border-zinc-700 bg-zinc-950 text-zinc-300 hover:border-zinc-500"}`}>
                Sem. {item.week}<span className="mt-1 block text-xs font-normal text-zinc-400">{weekly[item.week - 1].completedSessions}/{item.sessions} feitas</span>
              </button>
            );
          })}
        </div>
      </section>

      <section className="space-y-4 rounded-xl border border-red-900/70 bg-red-950/10 p-4">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div>
            <p className="text-xs font-bold uppercase tracking-wide text-red-300">Treino selecionado</p>
            <h2 className="mt-1 text-2xl font-black text-white">Semana {week}: base moderada</h2>
            <p className="mt-1 text-sm text-zinc-400">{readableDate(range.from)} a {readableDate(range.through)}</p>
          </div>
          <span className="rounded-full border border-red-500/40 px-3 py-1 text-sm font-bold text-red-200">{phase.sessions} × {phase.minutes} min</span>
        </div>
        <div className="grid grid-cols-3 gap-2">
          {[
            ["Aquecimento", "5 min", "Leve"],
            ["Parte principal", `${phase.minutes - 10} min`, "Conversável"],
            ["Desaquecimento", "5 min", "Leve"],
          ].map(([title, time, detail]) => <div key={title} className="rounded-lg border border-zinc-800 bg-zinc-950 p-3">
            <p className="text-xs text-zinc-400">{title}</p><p className="mt-1 text-lg font-black text-white">{time}</p><p className="text-xs text-zinc-400">{detail}</p>
          </div>)}
        </div>
        <div className="space-y-2 text-sm leading-6 text-zinc-300">
          <p><strong className="text-white">Esforço-alvo:</strong> percepção 3–4/10, mantendo a capacidade de conversar. Aumente primeiro o tempo, não a resistência.</p>
          <p><strong className="text-white">BPM de referência:</strong> 105–125 é apenas uma estimativa exploratória, não uma zona individual validada nem um limite de segurança. Se houver divergência, priorize sintomas, teste da fala e orientação clínica.</p>
          <p><strong className="text-white">Musculação:</strong> como os treinos A e B exigem bastante das pernas, reduza a carga da bike se sentir fadiga acumulada. Não some HIIT de PSE 8–9 nesta fase sem revisão da prescrição.</p>
        </div>
        <div className="h-2 overflow-hidden rounded-full bg-zinc-800"><div className="h-full bg-red-500" style={{ width: `${completedPercent}%` }} /></div>
        <p className="text-sm text-zinc-300">{summary.completedSessions}/{phase.sessions} sessões concluídas · {summary.minutes}/{summary.plannedMinutes} minutos planejados</p>
        <p className="text-sm font-semibold text-zinc-200">{progressionAdvice(data, week)}</p>
      </section>

      <section id="bike-session-form" className="space-y-4 rounded-xl border border-zinc-800 bg-zinc-900/40 p-4 scroll-mt-6">
        <div className="flex items-center justify-between gap-2">
          <h2 className="text-xl font-black text-white">{editingSession ? "Editar sessão" : "Registrar sessão"}</h2>
          {editingSession && <button type="button" className={buttonClass} onClick={() => { setEditingSession(null); setForm(blankSession(phase.minutes)); }}>Cancelar edição</button>}
        </div>
        <p className={mutedClass}>Preencha somente os dados medidos. É possível registrar um dia não realizado, editar depois e manter observações sobre recuperação.</p>
        <form className="space-y-4" onSubmit={saveSession}>
          <div className="grid gap-3 sm:grid-cols-2">
            {field("Data do treino", form.date, (v) => patchForm("date", v), { type: "date" })}
            <label className="flex flex-col gap-1.5"><span className={labelClass}>Situação</span><select className={fieldClass} value={form.status} onChange={(e) => patchForm("status", e.target.value as BikeStatus)}>
              <option value="completed">Realizado</option><option value="skipped">Não realizado</option>
            </select></label>
          </div>
          {form.status === "completed" && <>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              {field("Duração (min) *", form.minutes, (v) => patchForm("minutes", v), { type: "number", min: "1", max: "240", step: "1" })}
              {field("FC média (BPM)", form.averageBpm, (v) => patchForm("averageBpm", v), { type: "number", min: "30", max: "240" })}
              {field("FC pico (BPM)", form.peakBpm, (v) => patchForm("peakBpm", v), { type: "number", min: "30", max: "260" })}
              {field("Esforço PSE (0–10)", form.rpe, (v) => patchForm("rpe", v), { type: "number", min: "0", max: "10", step: "1" })}
              {field("Distância (km)", form.distanceKm, (v) => patchForm("distanceKm", v), { type: "number", min: "0", max: "200", step: "0.1" })}
              {field("Resistência da bike", form.resistance, (v) => patchForm("resistance", v), { placeholder: "Ex.: nível 3" })}
            </div>
            <label className="flex flex-col gap-1.5"><span className={labelClass}>Teste da fala</span><select className={fieldClass} value={form.talkTest} onChange={(e) => patchForm("talkTest", e.target.value as TalkTest)}>
              <option value="nao-avaliado">Não avaliado</option><option value="normal">Consegui conversar em frases completas</option><option value="frases">Falei frases, mas já estava ofegante</option><option value="dificil">Não consegui conversar</option>
            </select></label>
          </>}
          {field("Fadiga nas pernas (0–10)", form.legFatigue, (v) => patchForm("legFatigue", v), { type: "number", min: "0", max: "10", step: "1" })}
          <label className="flex items-start gap-3 rounded-lg border border-zinc-700 p-3 text-sm text-zinc-200"><input type="checkbox" className="mt-1 size-4 accent-red-500" checked={form.symptoms} onChange={(e) => patchForm("symptoms", e.target.checked)} /><span>Houve sintoma incomum (dor no peito, tontura intensa, palpitação com mal-estar ou falta de ar desproporcional). Se sim, interrompa o exercício e procure avaliação profissional.</span></label>
          <label className="flex flex-col gap-1.5"><span className={labelClass}>Observações / motivo de não realização</span><textarea className={`${fieldClass} min-h-24`} value={form.notes} onChange={(e) => patchForm("notes", e.target.value)} maxLength={500} placeholder="Ex.: sono, pernas cansadas, recuperação da musculação, ajustes do dia." /></label>
          <button type="submit" className="min-h-12 w-full rounded-lg bg-red-600 px-5 py-3 text-sm font-black text-white hover:bg-red-500">{editingSession ? "Salvar alteração" : "Salvar registro da bike"}</button>
        </form>
      </section>

      <section className="space-y-4 rounded-xl border border-zinc-800 p-4">
        <div><h2 className="text-xl font-black text-white">Evolução semanal</h2><p className={mutedClass}>Minutos planejados e efetivamente realizados — sem estimar calorias nem inventar frequência cardíaca.</p></div>
        <div className="space-y-4">
          {BIKE_PLAN.map((item) => {
            const detail = weekly[item.week - 1];
            const width = Math.min(100, detail.minutes / maxWeeklyMinutes * 100);
            const targetWidth = item.sessions * item.minutes / maxWeeklyMinutes * 100;
            return <div key={item.week} className="space-y-1.5">
              <div className="flex items-center justify-between gap-2 text-sm"><span className="font-bold text-zinc-200">Semana {item.week} · {detail.completedSessions}/{item.sessions} sessões</span><span className="text-zinc-400">{detail.minutes}/{detail.plannedMinutes} min</span></div>
              <div className="relative h-3 overflow-hidden rounded-full bg-zinc-800"><div className="absolute inset-y-0 left-0 bg-zinc-700" style={{ width: `${targetWidth}%` }} /><div className="absolute inset-y-0 left-0 bg-red-500" style={{ width: `${width}%` }} /></div>
            </div>;
          })}
        </div>
        <p className="text-xs text-zinc-500">Cinza = meta de volume · vermelho = volume registrado. Sessões extras são exibidas, mas não determinam, isoladamente, que a progressão é segura.</p>
      </section>

      <section className="space-y-3 rounded-xl border border-zinc-800 p-4">
        <h2 className="text-xl font-black text-white">Histórico da bike</h2>
        {sessions.length === 0 ? <p className={mutedClass}>Nenhuma sessão registrada ainda. Comece preenchendo o formulário acima.</p> :
          <div className="space-y-2">{sessions.map((item) => <article key={item.id} className="rounded-lg border border-zinc-800 bg-zinc-900/60 p-3">
            <div className="flex flex-wrap items-start justify-between gap-2"><div><p className="font-bold text-white">{readableDate(item.date)} · {item.status === "completed" ? `${item.minutes} minutos` : "Não realizado"}</p>
              <p className="text-xs text-zinc-400">Semana {weekForDate(data.startedOn, item.date)} · FC média {numberText(item.averageBpm, " BPM")} · PSE {numberText(item.rpe)} · Fadiga {numberText(item.legFatigue)}</p>
              {item.symptoms && <p className="mt-1 text-xs font-bold text-rose-300">Sintomas incomuns registrados</p>}
              {item.notes && <p className="mt-1 text-sm text-zinc-300">{item.notes}</p>}</div>
              <div className="flex gap-2"><button type="button" className={buttonClass} onClick={() => editSession(item)}>Editar</button><button type="button" className={buttonClass} onClick={() => removeSession(item.id)}>Excluir</button></div>
            </div>
          </article>)}</div>}
      </section>

      <section id="bike-measures" className="space-y-4 rounded-xl border border-zinc-800 bg-zinc-900/30 p-4 scroll-mt-6">
        <h2 className="text-xl font-black text-white">Medidas e composição corporal</h2>
        <p className={mutedClass}>Registre peso, cintura, gordura estimada ou pressão arterial quando medidos. Não há necessidade de preencher campos desconhecidos. Valores de bioimpedância podem variar com hidratação e condições da medição.</p>
        <form className="space-y-3" onSubmit={saveMeasurement}>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {field("Data", measure.date, (v) => patchMeasure("date", v), { type: "date" })}
            {field("Peso (kg)", measure.weightKg, (v) => patchMeasure("weightKg", v), { type: "number", min: "20", max: "400", step: "0.1" })}
            {field("Gordura estimada (%)", measure.bodyFatPct, (v) => patchMeasure("bodyFatPct", v), { type: "number", min: "1", max: "75", step: "0.1" })}
            {field("Cintura (cm)", measure.waistCm, (v) => patchMeasure("waistCm", v), { type: "number", min: "30", max: "250", step: "0.1" })}
            {field("Pressão sistólica", measure.systolic, (v) => patchMeasure("systolic", v), { type: "number", min: "60", max: "260" })}
            {field("Pressão diastólica", measure.diastolic, (v) => patchMeasure("diastolic", v), { type: "number", min: "30", max: "160" })}
          </div>
          <label className="flex flex-col gap-1.5"><span className={labelClass}>Notas da medição</span><textarea className={fieldClass} rows={2} maxLength={500} value={measure.notes} onChange={(e) => patchMeasure("notes", e.target.value)} /></label>
          <div className="flex flex-wrap gap-2"><button type="submit" className="min-h-11 rounded-lg bg-red-600 px-4 text-sm font-bold text-white hover:bg-red-500">{editingMeasure ? "Atualizar medida" : "Salvar medida"}</button>
            {editingMeasure && <button type="button" className={buttonClass} onClick={() => { setEditingMeasure(null); setMeasure(blankMeasure()); }}>Cancelar edição</button>}</div>
        </form>
        <div className="space-y-2">{measurements.length === 0 ? <p className={mutedClass}>Sem medidas registradas.</p> : measurements.map((item) => <article key={item.id} className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-zinc-800 p-3">
          <div><p className="font-bold text-zinc-100">{readableDate(item.date)}</p><p className="text-sm text-zinc-400">Peso {numberText(item.weightKg, " kg")} · Gordura {numberText(item.bodyFatPct, "%")} · Cintura {numberText(item.waistCm, " cm")}</p><p className="text-xs text-zinc-500">PA {item.systolic !== null && item.diastolic !== null ? `${item.systolic}/${item.diastolic} mmHg` : "—"}</p>{item.notes && <p className="mt-1 text-sm text-zinc-400">{item.notes}</p>}</div>
          <div className="flex gap-2"><button className={buttonClass} type="button" onClick={() => editMeasurement(item)}>Editar</button><button className={buttonClass} type="button" onClick={() => removeMeasurement(item.id)}>Excluir</button></div>
        </article>)}</div>
      </section>

      <section className="space-y-3 rounded-xl border border-zinc-800 p-4">
        <h2 className="text-lg font-black text-white">Backup e privacidade</h2>
        <p className={mutedClass}>Quando você estiver logado, o módulo usa a mesma sincronização Supabase da conta BJJ. Espere o estado “Sincronizado” antes de abrir em outro dispositivo. Sem login, os dados ficam somente neste navegador. O backup JSON/CSV contém dados de saúde: guarde-o em local privado e não o publique no GitHub.</p>
        <div className="flex flex-wrap gap-2">
          <button type="button" className={buttonClass} onClick={() => download("bike-cardio-backup.json", JSON.stringify(data, null, 2), "application/json")}>Exportar backup JSON</button>
          <button type="button" className={buttonClass} onClick={() => download("bike-cardio-sessoes.csv", makeCsv(data), "text/csv;charset=utf-8")}>Exportar sessões CSV</button>
          <label className={`${buttonClass} inline-flex cursor-pointer items-center`}><span>{importing ? "Importando..." : "Importar backup JSON"}</span><input type="file" accept="application/json,.json" className="sr-only" disabled={importing} onChange={async (event) => { await importBackup(event.target.files?.[0]); event.target.value = ""; }} /></label>
        </div>
      </section>

      <p className="text-xs leading-5 text-zinc-500">Orientação educativa, não liberação médica. A pressão arterial e exames recentes devem ser revisados com o profissional que acompanha você antes de aumentar significativamente a intensidade. Interrompa a sessão se houver dor torácica, desmaio, tontura importante ou falta de ar desproporcional. Em caso de sintomas graves, procure atendimento de urgência.</p>
    </main>
  );
}
