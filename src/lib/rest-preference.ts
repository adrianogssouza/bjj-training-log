/** Descanso automático entre rodadas: preferência deste aparelho. */
export const AUTO_REST_STORAGE_KEY = "bjj-training-log:auto-rest";

export function readAutoRestPreference(): boolean {
  try {
    return window.localStorage.getItem(AUTO_REST_STORAGE_KEY) === "1";
  } catch {
    return false;
  }
}

export function saveAutoRestPreference(enabled: boolean) {
  try {
    window.localStorage.setItem(AUTO_REST_STORAGE_KEY, enabled ? "1" : "0");
  } catch {
    // Sem armazenamento (ex.: navegação privada): vale só nesta tela.
  }
}
