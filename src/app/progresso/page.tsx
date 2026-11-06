import type { Metadata } from "next";
import { ProgressScreen } from "@/components/progress/ProgressScreen";
import { parseProgressTab } from "@/lib/progress-tab";

export const metadata: Metadata = {
  title: "Progresso · MEU TREINO",
};

export default async function ProgressPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const { aba } = await searchParams;
  return <ProgressScreen initialTab={parseProgressTab(aba)} />;
}
