"use client";

import { useEffect, useRef, useState, type FormEvent, type ReactNode } from "react";
import type { Session, SupabaseClient } from "@supabase/supabase-js";
import { cacheKey, cloudStore, downloadTrainingBackup, getSupabase, readAccountCache, saveAccountCache } from "@/lib/cloud-storage";
import { SyncController } from "@/lib/cloud-sync";
import { bindAccountStorage, readLegacyTrainingState } from "@/lib/workout-storage";
import { emptyTrainingState, mergeTrainingState, parseTrainingState, type TrainingState } from "@/lib/training-state";

const button = "min-h-11 rounded-lg border border-zinc-600 px-4 py-2 text-sm font-bold disabled:opacity-50";
const primary = `${button} border-red-400 bg-red-500 text-white`;
function Panel({ children }: { children: ReactNode }) {
  return <main className="mx-auto flex w-full max-w-lg flex-1 flex-col justify-center py-10"><section className="space-y-4 rounded-xl border border-zinc-800 bg-zinc-900 p-5">{children}</section></main>;
}

function Login({ api }: { api: SupabaseClient }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  async function submit(event: FormEvent) {
    event.preventDefault(); setBusy(true); setError("");
    try {
      const { error } = await api.auth.signInWithPassword({ email: email.trim(), password });
      if (error) setError("Não foi possível entrar. Confira e-mail, senha e confirmação da conta.");
    } catch { setError("Não foi possível conectar. Confira sua internet e tente novamente."); }
    finally { setBusy(false); setPassword(""); }
  }
  return <Panel><h1 className="text-2xl font-black">BJJ Training Log</h1><p className="text-sm text-zinc-300">Seus treinos no computador e no celular.</p>
    <form onSubmit={submit} className="flex flex-col gap-4">
      <label className="text-sm">E-mail<input className="mt-1 min-h-12 w-full rounded-lg border border-zinc-600 bg-zinc-950 px-3 text-base" type="email" autoComplete="username" required value={email} onChange={e => setEmail(e.target.value)} /></label>
      <label className="text-sm">Senha<input className="mt-1 min-h-12 w-full rounded-lg border border-zinc-600 bg-zinc-950 px-3 text-base" type="password" autoComplete="current-password" required value={password} onChange={e => setPassword(e.target.value)} /></label>
      <button className={primary} disabled={busy}>{busy ? "Entrando…" : "Entrar"}</button>
    </form>{error && <p role="alert">{error}</p>}
    <p className="text-xs text-zinc-400">Use a conta criada em Authentication → Users no Supabase. Se utilizar o mesmo projeto do NutriPlan, pode usar o mesmo e-mail e senha.</p>
  </Panel>;
}

export function Account({ api, session, children }: { api: SupabaseClient; session: Session; children: ReactNode }) {
  const engine = useRef<SyncController | null>(null);
  const [view, setView] = useState<{ status: string; message: string } | null>(null);
  const [firstAccess, setFirstAccess] = useState(false);
  const [error, setError] = useState("");
  const [retry, setRetry] = useState(0);
  const [busy, setBusy] = useState(false);
  const userId = session.user.id;

  useEffect(() => {
    let cancelled = false;
    const store = cloudStore(api, userId);
    let visibleData: TrainingState | null = null;
    function attach(data: TrainingState, revision: number | null, saved: boolean, conflict = false) {
      if (cancelled) return;
      const controller = new SyncController(store, data, revision,
        copy => saveAccountCache(userId, copy),
        () => {
          if (cancelled) return;
          setView({ status: controller.status, message: controller.message });
          if (visibleData !== controller.data) {
            visibleData = controller.data;
            window.dispatchEvent(new Event("bjj-cloud-updated"));
          }
        }, saved);
      engine.current = controller;
      visibleData = data;
      bindAccountStorage({ read: () => controller.data, write: next => {
        visibleData = next;
        controller.change(next);
      } });
      saveAccountCache(userId, { data, baseRevision: revision, pending: !saved });
      setFirstAccess(false);
      setView({ status: controller.status, message: controller.message });
      if (conflict) controller.markConflict();
      else if (!saved) void controller.flush();
    }
    async function load() {
      try {
        // Read cache first; invalid or pending local data must never be overwritten silently.
        const cache = readAccountCache(userId);
        const remote = await store.read();
        if (cancelled) return;
        if (cache?.pending) {
          if (remote && JSON.stringify(remote.data) === JSON.stringify(cache.data)) attach(remote.data, remote.revision, true);
          else attach(cache.data, cache.baseRevision, false, (remote?.revision ?? null) !== cache.baseRevision);
        } else if (remote) attach(remote.data, remote.revision, true);
        else setFirstAccess(true);
      } catch { if (!cancelled) setError("Não foi possível carregar os registros. Confira conexão, variáveis da Vercel e SQL do Supabase. Os dados locais foram preservados."); }
    }
    let releaseLock: (() => void) | undefined;
    const lockAbort = new AbortController();
    if (navigator.locks) {
      void navigator.locks.request(`bjj-training-log:${userId}`, { ifAvailable: true }, async lock => {
        if (!lock) { if (!cancelled) setError("Esta conta já está aberta em outra aba. Feche a outra aba e toque em Tentar novamente."); return; }
        await load();
        if (!cancelled) await new Promise<void>(resolve => { releaseLock = resolve; });
      }).catch(() => { if (!cancelled) setError("Falha ao abrir a conta. Tente novamente."); });
    } else { void load(); }
    const refresh = () => { if (document.visibilityState === "visible") void engine.current?.refresh(); };
    const interval = window.setInterval(refresh, 15000);
    window.addEventListener("focus", refresh); window.addEventListener("online", refresh); document.addEventListener("visibilitychange", refresh);
    // Protect a second tab from overwriting an account copy edited in another tab.
    const storage = (e: StorageEvent) => { if (e.key === cacheKey(userId) && engine.current) engine.current.markConflict(); };
    window.addEventListener("storage", storage);
    const unload = (e: BeforeUnloadEvent) => { if (engine.current?.pending) { e.preventDefault(); } };
    window.addEventListener("beforeunload", unload);
    return () => {
      cancelled = true; releaseLock?.(); lockAbort.abort(); window.clearInterval(interval); bindAccountStorage(null);
      engine.current?.dispose(); engine.current = null;
      window.removeEventListener("focus", refresh); window.removeEventListener("online", refresh); document.removeEventListener("visibilitychange", refresh);
      window.removeEventListener("storage", storage); window.removeEventListener("beforeunload", unload);
    };
  }, [api, userId, retry]);

  async function begin(importLegacy: boolean) {
    setBusy(true); setError("");
    try {
      const data = importLegacy ? readLegacyTrainingState() : emptyTrainingState();
      // The next initialization uploads this checkpoint using an insert with conflict detection.
      saveAccountCache(userId, { data, baseRevision: null, pending: true });
      setFirstAccess(false); setView(null); setRetry(x => x + 1);
    } catch { setError("Falha ao ler ou salvar os dados locais. Nenhum registro antigo foi apagado."); }
    finally { setBusy(false); }
  }
  async function logout() {
    if (engine.current?.pending && !confirm("Há alterações pendentes. Exporte um backup antes de sair. Deseja sair mesmo assim?")) return;
    const { error } = await api.auth.signOut({ scope: "local" });
    if (error) setError("Não foi possível sair. Tente novamente.");
  }
  async function loadRemote() {
    if (!confirm("Exporte sua cópia local antes de continuar. Substituir os dados desta tela pela versão da nuvem?")) return;
    setBusy(true);
    try {
      const remote = await cloudStore(api, userId).read();
      if (!remote) throw Error();
      engine.current?.dispose(); bindAccountStorage(null); engine.current = null;
      saveAccountCache(userId, { data: remote.data, baseRevision: remote.revision, pending: false });
      setView(null); setError(""); setRetry(x => x + 1);
    } catch { setError("Falha ao consultar a nuvem. Sua cópia local foi mantida."); }
    finally { setBusy(false); }
  }
  function importData(incoming: TrainingState) {
    const controller = engine.current;
    if (!controller || controller.status === "conflict") return;
    if (!confirm("Adicionar o histórico deste backup à conta? Sessões já existentes na conta serão mantidas e não serão duplicadas.")) return;
    controller.change(mergeTrainingState(controller.data, incoming));
  }
  const labels: Record<string, string> = { synced: "Sincronizado", saving: "Salvando…", error: "Sem sincronização", conflict: "Conflito entre dispositivos" };
  return <>
    <div className="my-3 flex flex-wrap items-center justify-between gap-2 rounded-lg border border-zinc-800 bg-zinc-900 p-3 text-xs">
      <span className="break-all" role="status">{session.user.email} · {view ? labels[view.status] : "Conectando…"}</span>
      <button className={button} onClick={() => void logout()}>Sair</button>
    </div>
    {error && <div role="alert" className="my-3 space-y-3 rounded-lg border border-amber-400 p-4"><p>{error}</p><button className={button} onClick={() => { setError(""); if (view) void engine.current?.refresh(); else setRetry(x => x + 1); }}>Tentar novamente</button><button className={button} onClick={() => { try { const copy = readAccountCache(userId); downloadTrainingBackup(copy?.data ?? readLegacyTrainingState()); } catch { setError("A cópia local está inválida; mantenha os dados do navegador para recuperação."); } }}>Exportar cópia local</button></div>}
    {firstAccess && <Panel><h1 className="text-xl font-black">Primeiro acesso desta conta</h1><p className="text-sm text-zinc-300">Se já treinou neste navegador, importe o histórico e as sessões em andamento. A cópia antiga será preservada.</p><button disabled={busy} className={`${primary} w-full`} onClick={() => void begin(true)}>Importar dados deste navegador</button><button disabled={busy} className={`${button} w-full`} onClick={() => void begin(false)}>Começar sem registros</button></Panel>}
    {view && <>
      {(view.message || view.status === "error" || view.status === "conflict") && <div role="alert" className="my-3 space-y-3 rounded-lg border border-amber-400 p-4"><p>{view.message}</p><button className={button} onClick={() => downloadTrainingBackup(engine.current!.data)}>Exportar minha cópia local</button>{view.status === "conflict" ? <button disabled={busy} className={button} onClick={() => void loadRemote()}>Carregar versão da nuvem</button> : <button className={button} onClick={() => void engine.current?.refresh()}>Tentar sincronizar</button>}</div>}
      {view.status !== "conflict" && <>
        {children}
        <details className="my-5 rounded-lg border border-zinc-800 p-3 text-sm"><summary className="cursor-pointer font-bold">Conta e backup</summary><div className="mt-3 flex flex-col gap-3"><p className="text-xs text-zinc-400">Espere aparecer “Sincronizado” antes de continuar o treino em outro dispositivo. Um treino em andamento pode ser retomado pela página do treino → Continuar treino.</p><button className={button} onClick={() => downloadTrainingBackup(engine.current!.data)}>Exportar backup</button><button className={button} onClick={() => { try { importData(readLegacyTrainingState()); } catch { setError("Dados antigos inválidos. A cópia original foi mantida."); } }}>Importar registros antigos deste navegador</button><label className={`${button} cursor-pointer text-center`}>Importar backup JSON<input type="file" accept="application/json,.json" className="sr-only" onChange={async e => { const file = e.target.files?.[0]; e.target.value = ""; if (!file) return; try { importData(parseTrainingState(JSON.parse(await file.text()))); } catch { setError("Backup inválido. Nenhum registro foi importado."); } }} /></label></div></details>
      </>}
    </>}
    {!view && !firstAccess && !error && <p role="status" className="py-10">Carregando sua conta…</p>}
  </>;
}

export function CloudWorkspace({ children }: { children: ReactNode }) {
  const [api, setApi] = useState<SupabaseClient | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState("");
  useEffect(() => {
    let cancelled = false;
    let unsubscribe: (() => void) | undefined;
    try {
      const client = getSupabase();
      // Initialize browser authentication after hydration.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setApi(client);
      if (!client) { setReady(true); return; }
      const { data } = client.auth.onAuthStateChange((_event, next) => { if (!cancelled) { setSession(next); setReady(true); } });
      unsubscribe = () => data.subscription.unsubscribe();
      void client.auth.getSession().then(({ data, error }) => {
        if (cancelled) return;
        if (error) setError("Falha ao recuperar login. Recarregue a página.");
        else { setSession(data.session); setReady(true); }
      }).catch(() => { if (!cancelled) setError("Falha ao recuperar login. Recarregue a página."); });
    } catch (e) { setError(e instanceof Error ? e.message : "Erro de configuração."); }
    return () => { cancelled = true; unsubscribe?.(); bindAccountStorage(null); };
  }, []);
  if (error) return <Panel><p role="alert">{error}</p></Panel>;
  if (!ready) return <p role="status" className="py-10">Preparando aplicativo…</p>;
  if (!api) return <><p className="my-3 rounded-lg border border-amber-700 p-3 text-xs" role="status">Modo local · Configure as duas variáveis do Supabase na Vercel para ativar login e sincronização.</p>{children}</>;
  if (!session) return <Login api={api} />;
  return <Account key={session.user.id} api={api} session={session}>{children}</Account>;
}
