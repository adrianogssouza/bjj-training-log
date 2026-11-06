import test, { afterEach } from "node:test";
import assert from "node:assert/strict";

import "./setup-dom";
import { render, screen, fireEvent, cleanup, waitFor } from "@testing-library/react";
import { AppRouterContext } from "next/dist/shared/lib/app-router-context.shared-runtime";

import type { Workout, WorkoutHistoryEntry, WorkoutSessionLog } from "../src/types";
import {
  averageFeeling,
  feelingLabel,
  formatVolume,
  normalizeSessionFeedback,
  parseRepsCount,
  summarizeSession,
  type SessionFeedback,
} from "../src/lib/session-feedback";
import { emptyTrainingState, mergeTrainingState, parseTrainingState } from "../src/lib/training-state";
import { readWorkoutHistory, saveWorkoutFeedback, workoutStorageKeys } from "../src/lib/workout-storage";
import { SessionWrapUp } from "../src/components/workout/SessionWrapUp";
import { WorkoutRunner } from "../src/components/workout/WorkoutRunner";
import { LastSessionSection } from "../src/components/home/LastSessionSection";
import { WeekSummarySection } from "../src/components/home/WeekSummarySection";
import { WorkoutHistory } from "../src/components/history/WorkoutHistory";
import { ProgressScreen } from "../src/components/progress/ProgressScreen";

afterEach(() => {
  cleanup();
  localStorage.clear();
});

function log(itemId: string, reps: string, load: string, set = 1, extra: Partial<WorkoutSessionLog> = {}): [string, WorkoutSessionLog] {
  return [`b1:${itemId}:${set}`, { blockId: "b1", itemId, reps, load, actualPse: "8", completed: true, set, ...extra }];
}

function entry(overrides: Partial<WorkoutHistoryEntry> = {}, logs: [string, WorkoutSessionLog][] = []): WorkoutHistoryEntry {
  const completedAt = overrides.completedAt ?? new Date().toISOString();
  const startedAt = new Date(Date.parse(completedAt) - 3_000_000).toISOString();
  return {
    id: `treino-a-prime-ciclo-4:${startedAt}`,
    workoutId: "treino-a-prime-ciclo-4",
    workoutTitle: "Treino A — Prime Ciclo 4",
    startedAt,
    completedAt,
    finishedAt: completedAt,
    durationSeconds: 3000,
    currentStepIndex: 0,
    logs: Object.fromEntries(logs),
    ...overrides,
  };
}

/* ---------------------------------------------------------------- */
/* Resumo da conclusão                                               */
/* ---------------------------------------------------------------- */

test("parseRepsCount lê repetições e ignora registros de tempo", () => {
  assert.equal(parseRepsCount("8"), 8);
  assert.equal(parseRepsCount("6 c/lado"), 6);
  assert.equal(parseRepsCount("12 totais"), 12);
  assert.equal(parseRepsCount("30s"), null);
  assert.equal(parseRepsCount("1 min"), null);
  assert.equal(parseRepsCount('45"'), null);
  assert.equal(parseRepsCount("até a falha"), null);
  assert.equal(parseRepsCount(""), null);
});

test("summarizeSession soma reps × carga das séries feitas e conta feitas e puladas", () => {
  const summary = summarizeSession(
    entry({ durationSeconds: 3125 }, [
      log("supino", "8", "60 kg", 1), // 480
      log("supino", "6", "62,5kg", 2), // 375
      log("bulgaro", "6 c/lado", "16kg", 1), // 96
      log("prancha", "40s", "BW", 1), // tempo e sem carga: fora do volume
      log("remada", "10", "elástico", 1), // sem carga numérica: fora
      log("supino", "8", "65 kg", 3, { completed: false, skipped: true }), // pulada
    ]),
  );
  assert.deepEqual(summary, { durationSeconds: 3125, doneSets: 5, skippedSets: 1, volumeKg: 951 });
  assert.equal(formatVolume(1240), "1.240 kg");
  assert.equal(formatVolume(951.5), "951,5 kg");
});

/* ---------------------------------------------------------------- */
/* Campos novos: normalização e validação                           */
/* ---------------------------------------------------------------- */

test("normalizeSessionFeedback guarda só o que foi respondido", () => {
  assert.deepEqual(normalizeSessionFeedback({ feeling: null, pains: null, note: "   " }), {});
  assert.deepEqual(normalizeSessionFeedback({ feeling: 4, pains: ["Ombro", "Ombro", " Joelho "], note: "  dormi mal  " }), {
    feeling: 4,
    pains: ["Ombro", "Joelho"],
    note: "dormi mal",
  });
  // "Nenhum" = lista vazia; nota é cortada no limite.
  assert.deepEqual(normalizeSessionFeedback({ pains: ["Nenhum"] }), { pains: [] });
  assert.equal(normalizeSessionFeedback({ note: "x".repeat(900) }).note?.length, 500);
  assert.deepEqual(normalizeSessionFeedback({ feeling: 7 }), {});
  assert.equal(feelingLabel(4.4), "Bom");
  assert.equal(feelingLabel(4.5), "Ótimo");
  assert.equal(feelingLabel(1), "Péssimo");
});

test("parseTrainingState aceita histórico antigo sem os campos e valida os novos", () => {
  const legacy = entry({}, [log("supino", "8", "60 kg")]);
  const parsedLegacy = parseTrainingState({ ...emptyTrainingState(), history: [legacy] });
  assert.equal("feeling" in parsedLegacy.history[0], false);
  assert.equal("pains" in parsedLegacy.history[0], false);
  assert.equal("note" in parsedLegacy.history[0], false);

  const rated = entry({ feeling: 4, pains: ["Ombro"], note: "dormi mal, treinei depois do jiu" });
  const noPain = entry({ completedAt: "2026-10-20T12:00:00.000Z", feeling: 2, pains: [] });
  const parsed = parseTrainingState({ ...emptyTrainingState(), history: [rated, noPain] });
  assert.equal(parsed.history[0].feeling, 4);
  assert.deepEqual(parsed.history[0].pains, ["Ombro"]);
  assert.equal(parsed.history[0].note, "dormi mal, treinei depois do jiu");
  assert.deepEqual(parsed.history[1].pains, []);

  // Backup exportado e importado de novo continua igual.
  assert.deepEqual(parseTrainingState(JSON.parse(JSON.stringify(parsed))), parsed);
  const merged = mergeTrainingState(emptyTrainingState(), parsed);
  assert.equal(merged.history.find((e) => e.id === rated.id)?.feeling, 4);

  const invalid: unknown[] = [
    { feeling: 0 },
    { feeling: 6 },
    { feeling: 3.5 },
    { feeling: "4" },
    { pains: "Ombro" },
    { pains: [1] },
    { pains: [""] },
    { note: 42 },
  ];
  for (const fields of invalid) {
    assert.throws(
      () => parseTrainingState({ ...emptyTrainingState(), history: [{ ...legacy, ...(fields as object) }] }),
      /inválid/,
      JSON.stringify(fields),
    );
  }
});

test("saveWorkoutFeedback grava a avaliação na sessão salva sem mexer nas outras", () => {
  const older = entry({ completedAt: "2026-10-20T12:00:00.000Z" });
  const latest = entry({ feeling: 1, note: "antiga" }, [log("supino", "8", "60 kg")]);
  localStorage.setItem(workoutStorageKeys.history, JSON.stringify([latest, older]));

  assert.equal(saveWorkoutFeedback(latest.id, { feeling: 5, pains: [] }), true);
  const [saved, untouched] = readWorkoutHistory();
  assert.equal(saved.feeling, 5);
  assert.deepEqual(saved.pains, []);
  assert.equal("note" in saved, false, "campo não respondido é removido");
  assert.deepEqual(saved.logs, latest.logs);
  assert.deepEqual(untouched, older);

  assert.equal(saveWorkoutFeedback("nao-existe", { feeling: 3 }), false);
  // O estado gravado continua válido para backup/sincronização.
  assert.doesNotThrow(() => parseTrainingState({ ...emptyTrainingState(), history: readWorkoutHistory() }));
});

test("averageFeeling considera só as sessões avaliadas", () => {
  assert.equal(averageFeeling([entry(), entry()]), null);
  assert.deepEqual(averageFeeling([entry({ feeling: 4 }), entry({ feeling: 5 }), entry()]), { average: 4.5, count: 2 });
});

/* ---------------------------------------------------------------- */
/* Tela de conclusão                                                 */
/* ---------------------------------------------------------------- */

const summary = { durationSeconds: 3125, doneSets: 18, skippedSets: 2, volumeKg: 1240 };

test("Tela de conclusão: resumo, sensação, incômodos com 'Nenhum' exclusivo e observação", () => {
  const calls: { feedback: SessionFeedback; next: string }[] = [];
  render(<SessionWrapUp workoutTitle="Treino A" summary={summary} onSave={(feedback, next) => calls.push({ feedback, next })} />);

  assert.ok(screen.getByRole("heading", { name: "Treino concluído" }));
  const resumo = screen.getByLabelText("Resumo da sessão");
  assert.equal(
    resumo.textContent,
    "Tempo total52:05Séries feitas18Séries puladas2Volume1.240 kg",
  );

  const bom = screen.getByRole("radio", { name: /Bom/ });
  fireEvent.click(bom);
  assert.equal(bom.getAttribute("aria-checked"), "true");
  fireEvent.click(screen.getByRole("radio", { name: /Ótimo/ }));
  assert.equal(bom.getAttribute("aria-checked"), "false");

  const nenhum = screen.getByRole("button", { name: "Nenhum" });
  const ombro = screen.getByRole("button", { name: "Ombro" });
  const joelho = screen.getByRole("button", { name: "Joelho" });
  fireEvent.click(ombro);
  fireEvent.click(joelho);
  assert.equal(ombro.getAttribute("aria-pressed"), "true");
  fireEvent.click(nenhum); // "Nenhum" desmarca os outros
  assert.equal(nenhum.getAttribute("aria-pressed"), "true");
  assert.equal(ombro.getAttribute("aria-pressed"), "false");
  assert.equal(joelho.getAttribute("aria-pressed"), "false");
  fireEvent.click(ombro); // marcar um incômodo tira o "Nenhum"
  assert.equal(nenhum.getAttribute("aria-pressed"), "false");
  assert.equal(ombro.getAttribute("aria-pressed"), "true");

  fireEvent.change(screen.getByLabelText(/Observações/), { target: { value: " dormi mal " } });
  fireEvent.click(screen.getByRole("button", { name: "Salvar e voltar para Hoje" }));
  assert.deepEqual(calls, [{ feedback: { feeling: 5, pains: ["Ombro"], note: "dormi mal" }, next: "home" }]);
});

test("Tela de conclusão: tudo é opcional e sem volume mostra traço", () => {
  const calls: { feedback: SessionFeedback; next: string }[] = [];
  render(
    <SessionWrapUp
      workoutTitle="Mobilidade"
      summary={{ ...summary, volumeKg: 0, skippedSets: 0 }}
      onSave={(feedback, next) => calls.push({ feedback, next })}
    />,
  );
  assert.ok(screen.getByText("-"));
  fireEvent.click(screen.getByRole("button", { name: "Ver histórico" }));
  assert.deepEqual(calls, [{ feedback: {}, next: "history" }]);
});

test("Fluxo completo: concluir o treino, avaliar e voltar para Hoje grava no histórico", async () => {
  const pushed: string[] = [];
  const router = { back() {}, forward() {}, refresh() {}, hmrRefresh() {}, push(href: string) { pushed.push(href); }, replace() {}, prefetch() {} };
  const workout: Workout = {
    id: "treino-fechamento",
    title: "Treino Fechamento",
    month: "Nov",
    year: 2026,
    type: "monthly",
    blocks: [{ id: "b1", title: "Supino", type: "single", sets: "1", order: 1, items: [{ id: "supino", name: "Supino", reps: "8" }] }],
  };

  render(
    <AppRouterContext.Provider value={router}>
      <WorkoutRunner autoStart workout={workout} />
    </AppRouterContext.Provider>,
  );

  fireEvent.change(await screen.findByLabelText(/realizad[oa]s?$/), { target: { value: "8" } });
  fireEvent.change(screen.getByLabelText(/^Carga/), { target: { value: "60 kg" } });
  fireEvent.change(screen.getByLabelText(/^PSE/), { target: { value: "8" } });
  fireEvent.click(await screen.findByRole("button", { name: /^Concluir/ }, { timeout: 2000 }));

  assert.ok(await screen.findByRole("heading", { name: "Treino concluído" }, { timeout: 2000 }));
  assert.ok(screen.getByText("480 kg"));
  // A sessão já está salva antes da avaliação (nada se perde se o app fechar).
  assert.equal(readWorkoutHistory().length, 1);
  assert.equal(readWorkoutHistory()[0].feeling, undefined);

  fireEvent.click(screen.getByRole("radio", { name: /Bom/ }));
  fireEvent.click(screen.getByRole("button", { name: "Lombar" }));
  fireEvent.change(screen.getByLabelText(/Observações/), { target: { value: "treinei depois do jiu" } });
  fireEvent.click(screen.getByRole("button", { name: "Salvar e voltar para Hoje" }));

  const [saved] = readWorkoutHistory();
  assert.equal(saved.feeling, 4);
  assert.deepEqual(saved.pains, ["Lombar"]);
  assert.equal(saved.note, "treinei depois do jiu");
  assert.deepEqual(pushed, ["/"]);
});

/* ---------------------------------------------------------------- */
/* Onde a avaliação aparece                                          */
/* ---------------------------------------------------------------- */

test("Home: Última sessão mostra sensação e observação; Resumo da semana mostra a sensação média", async () => {
  localStorage.setItem(
    workoutStorageKeys.history,
    JSON.stringify([
      entry({ feeling: 4, note: "dormi mal" }),
      entry({ completedAt: new Date(Date.now() - 60_000).toISOString(), feeling: 5 }),
    ]),
  );

  render(<LastSessionSection />);
  assert.ok(await screen.findByText("Bom (4/5)"));
  assert.ok(screen.getByText("“dormi mal”"));
  cleanup();

  render(<WeekSummarySection />);
  assert.ok(await screen.findByText("Sensação média"));
  assert.ok(screen.getByText("4,5"));
  assert.ok(screen.getByText("Ótimo"));
  assert.ok(screen.getByText("2 treinos avaliados de 1 a 5"));
});

test("Home: Resumo da semana sem avaliações convida a avaliar", async () => {
  localStorage.setItem(workoutStorageKeys.history, JSON.stringify([entry()]));
  render(<WeekSummarySection />);
  assert.ok(await screen.findByText("Avalie ao concluir o treino"));
});

test("Histórico: sensação, observação e incômodos como etiqueta no card da sessão", async () => {
  localStorage.setItem(
    workoutStorageKeys.history,
    JSON.stringify([entry({ feeling: 2, pains: ["Ombro", "Punho"], note: "dormi mal" }), entry({ completedAt: "2026-10-20T12:00:00.000Z", pains: [] })]),
  );
  render(<WorkoutHistory />);
  assert.ok(await screen.findByText("Ruim (2/5)"));
  assert.ok(screen.getByText("“dormi mal”"));
  assert.ok(screen.getByText("Ombro"));
  assert.ok(screen.getByText("Punho"));
  // "Nenhum" não vira etiqueta.
  assert.equal(screen.getAllByLabelText("Incômodos").length, 1);
});

test("Progresso > Cargas: sensação média do ciclo quando houver avaliações", async () => {
  localStorage.setItem(
    workoutStorageKeys.history,
    JSON.stringify([
      entry({ completedAt: "2026-10-20T12:00:00.000Z", feeling: 3 }),
      entry({ completedAt: "2026-10-27T12:00:00.000Z", feeling: 4 }),
      entry({ completedAt: "2026-09-27T12:00:00.000Z", feeling: 1 }), // fora do ciclo
    ]),
  );
  render(<ProgressScreen />);
  await waitFor(() => assert.ok(screen.getByTestId("cycle-feeling")));
  assert.equal(
    screen.getByTestId("cycle-feeling").textContent,
    "Sensação média no ciclo: 3,5 (Bom) em 2 treinos avaliados",
  );
});
