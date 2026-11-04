import test from "node:test";
import assert from "node:assert/strict";
import "./setup-dom";
import { render, screen } from "@testing-library/react";
import { BikeCardioDashboard } from "../src/components/bike/BikeCardioDashboard";
import { BIKE_STORAGE_KEY } from "../src/lib/bike-cardio";

test("renderiza perfeitamente o dashboard com largura de iPhone (375px)", async () => {
  // Simula dimensões de tela do iPhone (375x667 ou 390x844)
  Object.defineProperty(window, "innerWidth", { writable: true, configurable: true, value: 375 });
  Object.defineProperty(window, "innerHeight", { writable: true, configurable: true, value: 812 });

  const initialData = {
    version: 1,
    startedOn: "2026-11-04",
    goalWeightKg: 97,
    sessions: [
      {
        id: "s-iphone",
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
        notes: "Teste iPhone",
        recordedAt: "2026-11-04T12:00:00Z",
      },
    ],
    measurements: [
      {
        id: "m-iphone",
        date: "2026-11-04",
        weightKg: 106.6,
        waistCm: null,
        bodyFatPct: 27.9,
        systolic: null,
        diastolic: null,
        notes: "Bioimpedância RelaxFit",
      },
    ],
  };

  localStorage.setItem(BIKE_STORAGE_KEY, JSON.stringify(initialData));

  render(<BikeCardioDashboard />);

  // Título e cabeçalhos após carregamento assíncrono
  assert.ok(await screen.findByText("Cardio na Bike"));
  assert.ok(screen.getByText("Programa exclusivo · bicicleta ergométrica"));

  // Resumo
  assert.ok(screen.getByText("Tempo acumulado"));
  assert.ok(screen.getByText("25 min"));
  assert.ok(screen.getByText("Último peso"));
  assert.ok(screen.getByText("106,6 kg"));

  // Semanas (1 a 6)
  assert.ok(screen.getByText("Sem. 1"));
  assert.ok(screen.getByText("Sem. 6"));

  // Estrutura do treino
  assert.ok(screen.getByText("Aquecimento"));
  assert.ok(screen.getByText("Parte principal"));
  assert.ok(screen.getByText("Desaquecimento"));

  // Formulário de registro
  assert.ok(screen.getByText("Registrar sessão"));
  assert.ok(screen.getByText("Salvar registro da bike"));

  // Histórico
  assert.ok(screen.getByText("Teste iPhone"));

  // Medidas
  assert.ok(screen.getByText("Bioimpedância RelaxFit"));

  // Backups
  assert.ok(screen.getByText("Exportar backup JSON"));
  assert.ok(screen.getByText("Exportar sessões CSV"));
  assert.ok(screen.getByText("Importar backup JSON"));
});
