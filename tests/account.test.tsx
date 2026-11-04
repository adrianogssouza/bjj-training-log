import test, { afterEach } from "node:test";
import assert from "node:assert/strict";
import type { Session, SupabaseClient } from "@supabase/supabase-js";
import { emptyTrainingState, type TrainingState } from "../src/lib/training-state";
import { bindAccountStorage, createWorkoutHistoryEntry, createWorkoutSession, readWorkoutHistory, saveActiveWorkoutSession, workoutStorageKeys } from "../src/lib/workout-storage";
import { cacheKey, saveAccountCache } from "../src/lib/cloud-storage";

import "./setup-dom";
import { render, screen, fireEvent, waitFor, cleanup, act } from "@testing-library/react";
import { Account } from "../src/components/auth/CloudWorkspace";
import { WorkoutRunner } from "../src/components/workout/WorkoutRunner";
import { AppRouterContext } from "next/dist/shared/lib/app-router-context.shared-runtime";
const session = { user: { id: "user-a", email: "test@example.com" } } as Session;
type Row = { data: TrainingState; revision: number };
function fakeApi(initial: Row | null = null) {
  let row = initial;
  let fail = false;
  const api = {
    auth: { signOut: async () => ({ error: null }) },
    from(table: string) {
      assert.equal(table, "bjj_training_states");
      let action = "read";
      let payload: Row;
      const filters: Record<string, unknown> = {};
      const query = {
        select() { return query; },
        eq(key: string, value: unknown) { filters[key] = value; return query; },
        insert(value: Row) { action = "insert"; payload = value; return query; },
        update(value: Row) { action = "update"; payload = value; return query; },
        async maybeSingle() {
          if (fail) return { data: null, error: { code: "offline" } };
          if (action === "insert" && row) return { data: null, error: { code: "23505" } };
          if (action === "update" && filters.revision !== row?.revision) return { data: null, error: null };
          if (action !== "read") row = structuredClone(payload);
          return { data: structuredClone(row), error: null };
        },
      };
      return query;
    },
  };
  return { api: api as unknown as SupabaseClient, get row() { return row; }, set row(value) { row = value; }, set fail(value: boolean) { fail = value; } };
}
afterEach(() => { cleanup(); bindAccountStorage(null); localStorage.clear(); });

test("primeiro login importa dados do navegador e preserva o original", async () => {
  const s = createWorkoutSession("treino-a");
  const history = [createWorkoutHistoryEntry(s, "A", new Date().toISOString())];
  localStorage.setItem(workoutStorageKeys.history, JSON.stringify(history));
  const store = fakeApi();
  render(<Account api={store.api} session={session}><p>Aplicativo liberado</p></Account>);
  fireEvent.click(await screen.findByText("Importar dados deste navegador"));
  await screen.findByText("Aplicativo liberado");
  await waitFor(() => assert.equal(store.row?.data.history.length, 1));
  assert.equal(localStorage.getItem(workoutStorageKeys.history), JSON.stringify(history));
});

test("conta existente carrega somente seus dados e sincroniza sessão ativa", async () => {
  const store = fakeApi({ data: emptyTrainingState(), revision: 0 });
  const s = createWorkoutSession("treino-b");
  render(<Account api={store.api} session={session}><p>Aplicativo liberado</p></Account>);
  await screen.findByText("Aplicativo liberado");
  act(() => saveActiveWorkoutSession(s));
  await waitFor(() => assert.deepEqual(store.row?.data.activeSessions["treino-b"], s));
  assert.equal(JSON.parse(localStorage.getItem(cacheKey(session.user.id))!).pending, false);
});

test("cópia pendente e nuvem mais nova bloqueiam edição sem apagar a cópia", async () => {
  const data = emptyTrainingState();
  const s = createWorkoutSession("treino-a");
  data.activeSessions[s.workoutId] = s;
  saveAccountCache(session.user.id, { data, baseRevision: 0, pending: true });
  const store = fakeApi({ data: emptyTrainingState(), revision: 2 });
  render(<Account api={store.api} session={session}><p>Aplicativo liberado</p></Account>);
  await screen.findByText("Carregar versão da nuvem");
  assert.equal(screen.queryByText("Aplicativo liberado"), null);
  assert.equal(JSON.parse(localStorage.getItem(cacheKey(session.user.id))!).data.activeSessions[s.workoutId].startedAt, s.startedAt);
});

test("consulta remota notifica a tela e atualiza histórico sem recarregar", async () => {
  const store = fakeApi({ data: emptyTrainingState(), revision: 0 });
  render(<Account api={store.api} session={session}><p>Aplicativo liberado</p></Account>);
  await screen.findByText("Aplicativo liberado");
  const s = createWorkoutSession("treino-a");
  const data = { ...emptyTrainingState(), history: [createWorkoutHistoryEntry(s, "A", new Date().toISOString())] };
  let notified = false;
  const update = () => { notified = true; };
  window.addEventListener("bjj-cloud-updated", update);
  store.row = { data, revision: 1 };
  act(() => window.dispatchEvent(new Event("focus")));
  await waitFor(() => assert.equal(readWorkoutHistory().length, 1));
  assert.equal(notified, true);
  window.removeEventListener("bjj-cloud-updated", update);
});

test("link de início retoma sessão sincronizada e atualização remota mantém timer e carga", async () => {
  const stored = {
    ...createWorkoutSession("treino-a"), startedAt: "2026-11-04T12:00:00.000Z",
    logs: { "b:x": { blockId: "b", itemId: "x", reps: "8", load: "24kg", actualPse: "7", completed: false } },
  };
  let data = { ...emptyTrainingState(), activeSessions: { "treino-a": stored } };
  bindAccountStorage({ read: () => data, write: next => { data = next as typeof data; } });
  const router = { back() {}, forward() {}, refresh() {}, hmrRefresh() {}, push() {}, replace() {}, prefetch() {} };
  render(<AppRouterContext.Provider value={router}><WorkoutRunner autoStart workout={{ id: "treino-a", title: "Treino A", month: "Nov", year: 2026, type: "monthly", blocks: [{ id: "b", title: "Bloco", type: "single", order: 1, sets: "1", items: [{ id: "x", name: "Exercício teste", reps: "8" }] }] }} /></AppRouterContext.Provider>);
  await screen.findByDisplayValue("24kg");
  assert.equal(data.activeSessions["treino-a"].startedAt, stored.startedAt);
  data = { ...data, activeSessions: { "treino-a": { ...stored, logs: { "b:x": { ...stored.logs["b:x"], load: "30kg" } } } } };
  act(() => window.dispatchEvent(new Event("bjj-cloud-updated")));
  await waitFor(() => assert.equal(data.activeSessions["treino-a"].logs["b:x"].load, "30kg"));
  assert.equal(data.activeSessions["treino-a"].startedAt, stored.startedAt);
});
