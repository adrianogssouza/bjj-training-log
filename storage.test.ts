import test from "node:test";
import assert from "node:assert/strict";
import { emptyTrainingState, mergeTrainingState, parseTrainingState } from "../src/lib/training-state";
import { bindAccountStorage, clearWorkoutHistory, createWorkoutHistoryEntry, createWorkoutSession, readActiveWorkoutSession, readLegacyTrainingState, readWorkoutHistory, removeActiveWorkoutSession, saveActiveWorkoutSession, saveWorkoutHistoryEntry, workoutStorageKeys } from "../src/lib/workout-storage";

class MemoryStorage {
  values = new Map<string, string>();
  get length() { return this.values.size; }
  key(i: number) { return [...this.values.keys()][i] ?? null; }
  getItem(k: string) { return this.values.get(k) ?? null; }
  setItem(k: string, v: string) { this.values.set(k, v); }
  removeItem(k: string) { this.values.delete(k); }
}
const session = () => createWorkoutSession("treino-a");
const entry = () => { const s = session(); return createWorkoutHistoryEntry(s, "Treino A", new Date(Date.parse(s.startedAt) + 60000).toISOString()); };
test("backup mantém histórico, ordem, pausa e registros de exercícios", () => {
  const s = { ...session(), pausedAt: new Date().toISOString(), stepOrder: ["x"], totalPausedSeconds: 20, logs: { x: { blockId: "b", itemId: "x", reps: "8", load: "20kg", actualPse: "8,5", completed: true } } };
  const data = { version: 1 as const, history: [entry()], activeSessions: { "treino-a": s } };
  assert.deepEqual(parseTrainingState(JSON.parse(JSON.stringify(data))), data);
});
test("backup inválido é rejeitado antes de qualquer alteração", () => {
  assert.throws(() => parseTrainingState({ ...emptyTrainingState(), history: [{ id: "x" }] }));
  assert.throws(() => parseTrainingState({ ...emptyTrainingState(), activeSessions: { outro: session() } }));
  assert.throws(() => parseTrainingState({ ...emptyTrainingState(), activeSessions: { "treino-a": { ...session(), logs: { x: {} } } } }));
});
test("importação não duplica sessão e mantém dados já existentes na conta", () => {
  const e = entry();
  const current = { ...emptyTrainingState(), history: [{ ...e, workoutTitle: "Conta" }] };
  const incoming = { ...emptyTrainingState(), history: [e], activeSessions: { [e.workoutId]: e } };
  const merged = mergeTrainingState(current, incoming);
  assert.equal(merged.history.length, 1); assert.equal(merged.history[0].workoutTitle, "Conta");
  assert.deepEqual(merged.activeSessions, {});
});
test("migração lê chave legada e prefere sessão ativa, preservando originais", () => {
  bindAccountStorage(null);
  const storage = new MemoryStorage();
  Object.assign(globalThis, { localStorage: storage, window: { localStorage: storage } });
  const s = session();
  storage.setItem(workoutStorageKeys.legacySession(s.workoutId), JSON.stringify(s));
  storage.setItem(workoutStorageKeys.activeSession(s.workoutId), JSON.stringify({ ...s, currentStepIndex: 2 }));
  storage.setItem(workoutStorageKeys.history, JSON.stringify([entry()]));
  const before = [...storage.values];
  const data = readLegacyTrainingState();
  assert.equal(data.history.length, 1); assert.equal(data.activeSessions[s.workoutId].currentStepIndex, 2);
  assert.deepEqual([...storage.values], before);
});
test("adaptador da conta isola dados e sincroniza histórico, sessão e exclusão", () => {
  const storage = new MemoryStorage();
  Object.assign(globalThis, { localStorage: storage, window: { localStorage: storage } });
  storage.setItem(workoutStorageKeys.history, JSON.stringify([entry()]));
  const original = storage.getItem(workoutStorageKeys.history);
  let state = emptyTrainingState();
  bindAccountStorage({ read: () => state, write: next => { state = next; } });
  assert.equal(readWorkoutHistory().length, 0);
  const s = session(); saveActiveWorkoutSession(s); assert.deepEqual(readActiveWorkoutSession(s.workoutId), s);
  const e = entry(); saveWorkoutHistoryEntry(e); saveWorkoutHistoryEntry(e);
  assert.equal(state.history.length, 1);
  removeActiveWorkoutSession(s.workoutId); assert.equal(readActiveWorkoutSession(s.workoutId), null);
  clearWorkoutHistory(); assert.equal(state.history.length, 0);
  assert.equal(storage.getItem(workoutStorageKeys.history), original);
  bindAccountStorage(null);
  assert.equal(readWorkoutHistory().length, 1);
});
