import test, { afterEach } from "node:test";
import assert from "node:assert/strict";

import "./setup-dom";
import { render, screen, fireEvent, cleanup, waitFor } from "@testing-library/react";

import type { WorkoutHistoryEntry } from "../src/types";
import { WorkoutHistory } from "../src/components/history/WorkoutHistory";
import { deleteWorkoutHistoryEntry, readWorkoutHistory, workoutStorageKeys } from "../src/lib/workout-storage";

afterEach(() => {
  cleanup();
  localStorage.clear();
});

function entry(id: string, title: string, completedAt: string): WorkoutHistoryEntry {
  const startedAt = new Date(Date.parse(completedAt) - 600_000).toISOString();
  return {
    id,
    workoutId: "mobilidade-com-peso",
    workoutTitle: title,
    startedAt,
    completedAt,
    finishedAt: completedAt,
    durationSeconds: 600,
    currentStepIndex: 0,
    logs: {},
  };
}

const teste = entry("a", "Cardio 1 - Teste", "2026-11-06T23:20:00.000Z");
const real = entry("b", "Treino A real", "2026-11-04T16:00:00.000Z");

test("deleteWorkoutHistoryEntry remove só a sessão escolhida", () => {
  localStorage.setItem(workoutStorageKeys.history, JSON.stringify([teste, real]));
  assert.equal(deleteWorkoutHistoryEntry("a"), true);
  assert.deepEqual(readWorkoutHistory().map((e) => e.id), ["b"]);
  assert.equal(deleteWorkoutHistoryEntry("nao-existe"), false);
  assert.deepEqual(readWorkoutHistory().map((e) => e.id), ["b"]);
});

test("Histórico: excluir pede confirmação, cancelar mantém e confirmar remove só aquela sessão", async () => {
  localStorage.setItem(workoutStorageKeys.history, JSON.stringify([teste, real]));
  render(<WorkoutHistory />);
  await screen.findByText("Cardio 1 - Teste");

  fireEvent.click(screen.getAllByRole("button", { name: /Ver detalhes/ })[0]);

  const asked: string[] = [];
  window.confirm = (message?: string) => {
    asked.push(String(message));
    return false;
  };
  fireEvent.click(screen.getByRole("button", { name: "Excluir esta sessão" }));
  assert.equal(asked.length, 1);
  assert.match(asked[0], /Cardio 1 - Teste/);
  assert.equal(readWorkoutHistory().length, 2, "cancelar não apaga");

  window.confirm = () => true;
  fireEvent.click(screen.getByRole("button", { name: "Excluir esta sessão" }));
  await waitFor(() => assert.equal(screen.queryByText("Cardio 1 - Teste"), null));
  assert.ok(screen.getByText("Treino A real"));
  assert.deepEqual(readWorkoutHistory().map((e) => e.id), ["b"]);
});
