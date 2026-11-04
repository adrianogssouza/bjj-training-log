import type { TrainingState as AppState } from './training-state';

export type CloudRecord = { data: AppState; revision: number };
export type PendingCopy = { data: AppState; baseRevision: number | null; pending: boolean };
export type SyncStatus = 'synced' | 'saving' | 'error' | 'conflict';
export interface CloudStore {
  read(): Promise<CloudRecord | null>;
  write(data: AppState, revision: number | null): Promise<CloudRecord>;
}
export class SyncConflict extends Error {}
const equal = (a: AppState, b: AppState) => JSON.stringify(a) === JSON.stringify(b);

/** One serialized writer per workspace. Version checks prevent silent overwrites. */
export class SyncController {
  data: AppState;
  revision: number | null;
  status: SyncStatus = 'synced';
  message = '';
  private saved: AppState | null;
  private running = false;
  private reading = false;
  private disposed = false;
  private persistError = false;
  private store: CloudStore;
  private persist: (copy: PendingCopy) => void;
  private notify: () => void;
  constructor(
    store: CloudStore,
    data: AppState,
    revision: number | null,
    persist: (copy: PendingCopy) => void,
    notify: () => void,
    saved = true,
  ) { this.store = store; this.persist = persist; this.notify = notify; this.data = data; this.revision = revision; this.saved = saved ? data : null; }
  get pending() { return this.saved === null || !equal(this.data, this.saved); }
  private checkpoint() {
    try {
      this.persist({ data: this.data, baseRevision: this.revision, pending: this.pending });
      this.persistError = false;
    } catch {
      this.persistError = true;
      this.message = 'Falha ao salvar a cópia local. Mantenha a página aberta e exporte um backup.';
    }
  }
  private emit() { if (!this.disposed) this.notify(); }
  change(data: AppState) {
    if (this.disposed || equal(data, this.data)) return;
    this.data = data;
    this.checkpoint();
    this.emit();
    if (this.status !== 'conflict') void this.flush();
  }
  async flush() {
    if (this.disposed || this.running || this.reading || this.status === 'conflict') return;
    this.running = true;
    try {
      while (this.pending && !this.disposed) {
        const snapshot = this.data;
        this.status = 'saving'; this.message = ''; this.emit();
        const row = await this.store.write(snapshot, this.revision);
        if (this.disposed) return;
        this.revision = row.revision; this.saved = snapshot;
        this.checkpoint();
      }
      this.status = this.persistError ? 'error' : 'synced';
    } catch (e) {
      this.status = e instanceof SyncConflict ? 'conflict' : 'error';
      this.message = e instanceof SyncConflict
        ? 'Outro dispositivo alterou os dados. Suas alterações locais foram preservadas; exporte-as antes de carregar a nuvem.'
        : 'Sem sincronização. Suas alterações continuam neste dispositivo. Tente novamente quando houver conexão.';
    } finally { this.running = false; this.emit(); }
  }
  async refresh() {
    if (this.disposed || this.running || this.reading || this.status === 'conflict') return;
    if (this.pending) return this.flush();
    this.reading = true;
    try {
      const row = await this.store.read();
      if (this.disposed) return;
      // An edit can arrive while the read is in flight: never replace it.
      if (this.pending) return;
      if (!row) throw Error('Registro remoto indisponível.');
      if (row.revision !== this.revision) {
        this.data = row.data; this.saved = row.data; this.revision = row.revision;
        this.checkpoint();
      }
      this.checkpoint();
      this.status = this.persistError ? 'error' : 'synced';
      if (!this.persistError) this.message = '';
    } catch {
      this.status = 'error'; this.message = 'Não foi possível consultar a nuvem. Tentaremos novamente.';
    } finally {
      this.reading = false; this.emit();
      if (this.pending && !this.disposed) void this.flush();
    }
  }
  markConflict() { this.status = 'conflict'; this.message = 'Existe uma cópia local pendente e uma versão diferente na nuvem. Exporte a cópia local antes de carregar a nuvem.'; this.emit(); }
  dispose() { this.disposed = true; }
}
