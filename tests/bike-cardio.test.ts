import test from "node:test";
import assert from "node:assert/strict";
import { BIKE_PLAN, dayNumber, getWeekRange, mergeBikeData, newBikeData, progressionAdvice, sanitizeBikeData, summarizeWeek, weekForDate } from "../src/lib/bike-cardio";

test("datas respeitam semanas de sete dias e virada do ano", () => {
  assert.ok(Number.isNaN(dayNumber("2026-02-30")));
  assert.equal(weekForDate("2026-12-29", "2026-12-28"), 0);
  assert.equal(weekForDate("2026-12-29", "2027-01-04"), 1);
  assert.equal(weekForDate("2026-12-29", "2027-01-05"), 2);
  assert.deepEqual(getWeekRange("2026-12-29", 2), { from: "2027-01-05", through: "2027-01-11" });
});

test("plano contém volume progressivo de 3 a 5 sessões", () => {
  assert.deepEqual(BIKE_PLAN.map(x => x.sessions * x.minutes), [75, 90, 120, 140, 175, 200]);
});

test("registros parciais antigos e nulos são normalizados sem inventar FC", () => {
  const raw = { version: 1, startedOn: "2026-11-04", goalWeightKg: null, sessions: [{ id: "a", date: "2026-11-04", status: "completed", minutes: 25, averageBpm: null, peakBpm: null }], measurements: [] };
  const parsed = sanitizeBikeData(raw);
  assert.equal(parsed.sessions[0].averageBpm, null);
  assert.equal(parsed.sessions[0].rpe, null);
  assert.equal(summarizeWeek(parsed, 1).minutes, 25);
  assert.throws(() => sanitizeBikeData({ ...raw, sessions: {} }));
});

test("sintomas e fadiga impedem recomendação automática de progressão", () => {
  const base = { ...newBikeData(), startedOn: "2026-11-04" };
  const d = sanitizeBikeData({ ...base, sessions: [{ id: "a", date: "2026-11-04", status: "completed", minutes: 25, symptoms: true, rpe: 3, legFatigue: 3 }] });
  assert.match(progressionAdvice(d, 1), /Sintomas registrados/);
  assert.equal(summarizeWeek(d, 1).anySymptoms, true);
});

test("merge mantém sessões antigas e prioriza cópia atual por ID", () => {
  const old = sanitizeBikeData({ version: 1, startedOn: "2026-11-01", goalWeightKg: null, sessions: [
    {id:"a",date:"2026-11-01",status:"completed",minutes:25},
    {id:"b",date:"2026-11-02",status:"completed",minutes:30},
  ], measurements: [] });
  const current = sanitizeBikeData({ ...old, sessions: [{id:"b",date:"2026-11-02",status:"completed",minutes:32}], goalWeightKg: 97 });
  const merged = mergeBikeData(current,old)!;
  assert.equal(merged.sessions.length, 2);
  assert.equal(merged.sessions.find(s => s.id === "b")?.minutes,32);
  assert.equal(merged.goalWeightKg,97);
});
