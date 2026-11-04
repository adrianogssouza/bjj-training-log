# APP JIU / BJJ Training Log

Aplicativo web mobile-first para organizar, executar e revisar a rotina semanal real de treino do usuário.

O projeto começou como um log simples de treinos de Jiu-Jitsu/BJJ e evoluiu para um painel prático de treino: Treino A, Treino B, complementares, execução guiada e histórico com sincronização opcional pelo Supabase.

## Estado Oficial

Etapa atual: **integração Supabase implementada; validação em produção pendente**.

Sprints concluídas:

- Sprint 1
- Sprint 1.5
- Sprint 1.5.1
- Sprint 1.6
- Sprint 1.7
- Sprint 1.8
- Sprint 1.8.1
- Sprint 1.8.1-QA
- Sprint 1.8.1-FIX
- Sprint 1.8.1-BLOCKER
- Sprint 1.8.1-REAL
- Sprint 1.8.1-QA2
- Sprint 1.8.1-HOTFIX

O app está funcional, publicado na Vercel e em fase de uso real semanal antes da próxima rodada de implementação.

## Stack

- Next.js 16
- React 19
- TypeScript
- Tailwind CSS
- ESLint
- Supabase Auth e Postgres com RLS para login e sincronização
- `localStorage` para cópia local e migração do histórico antigo
- Deploy Vercel

## Funcionalidades Atuais

- Home como painel de decisão rápida.
- CTA principal para treino do mês.
- Treino A Abril/26 e Treino B Abril/26.
- Complementares reais:
  - Mobilidade
  - Core
  - Cardio
  - Anti-lesão
- Complementares com exercícios reais extraídos dos PDFs oficiais.
- Execução guiada com pausa, retomada e fila dinâmica.
- Opções do exercício:
  - Fazer depois
  - Não farei hoje
- Campo de carga/método flexível com texto livre.
- Conclusão de treino com retorno principal para Home.
- Histórico local com badges Principal/Complementar.
- Vídeos reais do Treino A.
- Vídeos reais do Treino B.
- Vídeos oficiais dos complementares.
- Interface dark, mobile-first.

## Rotas Principais

- `/`
- `/workouts`
- `/workouts/[id]`
- `/workouts/[id]/start`
- `/history`

## Dados de Treino

Os treinos e complementares ficam em:

```text
src/data/seed-workouts.ts
```

Tipos atuais:

- `monthly`: Treino A e Treino B
- `complementary`: Mobilidade, Core, Cardio e Anti-lesão

## Login e Sincronização

Configure o Supabase seguindo [o passo a passo](docs/SUPABASE.md).
Pode usar o mesmo projeto do NutriPlan, com tabela própria `bjj_training_states`.
A integração inclui login, histórico e sessões em andamento na nuvem, importação dos
registros antigos e backup JSON. Atualizações concorrentes geram aviso de conflito,
sem sobrescrever silenciosamente a versão remota.

Sem as duas variáveis públicas, o aplicativo continua em modo local.
As chaves antigas são preservadas:

- Sessão ativa: `bjj-training-log:active-session:{workoutId}`
- Histórico: `bjj-training-log:workout-history`
- Sessão legada: `bjj-training-log:session:{workoutId}`

A integração usa exclusivamente a chave pública. Não coloque secret key no frontend.

## Correções Recentes

- Sprint 1.8.1-HOTFIX: corrigido timer herdado ao reiniciar treino.

## Melhorias Pendentes Registradas

- Filtro no histórico.
- Aviso de registros antigos.
- Melhoria visual de `Carregando histórico...`.
- Métricas separadas entre histórico antigo e novo.

## Documentação de Projeto

- Estado atual: `docs/STATUS.md`
- Roadmap: `docs/ROADMAP.md`
- Backlog: `docs/BACKLOG.md`
- Changelog: `docs/CHANGELOG.md`
- Base oficial de QA: `docs/QA.md`
- Guia de testes: `docs/TESTING.md`
- Log de campo: `docs/FIELD-TEST-LOG.md`

## Regra de QA

Bugs novos encontrados em QA ou uso real devem alimentar a base de QA futura em `docs/QA.md` e, quando aplicável, virar item priorizado em `docs/BACKLOG.md`.

## Como Rodar Localmente

Instale dependências:

```bash
npm install
```

Rode em desenvolvimento:

```bash
npm run dev
```

Acesse:

```bash
http://localhost:3000
```

Valide lint:

```bash
npm run lint
```

Valide build:

```bash
npm run build
```

Verifique também `npm test` e `npm run typecheck`. Os testes de nuvem usam serviço simulado; valide login e sincronização no projeto real após configurar o SQL.
