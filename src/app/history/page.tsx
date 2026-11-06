import { redirect } from "next/navigation";
import { PROGRESS_HISTORY_PATH } from "@/lib/progress-tab";

/** Endereço antigo: o Histórico agora é uma aba de Progresso. */
export default function HistoryPage() {
  redirect(PROGRESS_HISTORY_PATH);
}
