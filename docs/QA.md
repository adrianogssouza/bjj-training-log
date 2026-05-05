# QA — APP JIU / BJJ Training Log

Base oficial de QA do projeto.

## Regra Principal

Bugs novos encontrados em QA ou uso real devem ser registrados neste arquivo e avaliados para entrada no backlog futuro.

Cada bug deve ter:

- Data.
- Sprint ou contexto.
- Fluxo testado.
- Passos para reproduzir.
- Resultado esperado.
- Resultado observado.
- Severidade.
- Status.

## QA Concluídas

### Sprint 1.8.1-QA

Objetivo:

Validar o APP JIU após vídeos reais do Treino A e antes de novo teste manual.

Escopo:

- Home.
- Treino A.
- Treino B.
- Complementares.
- Histórico.
- Persistência.
- Navegação.
- Vídeos.

Resultado:

QA concluída. Bugs e riscos alimentaram a Sprint 1.8.1-FIX.

### Sprint 1.8.1-QA2

Objetivo:

QA oficial rígida após Sprint 1.8.1-FIX, Sprint 1.8.1-BLOCKER e Sprint 1.8.1-REAL.

Escopo validado:

- Home.
- CTA principal.
- Repetir último treino.
- Treino A.
- Treino B.
- Mobilidade com Peso.
- Mobilidade sem Peso.
- Mobilidade 3.
- Core 1.
- Core 2.
- Anti-lesão.
- Cardio.
- Histórico.
- Persistência/localStorage.
- Vídeos/modal.
- Semântica das categorias.
- Fidelidade às sprints recentes.

Resultado:

Pronto com ressalvas.

## Bugs Reais Abertos

### QA2-001 — Timer herdado ao reiniciar treino

Contexto:

Sprint 1.8.1-QA2.

Passos observados:

1. Abrir treino com sessão ativa antiga.
2. Usar `Reiniciar treino`.
3. Entrar no runner.
4. Observar timer e histórico após conclusão.

Resultado esperado:

O treino reiniciado deve começar com duração zerada.

Resultado observado:

O timer pode herdar tempo anterior, gerando durações infladas no histórico.

Impacto:

Métricas de duração ficam pouco confiáveis.

Severidade:

Alta para métricas, média para execução do treino.

Status:

Resolvido na Sprint 1.8.1-HOTFIX.

Validação:

- `npm run lint` passou.
- `npm run build` passou.
- Com sessão ativa anterior, entrada por `?start=1` voltou para `0/9` e timer fresco.
- Rota manual sem `?start=1` continuou oferecendo `Continuar treino`.
- Botão `Reiniciar treino` voltou para `0/9` e timer fresco.

## Riscos Conhecidos

- Históricos antigos continuam com modelagem anterior de complementares.
- Métricas agregadas misturam registros antigos e novos.
- `Carregando histórico...` aparece durante hidratação do `localStorage`.
- Histórico pode ficar longo sem filtros.

## Critérios Mínimos Para QA Futura

- Rodar `npm run lint`.
- Rodar `npm run build`.
- Testar Home.
- Testar Treino A.
- Testar Treino B.
- Testar pelo menos uma Mobilidade.
- Testar Core.
- Testar Anti-lesão.
- Testar Cardio.
- Testar histórico.
- Testar persistência/reload.
- Registrar qualquer bug novo neste arquivo.
