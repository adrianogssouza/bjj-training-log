"use client";

import { useEffect, useRef, useState, type FormEvent, type ReactNode } from "react";
import type { Session, SupabaseClient } from "@supabase/supabase-js";
import { cacheKey, cloudStore, downloadTrainingBackup, getSupabase, readAccountCache, saveAccountCache } from "@/lib/cloud-storage";
import { SyncController } from "@/lib/cloud-sync";
import { bindAccountStorage, readLegacyTrainingState } from "@/lib/workout-storage";
import { emptyTrainingState, mergeTrainingState, parseTrainingState, type TrainingState } from "@/lib/training-state";
import { AccountContext } from "./AccountContext";
import { AccountModal } from "./AccountModal";
import { AppCard } from "@/components/ui/AppCard";
import { AppInput } from "@/components/ui/AppInput";
import { AppButton } from "@/components/ui/AppButton";

export function Login({ api }: { api: SupabaseClient }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function submit(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      const { error } = await api.auth.signInWithPassword({ email: email.trim(), password });
      if (error) setError("Não foi possível entrar. Confira e-mail, senha e confirmação da conta.");
    } catch {
      setError("Não foi possível conectar. Confira sua internet e tente novamente.");
    } finally {
      setBusy(false);
      setPassword("");
    }
  }

  return (
    <main className="mx-auto flex w-full max-w-[440px] flex-1 flex-col justify-center py-12 px-4">
      <AppCard className="p-6 space-y-5">
        <div>
          <h1 className="text-[24px] font-extrabold leading-[30px] text-[var(--foreground)]">MEU TREINO</h1>
          <p className="mt-1 text-[14px] text-[var(--muted)]">Treinamento e evolução</p>
        </div>

        <form onSubmit={submit} className="flex flex-col gap-4">
          <AppInput
            label="E-mail"
            type="email"
            autoComplete="username"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <AppInput
            label="Senha"
            type="password"
            autoComplete="current-password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <AppButton type="submit" variant="primary" fullWidth loading={busy}>
            {busy ? "Entrando…" : "Entrar"}
          </AppButton>
        </form>

        {error && (
          <p role="alert" className="text-[13px] text-[var(--primary-text)] rounded-[10px] border border-[var(--primary-hover)] bg-[var(--primary-soft)]/40 p-3">
            {error}
          </p>
        )}

        <p className="text-[13px] leading-[18px] text-[var(--muted)]">
          Use a conta criada em Authentication → Users no Supabase. Se utilizar o mesmo projeto do NutriPlan, pode usar o mesmo e-mail e senha.
        </p>
      </AppCard>
    </main>
  );
}

export function Account({ api, session, children }: { api: SupabaseClient; session: Session; children: ReactNode }) {
  const engine = useRef<SyncController | null>(null);
  const [view, setView] = useState<{ status: string; message: string } | null>(null);
  const [firstAccess, setFirstAccess] = useState(false);
  const [error, setError] = useState("");
  const [retry, setRetry] = useState(0);
  const [busy, setBusy] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const userId = session.user.id;

  useEffect(() => {
    let cancelled = false;
    const store = cloudStore(api, userId);
    let visibleData: TrainingState | null = null;

    function attach(data: TrainingState, revision: number | null, saved: boolean, conflict = false) {
      if (cancelled) return;
      const controller = new SyncController(
        store,
        data,
        revision,
        (copy) => saveAccountCache(userId, copy),
        () => {
          if (cancelled) return;
          setView({ status: controller.status, message: controller.message });
          if (visibleData !== controller.data) {
            visibleData = controller.data;
            window.dispatchEvent(new Event("bjj-cloud-updated"));
          }
        },
        saved
      );
      engine.current = controller;
      visibleData = data;
      bindAccountStorage({
        read: () => controller.data,
        write: (next) => {
          visibleData = next;
          controller.change(next);
        },
      });
      saveAccountCache(userId, { data, baseRevision: revision, pending: !saved });
      setFirstAccess(false);
      setView({ status: controller.status, message: controller.message });
      if (conflict) controller.markConflict();
      else if (!saved) void controller.flush();
    }

    async function load() {
      try {
        const cache = readAccountCache(userId);
        const remote = await store.read();
        if (cancelled) return;
        if (cache?.pending) {
          if (remote && JSON.stringify(remote.data) === JSON.stringify(cache.data)) {
            attach(remote.data, remote.revision, true);
          } else {
            attach(cache.data, cache.baseRevision, false, (remote?.revision ?? null) !== cache.baseRevision);
          }
        } else if (remote) {
          attach(remote.data, remote.revision, true);
        } else {
          setFirstAccess(true);
        }
      } catch {
        if (!cancelled) {
          setError(
            "Não foi possível carregar os registros. Confira conexão, variáveis da Vercel e SQL do Supabase. Os dados locais foram preservados."
          );
        }
      }
    }

    let releaseLock: (() => void) | undefined;
    const lockAbort = new AbortController();
    if (navigator.locks) {
      void navigator.locks
        .request(`bjj-training-log:${userId}`, { ifAvailable: true }, async (lock) => {
          if (!lock) {
            if (!cancelled) {
              setError("Esta conta já está aberta em outra aba. Feche a outra aba e toque em Tentar novamente.");
            }
            return;
          }
          await load();
          if (!cancelled) await new Promise<void>((resolve) => { releaseLock = resolve; });
        })
        .catch(() => {
          if (!cancelled) setError("Falha ao abrir a conta. Tente novamente.");
        });
    } else {
      void load();
    }

    const refresh = () => {
      if (document.visibilityState === "visible") void engine.current?.refresh();
    };
    const interval = window.setInterval(refresh, 15000);
    window.addEventListener("focus", refresh);
    window.addEventListener("online", refresh);
    document.addEventListener("visibilitychange", refresh);

    const storage = (e: StorageEvent) => {
      if (e.key === cacheKey(userId) && engine.current) engine.current.markConflict();
    };
    window.addEventListener("storage", storage);

    const unload = (e: BeforeUnloadEvent) => {
      if (engine.current?.pending) {
        e.preventDefault();
      }
    };
    window.addEventListener("beforeunload", unload);

    return () => {
      cancelled = true;
      releaseLock?.();
      lockAbort.abort();
      window.clearInterval(interval);
      bindAccountStorage(null);
      engine.current?.dispose();
      engine.current = null;
      window.removeEventListener("focus", refresh);
      window.removeEventListener("online", refresh);
      document.removeEventListener("visibilitychange", refresh);
      window.removeEventListener("storage", storage);
      window.removeEventListener("beforeunload", unload);
    };
  }, [api, userId, retry]);

  async function begin(importLegacy: boolean) {
    setBusy(true);
    setError("");
    try {
      const data = importLegacy ? readLegacyTrainingState() : emptyTrainingState();
      saveAccountCache(userId, { data, baseRevision: null, pending: true });
      setFirstAccess(false);
      setView(null);
      setRetry((x) => x + 1);
    } catch {
      setError("Falha ao ler ou salvar os dados locais. Nenhum registro antigo foi apagado.");
    } finally {
      setBusy(false);
    }
  }

  async function logout() {
    if (
      engine.current?.pending &&
      !confirm("Há alterações pendentes. Exporte um backup antes de sair. Deseja sair mesmo assim?")
    ) {
      return;
    }
    const { error } = await api.auth.signOut({ scope: "local" });
    if (error) setError("Não foi possível sair. Tente novamente.");
  }

  async function loadRemote() {
    if (
      !confirm(
        "Exporte sua cópia local antes de continuar. Substituir os dados desta tela pela versão da nuvem?"
      )
    ) {
      return;
    }
    setBusy(true);
    try {
      const remote = await cloudStore(api, userId).read();
      if (!remote) throw Error();
      engine.current?.dispose();
      bindAccountStorage(null);
      engine.current = null;
      saveAccountCache(userId, { data: remote.data, baseRevision: remote.revision, pending: false });
      setView(null);
      setError("");
      setRetry((x) => x + 1);
    } catch {
      setError("Falha ao consultar a nuvem. Sua cópia local foi mantida.");
    } finally {
      setBusy(false);
    }
  }

  function importData(incoming: TrainingState) {
    const controller = engine.current;
    if (!controller || controller.status === "conflict") return;
    if (
      !confirm(
        "Adicionar o histórico deste backup à conta? Sessões já existentes na conta serão mantidas e não serão duplicadas."
      )
    ) {
      return;
    }
    controller.change(mergeTrainingState(controller.data, incoming));
  }

  const labels: Record<string, string> = {
    synced: "Sincronizado",
    saving: "Salvando…",
    error: "Sem sincronização",
    conflict: "Conflito entre dispositivos",
  };

  const currentStatus = view ? (labels[view.status] || view.status) : "Conectando…";

  const contextValue = {
    isAccountModalOpen: isModalOpen,
    openAccountModal: () => setIsModalOpen(true),
    closeAccountModal: () => setIsModalOpen(false),
    syncStatus: currentStatus,
    syncMessage: view?.message || error || "",
    userEmail: session.user.email ?? null,
    onLogout: () => void logout(),
  };

  return (
    <AccountContext.Provider value={contextValue}>
      {/* First access onboarding */}
      {firstAccess && (
        <main className="mx-auto flex w-full max-w-lg flex-1 flex-col justify-center py-10 px-4">
          <AppCard className="p-6 space-y-4">
            <h1 className="text-[20px] font-bold text-[var(--foreground)]">Primeiro acesso desta conta</h1>
            <p className="text-[14px] leading-[21px] text-[var(--muted)]">
              Se já treinou neste navegador, importe o histórico e as sessões em andamento. A cópia antiga será preservada.
            </p>
            <div className="space-y-2 pt-2">
              <AppButton disabled={busy} variant="primary" fullWidth onClick={() => void begin(true)}>
                Importar dados deste navegador
              </AppButton>
              <AppButton disabled={busy} variant="secondary" fullWidth onClick={() => void begin(false)}>
                Começar sem registros
              </AppButton>
            </div>
          </AppCard>
        </main>
      )}

      {/* Global error banner */}
      {error && !firstAccess && (
        <div
          role="alert"
          className="my-3 space-y-3 rounded-[12px] border border-[var(--warning)]/50 bg-[var(--warning)]/10 p-4 text-[var(--foreground)]"
        >
          <p className="text-[14px] leading-[21px]">{error}</p>
          <div className="flex flex-wrap gap-2">
            <AppButton
              variant="secondary"
              onClick={() => {
                setError("");
                if (view) void engine.current?.refresh();
                else setRetry((x) => x + 1);
              }}
            >
              Tentar novamente
            </AppButton>
            <AppButton
              variant="secondary"
              onClick={() => {
                try {
                  const copy = readAccountCache(userId);
                  downloadTrainingBackup(copy?.data ?? readLegacyTrainingState());
                } catch {
                  setError("A cópia local está inválida; mantenha os dados do navegador para recuperação.");
                }
              }}
            >
              Exportar cópia local
            </AppButton>
          </div>
        </div>
      )}

      {/* Conflict / sync alert banner */}
      {view && (view.message || view.status === "error" || view.status === "conflict") && !firstAccess && (
        <div
          role="alert"
          className="my-3 space-y-3 rounded-[12px] border border-[var(--warning)]/50 bg-[var(--warning)]/10 p-4 text-[var(--foreground)]"
        >
          <p className="text-[14px] leading-[21px]">{view.message}</p>
          <div className="flex flex-wrap gap-2">
            <AppButton
              variant="secondary"
              onClick={() => downloadTrainingBackup(engine.current!.data)}
            >
              Exportar minha cópia local
            </AppButton>
            {view.status === "conflict" ? (
              <AppButton disabled={busy} variant="primary" onClick={() => void loadRemote()}>
                Carregar versão da nuvem
              </AppButton>
            ) : (
              <AppButton variant="secondary" onClick={() => void engine.current?.refresh()}>
                Tentar sincronizar
              </AppButton>
            )}
          </div>
        </div>
      )}

      {/* Main app content when ready and not blocked by conflict or first-access */}
      {view && view.status !== "conflict" && !firstAccess && children}

      {/* Loading state before view initializes */}
      {!view && !firstAccess && !error && (
        <p role="status" className="py-10 text-center text-[14px] text-[var(--muted)]">
          Carregando sua conta…
        </p>
      )}

      {/* Account Modal triggered by header */}
      <AccountModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        email={session.user.email ?? null}
        syncStatus={currentStatus}
        syncMessage={view?.message || error || ""}
        onLogout={() => void logout()}
        onExportBackup={() => {
          if (engine.current) downloadTrainingBackup(engine.current.data);
        }}
        onImportLegacy={() => {
          try {
            importData(readLegacyTrainingState());
          } catch {
            setError("Dados antigos inválidos. A cópia original foi mantida.");
          }
        }}
        onImportJson={async (file) => {
          try {
            const text = await file.text();
            importData(parseTrainingState(JSON.parse(text)));
          } catch {
            setError("Backup inválido. Nenhum registro foi importado.");
          }
        }}
        onRefreshSync={() => void engine.current?.refresh()}
        onResolveConflict={view?.status === "conflict" ? () => void loadRemote() : undefined}
      />
    </AccountContext.Provider>
  );
}

export function CloudWorkspace({ children }: { children: ReactNode }) {
  const [api, setApi] = useState<SupabaseClient | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState("");
  const [isLocalAccountModalOpen, setIsLocalAccountModalOpen] = useState(false);

  useEffect(() => {
    let cancelled = false;
    let unsubscribe: (() => void) | undefined;
    try {
      const client = getSupabase();
      // Initialize browser authentication after hydration.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setApi(client);
      if (!client) {
        setReady(true);
        return;
      }
      const { data } = client.auth.onAuthStateChange((_event, next) => {
        if (!cancelled) {
          setSession(next);
          setReady(true);
        }
      });
      unsubscribe = () => data.subscription.unsubscribe();
      void client.auth
        .getSession()
        .then(({ data, error }) => {
          if (cancelled) return;
          if (error) setError("Falha ao recuperar login. Recarregue a página.");
          else {
            setSession(data.session);
            setReady(true);
          }
        })
        .catch(() => {
          if (!cancelled) setError("Falha ao recuperar login. Recarregue a página.");
        });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erro de configuração.");
    }
    return () => {
      cancelled = true;
      unsubscribe?.();
      bindAccountStorage(null);
    };
  }, []);

  if (error) {
    return (
      <main className="mx-auto flex w-full max-w-lg flex-1 flex-col justify-center py-10 px-4">
        <AppCard className="p-6">
          <p role="alert" className="text-[14px] text-[var(--primary-text)]">{error}</p>
        </AppCard>
      </main>
    );
  }

  if (!ready) {
    return (
      <p role="status" className="py-10 text-center text-[14px] text-[var(--muted)]">
        Preparando aplicativo…
      </p>
    );
  }

  if (!api) {
    const localContext = {
      isAccountModalOpen: isLocalAccountModalOpen,
      openAccountModal: () => setIsLocalAccountModalOpen(true),
      closeAccountModal: () => setIsLocalAccountModalOpen(false),
      syncStatus: "Sem sincronização",
      syncMessage: "Modo local · Configure as variáveis do Supabase para sincronizar em nuvem.",
      userEmail: null,
    };

    return (
      <AccountContext.Provider value={localContext}>
        <div className="mb-4 rounded-[10px] border border-[var(--warning)]/40 bg-[var(--warning)]/10 p-3 text-[13px] text-[var(--warning)]" role="status">
          Modo local · Configure as variáveis do Supabase na Vercel para ativar login e sincronização.
        </div>
        {children}
        <AccountModal
          isOpen={isLocalAccountModalOpen}
          onClose={() => setIsLocalAccountModalOpen(false)}
          email={null}
          syncStatus="Sem sincronização"
          syncMessage="Modo local"
          onExportBackup={() => {
            try {
              downloadTrainingBackup(readLegacyTrainingState());
            } catch {
              // ignore
            }
          }}
        />
      </AccountContext.Provider>
    );
  }

  if (!session) {
    return <Login api={api} />;
  }

  return (
    <Account key={session.user.id} api={api} session={session}>
      {children}
    </Account>
  );
}
