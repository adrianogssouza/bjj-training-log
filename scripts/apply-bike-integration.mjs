import { readFileSync, writeFileSync } from "node:fs";

/** Executar uma vez, a partir da raiz do repositório original. */
function update(path, edits) {
  let file = readFileSync(path, "utf8");
  let dirty = false;
  for (const { from, to } of edits) {
    if (file.includes(to)) continue; // Reexecutar sem duplicar mudanças.
    if (!file.includes(from)) {
      throw new Error(`Trecho esperado não encontrado em ${path}; concilie manualmente antes de seguir: ${from.slice(0, 90)}`);
    }
    file = file.replace(from, to);
    dirty = true;
  }
  if (dirty) { writeFileSync(path, file); console.log(`Atualizado: ${path}`); }
  else console.log(`Já integrado: ${path}`);
}

update("src/app/page.tsx", [
  { from: 'import { AppCard } from "@/components/ui/AppCard";',
    to: 'import { AppCard } from "@/components/ui/AppCard";\nimport { BikeEntryCard } from "@/components/home/BikeEntryCard";' },
  { from: '        <TopActionPanel workouts={monthlyWorkouts} />',
    to: '        <TopActionPanel workouts={monthlyWorkouts} />\n        <BikeEntryCard />' },
]);

update("src/components/layout/AppShell.tsx", [
  { from: '<nav className="flex items-center gap-4 text-sm font-medium text-zinc-300">',
    to: '<nav className="flex flex-wrap items-center justify-end gap-2 text-xs font-medium text-zinc-300 sm:gap-4 sm:text-sm">\n            <Link href="/bike" className="hover:text-white">\n              Bike\n            </Link>' },
]);

update("src/lib/training-state.ts", [
  { from: 'import { sanitizeWorkoutSessionPse } from "./workout-validation";',
    to: 'import { sanitizeWorkoutSessionPse } from "./workout-validation";\nimport { mergeBikeData, sanitizeBikeData, type BikeData } from "./bike-cardio";' },
  { from: '  activeSessions: Record<string, WorkoutSession>;\n};',
    to: '  activeSessions: Record<string, WorkoutSession>;\n  /** Opcional para aceitar backups anteriores à criação da Bike. */\n  bike?: BikeData;\n};' },
  { from: '  return { version: 1, history, activeSessions };\n}',
    to: '  const bike = value.bike === undefined ? undefined : sanitizeBikeData(value.bike);\n  return { version: 1, history, activeSessions, ...(bike ? { bike } : {}) };\n}' },
  { from: '  return { version: 1, history, activeSessions };\n}',
    to: '  const bike = mergeBikeData(current.bike, incoming.bike);\n  return { version: 1, history, activeSessions, ...(bike ? { bike } : {}) };\n}' },
]);

update("src/lib/workout-storage.ts", [
  { from: 'import { emptyTrainingState, parseTrainingState, type TrainingState } from "./training-state";',
    to: 'import { emptyTrainingState, parseTrainingState, type TrainingState } from "./training-state";\nimport { BIKE_STORAGE_KEY, bindBikeStorage, newBikeData, sanitizeBikeData } from "./bike-cardio";' },
  { from: 'export function bindAccountStorage(adapter: typeof account) { account = adapter; }',
    to: `export function bindAccountStorage(adapter: typeof account) {
  account = adapter;
  bindBikeStorage(adapter ? {
    read: () => sanitizeBikeData(adapter.read().bike ?? newBikeData()),
    write: bike => adapter.write({ ...adapter.read(), bike }),
  } : null);
}` },
  { from: '  return parseTrainingState(state);\n}',
    to: `  const bike = localStorage.getItem(BIKE_STORAGE_KEY);
  if (bike) state.bike = sanitizeBikeData(JSON.parse(bike));
  return parseTrainingState(state);
}` },
]);

update("README.md", [
  { from: '## Rotas Principais', to: `## Cardio na Bike — módulo independente

- Nova rota \`/bike\`, acessível pela Home e barra de navegação.
- Plano moderado de 6 semanas, 3 a 5 sessões/semana, com aquecimento e desaquecimento.
- Registros de FC medida, tempo, PSE, recuperação e medidas; gráficos de evolução e backup JSON/CSV.
- Usa o mesmo estado Supabase \`bjj_training_states\` com campo opcional \`bike\` (sem migração SQL).
- Em modo local, dados ficam no navegador; com login, sincronizam na conta.
- Os seis cardios complementares anteriores não são alterados.

Leia \`docs/BIKE-CARDIO.md\` para instruções e limites da prescrição.

## Rotas Principais` },
]);

console.log("Integração da Bike concluída. Execute npm run typecheck, lint, test e build.");
