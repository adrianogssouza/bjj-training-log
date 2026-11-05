import test, { afterEach } from "node:test";
import assert from "node:assert/strict";
import "./setup-dom";
import { render, screen, fireEvent, cleanup, act } from "@testing-library/react";

import {
  PLAN_STORAGE_KEY,
  addDaysIso,
  bindPlanStorage,
  emptyPlans,
  getWeek,
  isPlanItemDone,
  loadWeeklyPlans,
  mergeWeeklyPlans,
  mondayOf,
  resolveWorkoutId,
  sanitizeWeeklyPlans,
  storeWeeklyPlans,
  todayIso,
  toggleDayItem,
  weekdayIndex,
  withWeek,
} from "../src/lib/weekly-plan";
import { emptyTrainingState, mergeTrainingState, parseTrainingState, type TrainingState } from "../src/lib/training-state";
import { bindAccountStorage, createWorkoutHistoryEntry, createWorkoutSession, saveWorkoutHistoryEntry } from "../src/lib/workout-storage";
import { OFFICIAL_CYCLES } from "../src/data/training-cycles";
import { HomePlanSections } from "../src/components/home/HomePlanSections";
import { WeekPlanner } from "../src/components/plan/WeekPlanner";
import { ThemePicker } from "../src/components/layout/ThemePicker";
import { THEME_STORAGE_KEY } from "../src/lib/theme";

afterEach(() => {
  cleanup();
  bindAccountStorage(null);
  localStorage.clear();
  delete document.documentElement.dataset.theme;
});

const MONDAY = "2026-11-02";

test("datas: segunda-feira da semana e dia da semana", () => {
  assert.equal(mondayOf("2026-11-05"), MONDAY);
  assert.equal(mondayOf("2026-11-08"), MONDAY);
  assert.equal(mondayOf("2026-11-09"), "2026-11-09");
  assert.equal(weekdayIndex("2026-11-05"), 3);
  assert.equal(addDaysIso("2026-10-31", 2), "2026-11-02");
});

test("validação descarta semanas e itens inválidos sem rejeitar o resto", () => {
  const plans = sanitizeWeeklyPlans({
    version: 1,
    weeks: {
      [MONDAY]: [["cardio-3", "a", "a"], ["tatame"], [], [42], ["Treino!"], [], []],
      "2026-11-04": [["a"], [], [], [], [], [], []], // não é segunda-feira
      "2026-11-09": [["a"]], // não tem 7 dias
      "2026-11-16": [[], [], [], [], [], [], []], // vazia
    },
  });
  assert.deepEqual(Object.keys(plans.weeks), [MONDAY]);
  assert.deepEqual(plans.weeks[MONDAY][0], ["a", "cardio-3"]);
  assert.deepEqual(plans.weeks[MONDAY][3], []);
  assert.deepEqual(sanitizeWeeklyPlans("lixo"), emptyPlans());
});

test("vários treinos por dia; folga ocupa o dia sozinha", () => {
  let day = toggleDayItem([], "cardio-3");
  day = toggleDayItem(day, "a");
  assert.deepEqual(day, ["a", "cardio-3"]);
  assert.deepEqual(toggleDayItem(day, "folga"), ["folga"]);
  assert.deepEqual(toggleDayItem(["folga"], "b"), ["b"]);
  assert.deepEqual(toggleDayItem(day, "a"), ["cardio-3"]);
});

test("semana sem itens é removida do plano", () => {
  const filled = withWeek(emptyPlans(), MONDAY, [["a"], [], [], [], [], [], []]);
  assert.ok(filled.weeks[MONDAY]);
  assert.equal(withWeek(filled, MONDAY, getWeek(emptyPlans(), MONDAY)).weeks[MONDAY], undefined);
});

test("A/B seguem o ciclo vigente", () => {
  assert.equal(resolveWorkoutId("a", "2026-11-05"), OFFICIAL_CYCLES[0].workoutAId);
  assert.equal(resolveWorkoutId("b", "2026-11-05"), OFFICIAL_CYCLES[0].workoutBId);
  assert.equal(resolveWorkoutId("core-1"), "core-1");
  assert.equal(resolveWorkoutId("tatame"), null);
});

test("item conta como feito pelo dia de São Paulo, não pelo UTC", () => {
  const history = [{ workoutId: OFFICIAL_CYCLES[0].workoutAId, completedAt: "2026-11-06T01:30:00.000Z" }];
  assert.equal(isPlanItemDone("a", "2026-11-05", { history }), true);
  assert.equal(isPlanItemDone("a", "2026-11-06", { history }), false);
  assert.equal(isPlanItemDone("b", "2026-11-05", { history }), false);
  assert.equal(isPlanItemDone("bike", "2026-11-05", { history, bikeSessions: [{ date: "2026-11-05", status: "completed" }] }), true);
  assert.equal(isPlanItemDone("bike", "2026-11-05", { history, bikeSessions: [{ date: "2026-11-05", status: "skipped" }] }), false);
});

test("estado da conta guarda o plano; estados antigos continuam válidos", () => {
  const plans = withWeek(emptyPlans(), MONDAY, [["a", "cardio-3"], [], [], [], [], [], []]);
  const state = { ...emptyTrainingState(), plans };
  assert.deepEqual(parseTrainingState(JSON.parse(JSON.stringify(state))).plans, plans);
  assert.equal(parseTrainingState(emptyTrainingState()).plans, undefined);
  // Plano malformado não derruba o backup.
  assert.deepEqual(parseTrainingState({ ...emptyTrainingState(), plans: { version: 9 } }).plans, emptyPlans());
});

test("importação mantém as semanas já planejadas na conta", () => {
  const current = { ...emptyTrainingState(), plans: withWeek(emptyPlans(), MONDAY, [["b"], [], [], [], [], [], []]) };
  const incoming = {
    ...emptyTrainingState(),
    plans: withWeek(withWeek(emptyPlans(), MONDAY, [["a"], [], [], [], [], [], []]), "2026-10-26", [["core-1"], [], [], [], [], [], []]),
  };
  const merged = mergeTrainingState(current, incoming);
  assert.deepEqual(merged.plans?.weeks[MONDAY][0], ["b"]);
  assert.deepEqual(merged.plans?.weeks["2026-10-26"][0], ["core-1"]);
  assert.deepEqual(mergeWeeklyPlans(undefined, current.plans), current.plans);
});

test("com login, o plano é salvo no estado sincronizado da conta", () => {
  let state: TrainingState = emptyTrainingState();
  bindAccountStorage({ read: () => state, write: (next) => { state = next; } });
  const plans = withWeek(emptyPlans(), MONDAY, [["a"], [], [], [], [], [], []]);
  storeWeeklyPlans(plans);
  assert.deepEqual(state.plans, plans);
  assert.equal(localStorage.getItem(PLAN_STORAGE_KEY), null);
  assert.deepEqual(loadWeeklyPlans(), plans);
  bindPlanStorage(null);
});

test("sem login, o plano fica no navegador", () => {
  const plans = withWeek(emptyPlans(), MONDAY, [["a"], [], [], [], [], [], []]);
  storeWeeklyPlans(plans);
  assert.deepEqual(JSON.parse(localStorage.getItem(PLAN_STORAGE_KEY) ?? "null"), plans);
});

function planToday(items: string[]) {
  const today = todayIso();
  const monday = mondayOf(today);
  const week = getWeek(emptyPlans(), monday);
  week[weekdayIndex(today)] = items;
  storeWeeklyPlans(withWeek(emptyPlans(), monday, week));
  return today;
}

test("Home mostra todos os treinos planejados para hoje, com o primeiro em destaque", async () => {
  planToday(["a", "cardio-3"]);
  await act(async () => { render(<HomePlanSections />); });
  const startA = screen.getByRole("link", { name: /Iniciar Treino A/ });
  assert.match(startA.getAttribute("href") ?? "", new RegExp(`/workouts/${OFFICIAL_CYCLES[0].workoutAId}/start\\?start=1`));
  assert.ok(screen.getByRole("link", { name: /Iniciar Cardio 3/ }));
  assert.ok(screen.getByText(/2 treinos · ~70 min/));
});

test("treino feito hoje aparece como Feito e sai do botão principal", async () => {
  planToday(["a", "cardio-3"]);
  const session = { ...createWorkoutSession(OFFICIAL_CYCLES[0].workoutAId), startedAt: new Date(Date.now() - 3_600_000).toISOString() };
  saveWorkoutHistoryEntry(createWorkoutHistoryEntry(session, "Treino A", new Date().toISOString()));
  await act(async () => { render(<HomePlanSections />); });
  assert.ok(screen.getByText("Feito ✓"));
  assert.equal(screen.queryByRole("link", { name: /Iniciar Treino A/ }), null);
  assert.ok(screen.getByText(/1 concluído/));
});

test("dia sem plano oferece planejar e treinar A/B mesmo assim", async () => {
  await act(async () => { render(<HomePlanSections />); });
  assert.ok(screen.getByText("Nenhum treino planejado para hoje."));
  assert.ok(screen.getByRole("button", { name: "Planejar hoje" }));
  assert.ok(screen.getByRole("link", { name: "Treinar A mesmo assim" }));
});

test("tocar num dia da semana abre a seleção e salva vários itens", async () => {
  const today = todayIso();
  await act(async () => { render(<HomePlanSections />); });
  fireEvent.click(screen.getByRole("button", { name: "Planejar hoje" }));
  fireEvent.click(screen.getByRole("button", { name: "Treino B" }));
  fireEvent.click(screen.getByRole("button", { name: "Cardio 2 · Base" }));
  const saved = loadWeeklyPlans().weeks[mondayOf(today)][weekdayIndex(today)];
  assert.deepEqual(saved, ["b", "cardio-2"]);
  assert.equal(screen.getByRole("button", { name: "Treino B" }).getAttribute("aria-pressed"), "true");
});

test("planejador copia a semana anterior", async () => {
  const monday = mondayOf(todayIso());
  storeWeeklyPlans(withWeek(emptyPlans(), addDaysIso(monday, -7), [["a", "cardio-3"], ["tatame"], [], [], [], [], []]));
  await act(async () => { render(<WeekPlanner />); });
  fireEvent.click(screen.getByRole("button", { name: "Copiar semana anterior" }));
  assert.deepEqual(loadWeeklyPlans().weeks[monday][0], ["a", "cardio-3"]);
  assert.ok(screen.getByRole("button", { name: /Remover Treino A de Segunda/ }));
});

test("seletor de aparência aplica e guarda o tema", async () => {
  await act(async () => { render(<ThemePicker />); });
  fireEvent.click(screen.getByRole("button", { name: "Aparência do app" }));
  fireEvent.click(screen.getByRole("radio", { name: /Preto · Verde-limão/ }));
  assert.equal(document.documentElement.dataset.theme, "lima");
  assert.equal(localStorage.getItem(THEME_STORAGE_KEY), "lima");
  assert.equal(screen.getByRole("radio", { name: /Preto · Verde-limão/ }).getAttribute("aria-checked"), "true");
});
