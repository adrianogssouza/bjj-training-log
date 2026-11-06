import test, { afterEach } from "node:test";
import assert from "node:assert/strict";

import "./setup-dom";
import { render, screen, fireEvent, cleanup, waitFor } from "@testing-library/react";
import { AppRouterContext } from "next/dist/shared/lib/app-router-context.shared-runtime";

import type { WorkoutBlock, WorkoutHistoryEntry } from "../src/types";
import { WorkoutBlockList } from "../src/components/workout/WorkoutBlockList";
import { WorkoutDetailPageActions } from "../src/components/workout/WorkoutDetailPageActions";
import { LastSessionSection } from "../src/components/home/LastSessionSection";
import { WorkoutHistory } from "../src/components/history/WorkoutHistory";
import { deleteBikeSession, loadBikeData, newBikeData, sanitizeBikeData, storeBikeData } from "../src/lib/bike-cardio";
import { seedWorkouts } from "../src/data/seed-workouts";
import { workoutStorageKeys } from "../src/lib/workout-storage";

afterEach(() => {
  cleanup();
  localStorage.clear();
});

/* ---------------------------------------------------------------- */
/* Detalhe do treino                                                 */
/* ---------------------------------------------------------------- */

const blocks: WorkoutBlock[] = [
  {
    id: "b1",
    title: "Supino + Remada",
    type: "bi_set",
    sets: "3",
    order: 1,
    items: [
      { id: "supino", name: "Supino", reps: "8", targetPse: "8" },
      { id: "prancha", name: "Prancha", time: "40s" },
      { id: "livre", name: "Respiração" }, // sem reps, tempo nem PSE
    ],
  },
];

test("Detalhe: 'Séries' em português, sem '(guiado)' repetido e sem campos vazios", () => {
  render(<WorkoutBlockList blocks={blocks} variant="complementary" categoryLabel="Cardio" formatLabel="Cardio guiado" />);

  assert.ok(screen.getByText("Séries:"));
  assert.equal(screen.queryByText(/Sets/), null);
  assert.equal(screen.queryByText(/\(guiado\)/), null);
  assert.ok(screen.getByRole("heading", { name: "Supino" }));

  // Só aparece o que existe: nada de "Tempo: -" ou "PSE alvo: -".
  assert.equal(screen.getAllByText("Reps").length, 1);
  assert.equal(screen.getAllByText("Tempo").length, 1);
  assert.equal(screen.getAllByText("PSE alvo").length, 1);
  assert.equal(screen.queryByText("-"), null);
  assert.equal(screen.queryByText("Etapa"), null);
  assert.ok(screen.getByText("40s"));
});

test("Detalhe: o treino principal também usa 'Séries'", () => {
  render(<WorkoutBlockList blocks={blocks} variant="monthly" />);
  assert.ok(screen.getByText("Séries:"));
  assert.equal(screen.queryByText(/Sets/), null);
});

test("Detalhe: nenhum treino do catálogo tem '(guiado)' duplicado ou campo vazio na tela", () => {
  for (const workout of seedWorkouts) {
    const { unmount } = render(
      <WorkoutBlockList blocks={workout.blocks} variant={workout.type} categoryLabel="Cardio" formatLabel="Sequência guiada" />,
    );
    assert.equal(screen.queryByText(/\(guiado\)/), null, workout.id);
    assert.equal(screen.queryByText("-"), null, workout.id);
    unmount();
  }
});

test("Detalhe: o botão Iniciar treino fica acima da barra de navegação no celular", () => {
  const router = { back() {}, forward() {}, refresh() {}, hmrRefresh() {}, push() {}, replace() {}, prefetch() {} };
  render(
    <AppRouterContext.Provider value={router}>
      <WorkoutDetailPageActions workoutId="treino-a-prime-ciclo-4" />
    </AppRouterContext.Provider>,
  );
  const bar = screen.getByTestId("workout-sticky-action");
  // A barra de navegação fixa tem 64px + área segura; o botão sobe esse tanto no celular.
  assert.match(bar.className, /bottom-\[calc\(64px\+env\(safe-area-inset-bottom\)\)\]/);
  assert.match(bar.className, /md:bottom-0/);
  assert.ok(screen.getByRole("link", { name: "Iniciar treino" }));
});

/* ---------------------------------------------------------------- */
/* Última sessão                                                     */
/* ---------------------------------------------------------------- */

function entry(workoutId: string, title: string): WorkoutHistoryEntry {
  const completedAt = new Date().toISOString();
  return {
    id: `${workoutId}:x`,
    workoutId,
    workoutTitle: title,
    startedAt: new Date(Date.now() - 600_000).toISOString(),
    completedAt,
    finishedAt: completedAt,
    durationSeconds: 600,
    currentStepIndex: 0,
    logs: {},
  };
}

const lastLabel = async (workoutId: string, title: string) => {
  localStorage.setItem(workoutStorageKeys.history, JSON.stringify([entry(workoutId, title)]));
  const { container, unmount } = render(<LastSessionSection />);
  await screen.findByText(title);
  const badge = container.querySelector("span.rounded-full")?.textContent;
  unmount();
  return badge;
};

test("Última sessão: Treino A/B é Musculação; Cardio, Core e Mobilidade mostram a própria categoria", async () => {
  const cardio = seedWorkouts.find((w) => w.title.startsWith("Cardio"))!;
  const core = seedWorkouts.find((w) => w.title.startsWith("Core"))!;
  const mobilidade = seedWorkouts.find((w) => w.id === "mobilidade-com-peso")!;

  assert.equal(await lastLabel("treino-a-prime-ciclo-4", "Treino A"), "Musculação");
  assert.equal(await lastLabel(cardio.id, cardio.title), "Cardio");
  assert.equal(await lastLabel(core.id, core.title), "Core");
  assert.equal(await lastLabel(mobilidade.id, mobilidade.title), "Mobilidade");
});

/* ---------------------------------------------------------------- */
/* Excluir pedalada pelo Histórico                                   */
/* ---------------------------------------------------------------- */

function seedBike() {
  storeBikeData(
    sanitizeBikeData({
      ...newBikeData(),
      startedOn: "2026-11-02",
      sessions: [
        { id: "teste", date: "2026-11-06", status: "completed", minutes: 25 },
        { id: "real", date: "2026-11-04", status: "completed", minutes: 30 },
      ],
    }),
  );
}

test("deleteBikeSession remove só a pedalada escolhida", () => {
  seedBike();
  assert.equal(deleteBikeSession("teste"), true);
  assert.deepEqual(loadBikeData().sessions.map((s) => s.id), ["real"]);
  assert.equal(deleteBikeSession("nao-existe"), false);
  assert.equal(loadBikeData().sessions.length, 1);
  assert.equal(loadBikeData().startedOn, "2026-11-02", "o programa não muda");
});

test("Progresso > Histórico: excluir pedalada pede confirmação e remove só aquela", async () => {
  seedBike();
  render(<WorkoutHistory embedded />);
  await waitFor(() => assert.equal(screen.getAllByRole("button", { name: /Ver detalhes/ }).length, 2));

  // A mais recente (06/11, 25 min) vem primeiro.
  fireEvent.click(screen.getAllByRole("button", { name: /Ver detalhes/ })[0]);

  const asked: string[] = [];
  window.confirm = (message?: string) => {
    asked.push(String(message));
    return false;
  };
  fireEvent.click(screen.getByRole("button", { name: "Excluir esta pedalada" }));
  assert.equal(asked.length, 1);
  assert.match(asked[0], /25 min/);
  assert.equal(loadBikeData().sessions.length, 2, "cancelar não apaga");

  window.confirm = () => true;
  fireEvent.click(screen.getByRole("button", { name: "Excluir esta pedalada" }));
  await waitFor(() => assert.deepEqual(loadBikeData().sessions.map((s) => s.id), ["real"]));
  await waitFor(() => assert.equal(screen.getAllByRole("button", { name: /Ver detalhes/ }).length, 1));
});
