# Status — APP JIU / BJJ Training Log

## Estado Atual

Etapa atual: **testes da semana**.

O app está funcional, publicado na Vercel e em uso real semanal.

## Sprints Concluídas

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

## Escopo Funcional Atual

- Home mobile-first.
- Treino A Abril/26.
- Treino B Abril/26.
- Complementares:
  - Mobilidade.
  - Core.
  - Cardio.
  - Anti-lesão.
- Exercícios reais dos complementares vindos de PDFs oficiais.
- Execução guiada.
- Pausar/retomar.
- Fazer depois.
- Não farei hoje.
- Histórico local.
- Badges Principal/Complementar.
- Repetir último treino.

## Correções Concluídas

### Sprint 1.8.1-HOTFIX

Corrigir timer herdado ao reiniciar treino.

Status:

Concluída.

Resultado:

Sessões iniciadas por `?start=1` e sessões reiniciadas pelo runner passam a começar com timer e progresso zerados, sem herdar `startedAt` de sessão ativa antiga.

## Melhorias Pendentes

- Filtro no histórico.
- Aviso de registros antigos.
- Melhoria visual de `Carregando histórico...`.
- Métricas separadas entre histórico antigo e novo.

## Próximas Etapas Previstas

1. Sprint 1.8.2.
2. Sprint 1.8.3.
3. Sprint 1.9.
4. Sprint 2.

## Regras Atuais

- Não abrir Sprint 2 sem validação de uso real.
- Não alterar `localStorage` de forma incompatível sem necessidade.
- Não criar feature nova durante testes da semana.
- Bugs novos de QA ou uso real devem alimentar `docs/QA.md`.
