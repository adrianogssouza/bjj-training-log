"use client";

import { useState, type FormEvent } from "react";
import {
  localDate,
  type BikeStatus,
  type TalkTest,
} from "@/lib/bike-cardio";

export type SessionFormData = {
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

export function blankSessionForm(minutes = 25): SessionFormData {
  return {
    date: localDate(),
    status: "completed",
    minutes: String(minutes),
    averageBpm: "",
    peakBpm: "",
    rpe: "4",
    legFatigue: "",
    talkTest: "normal",
    distanceKm: "",
    resistance: "",
    symptoms: false,
    notes: "",
  };
}

type BikeSessionFormProps = {
  form: SessionFormData;
  editingId: string | null;
  onChange: <K extends keyof SessionFormData>(key: K, value: SessionFormData[K]) => void;
  onSubmit: (e: FormEvent<HTMLFormElement>) => void;
  onCancelEdit: () => void;
};

const fieldClass =
  "min-h-11 w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-base text-zinc-100 outline-none focus:border-red-400";
const labelClass = "block text-xs font-semibold text-zinc-300";
const mutedClass = "text-xs text-zinc-400";

export function BikeSessionForm({
  form,
  editingId,
  onChange,
  onSubmit,
  onCancelEdit,
}: BikeSessionFormProps) {
  const [showAdditional, setShowAdditional] = useState(false);

  return (
    <section
      id="bike-session-form"
      className="space-y-4 rounded-2xl border border-zinc-800 bg-zinc-900/40 p-4 sm:p-5 scroll-mt-6"
    >
      <div className="flex items-center justify-between gap-2 border-b border-zinc-800 pb-3">
        <div>
          <h2 className="text-xl font-black text-white">
            {editingId ? "Editar sessão" : "Registro de Sessão"}
          </h2>
          <p className={mutedClass}>
            {editingId
              ? "Atualize as informações desejadas e salve."
              : "Registro rápido e prático. Preencha apenas o que mediu."}
          </p>
        </div>
        {editingId && (
          <button
            type="button"
            onClick={onCancelEdit}
            className="min-h-10 rounded-lg border border-zinc-700 bg-zinc-900 px-3 text-xs font-bold text-zinc-300 hover:border-zinc-500"
          >
            Cancelar edição
          </button>
        )}
      </div>

      <form className="space-y-4" onSubmit={onSubmit}>
        {/* ===================== NÍVEL 1: REGISTRO RÁPIDO ===================== */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <span className="rounded bg-red-600/30 px-2 py-0.5 text-[11px] font-bold text-red-200 border border-red-500/30">
              Nível 1
            </span>
            <p className="text-xs font-bold uppercase tracking-wider text-zinc-200">
              Registro Rápido
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <label className="flex flex-col gap-1.5">
              <span className={labelClass}>Data do treino</span>
              <input
                type="date"
                className={fieldClass}
                value={form.date}
                onChange={(e) => onChange("date", e.target.value)}
              />
            </label>

            <label className="flex flex-col gap-1.5">
              <span className={labelClass}>Situação</span>
              <select
                className={fieldClass}
                value={form.status}
                onChange={(e) => onChange("status", e.target.value as BikeStatus)}
              >
                <option value="completed">Realizado</option>
                <option value="skipped">Não realizado / Pulado</option>
              </select>
            </label>
          </div>

          {form.status === "completed" && (
            <>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                <label className="flex flex-col gap-1.5">
                  <span className={labelClass}>Duração (minutos) *</span>
                  <input
                    type="number"
                    min="1"
                    max="240"
                    step="1"
                    className={fieldClass}
                    value={form.minutes}
                    onChange={(e) => onChange("minutes", e.target.value)}
                    placeholder="Ex.: 25"
                    required
                  />
                </label>

                <label className="flex flex-col gap-1.5">
                  <span className={labelClass}>FC média BPM (opcional)</span>
                  <input
                    type="number"
                    min="30"
                    max="240"
                    className={fieldClass}
                    value={form.averageBpm}
                    onChange={(e) => onChange("averageBpm", e.target.value)}
                    placeholder="Ex.: 118"
                  />
                </label>

                <label className="flex flex-col gap-1.5">
                  <span className={labelClass}>FC pico BPM (opcional)</span>
                  <input
                    type="number"
                    min="30"
                    max="260"
                    className={fieldClass}
                    value={form.peakBpm}
                    onChange={(e) => onChange("peakBpm", e.target.value)}
                    placeholder="Ex.: 126"
                  />
                </label>
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                <label className="flex flex-col gap-1.5">
                  <span className={labelClass}>Esforço percebido PSE (0–10)</span>
                  <select
                    className={fieldClass}
                    value={form.rpe}
                    onChange={(e) => onChange("rpe", e.target.value)}
                  >
                    <option value="">Não informado</option>
                    <option value="1">1 - Muito muito leve</option>
                    <option value="2">2 - Muito leve</option>
                    <option value="3">3 - Leve / Fácil</option>
                    <option value="4">4 - Moderado (Zona alvo)</option>
                    <option value="5">5 - Um pouco difícil</option>
                    <option value="6">6 - Difícil</option>
                    <option value="7">7 - Muito difícil</option>
                    <option value="8">8 - Extremamente difícil</option>
                    <option value="9">9 - Quase exaustão</option>
                    <option value="10">10 - Esforço máximo</option>
                  </select>
                </label>

                <label className="flex flex-col gap-1.5">
                  <span className={labelClass}>Fadiga nas pernas (0–10)</span>
                  <select
                    className={fieldClass}
                    value={form.legFatigue}
                    onChange={(e) => onChange("legFatigue", e.target.value)}
                  >
                    <option value="">Não avaliado</option>
                    <option value="0">0 - Pernas leves e descansadas</option>
                    <option value="1">1 - Sem cansaço perceptível</option>
                    <option value="2">2 - Fadiga muito baixa</option>
                    <option value="3">3 - Cansaço leve</option>
                    <option value="4">4 - Cansaço moderado</option>
                    <option value="5">5 - Pernas sentindo o pedal</option>
                    <option value="6">6 - Fadiga considerável</option>
                    <option value="7">7 - Pernas pesadas (alerta p/ musculação)</option>
                    <option value="8">8 - Fadiga muito alta</option>
                    <option value="9">9 - Queimação intensa</option>
                    <option value="10">10 - Exaustão muscular local</option>
                  </select>
                </label>

                <label className="flex flex-col gap-1.5">
                  <span className={labelClass}>Teste da fala</span>
                  <select
                    className={fieldClass}
                    value={form.talkTest}
                    onChange={(e) => onChange("talkTest", e.target.value as TalkTest)}
                  >
                    <option value="normal">Normal: frases completas</option>
                    <option value="frases">Frases curtas / ofegante</option>
                    <option value="dificil">Difícil conversar</option>
                    <option value="nao-avaliado">Não avaliado</option>
                  </select>
                </label>
              </div>
            </>
          )}
        </div>

        {/* ===================== NÍVEL 2: INFORMAÇÕES ADICIONAIS EXPANSÍVEIS ===================== */}
        <div className="rounded-xl border border-zinc-800 bg-zinc-950/60 p-3.5">
          <button
            type="button"
            onClick={() => setShowAdditional((prev) => !prev)}
            className="flex w-full items-center justify-between text-left text-xs font-bold text-zinc-300 hover:text-white"
          >
            <div className="flex items-center gap-2">
              <span className="rounded bg-zinc-800 px-2 py-0.5 text-[11px] font-semibold text-zinc-400">
                Nível 2
              </span>
              <span>Informações Adicionais (opcionais)</span>
            </div>
            <span>{showAdditional ? "▲ Recolher" : "▼ Expandir (distância, carga, sintomas, notas)"}</span>
          </button>

          {showAdditional && (
            <div className="mt-3.5 space-y-3.5 border-t border-zinc-800 pt-3">
              {form.status === "completed" && (
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <label className="flex flex-col gap-1.5">
                    <span className={labelClass}>Distância percorrida (km)</span>
                    <input
                      type="number"
                      min="0"
                      max="200"
                      step="0.1"
                      className={fieldClass}
                      value={form.distanceKm}
                      onChange={(e) => onChange("distanceKm", e.target.value)}
                      placeholder="Ex.: 8.5"
                    />
                  </label>

                  <label className="flex flex-col gap-1.5">
                    <span className={labelClass}>Resistência / marcha da bike</span>
                    <input
                      type="text"
                      maxLength={80}
                      className={fieldClass}
                      value={form.resistance}
                      onChange={(e) => onChange("resistance", e.target.value)}
                      placeholder="Ex.: nível 3 ou carga média"
                    />
                  </label>
                </div>
              )}

              <label className="flex items-start gap-3 rounded-lg border border-red-900/40 bg-red-950/20 p-3 text-xs text-red-200">
                <input
                  type="checkbox"
                  className="mt-0.5 size-4 accent-red-500"
                  checked={form.symptoms}
                  onChange={(e) => onChange("symptoms", e.target.checked)}
                />
                <span>
                  <strong>Houve sintoma incomum:</strong> dor ou aperto no peito, tontura intensa, palpitações fortes com mal-estar ou falta de ar desproporcional. (Interrompa o exercício e procure atendimento).
                </span>
              </label>

              <label className="flex flex-col gap-1.5">
                <span className={labelClass}>
                  {form.status === "skipped"
                    ? "Motivo de não realização / Observações"
                    : "Observações da sessão"}
                </span>
                <textarea
                  className={`${fieldClass} min-h-20`}
                  rows={2}
                  maxLength={500}
                  value={form.notes}
                  onChange={(e) => onChange("notes", e.target.value)}
                  placeholder={
                    form.status === "skipped"
                      ? "Ex.: cansaço da musculação, dor muscular, prioridade do Jiu-Jitsu, imprevisto do dia."
                      : "Ex.: sono, recuperação muscular, ajuste de cadência, sensação geral."
                  }
                />
              </label>
            </div>
          )}
        </div>

        {/* Botão de Envio com Touch Target Amplo */}
        <button
          type="submit"
          className="min-h-12 w-full rounded-xl bg-red-600 px-5 py-3 text-base font-black text-white shadow-lg transition hover:bg-red-500 active:scale-[0.98]"
        >
          {editingId ? "Salvar alterações da sessão" : "Salvar treino"}
        </button>
      </form>
    </section>
  );
}
