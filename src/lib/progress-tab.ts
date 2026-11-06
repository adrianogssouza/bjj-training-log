/** Abas da tela Progresso. Fica fora do componente cliente para a página (servidor) poder usar. */
export type ProgressTab = "cargas" | "historico";

export const PROGRESS_HISTORY_PATH = "/progresso?aba=historico";

/** Lê `?aba=` do endereço; qualquer valor desconhecido abre Cargas. */
export function parseProgressTab(value: string | string[] | undefined | null): ProgressTab {
  const raw = Array.isArray(value) ? value[0] : value;
  return raw === "historico" ? "historico" : "cargas";
}
