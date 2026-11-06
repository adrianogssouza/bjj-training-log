import test, { afterEach } from "node:test";
import assert from "node:assert/strict";

import "./setup-dom";
import { render, screen, fireEvent, waitFor, cleanup, within } from "@testing-library/react";
import { AppRouterContext } from "next/dist/shared/lib/app-router-context.shared-runtime";

import type { Workout, WorkoutSessionLog } from "../src/types";
import { WorkoutRunner } from "../src/components/workout/WorkoutRunner";
import { seedWorkouts } from "../src/data/seed-workouts";
import { parseTrainingState, emptyTrainingState } from "../src/lib/training-state";
import {
  createWorkoutHistoryEntry,
  createWorkoutSession,
  readActiveWorkoutSession,
  saveWorkoutHistoryEntry,
  workoutStorageKeys,
} from "../src/lib/workout-storage";
import { WorkoutHistory } from "../src/components/history/WorkoutHistory";
import { AUTO_REST_STORAGE_KEY } from "../src/lib/rest-preference";
import {
  buildWorkoutSteps,
  countWorkoutSteps,
  findPreviousLog,
  getBlockRestSeconds,
  groupStepsByBlock,
  isRoundComplete,
  moveStepToCurrent,
  orderSteps,
  parseRestSeconds,
  parseSetCount,
  skipSteps,
} from "../src/lib/workout-steps";

afterEach(() => {
  cleanup();
  localStorage.clear();
});

const router = { back() {}, forward() {}, refresh() {}, hmrRefresh() {}, push() {}, replace() {}, prefetch() {} };

function makeWorkout(restNote = 'Descanso entre séries: 60–90".'): Workout {
  return {
    id: "treino-foco",
    title: "Treino Foco",
    month: "Nov",
    year: 2026,
    type: "monthly",
    blocks: [
      {
        id: "b1",
        title: "Remada + Flexão",
        type: "bi_set",
        sets: "2",
        order: 1,
        notes: restNote,
        items: [
          { id: "remada", name: "Remada", reps: "10", targetPse: "8" },
          { id: "flexao", name: "Flexão", reps: "12", targetPse: "8" },
        ],
      },
      {
        id: "b2",
        title: "Prancha",
        type: "single",
        sets: "1",
        order: 2,
        items: [{ id: "prancha", name: "Prancha", time: "40s" }],
      },
    ],
  };
}

function renderRunner(workout: Workout) {
  return render(
    <AppRouterContext.Provider value={router}>
      <WorkoutRunner autoStart workout={workout} />
    </AppRouterContext.Provider>,
  );
}

function log(blockId: string, itemId: string, extra: Partial<WorkoutSessionLog> = {}): WorkoutSessionLog {
  return { blockId, itemId, reps: "", load: "", actualPse: "", completed: false, ...extra };
}

async function fillAndComplete(reps: string, pse = "8") {
  const repsInput = await screen.findByLabelText(/realizad[oa]s?$/);
  fireEvent.change(repsInput, { target: { value: reps } });
  fireEvent.change(screen.getByLabelText("PSE real"), { target: { value: pse } });
  // Após cada conclusão o botão fica em "Salvando..." por um instante.
  fireEvent.click(await screen.findByRole("button", { name: /^Concluir/ }, { timeout: 2000 }));
}

test("quantidade de séries e descanso são lidos do treino", () => {
  assert.equal(parseSetCount("3"), 3);
  assert.equal(parseSetCount("3x"), 3);
  assert.equal(parseSetCount("1 válida"), 1);
  assert.equal(parseSetCount("2-3"), 3);
  assert.equal(parseSetCount(""), 1);

  assert.equal(parseRestSeconds('Descanso entre séries: 60–90".'), 60);
  assert.equal(parseRestSeconds("Descanso entre séries: 2–3'."), 120);
  assert.equal(parseRestSeconds("Descanso entre séries: 90\"–2'."), 90);
  assert.equal(parseRestSeconds("Escolha o protocolo pela frequência."), null);
  assert.equal(parseRestSeconds(undefined), null);

  // Todos os blocos reais têm séries válidas; blocos com "Descanso" geram tempo.
  for (const workout of seedWorkouts) {
    for (const block of workout.blocks) {
      assert.ok(parseSetCount(block.sets) >= 1, block.id);
      if (block.notes?.includes("Descanso entre séries")) {
        assert.ok((getBlockRestSeconds(block) ?? 0) >= 30, block.id);
      }
    }
  }
});

test("séries de bi-set são intercaladas por rodada e a 1ª mantém o id antigo", () => {
  const workout = makeWorkout();
  const steps = buildWorkoutSteps(workout);
  assert.deepEqual(
    steps.map((step) => step.id),
    ["b1:remada", "b1:flexao", "b1:remada#2", "b1:flexao#2", "b2:prancha"],
  );
  assert.equal(countWorkoutSteps(workout), 5);

  const groups = groupStepsByBlock(steps);
  assert.equal(groups.length, 2);
  assert.deepEqual(groups[0].exercises.map((exercise) => exercise.steps.length), [2, 2]);

  const logs = { "b1:remada": log("b1", "remada", { completed: true }) };
  assert.equal(isRoundComplete(steps, "b1", 1, logs), false);
  logs["b1:flexao" as keyof typeof logs] = log("b1", "flexao", { skipped: true });
  assert.equal(isRoundComplete(steps, "b1", 1, logs), true);
});

test("fila: fazer agora, pular e retomar série pulada", () => {
  const ids = ["a", "b", "c", "d"];
  const moved = moveStepToCurrent(ids, 1, "d", {});
  assert.deepEqual(moved?.stepOrder, ["a", "d", "b", "c"]);
  assert.equal(moved?.currentStepIndex, 1);

  // "a" foi pulada; trazer de volta a torna atual e pendente.
  const logs = { a: log("x", "a", { skipped: true, skipReason: "Dor/desconforto" }) };
  const revived = moveStepToCurrent(ids, 1, "a", logs);
  assert.deepEqual(revived?.stepOrder, ["a", "b", "c", "d"]);
  assert.equal(revived?.currentStepIndex, 0);
  assert.equal(revived?.logs.a.skipped, false);
  assert.equal(revived?.logs.a.skipReason, undefined);

  // Série feita não volta para a fila.
  assert.equal(moveStepToCurrent(ids, 1, "a", { a: log("x", "a", { completed: true }) }), null);

  assert.deepEqual(skipSteps(ids, 1, ["b", "d"]), {
    stepOrder: ["a", "b", "d", "c"],
    currentStepIndex: 3,
  });

  const steps = buildWorkoutSteps(makeWorkout());
  assert.deepEqual(
    orderSteps(steps, ["b1:flexao", "b1:remada"]).map((step) => step.id),
    ["b1:flexao", "b1:remada", "b1:remada#2", "b1:flexao#2", "b2:prancha"],
  );
});

test("última execução usa a mesma série, ou o registro antigo sem série", () => {
  const steps = buildWorkoutSteps(makeWorkout());
  const secondSet = steps.find((step) => step.id === "b1:remada#2")!;
  const legacyHistory = [
    { workoutId: "treino-foco", logs: { "b1:remada": log("b1", "remada", { reps: "9", load: "20kg", completed: true }) } },
  ];
  assert.equal(findPreviousLog(legacyHistory, "treino-foco", secondSet)?.load, "20kg");

  const newHistory = [
    {
      workoutId: "treino-foco",
      logs: {
        "b1:remada": log("b1", "remada", { reps: "10", load: "20kg", completed: true, set: 1 }),
        "b1:remada#2": log("b1", "remada", { reps: "8", load: "22kg", completed: true, set: 2 }),
      },
    },
  ];
  assert.equal(findPreviousLog(newHistory, "treino-foco", secondSet)?.load, "22kg");
});

test("backup aceita o número da série e rejeita valor inválido", () => {
  const session = {
    workoutId: "treino-foco",
    startedAt: "2026-11-05T10:00:00.000Z",
    currentStepIndex: 1,
    logs: { "b1:remada#2": log("b1", "remada", { set: 2, completed: true }) },
  };
  const parsed = parseTrainingState({ ...emptyTrainingState(), activeSessions: { "treino-foco": session } });
  assert.equal(parsed.activeSessions["treino-foco"].logs["b1:remada#2"].set, 2);

  const broken = { ...session, logs: { x: log("b1", "remada", { set: 0 }) } };
  assert.throws(() => parseTrainingState({ ...emptyTrainingState(), activeSessions: { "treino-foco": broken } }));
});

test("modo foco mostra a série atual e a lista agrupada permite fazer agora", async () => {
  renderRunner(makeWorkout());

  await screen.findByRole("heading", { name: "Remada" });
  assert.ok(screen.getByText(/Série 1/));
  assert.ok(screen.getByText("0/5"));

  fireEvent.click(screen.getByRole("button", { name: /Ver lista/ }));
  const dialog = await screen.findByRole("dialog", { name: "Lista do treino" });
  assert.ok(within(dialog).getByRole("region", { name: /Bloco 1: Remada \+ Flexão/ }));
  assert.ok(within(dialog).getByRole("region", { name: /Bloco 2: Prancha/ }));
  assert.equal(
    within(dialog).getByRole("button", { name: "Série 1 de Remada: em andamento" }).hasAttribute("disabled"),
    true,
  );

  fireEvent.click(within(dialog).getByRole("button", { name: "Série 2 de Flexão: pendente, fazer agora" }));

  await screen.findByRole("heading", { name: "Flexão" });
  assert.ok(!screen.queryByRole("dialog", { name: "Lista do treino" }));
  assert.ok(screen.getByText(/Agora: Flexão · série 2 de 2/));

  const stored = readActiveWorkoutSession("treino-foco");
  assert.equal(stored?.stepOrder?.[0], "b1:flexao#2");
  assert.equal(stored?.currentStepIndex, 0);
});

test("série pulada aparece na lista e pode ser feita depois", async () => {
  renderRunner(makeWorkout());
  await screen.findByRole("heading", { name: "Remada" });

  fireEvent.click(screen.getByRole("button", { name: "Opções da série" }));
  fireEvent.click(await screen.findByRole("button", { name: "Pular esta série" }));
  fireEvent.click(screen.getByRole("button", { name: "Pular série" }));

  await screen.findByRole("heading", { name: "Flexão" });
  const stored = readActiveWorkoutSession("treino-foco");
  assert.equal(stored?.logs["b1:remada"].skipped, true);
  assert.equal(stored?.logs["b1:remada"].set, 1);

  fireEvent.click(screen.getByRole("button", { name: /Ver lista/ }));
  const dialog = await screen.findByRole("dialog", { name: "Lista do treino" });
  fireEvent.click(within(dialog).getByRole("button", { name: "Série 1 de Remada: pulada, fazer agora" }));

  await screen.findByRole("heading", { name: "Remada" });
  assert.equal(readActiveWorkoutSession("treino-foco")?.logs["b1:remada"].skipped, false);
});

test("não farei hoje pula todas as séries restantes do exercício", async () => {
  renderRunner(makeWorkout());
  await screen.findByRole("heading", { name: "Remada" });

  fireEvent.click(screen.getByRole("button", { name: "Opções da série" }));
  fireEvent.click(await screen.findByRole("button", { name: "Não farei hoje (2 séries)" }));
  fireEvent.click(screen.getByRole("button", { name: "Não farei hoje" }));

  await screen.findByRole("heading", { name: "Flexão" });
  const stored = readActiveWorkoutSession("treino-foco");
  assert.equal(stored?.logs["b1:remada"].skipped, true);
  assert.equal(stored?.logs["b1:remada#2"].skipped, true);
  assert.equal(stored?.currentStepIndex, 2);
});

test("descanso automático começa ao terminar a rodada e pode ser pulado", async () => {
  renderRunner(makeWorkout());
  await screen.findByRole("heading", { name: "Remada" });

  const toggle = screen.getByRole("switch", { name: /Descanso automático/ });
  assert.equal(toggle.getAttribute("aria-checked"), "false");
  fireEvent.click(toggle);
  assert.equal(toggle.getAttribute("aria-checked"), "true");
  assert.equal(localStorage.getItem(AUTO_REST_STORAGE_KEY), "1");

  // 1ª série da Remada: a rodada ainda não terminou, então não há descanso.
  fireEvent.change(screen.getByLabelText("Carga usada"), { target: { value: "24kg" } });
  await fillAndComplete("10");
  await screen.findByRole("heading", { name: "Flexão" });
  assert.ok(!screen.queryByRole("region", { name: "Descanso" }));
  assert.ok(screen.getByText("Descanso de 1 min antes"));

  // Flexão fecha a rodada 1: descanso de 60s (menor valor de 60–90").
  await fillAndComplete("12");
  const restPanel = await screen.findByRole("region", { name: "Descanso" });
  assert.ok(within(restPanel).getByText("1:00"));
  assert.ok(within(restPanel).getByText("Remada · série 2 de 2"));

  fireEvent.click(screen.getByRole("button", { name: "Mais 30 segundos" }));
  assert.ok(within(restPanel).getByText("de 1:30"));

  fireEvent.click(screen.getByRole("button", { name: "Pular descanso" }));
  await screen.findByRole("heading", { name: "Remada" });
  assert.ok(screen.getByText(/Série 2/));
  // A carga da série anterior vem preenchida.
  assert.equal((screen.getByLabelText("Carga usada") as HTMLInputElement).value, "24kg");
});

test("descanso termina sozinho e o treino segue na próxima série", async () => {
  renderRunner(makeWorkout('Descanso entre séries: 1".'));
  await screen.findByRole("heading", { name: "Remada" });
  fireEvent.click(screen.getByRole("switch", { name: /Descanso automático/ }));

  await fillAndComplete("10");
  await screen.findByRole("heading", { name: "Flexão" });
  await fillAndComplete("12");
  await screen.findByRole("region", { name: "Descanso" });

  await waitFor(() => assert.ok(!screen.queryByRole("region", { name: "Descanso" })), { timeout: 3000 });
  assert.ok(screen.getByText("Descanso terminado. Bora!"));
  assert.ok(screen.getByRole("heading", { name: "Remada" }));
});

test("sem descanso automático, a rodada termina sem contagem", async () => {
  localStorage.setItem(AUTO_REST_STORAGE_KEY, "0");
  renderRunner(makeWorkout());
  await screen.findByRole("heading", { name: "Remada" });
  await fillAndComplete("10");
  await screen.findByRole("heading", { name: "Flexão" });
  await fillAndComplete("12");
  await screen.findByRole("heading", { name: "Remada" });
  assert.ok(!screen.queryByRole("region", { name: "Descanso" }));
});

test("sessão em andamento criada antes das séries continua de onde parou", async () => {
  const legacy = {
    workoutId: "treino-foco",
    startedAt: "2026-11-05T10:00:00.000Z",
    currentStepIndex: 1,
    stepOrder: ["b1:remada", "b1:flexao", "b2:prancha"],
    logs: { "b1:remada": log("b1", "remada", { reps: "10", load: "20kg", actualPse: "8", completed: true }) },
  };
  localStorage.setItem(workoutStorageKeys.activeSession("treino-foco"), JSON.stringify(legacy));

  renderRunner(makeWorkout());
  await screen.findByRole("heading", { name: "Flexão" });
  // 1 registrada de 5 séries; as séries novas entram no fim da fila.
  assert.ok(screen.getByText("1/5"));
});

test("histórico junta as séries do mesmo exercício", async () => {
  const workout = seedWorkouts.find((w) => w.id === "treino-a-prime-ciclo-4")!;
  const block = workout.blocks[0];
  const [first, second] = block.items;
  const session = {
    ...createWorkoutSession(workout.id),
    logs: {
      [`${block.id}:${first.id}`]: log(block.id, first.id, { reps: "12", load: "BW", actualPse: "6", completed: true, set: 1 }),
      [`${block.id}:${first.id}#2`]: log(block.id, first.id, { reps: "10", load: "BW", actualPse: "7", completed: true, set: 2 }),
      [`${block.id}:${first.id}#3`]: log(block.id, first.id, { skipped: true, skipReason: "Falta de tempo", set: 3 }),
      [`${block.id}:${second.id}`]: log(block.id, second.id, { reps: "12", actualPse: "8", completed: true }),
    },
  };
  saveWorkoutHistoryEntry(createWorkoutHistoryEntry(session, workout.title, "2026-11-05T12:00:00.000Z"));

  render(<WorkoutHistory />);
  fireEvent.click(await screen.findByRole("button", { name: /Ver detalhes/ }));

  assert.equal(screen.getAllByText(first.name).length, 1);
  assert.ok(screen.getByText("2 feitas · 1 pulada"));
  assert.ok(screen.getByText("Série 3"));
  assert.ok(screen.getByText("Pulada · Falta de tempo"));
  // Registro de uma série só (ou antigo) continua no formato de antes.
  assert.ok(screen.getByText(second.name));
  assert.ok(screen.getByText("Concluído"));
});
