import test from "node:test";
import assert from "node:assert/strict";
import "./setup-dom";
import { fireEvent, render, screen } from "@testing-library/react";
import { BikeCardioDashboard } from "../src/components/bike/BikeCardioDashboard";
import { BIKE_STORAGE_KEY } from "../src/lib/bike-cardio";

test("renderiza perfeitamente o dashboard com largura de iPhone (375px) e navegação por abas", async () => {
  // Simula dimensões de tela do iPhone (375x812)
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

  // Resumo de topo
  assert.ok(screen.getByText("Tempo acumulado"));
  assert.ok(screen.getByText("25 min"));
  assert.ok(screen.getByText("Último peso"));
  assert.ok(screen.getByText("106,6 kg"));

  // Aba 'Hoje': Destaque de Treino de Hoje e estrutura da sessão
  assert.ok(screen.getByText(/Treino de Hoje · Bike/));
  assert.ok(screen.getByText("Aquecimento"));
  assert.ok(screen.getByText("Parte principal"));
  assert.ok(screen.getByText("Desaquecimento"));
  assert.ok(screen.getByText("▶ Iniciar treino guiado"));
  assert.ok(screen.getByText("Registrar treino já realizado"));

  // Formulário de Registro Rápido
  assert.ok(screen.getByText("Registro Rápido"));
  assert.ok(screen.getByText("Salvar treino"));

  // Testar início do modo guiado
  fireEvent.click(screen.getByText("▶ Iniciar treino guiado"));
  assert.ok(screen.getByText(/Modo Guiado · Bike/));
  assert.ok(screen.getByText("Etapa Atual:"));
  assert.ok(screen.getByText("⏸ Pausar"));

  // Pausar e retomar no cronômetro
  fireEvent.click(screen.getByText("⏸ Pausar"));
  assert.ok(screen.getByText("▶ Retomar pedal"));
  fireEvent.click(screen.getByText("▶ Retomar pedal"));

  // Encerrar o treino guiado
  fireEvent.click(screen.getByText(/Encerrar e salvar/));
  // Volta para a tela de registro com a notificação
  assert.ok(await screen.findByText(/Treino guiado finalizado/));

  // Navegar para aba 'Plano 6 Sem.'
  fireEvent.click(screen.getByText("Plano 6 Sem."));
  assert.ok(screen.getByText("Sem. 1"));
  assert.ok(screen.getByText("Sem. 6"));

  // Navegar para aba 'Evolução'
  fireEvent.click(screen.getByText("Evolução"));
  assert.ok(screen.getByText("Evolução do Volume Semanal"));
  assert.ok(screen.getByText("Indicadores Gerais"));

  // Navegar para aba 'Histórico'
  fireEvent.click(screen.getByText("Histórico (1)"));
  assert.ok(screen.getByText("Teste iPhone"));

  // Navegar para aba 'Medidas'
  fireEvent.click(screen.getByText("Medidas"));
  assert.ok(screen.getByText("Bioimpedância RelaxFit"));

  // Navegar para aba 'Dicas'
  fireEvent.click(screen.getByText("Dicas"));
  assert.ok(screen.getByText("1. Como ajustar a intensidade da bicicleta"));

  // Navegar para aba 'Backup'
  fireEvent.click(screen.getByText("Backup"));
  assert.ok(screen.getByText("Exportar backup JSON"));
  assert.ok(screen.getByText("Exportar sessões CSV"));
  assert.ok(screen.getByText("Importar backup JSON"));
});
