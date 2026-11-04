import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { parseTrainingState, type TrainingState } from "./training-state";
import { SyncConflict, type CloudStore, type PendingCopy } from "./cloud-sync";

let client: SupabaseClient | null = null;
export function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!url && !key) return null;
  if (!url || !key || !/^https:\/\//.test(url) || !key.startsWith("sb_publishable_")) throw Error("Confira NEXT_PUBLIC_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY na Vercel e publique novamente.");
  client ??= createClient(url, key, { auth: { storageKey: "bjj-training-log:auth" } });
  return client;
}

function decode(row: { data: unknown; revision: unknown }) {
  if (!Number.isSafeInteger(row.revision) || Number(row.revision) < 0) throw Error("Revisão remota inválida.");
  return { data: parseTrainingState(row.data), revision: Number(row.revision) };
}

export function cloudStore(api: SupabaseClient, userId: string): CloudStore {
  return {
    async read() {
      const { data, error } = await api.from("bjj_training_states").select("data,revision").eq("user_id", userId).maybeSingle();
      if (error) throw error;
      return data ? decode(data) : null;
    },
    async write(state, revision) {
      const payload = { data: state, revision: revision === null ? 0 : revision + 1, updated_at: new Date().toISOString() };
      const query = revision === null
        ? api.from("bjj_training_states").insert({ ...payload, user_id: userId })
        : api.from("bjj_training_states").update(payload).eq("user_id", userId).eq("revision", revision);
      const { data, error } = await query.select("data,revision").maybeSingle();
      if (error?.code === "23505" || (!error && !data)) throw new SyncConflict();
      if (error) throw error;
      return decode(data!);
    },
  };
}

export const cacheKey = (userId: string) => `bjj-training-log:cloud:${userId}`;
export function readAccountCache(userId: string): PendingCopy | null {
  const raw = localStorage.getItem(cacheKey(userId));
  if (!raw) return null;
  const copy = JSON.parse(raw);
  if (typeof copy.pending !== "boolean" || (copy.baseRevision !== null && (!Number.isSafeInteger(copy.baseRevision) || copy.baseRevision < 0))) throw Error("Cópia local inválida. Exporte os dados antes de continuar.");
  return { data: parseTrainingState(copy.data), baseRevision: copy.baseRevision, pending: copy.pending };
}
export function saveAccountCache(userId: string, copy: PendingCopy) {
  localStorage.setItem(cacheKey(userId), JSON.stringify(copy));
}
export function downloadTrainingBackup(data: TrainingState) {
  const url = URL.createObjectURL(new Blob([JSON.stringify(data, null, 2)], { type: "application/json" }));
  const a = document.createElement("a");
  a.href = url; a.download = `bjj-training-log-${new Date().toISOString().slice(0, 10)}.json`; a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
