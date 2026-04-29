# APP JIU / BJJ Training Log

Aplicativo web mobile-first para organizar, executar e revisar a rotina semanal real de treino do usuário.

O projeto começou como um log simples de treinos de Jiu-Jitsu/BJJ e evoluiu para um painel prático de treino: Treino A, Treino B, complementares e histórico local.

## Estado oficial

Sprint 1, Sprint 1.5, Sprint 1.5.1 e Sprint 1.6 estão concluídas.

O app está funcional, validado em uso real e preparado para a rotina semanal atual:

- Treino A Abril/26
- Treino B Abril/26
- Mobilidade
- Core
- Cardio
- Anti-lesão

## Stack

- Next.js 16
- React 19
- TypeScript
- Tailwind CSS
- ESLint
- `localStorage` para persistência local
- Deploy Vercel

## Funcionalidades atuais

- Home redesenhada como painel de decisão rápida.
- CTA principal para abrir Treino A.
- Treino B como alternativa imediata.
- Treinos do mês em cards prioritários.
- Complementares agrupados por categoria.
- Rotas dinâmicas para todos os treinos e complementares.
- Tela de detalhe com blocos, sequência, PSE alvo e vídeos.
- Execução guiada com pausa, retomada e fila dinâmica.
- Opções do exercício:
  - Fazer depois
  - Não farei hoje
- Campo de carga/método flexível com texto livre.
- Conclusão de treino com ação principal para voltar à Home.
- Histórico local com sessões concluídas.
- Métricas simples no histórico.
- Vídeos oficiais dos complementares.
- Vídeos reais do Treino B.
- Suporte a vídeos por exercício ou sequência.
- Interface mobile-first com refinamentos pós-teste real.

## Rotas principais

- `/`
- `/workouts`
- `/workouts/[id]`
- `/workouts/[id]/start`
- `/history`

## Dados de treino

Os treinos e complementares ficam em:

```text
src/data/seed-workouts.ts
```

Tipos atuais:

- `monthly`: Treino A e Treino B
- `complementary`: Mobilidade, Core, Cardio e Anti-lesão

## Persistência local

O app usa `localStorage`, sem backend nesta fase.

- Sessão ativa: `bjj-training-log:active-session:{workoutId}`
- Histórico concluído: `bjj-training-log:workout-history`
- Chave legada suportada: `bjj-training-log:session:{workoutId}`

Limitações atuais:

- Histórico fica apenas no navegador/dispositivo atual.
- Limpar dados do navegador remove os registros.
- Ainda não há login, backend, sincronização em nuvem ou conta de usuário.

## Como rodar localmente

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

## Sprints concluídas

### Sprint 1

MVP funcional com treinos principais, execução guiada, histórico local, vídeos e validação em treino real.

### Sprint 1.5

Expansão da rotina semanal com complementares reais: Mobilidade, Core, Cardio e Anti-lesão.

### Sprint 1.5.1

Polimento da Home para reduzir scroll, priorizar CTA principal e melhorar decisão rápida antes do treino.

### Sprint 1.6

Correções vindas de teste real:

- Conclusão de treino volta para Home.
- Campo de carga aceita texto livre.
- Complementares aparecem como sequência/circuito/combo, não como exercício simples isolado.

## Próxima direção

As próximas duas semanas devem priorizar ajustes de uso real, não uma expansão pesada:

- Simplificar execução de complementares.
- Separar `/workouts` por categorias.
- Resolver vídeos pendentes do Treino A.
- Melhorar histórico por tipo de treino.
- Criar atalho para repetir último treino.

Backend, login e Supabase seguem fora do escopo até haver necessidade real validada.
