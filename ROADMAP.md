# Roadmap — APP JIU / BJJ Training Log

Roadmap oficial após conclusão até **Sprint 1.8.1-HOTFIX**.

## Estado Atual

Etapa atual: **testes da semana**.

O APP JIU está funcional para rotina semanal real:

- Treino A Abril/26.
- Treino B Abril/26.
- Mobilidade.
- Core.
- Cardio.
- Anti-lesão.
- Execução guiada.
- Histórico local.
- Vídeos por exercício ou sequência.
- Uso mobile-first.

## Linha do Tempo Concluída

### Sprint 1 — MVP validado

- App funcional.
- Treinos principais.
- Execução guiada.
- Histórico local.
- Vídeos.
- Deploy.
- Teste real.
- Hotfixes mobile.
- Pular exercício.
- Fazer depois.
- Não farei hoje.

### Sprint 1.5 — Rotina semanal

- Complementares reais.
- Vídeos oficiais dos complementares.
- Navegação completa para complementares.
- Home separando treinos do mês e complementares.

### Sprint 1.5.1 — Home mais rápida

- CTA principal no topo.
- Complementares compactados.
- Menos scroll.
- Microcopy mais direta.

### Sprint 1.6 — Correções de uso real

- Conclusão retorna para Home.
- Campo de carga/método textual.
- Complementares apresentados como sequência/circuito/combo.
- Fluxos completos testados.

### Sprint 1.7 — Documentação

- README, changelog, backlog e roadmap atualizados para refletir o estado real da época.

### Sprint 1.8 — Conveniência e clareza

- Modo rápido para complementares.
- Badge Principal/Complementar no histórico.
- Botão para repetir último treino na Home.
- Renomeação inicial de complementares para nomes mais claros.

### Sprint 1.8.1 — Vídeos reais do Treino A

- Treino A recebeu 9 vídeos reais.
- Ordem dos exercícios preservada.
- Sem alteração funcional no runner.

### Sprint 1.8.1-QA — QA ampla

- Teste funcional amplo de Home, treinos principais, complementares, histórico, persistência e navegação.
- Bugs e riscos registrados.

### Sprint 1.8.1-FIX — Correções pós-teste manual

- Correção de mapeamento/visibilidade dos vídeos reais do Treino A.
- Correção semântica de Anti-lesão.
- Ajustes de apresentação dos complementares.

### Sprint 1.8.1-BLOCKER — Execução real dos complementares

- Mobilidade, Core e Anti-lesão deixaram de executar como treino único `0/1`.
- Complementares multi-etapa passaram a ter progresso correto por item.
- Cardio preservado como unidade única guiada.

### Sprint 1.8.1-REAL — Exercícios oficiais dos complementares

- PDFs oficiais usados como fonte dos exercícios reais.
- Mobilidade, Core e Anti-lesão receberam nomes, ordem, reps, tempo, observações e PSE quando disponíveis.
- Nomes mínimos/fictícios foram removidos.

### Sprint 1.8.1-QA2 — QA oficial rígida

- QA rígida executada sem alteração de código.
- Produto recomendado como pronto com ressalvas.
- Bug real encontrado: timer herdado ao reiniciar treino.

### Sprint 1.8.1-HOTFIX — Timer herdado

- Sessões iniciadas por `?start=1` passam a descartar sessão ativa antiga e começar do zero.
- Botão `Reiniciar treino` limpa a sessão persistida antes de montar uma nova sessão.
- Fluxo manual sem `?start=1` preserva a opção de continuar sessão ativa.
- Validação local confirmou progresso zerado e timer fresco.

## Próximas Etapas Previstas

### Sprint 1.8.2 — Histórico mais confiável

Objetivo:

Melhorar leitura do histórico sem alterar a essência do app.

Possíveis entregas:

- Filtro por Principal/Complementar.
- Aviso de registros antigos.
- Separação visual entre histórico antigo e novo.

### Sprint 1.8.3 — Polimento de uso semanal

Objetivo:

Refinar pontos de atrito observados nos testes da semana.

Possíveis entregas:

- Melhorar estado de carregamento do histórico.
- Ajustes finos de microcopy.
- Melhorias pequenas em fluxo mobile.

### Sprint 1.9 — Consolidação pré-Sprint 2

Objetivo:

Fechar a base local estável antes de pensar em expansão estrutural.

Possíveis entregas:

- QA de regressão final.
- Documentação atualizada.
- Revisão de métricas e histórico.

### Sprint 2 — Expansão estrutural

Objetivo:

Só deve começar quando o uso real justificar.

Possíveis temas:

- Backend.
- Login.
- Sync.
- Dashboard mais robusto.

## Decisões de Produto

- Manter mobile-first.
- Manter dark UI atual.
- Priorizar uso real antes de novas features grandes.
- Manter histórico local por enquanto.
- Não adicionar login/backend ainda.
- Não alterar localStorage de forma incompatível sem necessidade.
- Bugs novos encontrados em QA alimentam `docs/QA.md` e o backlog futuro.

## Fora do Roadmap Imediato

- Login.
- Supabase.
- Backend.
- Sincronização entre dispositivos.
- Dashboard avançado.
- Multiusuário/professor.
