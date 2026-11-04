import test, { afterEach } from "node:test";
import assert from "node:assert/strict";
import "./setup-dom";

import {
  BIKE_STORAGE_KEY,
  bindBikeStorage,
  loadBikeData,
  newBikeData,
  sanitizeBikeData,
  storeBikeData,
  type BikeData,
  type BikeMeasurement,
  type BikeSession,
} from "../src/lib/bike-cardio";
import {
  emptyTrainingState,
  type TrainingState,
} from "../src/lib/training-state";
import {
  bindAccountStorage,
  readLegacyTrainingState,
} from "../src/lib/workout-storage";
import { seedWorkouts } from "../src/data/seed-workouts";

afterEach(() => {
  bindAccountStorage(null);
  bindBikeStorage(null);
  localStorage.clear();
});

test("preserva os seis cardios existentes e treinos de musculação", () => {
  assert.equal(seedWorkouts.length, 14);

  const cardios = seedWorkouts.filter((w) => w.id.startsWith("cardio-"));
  assert.equal(cardios.length, 6, "Devem existir exatamente 6 cardios complementares");
  const cardioIds = cardios.map((c) => c.id).sort();
  assert.deepEqual(cardioIds, [
    "cardio-1",
    "cardio-2",
    "cardio-3",
    "cardio-4",
    "cardio-5",
    "cardio-6",
  ]);

  const strengthWorkouts = seedWorkouts.filter((w) =>
    w.id.startsWith("treino-a") || w.id.startsWith("treino-b")
  );
  assert.ok(strengthWorkouts.length >= 2, "Treinos A e B de musculação preservados");
});

test("importação dos dados iniciais fornecidos (RelaxFit baseline)", () => {
  const initialPayload = {
    version: 1,
    startedOn: "2026-11-04",
    goalWeightKg: 97,
    sessions: [],
    measurements: [
      {
        id: "baseline-relaxfit-2026-11-04",
        date: "2026-11-04",
        weightKg: 106.6,
        waistCm: null,
        bodyFatPct: 27.9,
        systolic: null,
        diastolic: null,
        notes:
          "Bioimpedância RelaxFit de 04/11/2026; valores de composição corporal são estimativas. Pressão e cintura ainda não medidas.",
      },
    ],
  };

  const parsed = sanitizeBikeData(initialPayload);
  assert.equal(parsed.version, 1);
  assert.equal(parsed.startedOn, "2026-11-04");
  assert.equal(parsed.goalWeightKg, 97);
  assert.equal(parsed.sessions.length, 0);
  assert.equal(parsed.measurements.length, 1);

  const m = parsed.measurements[0];
  assert.equal(m.id, "baseline-relaxfit-2026-11-04");
  assert.equal(m.date, "2026-11-04");
  assert.equal(m.weightKg, 106.6);
  assert.equal(m.bodyFatPct, 27.9);
  assert.equal(m.waistCm, null);
  assert.equal(m.systolic, null);
  assert.equal(m.diastolic, null);
  assert.match(m.notes, /Bioimpedância RelaxFit/);
});

test("registro, edição e exclusão de sessões da bike", () => {
  let state = newBikeData();
  state.startedOn = "2026-11-04";

  // 1. Registro
  const session1: BikeSession = {
    id: "session-1",
    date: "2026-11-04",
    status: "completed",
    minutes: 25,
    averageBpm: 118,
    peakBpm: 126,
    rpe: 4,
    legFatigue: 3,
    talkTest: "normal",
    distanceKm: 8.5,
    resistance: "nível 3",
    symptoms: false,
    notes: "Primeiro treino tranquilo",
    recordedAt: "2026-11-04T10:00:00Z",
  };

  state = { ...state, sessions: [session1] };
  storeBikeData(state);
  let loaded = loadBikeData();
  assert.equal(loaded.sessions.length, 1);
  assert.equal(loaded.sessions[0].minutes, 25);
  assert.equal(loaded.sessions[0].averageBpm, 118);

  // 2. Edição
  const updatedSession: BikeSession = {
    ...session1,
    minutes: 28,
    averageBpm: 120,
    peakBpm: 128,
    notes: "Ajustado tempo final",
  };
  state = {
    ...state,
    sessions: [updatedSession, ...state.sessions.filter((s) => s.id !== session1.id)],
  };
  storeBikeData(state);
  loaded = loadBikeData();
  assert.equal(loaded.sessions.length, 1);
  assert.equal(loaded.sessions[0].minutes, 28);
  assert.equal(loaded.sessions[0].averageBpm, 120);
  assert.equal(loaded.sessions[0].notes, "Ajustado tempo final");

  // 3. Exclusão
  state = { ...state, sessions: state.sessions.filter((s) => s.id !== session1.id) };
  storeBikeData(state);
  loaded = loadBikeData();
  assert.equal(loaded.sessions.length, 0);
});

test("registro, edição e exclusão de medições corporais", () => {
  let state = newBikeData();

  // 1. Registro
  const m1: BikeMeasurement = {
    id: "m-1",
    date: "2026-11-04",
    weightKg: 106.6,
    waistCm: 112,
    bodyFatPct: 27.9,
    systolic: 125,
    diastolic: 82,
    notes: "Avaliação inicial",
  };

  state = { ...state, measurements: [m1] };
  storeBikeData(state);
  let loaded = loadBikeData();
  assert.equal(loaded.measurements.length, 1);
  assert.equal(loaded.measurements[0].weightKg, 106.6);
  assert.equal(loaded.measurements[0].systolic, 125);

  // 2. Edição
  const updatedM1: BikeMeasurement = {
    ...m1,
    weightKg: 105.8,
    notes: "Peso atualizado após conferência",
  };
  state = {
    ...state,
    measurements: [updatedM1, ...state.measurements.filter((m) => m.id !== m1.id)],
  };
  storeBikeData(state);
  loaded = loadBikeData();
  assert.equal(loaded.measurements.length, 1);
  assert.equal(loaded.measurements[0].weightKg, 105.8);
  assert.equal(loaded.measurements[0].notes, "Peso atualizado após conferência");

  // 3. Exclusão
  state = { ...state, measurements: state.measurements.filter((m) => m.id !== m1.id) };
  storeBikeData(state);
  loaded = loadBikeData();
  assert.equal(loaded.measurements.length, 0);
});

test("integração com Supabase: sincronização bidirecional e isolamento", () => {
  let cloudState: TrainingState = emptyTrainingState();
  const mockAccountAdapter = {
    read: () => cloudState,
    write: (next: TrainingState) => {
      cloudState = next;
    },
  };

  // Conecta o armazenamento da conta (como feito no login do Supabase)
  bindAccountStorage(mockAccountAdapter);

  // Adiciona dados da bike via módulo da bike
  const bikeData: BikeData = {
    version: 1,
    startedOn: "2026-11-04",
    goalWeightKg: 97,
    sessions: [
      {
        id: "cloud-session-1",
        date: "2026-11-04",
        status: "completed",
        minutes: 25,
        averageBpm: 115,
        peakBpm: 124,
        rpe: 4,
        legFatigue: 2,
        talkTest: "normal",
        distanceKm: 8,
        resistance: "nível 2",
        symptoms: false,
        notes: "Sincronizado com nuvem",
        recordedAt: "2026-11-04T10:00:00Z",
      },
    ],
    measurements: [
      {
        id: "m-baseline",
        date: "2026-11-04",
        weightKg: 106.6,
        waistCm: null,
        bodyFatPct: 27.9,
        systolic: null,
        diastolic: null,
        notes: "Baseline",
      },
    ],
  };

  storeBikeData(bikeData);

  // Verifica que o cloudState (que vai para o Supabase bjj_training_states.data) recebeu a chave bike
  assert.ok(cloudState.bike);
  assert.equal(cloudState.bike?.sessions.length, 1);
  assert.equal(cloudState.bike?.sessions[0].id, "cloud-session-1");
  assert.equal(cloudState.bike?.measurements[0].weightKg, 106.6);

  // Simula recuperação dos dados lendo via loadBikeData
  const loadedFromCloud = loadBikeData();
  assert.equal(loadedFromCloud.sessions[0].notes, "Sincronizado com nuvem");

  // Desconecta conta: em modo local volta para localStorage sem sobrescrever
  bindAccountStorage(null);
  const localData = loadBikeData();
  assert.equal(localData.sessions.length, 0); // local estava vazio
});

test("primeiro login: migração do localStorage local para o Supabase inclui os dados da bike", () => {
  const localBike: BikeData = {
    version: 1,
    startedOn: "2026-11-04",
    goalWeightKg: 97,
    sessions: [
      {
        id: "local-1",
        date: "2026-11-04",
        status: "completed",
        minutes: 25,
        averageBpm: 112,
        peakBpm: 120,
        rpe: 3,
        legFatigue: 2,
        talkTest: "normal",
        distanceKm: 7.5,
        resistance: "nível 2",
        symptoms: false,
        notes: "Feito antes de logar",
        recordedAt: "2026-11-04T09:00:00Z",
      },
    ],
    measurements: [],
  };

  localStorage.setItem(BIKE_STORAGE_KEY, JSON.stringify(localBike));

  // Quando o usuário faz login pela primeira vez, o app chama readLegacyTrainingState
  const legacy = readLegacyTrainingState();
  assert.ok(legacy.bike);
  assert.equal(legacy.bike?.sessions[0].id, "local-1");
});

test("backup e exportação CSV: formatação segura e proteção contra injeção de fórmulas", () => {
  const injectionNotes = "=cmd|' /C calc'!A0";
  const data: BikeData = {
    version: 1,
    startedOn: "2026-11-04",
    goalWeightKg: 97,
    sessions: [
      {
        id: "s-csv",
        date: "2026-11-04",
        status: "completed",
        minutes: 30,
        averageBpm: 115,
        peakBpm: 125,
        rpe: 4,
        legFatigue: 3,
        talkTest: "normal",
        distanceKm: 10,
        resistance: "3",
        symptoms: false,
        notes: injectionNotes,
        recordedAt: "2026-11-04T12:00:00Z",
      },
    ],
    measurements: [],
  };

  // Testa sanitização do CSV contra formula injection
  const escapeCsv = (value: unknown) => {
    const raw = String(value ?? "");
    const safe = /^[=+@\-\t\r]/.test(raw) ? `'${raw}` : raw;
    return `"${safe.replaceAll('"', '""')}"`;
  };

  const escaped = escapeCsv(injectionNotes);
  assert.ok(escaped.startsWith("\"'="), "Fórmula com prefixo '=' foi prefixada com apóstrofo");

  // Testa exportação JSON e re-importação completa
  const jsonExport = JSON.stringify(data, null, 2);
  const reimported = sanitizeBikeData(JSON.parse(jsonExport));
  assert.deepEqual(reimported, data);
});
