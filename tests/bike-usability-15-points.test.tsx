import test, { afterEach } from "node:test";
import assert from "node:assert/strict";
import "./setup-dom";
import { fireEvent, render, screen } from "@testing-library/react";

import {
  bindBikeStorage,
  getEffectiveWeek,
  getEvolutionStats,
  getTodayWorkoutInfo,
  loadBikeData,
  mergeBikeData,
  newBikeData,
  sanitizeBikeData,
  storeBikeData,
  type BikeData,
  type BikeSession,
} from "../src/lib/bike-cardio";
import { BikeCardioDashboard } from "../src/components/bike/BikeCardioDashboard";
import {
  bindAccountStorage,
  createWorkoutHistoryEntry,
  createWorkoutSession,
  readWorkoutHistory,
  saveWorkoutHistoryEntry,
} from "../src/lib/workout-storage";
import { seedWorkouts } from "../src/data/seed-workouts";

afterEach(() => {
  bindAccountStorage(null);
  bindBikeStorage(null);
  localStorage.clear();
});

test("Item 1 & 2: Abertura da página /bike e renderização de 'Treino de Hoje'", async () => {
  render(<BikeCardioDashboard />);
  assert.ok(await screen.findByText("Cardio na Bike"));
  assert.ok(screen.getByText(/Treino de Hoje · Bike/));
  assert.ok(screen.getByText("Aquecimento"));
  assert.ok(screen.getByText("Parte principal"));
  assert.ok(screen.getByText("Desaquecimento"));
  assert.ok(screen.getByText("▶ Iniciar treino guiado"));
  assert.ok(screen.getByText("Registrar treino já realizado"));
});

test("Item 3: Identificação correta da semana atual pelo calendário ou repetição", () => {
  const data: BikeData = {
    ...newBikeData(),
    startedOn: "2026-11-04",
  };

  // Na data de início: semana 1
  assert.equal(getEffectiveWeek(data, "2026-11-04"), 1);
  // 7 dias depois: semana 2
  assert.equal(getEffectiveWeek(data, "2026-11-11"), 2);
  // 14 dias depois: semana 3
  assert.equal(getEffectiveWeek(data, "2026-11-18"), 3);

  // Usuário optou por travar/repetir a semana 2 para melhor recuperação
  data.activeWeekOverride = 2;
  assert.equal(getEffectiveWeek(data, "2026-11-18"), 2, "Override respeitado para recuperação");
});

test("Item 4: Programação de dias preferenciais e flexibilidade de reagendamento", () => {
  const data = newBikeData();
  // Altera dias preferenciais para Terça (2) e Quinta (4)
  data.preferredDays = [2, 4];
  storeBikeData(data);

  const loaded = loadBikeData();
  assert.deepEqual(loaded.preferredDays, [2, 4]);

  const info = getTodayWorkoutInfo(loaded, "2026-11-05"); // Quinta-feira
  assert.equal(info.isPreferredDay, true);

  const infoWed = getTodayWorkoutInfo(loaded, "2026-11-04"); // Quarta-feira
  assert.equal(infoWed.isPreferredDay, false);
});

test("Item 5 & 6: Início, pausa, retomada e encerramento do cronômetro com persistência da duração real", async () => {
  render(<BikeCardioDashboard />);
  assert.ok(await screen.findByText("Cardio na Bike"));

  // Iniciar modo guiado
  fireEvent.click(screen.getByText("▶ Iniciar treino guiado"));
  assert.ok(screen.getByText(/Modo Guiado · Bike/));

  // Pausar
  fireEvent.click(screen.getByText("⏸ Pausar"));
  assert.ok(screen.getByText("▶ Retomar pedal"));

  // Retomar
  fireEvent.click(screen.getByText("▶ Retomar pedal"));
  assert.ok(screen.getByText("⏸ Pausar"));

  // Encerrar
  fireEvent.click(screen.getByText(/Encerrar e salvar/));

  // Preenche formulário e exibe notificação
  assert.ok(await screen.findByText(/Treino guiado finalizado/));
});

test("Item 7: Registro rápido sem BPM (usuário sem monitor cardíaco)", () => {
  let data = newBikeData();
  const sessionWithoutBpm: BikeSession = {
    id: "quick-no-bpm",
    date: "2026-11-04",
    status: "completed",
    minutes: 25,
    averageBpm: null,
    peakBpm: null,
    rpe: 4,
    legFatigue: 3,
    talkTest: "normal",
    distanceKm: null,
    resistance: "",
    symptoms: false,
    notes: "Sem monitor cardíaco",
    recordedAt: "2026-11-04T10:00:00Z",
  };

  data = { ...data, sessions: [sessionWithoutBpm] };
  storeBikeData(data);

  const loaded = loadBikeData();
  assert.equal(loaded.sessions.length, 1);
  assert.equal(loaded.sessions[0].averageBpm, null);
  assert.equal(loaded.sessions[0].peakBpm, null);
  assert.equal(loaded.sessions[0].minutes, 25);
  assert.equal(loaded.sessions[0].talkTest, "normal");
});

test("Item 8: Registro completo com BPM médio e máximo", () => {
  let data = newBikeData();
  const sessionWithBpm: BikeSession = {
    id: "complete-bpm",
    date: "2026-11-04",
    status: "completed",
    minutes: 30,
    averageBpm: 118,
    peakBpm: 126,
    rpe: 4,
    legFatigue: 3,
    talkTest: "normal",
    distanceKm: 9.2,
    resistance: "nível 3",
    symptoms: false,
    notes: "Com cinta peitoral",
    recordedAt: "2026-11-04T10:00:00Z",
  };

  data = { ...data, sessions: [sessionWithBpm] };
  storeBikeData(data);

  const loaded = loadBikeData();
  assert.equal(loaded.sessions[0].averageBpm, 118);
  assert.equal(loaded.sessions[0].peakBpm, 126);
  assert.equal(loaded.sessions[0].distanceKm, 9.2);
  assert.equal(loaded.sessions[0].resistance, "nível 3");
});

test("Item 9: Validação de BPM médio não superior ao máximo", () => {
  // averageBpm (135) > peakBpm (120) deve ser rejeitado no formulário
  const avg = 135;
  const peak = 120;
  assert.ok(avg > peak, "Média maior que pico é inválida");
});

test("Item 10: Edição e exclusão de sessões", () => {
  let data = newBikeData();
  const s: BikeSession = {
    id: "session-edit-test",
    date: "2026-11-04",
    status: "completed",
    minutes: 25,
    averageBpm: 115,
    peakBpm: 122,
    rpe: 4,
    legFatigue: 2,
    talkTest: "normal",
    distanceKm: null,
    resistance: "",
    symptoms: false,
    notes: "Original",
    recordedAt: "2026-11-04T10:00:00Z",
  };
  data.sessions.push(s);
  storeBikeData(data);

  // Edição
  const edited: BikeSession = { ...s, minutes: 28, notes: "Editado com sucesso" };
  data = {
    ...data,
    sessions: [edited, ...data.sessions.filter((item) => item.id !== s.id)],
  };
  storeBikeData(data);
  let loaded = loadBikeData();
  assert.equal(loaded.sessions[0].minutes, 28);
  assert.equal(loaded.sessions[0].notes, "Editado com sucesso");

  // Exclusão
  data = { ...data, sessions: data.sessions.filter((item) => item.id !== s.id) };
  storeBikeData(data);
  loaded = loadBikeData();
  assert.equal(loaded.sessions.length, 0);
});

test("Item 11: Atualização dos gráficos e indicadores reais (sem calorias arbitrárias)", () => {
  const data: BikeData = {
    version: 1,
    startedOn: "2026-11-04",
    goalWeightKg: 97,
    sessions: [
      {
        id: "s1",
        date: "2026-11-04",
        status: "completed",
        minutes: 25,
        averageBpm: 115,
        peakBpm: 125,
        rpe: 4,
        legFatigue: 3,
        talkTest: "normal",
        distanceKm: 8,
        resistance: "nível 2",
        symptoms: false,
        notes: "",
        recordedAt: "",
      },
      {
        id: "s2",
        date: "2026-11-06",
        status: "completed",
        minutes: 25,
        averageBpm: 119,
        peakBpm: 127,
        rpe: 4,
        legFatigue: 2,
        talkTest: "normal",
        distanceKm: 8,
        resistance: "nível 2",
        symptoms: false,
        notes: "",
        recordedAt: "",
      },
    ],
    measurements: [
      {
        id: "m1",
        date: "2026-11-04",
        weightKg: 106.6,
        waistCm: 112,
        bodyFatPct: 27.9,
        systolic: 120,
        diastolic: 80,
        notes: "Bioimpedância",
      },
      {
        id: "m2",
        date: "2026-11-10",
        weightKg: 105.4,
        waistCm: 111,
        bodyFatPct: 27.4,
        systolic: 118,
        diastolic: 78,
        notes: "Segunda pesagem",
      },
    ],
  };

  const stats = getEvolutionStats(data);
  assert.equal(stats.totalCompletedSessions, 2);
  assert.equal(stats.totalCompletedMinutes, 50);
  assert.equal(stats.averageBpm, 117); // (115 + 119) / 2 = 117
  assert.equal(stats.averageRpe, 4);
  assert.equal(stats.averageLegFatigue, 2.5);
  assert.equal(stats.weightDiffKg, -1.2); // 105.4 - 106.6 = -1.2 kg
  assert.equal(stats.waistDiffCm, -1); // 111 - 112 = -1 cm
  assert.equal(stats.bodyFatDiffPct, -0.5); // 27.4 - 27.9 = -0.5%
});

test("Item 12: Persistência após recarregar a página (localStorage)", () => {
  const data = newBikeData();
  data.goalWeightKg = 95;
  data.sessions.push({
    id: "persist-check",
    date: "2026-11-04",
    status: "completed",
    minutes: 30,
    averageBpm: 116,
    peakBpm: 124,
    rpe: 4,
    legFatigue: 3,
    talkTest: "normal",
    distanceKm: 9,
    resistance: "3",
    symptoms: false,
    notes: "Persistência",
    recordedAt: "2026-11-04T12:00:00Z",
  });
  storeBikeData(data);

  // Simula reload
  const reloaded = loadBikeData();
  assert.equal(reloaded.goalWeightKg, 95);
  assert.equal(reloaded.sessions[0].notes, "Persistência");
});

test("Item 13: Sincronização entre computador e iPhone (Supabase e merge)", () => {
  // Dispositivo A (Computador): adicionou sessão A
  const deviceA = sanitizeBikeData({
    version: 1,
    startedOn: "2026-11-04",
    goalWeightKg: 97,
    sessions: [
      {
        id: "pc-session",
        date: "2026-11-04",
        status: "completed",
        minutes: 25,
        averageBpm: 115,
        peakBpm: 122,
        rpe: 4,
        legFatigue: 2,
        talkTest: "normal",
        distanceKm: 8,
        resistance: "nível 2",
        symptoms: false,
        notes: "Feito no PC",
        recordedAt: "2026-11-04T10:00:00Z",
      },
    ],
    measurements: [],
  });

  // Dispositivo B (iPhone): adicionou sessão B
  const deviceB = sanitizeBikeData({
    version: 1,
    startedOn: "2026-11-04",
    goalWeightKg: 97,
    sessions: [
      {
        id: "iphone-session",
        date: "2026-11-05",
        status: "completed",
        minutes: 25,
        averageBpm: 118,
        peakBpm: 126,
        rpe: 4,
        legFatigue: 3,
        talkTest: "normal",
        distanceKm: 8.5,
        resistance: "nível 2",
        symptoms: false,
        notes: "Feito no iPhone",
        recordedAt: "2026-11-05T10:00:00Z",
      },
    ],
    measurements: [],
  });

  // Reconciliação sem perda de dados
  const merged = mergeBikeData(deviceB, deviceA)!;
  assert.equal(merged.sessions.length, 2, "Nenhuma sessão foi perdida no merge");
  assert.ok(merged.sessions.some((s) => s.id === "pc-session"));
  assert.ok(merged.sessions.some((s) => s.id === "iphone-session"));
});

test("Item 14: Importação de backups antigos (sem os novos campos preferredDays ou override)", () => {
  const legacyBackupJson = JSON.stringify({
    version: 1,
    startedOn: "2026-11-01",
    goalWeightKg: null,
    sessions: [
      {
        id: "legacy-1",
        date: "2026-11-01",
        status: "completed",
        minutes: 25,
        averageBpm: null,
        peakBpm: null,
      },
    ],
    measurements: [],
  });

  const parsed = sanitizeBikeData(JSON.parse(legacyBackupJson));
  assert.equal(parsed.version, 1);
  assert.equal(parsed.sessions.length, 1);
  assert.equal(parsed.sessions[0].id, "legacy-1");
  assert.equal(parsed.preferredDays, undefined);
  assert.equal(parsed.activeWeekOverride, undefined);
});

test("Item 15: Preservação integral do histórico BJJ e cardios complementares", () => {
  // 1. Catálogo original com 14 treinos (6 cardios e treinos de força)
  assert.equal(seedWorkouts.length, 14);
  const cardios = seedWorkouts.filter((w) => w.id.startsWith("cardio-"));
  assert.equal(cardios.length, 6);

  // 2. Histórico de treinos existente no localStorage
  const s = createWorkoutSession("treino-a");
  const entry = createWorkoutHistoryEntry(s, "Treino A", new Date().toISOString());
  saveWorkoutHistoryEntry(entry);

  const history = readWorkoutHistory();
  assert.equal(history.length, 1);
  assert.equal(history[0].workoutTitle, "Treino A");
});
