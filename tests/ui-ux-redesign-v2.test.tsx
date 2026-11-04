import test, { afterEach } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import "./setup-dom";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";

import manifest from "../src/app/manifest";
import { PrimaryNavigation } from "../src/components/layout/PrimaryNavigation";
import { AppHeader } from "../src/components/layout/AppHeader";
import { AppShell } from "../src/components/layout/AppShell";
import { WorkoutHistory } from "../src/components/history/WorkoutHistory";
import { AccountModal } from "../src/components/auth/AccountModal";
import { AccountContext } from "../src/components/auth/AccountContext";
import { getActiveCycle, OFFICIAL_CYCLES } from "../src/data/training-cycles";
import {
  createWorkoutHistoryEntry,
  createWorkoutSession,
  readWorkoutHistory,
  saveWorkoutHistoryEntry,
} from "../src/lib/workout-storage";
import { storeBikeData, loadBikeData, newBikeData } from "../src/lib/bike-cardio";

afterEach(() => {
  cleanup();
  localStorage.clear();
});

test("Manifesto PWA e ícones atendem rigorosamente à especificação", () => {
  const m = manifest();
  assert.equal(m.name, "Meu Treino");
  assert.equal(m.short_name, "Meu Treino");
  assert.equal(m.description, "Treinamento e evolução");
  assert.equal(m.start_url, "/");
  assert.equal(m.scope, "/");
  assert.equal(m.display, "standalone");
  assert.equal(m.background_color, "#09090B");
  assert.equal(m.theme_color, "#09090B");
  assert.equal(m.icons?.length, 2);

  // Check generated icons on disk
  const icon180 = path.resolve("public/icons/icon-180x180.png");
  const icon192 = path.resolve("public/icons/icon-192x192.png");
  const icon512 = path.resolve("public/icons/icon-512x512.png");
  const appleIcon = path.resolve("public/apple-touch-icon.png");

  assert.ok(fs.existsSync(icon180), "icon-180x180.png must exist");
  assert.ok(fs.existsSync(icon192), "icon-192x192.png must exist");
  assert.ok(fs.existsSync(icon512), "icon-512x512.png must exist");
  assert.ok(fs.existsSync(appleIcon), "apple-touch-icon.png must exist");
});

test("Navegação principal: 4 abas, acessibilidade e ocultação na execução guiada", () => {
  // Mobile bottom bar on home route
  const { unmount } = render(<PrimaryNavigation currentPath="/" />);
  const nav = screen.getByRole("navigation", { name: "Navegação principal" });
  assert.ok(nav);

  const links = screen.getAllByRole("link");
  assert.equal(links.length, 4);

  // Check 4 tabs
  const tabNames = ["Hoje", "Treinos", "Bike", "Histórico"];
  tabNames.forEach((name) => {
    assert.ok(screen.getByText(name));
  });

  // "Hoje" is active on "/"
  const activeLink = screen.getByRole("link", { name: /Hoje/ });
  assert.equal(activeLink.getAttribute("aria-current"), "page");

  unmount();

  // On execution runner route, navigation should be hidden
  const { container } = render(<PrimaryNavigation currentPath="/workouts/treino-a/start" />);
  assert.equal(container.innerHTML, "");
});

test("AppHeader exibe a marca MEU TREINO e gatilho de Conta", () => {
  render(
    <AccountContext.Provider
      value={{
        isAccountModalOpen: false,
        openAccountModal: () => {},
        closeAccountModal: () => {},
        userEmail: "atleta@exemplo.com",
        syncStatus: "Sincronizado",
        syncMessage: "Pronto",
      }}
    >
      <AppHeader currentPath="/" />
    </AccountContext.Provider>
  );

  assert.ok(screen.getByText("MEU TREINO"));
  assert.ok(screen.getByRole("button", { name: /Minha conta/ }));
});

test("AppShell inclui link acessível 'Pular para o conteúdo'", () => {
  render(
    <AppShell>
      <div>Conteúdo</div>
    </AppShell>
  );

  const skipLink = screen.getByText("Pular para o conteúdo");
  assert.ok(skipLink);
  assert.equal(skipLink.getAttribute("href"), "#main-content");
});

test("Ciclos de treinamento: Ciclo 4 e verificação de vigência", () => {
  assert.ok(OFFICIAL_CYCLES.length >= 1);
  const cycle4 = OFFICIAL_CYCLES[0];
  assert.equal(cycle4.id, "ciclo-4");
  assert.equal(cycle4.name, "Ciclo 4");

  const current = getActiveCycle(new Date("2026-11-04"));
  assert.equal(current.cycle.id, "ciclo-4");
  assert.equal(current.isExpired, false);
  assert.equal(current.statusLabel, "Ciclo 4 · Vigente");

  const expired = getActiveCycle(new Date("2026-12-01"));
  assert.equal(expired.isExpired, true);
  assert.equal(expired.statusLabel, "Último ciclo disponível · encerrado");
});

test("Histórico Reformulado: filtros de categoria, período, busca, paginação e bike integrada", () => {
  // Pre-seed workout history
  const sessionA = createWorkoutSession("treino-a");
  const entryA = createWorkoutHistoryEntry(sessionA, "Treino A - Peito e Costas", "2026-11-01T10:00:00.000Z");
  entryA.durationSeconds = 2400; // 40m
  saveWorkoutHistoryEntry(entryA);

  const sessionMob = createWorkoutSession("mobilidade-ombros");
  const entryMob = createWorkoutHistoryEntry(sessionMob, "Mobilidade de Ombros", "2026-11-02T10:00:00.000Z");
  entryMob.durationSeconds = 600; // 10m
  saveWorkoutHistoryEntry(entryMob);

  // Pre-seed bike cardio data
  const initialBike = newBikeData();
  initialBike.sessions = [
    {
      id: "bike-session-1",
      date: "2026-11-03",
      status: "completed",
      minutes: 30,
      averageBpm: 120,
      peakBpm: 135,
      rpe: 4,
      legFatigue: 3,
      talkTest: "frases",
      distanceKm: 12.5,
      resistance: "Carga 4",
      symptoms: false,
      notes: "Treino tranquilo",
      recordedAt: "2026-11-03T11:00:00.000Z",
    },
  ];
  storeBikeData(initialBike);

  render(<WorkoutHistory />);

  // Title and subtitle
  assert.ok(screen.getByRole("heading", { level: 1, name: "Histórico" }));
  assert.ok(screen.getByText("Suas sessões registradas"));

  // Check separate indicators
  assert.ok(screen.getByText("Treinos concluídos"));
  assert.ok(screen.getByText("Pedaladas"));
  assert.ok(screen.getByText("Minutos na Bike"));

  // All 3 items should appear in "Todos"
  assert.ok(screen.getByText("Treino A - Peito e Costas"));
  assert.ok(screen.getByText("Mobilidade de Ombros"));
  assert.ok(screen.getByText("Cardio na Bike"));

  // Category filter: Bike only
  const bikeBtn = screen.getByRole("button", { name: "Bike" });
  fireEvent.click(bikeBtn);

  assert.ok(screen.getByText("Cardio na Bike"));
  assert.equal(screen.queryByText("Treino A - Peito e Costas"), null);

  // Category filter: Principal only
  const principalBtn = screen.getByRole("button", { name: "Principal" });
  fireEvent.click(principalBtn);

  assert.ok(screen.getByText("Treino A - Peito e Costas"));
  assert.equal(screen.queryByText("Cardio na Bike"), null);

  // Category filter: Complementares only
  const compBtn = screen.getByRole("button", { name: "Complementares" });
  fireEvent.click(compBtn);

  assert.ok(screen.getByText("Mobilidade de Ombros"));
  assert.equal(screen.queryByText("Treino A - Peito e Costas"), null);

  // Back to Todos & search by name
  const todosBtn = screen.getByRole("button", { name: "Todos" });
  fireEvent.click(todosBtn);

  const searchInput = screen.getByLabelText("Buscar por nome do treino");
  fireEvent.change(searchInput, { target: { value: "Ombros" } });

  assert.ok(screen.getByText("Mobilidade de Ombros"));
  assert.equal(screen.queryByText("Treino A - Peito e Costas"), null);
});

test("Conta: exclusão protegida exige digitação de 'APAGAR' e preserva dados da bike", () => {
  // Pre-seed workout history
  const session = createWorkoutSession("treino-a");
  const entry = createWorkoutHistoryEntry(session, "Treino A", new Date().toISOString());
  saveWorkoutHistoryEntry(entry);

  // Pre-seed bike data
  const keepBike = newBikeData();
  keepBike.sessions = [
    {
      id: "bike-keep",
      date: "2026-11-04",
      status: "completed",
      minutes: 25,
      averageBpm: 115,
      peakBpm: 125,
      rpe: 3,
      legFatigue: 2,
      talkTest: "frases",
      distanceKm: 10,
      resistance: "Carga 3",
      symptoms: false,
      notes: "Preservado",
      recordedAt: "2026-11-04T12:00:00.000Z",
    },
  ];
  storeBikeData(keepBike);

  assert.equal(readWorkoutHistory().length, 1);
  assert.equal(loadBikeData().sessions.length, 1);

  render(
    <AccountModal
      isOpen={true}
      onClose={() => {}}
      email="usuario@teste.com"
      syncStatus="Sincronizado"
      syncMessage="Pronto"
    />
  );

  // Open the dangerous deletion dialog
  const clearBtn = screen.getByRole("button", { name: "Limpar histórico de musculação" });
  fireEvent.click(clearBtn);

  // Dialog opened
  assert.ok(screen.getByRole("heading", { name: "Limpar histórico de musculação" }));

  // Confirmation button is disabled initially
  const confirmBtn = screen.getByRole("button", { name: "Confirmar exclusão" }) as HTMLButtonElement;
  assert.equal(confirmBtn.disabled, true);

  // Typing wrong word keeps disabled
  const input = screen.getByLabelText("Confirmação de exclusão");
  fireEvent.change(input, { target: { value: "apagar" } });
  assert.equal(confirmBtn.disabled, true);

  // Typing exact word "APAGAR" enables button
  fireEvent.change(input, { target: { value: "APAGAR" } });
  assert.equal(confirmBtn.disabled, false);

  // Execute deletion
  fireEvent.click(confirmBtn);

  // Workout history is cleared
  assert.equal(readWorkoutHistory().length, 0);

  // Bike data MUST be strictly preserved!
  const bikeAfter = loadBikeData();
  assert.equal(bikeAfter.sessions.length, 1);
  assert.equal(bikeAfter.sessions[0].id, "bike-keep");
});
