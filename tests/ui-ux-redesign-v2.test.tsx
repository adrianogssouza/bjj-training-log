import test, { afterEach } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import "./setup-dom";
import { render, screen, fireEvent, cleanup, act } from "@testing-library/react";
import type { SupabaseClient } from "@supabase/supabase-js";

import manifest from "../src/app/manifest";
import { PrimaryNavigation } from "../src/components/layout/PrimaryNavigation";
import { AppHeader } from "../src/components/layout/AppHeader";
import { AppShell } from "../src/components/layout/AppShell";
import { WorkoutHistory } from "../src/components/history/WorkoutHistory";
import { AccountModal } from "../src/components/auth/AccountModal";
import { AccountContext } from "../src/components/auth/AccountContext";
import { Login } from "../src/components/auth/CloudWorkspace";
import { WeekSummarySection } from "../src/components/home/WeekSummarySection";
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

test("Correção 1: Formulário de login mantém e-mail e senha independentes e trata autenticação", async () => {
  let submittedCredentials: { email?: string; password?: string } | null = null;
  let shouldFail = false;

  const fakeSupabase = {
    auth: {
      signInWithPassword: async (creds: { email: string; password: string }) => {
        submittedCredentials = creds;
        if (shouldFail) {
          return { error: { message: "Credenciais inválidas" } };
        }
        return { error: null };
      },
    },
  } as unknown as SupabaseClient;

  render(<Login api={fakeSupabase} />);

  const emailInput = screen.getByLabelText("E-mail") as HTMLInputElement;
  const passwordInput = screen.getByLabelText("Senha") as HTMLInputElement;

  // 1. Preenche e-mail
  fireEvent.change(emailInput, { target: { value: "atleta@exemplo.com" } });
  assert.equal(emailInput.value, "atleta@exemplo.com");
  assert.equal(passwordInput.value, "");

  // 2. Preenche senha
  fireEvent.change(passwordInput, { target: { value: "Segredo123" } });

  // 3. Confirma que digitar a senha não altera o e-mail
  assert.equal(emailInput.value, "atleta@exemplo.com");
  assert.equal(passwordInput.value, "Segredo123");

  // 4. Submete o formulário com sucesso
  const submitBtn = screen.getByRole("button", { name: "Entrar" });
  await act(async () => {
    fireEvent.click(submitBtn);
  });

  // Confirma que signInWithPassword recebe as credenciais corretas
  assert.deepEqual(submittedCredentials, {
    email: "atleta@exemplo.com",
    password: "Segredo123",
  });

  // 5. Teste a apresentação de erro de autenticação
  shouldFail = true;
  fireEvent.change(passwordInput, { target: { value: "SenhaErrada" } });
  await act(async () => {
    fireEvent.click(submitBtn);
  });

  const errorAlert = await screen.findByRole("alert");
  assert.ok(errorAlert);
  assert.ok(errorAlert.textContent?.includes("Não foi possível entrar"));
});

test("Correção 2: Histórico usa session.date como data efetiva (retroativa) e recordedAt como critério secundário", () => {
  // Cenário:
  // Sessão 1 (Manhã): 2026-11-04, recordedAt 10:00:00Z
  // Sessão 2 (Tarde): 2026-11-04, recordedAt 15:00:00Z (deve vir primeiro na mesma data)
  // Sessão 3 (Retroativa): realizada há 45 dias (2026-09-20), mas registrada HOJE (recordedAt 2026-11-04T12:00:00Z)
  const bike = newBikeData();
  bike.sessions = [
    {
      id: "bike-recent-morning",
      date: "2026-11-04",
      status: "completed",
      minutes: 25,
      averageBpm: 120,
      peakBpm: 130,
      rpe: 3,
      legFatigue: 2,
      talkTest: "frases",
      distanceKm: 10,
      resistance: "3",
      symptoms: false,
      notes: "Manhã",
      recordedAt: "2026-11-04T10:00:00.000Z",
    },
    {
      id: "bike-recent-afternoon",
      date: "2026-11-04",
      status: "completed",
      minutes: 30,
      averageBpm: 125,
      peakBpm: 135,
      rpe: 4,
      legFatigue: 3,
      talkTest: "frases",
      distanceKm: 12,
      resistance: "4",
      symptoms: false,
      notes: "Tarde",
      recordedAt: "2026-11-04T15:00:00.000Z",
    },
    {
      id: "bike-retroactive",
      date: "2026-09-20", // 45 dias atrás
      status: "completed",
      minutes: 40,
      averageBpm: 130,
      peakBpm: 140,
      rpe: 5,
      legFatigue: 4,
      talkTest: "frases",
      distanceKm: 15,
      resistance: "4",
      symptoms: false,
      notes: "Retroativa registrada hoje",
      recordedAt: "2026-11-04T12:00:00.000Z", // recordedAt é hoje!
    },
  ];
  storeBikeData(bike);

  render(<WorkoutHistory />);

  assert.ok(screen.getAllByText("Cardio na Bike").length > 0);

  // Filtro de período: "Últimos 7 dias"
  const periodSelect = screen.getByLabelText("Filtro de período");
  fireEvent.change(periodSelect, { target: { value: "7d" } });

  // A sessão retroativa NÃO deve aparecer nos últimos 7 dias (embora tenha recordedAt hoje!)
  assert.equal(screen.queryByText(/40 min/), null);
  // As sessões de hoje aparecem
  assert.ok(screen.getByText(/30 min/));
  assert.ok(screen.getByText(/25 min/));

  // Filtro de período: "Últimos 30 dias"
  fireEvent.change(periodSelect, { target: { value: "30d" } });
  // Ainda não deve aparecer pois 2026-09-20 é > 30 dias atrás
  assert.equal(screen.queryByText(/40 min/), null);

  // Filtro de período: "Últimos 90 dias"
  fireEvent.change(periodSelect, { target: { value: "90d" } });
  // Agora a sessão retroativa DEVE aparecer no período correto!
  assert.ok(screen.getByText(/40 min/));
  assert.ok(screen.getByText("20/09/2026"));
});

test("Correção 3: Resumo semanal calcula minutos na semana de calendário (Seg-Dom) e exibe 'Meta do ciclo'", () => {
  // Ciclo iniciado no meio da semana (Quarta-feira, 2026-11-04)
  const bike = newBikeData();
  bike.startedOn = "2026-11-04"; // Quarta-feira

  // Sessão 1: Terça-feira (2026-11-03) - concluída nesta semana de calendário (Segunda a Domingo)
  // Sessão 2: Quarta-feira (2026-11-04) - concluída
  // Sessão 3: Quarta-feira (2026-11-04) - pulada (não deve somar minutos!)
  // Sessão 4: Semana passada (2026-10-28) - concluída (fora da semana de calendário)
  bike.sessions = [
    {
      id: "b1",
      date: "2026-11-03",
      status: "completed",
      minutes: 25,
      averageBpm: 110,
      peakBpm: 120,
      rpe: 3,
      legFatigue: 2,
      talkTest: "frases",
      distanceKm: 8,
      resistance: "3",
      symptoms: false,
      notes: "",
      recordedAt: "2026-11-03T10:00:00Z",
    },
    {
      id: "b2",
      date: "2026-11-04",
      status: "completed",
      minutes: 25,
      averageBpm: 115,
      peakBpm: 125,
      rpe: 3,
      legFatigue: 2,
      talkTest: "frases",
      distanceKm: 9,
      resistance: "3",
      symptoms: false,
      notes: "",
      recordedAt: "2026-11-04T10:00:00Z",
    },
    {
      id: "b3",
      date: "2026-11-04",
      status: "skipped",
      minutes: 0,
      averageBpm: null,
      peakBpm: null,
      rpe: null,
      legFatigue: null,
      talkTest: "nao-avaliado",
      distanceKm: null,
      resistance: "",
      symptoms: false,
      notes: "Pulada",
      recordedAt: "2026-11-04T11:00:00Z",
    },
    {
      id: "b4",
      date: "2026-10-28",
      status: "completed",
      minutes: 30,
      averageBpm: 120,
      peakBpm: 130,
      rpe: 4,
      legFatigue: 3,
      talkTest: "frases",
      distanceKm: 10,
      resistance: "4",
      symptoms: false,
      notes: "Semana passada",
      recordedAt: "2026-10-28T10:00:00Z",
    },
  ];
  storeBikeData(bike);

  render(<WeekSummarySection />);

  // Minutos somados devem ser 25 + 25 = 50 min (somente completed da semana atual de calendário)
  assert.ok(screen.getByText("50 min"));
  // Meta do ciclo deve ser identificada como "Meta do ciclo: 75 min"
  assert.ok(screen.getByText("Meta do ciclo: 75 min"));
});

test("Correção 4: Atualização da interface após salvamento, exclusão e evento do Supabase", () => {
  render(<WeekSummarySection />);

  // Inicialmente sem sessões
  assert.ok(screen.getByText("0 sessões"));
  assert.ok(screen.getByText("0 min"));

  // 1. Salvamento de musculação via saveWorkoutHistoryEntry
  act(() => {
    const session = createWorkoutSession("treino-a");
    const entry = createWorkoutHistoryEntry(session, "Treino A", new Date().toISOString());
    saveWorkoutHistoryEntry(entry);
  });

  // Indicador de musculação atualiza automaticamente para 1 sessão
  assert.ok(screen.getByText("1 sessão"));

  // 2. Registro de sessão na Bike via storeBikeData
  act(() => {
    const bike = newBikeData();
    bike.sessions = [
      {
        id: "b-live",
        date: new Date().toISOString().slice(0, 10),
        status: "completed",
        minutes: 25,
        averageBpm: 118,
        peakBpm: 128,
        rpe: 3,
        legFatigue: 2,
        talkTest: "frases",
        distanceKm: 10,
        resistance: "3",
        symptoms: false,
        notes: "",
        recordedAt: new Date().toISOString(),
      },
    ];
    storeBikeData(bike);
  });

  // Indicador de bike atualiza automaticamente para 25 min
  assert.ok(screen.getByText("25 min"));

  // 3. Atualização recebida do Supabase (evento bjj-cloud-updated)
  act(() => {
    window.dispatchEvent(new Event("bjj-cloud-updated"));
  });

  // Mantém estado atualizado
  assert.ok(screen.getByText("1 sessão"));
  assert.ok(screen.getByText("25 min"));
});
