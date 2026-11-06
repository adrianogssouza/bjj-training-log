import test, { afterEach } from "node:test";
import assert from "node:assert/strict";

import "./setup-dom";
import { render, screen, fireEvent, cleanup, waitFor, within } from "@testing-library/react";

import type { Workout, WorkoutHistoryEntry, WorkoutSessionLog } from "../src/types";
import {
  addDaysIso,
  formatKg,
  formatKgDelta,
  getCycleWeeklyFrequency,
  getExerciseProgress,
  parseLoadKg,
  toSaoPauloIsoDate,
  weekStartIso,
} from "../src/lib/progress";
import { parseProgressTab, PROGRESS_HISTORY_PATH } from "../src/lib/progress-tab";
import { ProgressScreen } from "../src/components/progress/ProgressScreen";
import { PrimaryNavigation } from "../src/components/layout/PrimaryNavigation";
import { seedWorkouts } from "../src/data/seed-workouts";
import { OFFICIAL_CYCLES } from "../src/data/training-cycles";
import { workoutStorageKeys } from "../src/lib/workout-storage";
import HistoryPage from "../src/app/history/page";

afterEach(() => {
  cleanup();
  localStorage.clear();
});

/* ---------------------------------------------------------------- */
/* Extração da carga                                                 */
/* ---------------------------------------------------------------- */

test("parseLoadKg extrai o número do texto livre e ignora os sem número", () => {
  assert.equal(parseLoadKg("24 kg"), 24);
  assert.equal(parseLoadKg("24kg"), 24);
  assert.equal(parseLoadKg("24KG"), 24);
  assert.equal(parseLoadKg("24,5 kg"), 24.5);
  assert.equal(parseLoadKg("22.5"), 22.5);
  assert.equal(parseLoadKg("24"), 24);
  assert.equal(parseLoadKg("  30 quilos "), 30);
  // Com "kg" no texto, só os números com unidade contam.
  assert.equal(parseLoadKg("2x12kg"), 12);
  assert.equal(parseLoadKg("BW + 10kg"), 10);
  // Mais de um valor: vale o maior.
  assert.equal(parseLoadKg("16/20 kg"), 20);
  assert.equal(parseLoadKg("16kg e 20kg"), 20);
  // Sem número → fica de fora.
  assert.equal(parseLoadKg("BW"), null);
  assert.equal(parseLoadKg("elástico"), null);
  assert.equal(parseLoadKg("elástico verde"), null);
  assert.equal(parseLoadKg(""), null);
  assert.equal(parseLoadKg(undefined), null);
  assert.equal(parseLoadKg("0 kg"), null);
});

test("formatação de carga em pt-BR", () => {
  assert.equal(formatKg(22.5), "22,5 kg");
  assert.equal(formatKg(24), "24 kg");
  assert.equal(formatKgDelta(4), "+4 kg");
  assert.equal(formatKgDelta(-2.5), "−2,5 kg");
  assert.equal(formatKgDelta(0), "0 kg");
});

test("datas: dia no fuso de São Paulo e início de semana na segunda", () => {
  // 01:30 UTC de 13/10 ainda é 12/10 em São Paulo (UTC−3).
  assert.equal(toSaoPauloIsoDate("2026-10-13T01:30:00.000Z"), "2026-10-12");
  assert.equal(toSaoPauloIsoDate("data inválida"), null);
  assert.equal(weekStartIso("2026-10-11"), "2026-10-05"); // domingo → segunda anterior
  assert.equal(weekStartIso("2026-10-12"), "2026-10-12"); // segunda
  assert.equal(weekStartIso("2026-10-18"), "2026-10-12");
  assert.equal(addDaysIso("2026-10-30", 3), "2026-11-02");
});

/* ---------------------------------------------------------------- */
/* Evolução por exercício                                            */
/* ---------------------------------------------------------------- */

const workoutA: Workout = {
  id: "treino-a-teste",
  title: "Treino A Teste",
  month: "Outubro",
  year: 2026,
  type: "monthly",
  blocks: [
    {
      id: "b2",
      title: "Bloco 2",
      type: "single",
      sets: "3",
      order: 2,
      items: [{ id: "remada", name: "Remada" }],
    },
    {
      id: "b1",
      title: "Bloco 1",
      type: "bi_set",
      sets: "3",
      order: 1,
      items: [
        { id: "supino", name: "Supino" },
        { id: "prancha", name: "Prancha" },
      ],
    },
  ],
};

function log(blockId: string, itemId: string, load: string, set: number, extra: Partial<WorkoutSessionLog> = {}): [string, WorkoutSessionLog] {
  return [
    `${blockId}:${itemId}:${set}`,
    { blockId, itemId, reps: "8", load, actualPse: "", completed: true, set, ...extra },
  ];
}

function entry(workoutId: string, completedAt: string, logs: [string, WorkoutSessionLog][], title = "Treino"): WorkoutHistoryEntry {
  const startedAt = new Date(Date.parse(completedAt) - 3600_000).toISOString();
  return {
    id: `${workoutId}:${startedAt}`,
    workoutId,
    workoutTitle: title,
    startedAt,
    completedAt,
    finishedAt: completedAt,
    durationSeconds: 3600,
    currentStepIndex: 0,
    logs: Object.fromEntries(logs),
  };
}

test("getExerciseProgress usa a maior carga da sessão, ignora sem número e calcula variação, melhor e PSE", () => {
  const history = [
    // Fora de ordem de propósito: a mais recente primeiro.
    entry("treino-a-teste", "2026-10-26T12:00:00.000Z", [
      log("b1", "supino", "30 kg", 1, { actualPse: "8" }),
      log("b1", "supino", "32kg", 2, { actualPse: "9" }),
      log("b1", "supino", "34 kg", 3, { skipped: true, completed: false }), // pulada não conta
      log("b1", "prancha", "BW", 1),
    ]),
    entry("treino-a-teste", "2026-10-12T12:00:00.000Z", [
      log("b1", "supino", "24 kg", 1, { actualPse: "7" }),
      log("b1", "supino", "26 kg", 2, { actualPse: "abc" }), // PSE inválido não entra
      log("b2", "remada", "elástico", 1),
    ]),
    entry("treino-a-teste", "2026-10-19T12:00:00.000Z", [log("b1", "supino", "BW", 1)]), // sem número: fora
    entry("outro-treino", "2026-10-20T12:00:00.000Z", [log("b1", "supino", "100 kg", 1)]), // outro treino: fora
  ];

  const result = getExerciseProgress(history, [{ label: "A", workout: workoutA }]);

  // Prancha e Remada não têm carga numérica → não viram chip.
  assert.deepEqual(result.map((r) => r.name), ["Supino"]);
  const supino = result[0];
  assert.equal(supino.workoutLabel, "A");
  assert.deepEqual(
    supino.points.map((p) => [p.date, p.load]),
    [
      ["2026-10-12", 26],
      ["2026-10-26", 32],
    ],
  );
  assert.equal(supino.firstLoad, 26);
  assert.equal(supino.lastLoad, 32);
  assert.equal(supino.delta, 6);
  assert.equal(supino.bestLoad, 32);
  assert.equal(supino.sessions, 2);
  assert.equal(supino.averagePse, 8); // (7 + 8 + 9) / 3
});

test("getExerciseProgress segue a ordem do treino (A antes de B, blocos pela ordem)", () => {
  const workoutB: Workout = { ...workoutA, id: "treino-b-teste", blocks: [{ ...workoutA.blocks[1], id: "bb" }] };
  const history = [
    entry("treino-b-teste", "2026-10-13T12:00:00.000Z", [log("bb", "supino", "40kg", 1)]),
    entry("treino-a-teste", "2026-10-12T12:00:00.000Z", [
      log("b2", "remada", "20kg", 1),
      log("b1", "prancha", "10kg", 1),
    ]),
  ];
  const result = getExerciseProgress(history, [
    { label: "A", workout: workoutA },
    { label: "B", workout: workoutB },
  ]);
  assert.deepEqual(result.map((r) => `${r.workoutLabel} ${r.name}`), ["A Prancha", "A Remada", "B Supino"]);
  assert.equal(result[0].averagePse, null);
  assert.equal(result[0].delta, 0);
});

/* ---------------------------------------------------------------- */
/* Frequência semanal                                                */
/* ---------------------------------------------------------------- */

const cycle = { startDate: "2026-10-11", endDate: "2026-11-15" };

test("getCycleWeeklyFrequency agrupa por semana (seg–dom, São Paulo) separando Principal e Complementar", () => {
  const history = [
    entry("treino-a-prime-ciclo-4", "2026-10-11T15:00:00.000Z", []), // domingo, 1º dia do ciclo
    entry("treino-a-prime-ciclo-4", "2026-10-13T15:00:00.000Z", []),
    entry("treino-b-prime-ciclo-4", "2026-10-15T15:00:00.000Z", []),
    entry("mobilidade-com-peso", "2026-10-16T15:00:00.000Z", []),
    // 19/10 01:00 UTC = 18/10 22:00 em São Paulo → ainda na semana de 12/10
    entry("mobilidade-sem-peso", "2026-10-19T01:00:00.000Z", []),
    entry("treino-a-prime-ciclo-4", "2026-10-27T15:00:00.000Z", []),
    entry("treino-a-prime-ciclo-4", "2026-10-01T15:00:00.000Z", []), // antes do ciclo
  ];

  const weeks = getCycleWeeklyFrequency(history, cycle, seedWorkouts, new Date("2026-10-28T15:00:00.000Z"));

  assert.deepEqual(
    weeks.map((w) => [w.weekStart, w.label, w.principal, w.complementary, w.total, w.isCurrent]),
    [
      ["2026-10-05", "11/10", 1, 0, 1, false],
      ["2026-10-12", "12/10", 2, 2, 4, false],
      ["2026-10-19", "19/10", 0, 0, 0, false],
      ["2026-10-26", "26/10", 1, 0, 1, true],
    ],
  );
});

test("getCycleWeeklyFrequency para no fim do ciclo quando ele já acabou", () => {
  const weeks = getCycleWeeklyFrequency([], cycle, seedWorkouts, new Date("2026-12-10T12:00:00.000Z"));
  assert.equal(weeks.length, 6);
  assert.equal(weeks[0].weekStart, "2026-10-05");
  assert.equal(weeks[weeks.length - 1].weekStart, "2026-11-09");
  assert.ok(weeks.every((w) => !w.isCurrent && w.total === 0));
});

/* ---------------------------------------------------------------- */
/* Tela Progresso                                                    */
/* ---------------------------------------------------------------- */

const cycle4 = OFFICIAL_CYCLES[0];
const seedA = seedWorkouts.find((w) => w.id === cycle4.workoutAId)!;
const seedB = seedWorkouts.find((w) => w.id === cycle4.workoutBId)!;
const supinoBlock = seedA.blocks.find((b) => b.items.some((i) => i.name.startsWith("Supino")))!;
const supinoItem = supinoBlock.items[0];
const remadaBlock = seedB.blocks.find((b) => b.items.some((i) => i.name.startsWith("Remada")))!;
const remadaItem = remadaBlock.items[0];

function storeHistory(entries: WorkoutHistoryEntry[]) {
  localStorage.setItem(workoutStorageKeys.history, JSON.stringify(entries));
}

test("Progresso > Cargas: chips do ciclo, última carga, variação e números do exercício", async () => {
  storeHistory([
    entry(seedA.id, "2026-10-26T12:00:00.000Z", [log(supinoBlock.id, supinoItem.id, "64 kg", 1, { actualPse: "8" })], seedA.title),
    entry(seedA.id, "2026-10-13T12:00:00.000Z", [log(supinoBlock.id, supinoItem.id, "60kg", 1, { actualPse: "7" })], seedA.title),
    entry(seedB.id, "2026-10-15T12:00:00.000Z", [log(remadaBlock.id, remadaItem.id, "22,5 kg", 1)], seedB.title),
  ]);

  render(<ProgressScreen />);

  assert.ok(screen.getByRole("heading", { level: 1, name: "Progresso" }));
  const cargasTab = screen.getByRole("tab", { name: "Cargas" });
  assert.equal(cargasTab.getAttribute("aria-selected"), "true");

  const chips = await screen.findByRole("group", { name: "Escolher exercício" });
  const chipButtons = within(chips).getAllByRole("button");
  assert.equal(chipButtons.length, 2);
  assert.match(chipButtons[0].textContent ?? "", /Supino/);
  assert.match(chipButtons[1].textContent ?? "", /Remada/);
  assert.equal(chipButtons[0].getAttribute("aria-pressed"), "true");

  assert.ok(screen.getByRole("heading", { name: supinoItem.name }));
  assert.equal(screen.getByTestId("last-load").textContent, "64kg");
  const delta = screen.getByTestId("load-delta");
  assert.equal(delta.textContent, "+4 kg no ciclo");
  assert.match(delta.className, /success/);
  assert.ok(screen.getByText("Melhor carga"));
  assert.ok(screen.getByText("7,5")); // PSE médio
  const chart = screen.getByRole("img", { name: /Carga por sessão/ });
  assert.match(chart.getAttribute("aria-label") ?? "", /13\/10: 60 kg, 26\/10: 64 kg/);

  fireEvent.click(chipButtons[1]);
  assert.equal(chipButtons[1].getAttribute("aria-pressed"), "true");
  assert.ok(screen.getByRole("heading", { name: remadaItem.name }));
  assert.equal(screen.getByTestId("load-delta").textContent, "Primeira carga do ciclo");
  assert.equal(screen.getByTestId("last-load").textContent, "22,5kg");

  // Frequência semanal com legenda.
  assert.ok(screen.getByRole("heading", { name: "Frequência semanal" }));
  assert.ok(screen.getByText("3 sessões no Ciclo 4"));
  assert.ok(screen.getByRole("img", { name: /Sessões por semana do ciclo/ }));
  assert.ok(screen.getByText("Principal"));
  assert.ok(screen.getByText("Complementar"));
});

test("Progresso > Cargas: estado vazio sem cargas e sem treinos no ciclo", async () => {
  render(<ProgressScreen />);
  assert.ok(await screen.findByText("Nenhuma carga registrada"));
  assert.ok(screen.getByRole("link", { name: "Ver treinos" }));
  assert.ok(screen.getByText(/Nenhum treino concluído neste ciclo ainda/));
  assert.equal(screen.queryByRole("img", { name: /Carga por sessão/ }), null);
});

test("Progresso > Histórico: abre pelo endereço e troca de aba sem perder os filtros do histórico", async () => {
  storeHistory([entry(seedA.id, "2026-10-13T12:00:00.000Z", [], seedA.title)]);

  render(<ProgressScreen initialTab="historico" />);
  assert.equal(screen.getByRole("tab", { name: "Histórico" }).getAttribute("aria-selected"), "true");
  // Histórico embutido: sem título próprio, com filtros, busca e Bike.
  assert.equal(screen.queryByRole("heading", { level: 1, name: "Histórico" }), null);
  assert.ok(screen.getByRole("group", { name: "Filtro por categoria" }));
  assert.ok(screen.getByRole("button", { name: "Bike" }));
  assert.ok(screen.getByLabelText("Buscar por nome do treino"));
  await waitFor(() => assert.ok(screen.getByText(seedA.title)));

  fireEvent.click(screen.getByRole("tab", { name: "Cargas" }));
  assert.equal(screen.getByRole("tab", { name: "Cargas" }).getAttribute("aria-selected"), "true");
  assert.equal(window.location.pathname + window.location.search, "/progresso");

  fireEvent.keyDown(screen.getByRole("tablist"), { key: "ArrowRight" });
  assert.equal(screen.getByRole("tab", { name: "Histórico" }).getAttribute("aria-selected"), "true");
  assert.equal(window.location.pathname + window.location.search, PROGRESS_HISTORY_PATH);
});

test("parseProgressTab aceita só abas conhecidas", () => {
  assert.equal(parseProgressTab("historico"), "historico");
  assert.equal(parseProgressTab(["historico"]), "historico");
  assert.equal(parseProgressTab("cargas"), "cargas");
  assert.equal(parseProgressTab("qualquer"), "cargas");
  assert.equal(parseProgressTab(undefined), "cargas");
});

/* ---------------------------------------------------------------- */
/* Navegação e endereço antigo                                       */
/* ---------------------------------------------------------------- */

test("Navegação: Progresso no lugar de Histórico, ativo também no endereço antigo /history", () => {
  const { unmount } = render(<PrimaryNavigation currentPath="/progresso" />);
  const progresso = screen.getByRole("link", { name: /Progresso/ });
  assert.equal(progresso.getAttribute("href"), "/progresso");
  assert.equal(progresso.getAttribute("aria-current"), "page");
  assert.equal(screen.queryByRole("link", { name: /Histórico/ }), null);
  unmount();

  render(<PrimaryNavigation currentPath="/history" />);
  assert.equal(screen.getByRole("link", { name: /Progresso/ }).getAttribute("aria-current"), "page");
});

test("/history redireciona para Progresso > Histórico", () => {
  assert.throws(
    () => HistoryPage(),
    (error: unknown) => {
      const digest = (error as { digest?: string }).digest ?? "";
      return digest.startsWith("NEXT_REDIRECT") && digest.includes(PROGRESS_HISTORY_PATH);
    },
  );
});

test("next.config redireciona /history (307) para Progresso > Histórico antes de carregar a página", async () => {
  const { default: config } = await import("../next.config");
  const redirects = await config.redirects!();
  const rule = redirects.find((r) => r.source === "/history");
  assert.ok(rule);
  assert.equal(rule.destination, PROGRESS_HISTORY_PATH);
  assert.equal(rule.permanent, false);
});
