# Changelog — APP JIU / BJJ Training Log

Registro interno das entregas concluídas até **Sprint 1.8.1-HOTFIX**.

## Sprint 1 — MVP funcional

Status: concluída.

- App com Next.js, TypeScript e Tailwind CSS.
- Home inicial.
- Catálogo de treinos.
- Treino A Abril/26.
- Treino B Abril/26.
- Tela de detalhe do treino.
- Execução guiada.
- Pausa e retomada de sessão.
- Registro de reps/tempo, carga/método e PSE real.
- Validação de PSE entre 0 e 10.
- Histórico local com `localStorage`.
- Métricas simples no histórico.
- Vídeos por exercício.
- Vídeos reais do Treino B.
- Fallback para abrir vídeo no YouTube.
- Deploy Vercel.
- Teste real em celular.
- Pular exercício.
- Fazer depois.
- Não farei hoje.
- Fila dinâmica por sessão com `stepOrder`.

## Sprint 1.5 — Rotina semanal real

Status: concluída.

- Complementares adicionados como `type: "complementary"`.
- Categorias reais:
  - Mobilidade
  - Core
  - Cardio
  - Anti-lesão
- URLs oficiais dos vídeos dos complementares em `items[].videoUrl`.
- Rotas dinâmicas abrindo complementares em `/workouts/[id]`.
- Home redesenhada com treinos do mês, complementares e histórico.

## Sprint 1.5.1 — Polimento da Home

Status: concluída.

- CTA principal no topo.
- Treino B como alternativa imediata.
- Complementares compactados por categoria.
- Redução de scroll na Home.
- Microcopy melhorada para uso antes do treino.

## Sprint 1.6 — Correções vindas de teste real

Status: concluída.

- Conclusão de treino volta para Home `/`.
- `Ver histórico` permanece como ação secundária.
- `Repetir este treino` disponível após conclusão.
- Campo de carga/método aceita texto livre.
- Complementares apresentados como sequência/circuito/combo/cardio guiado.

## Sprint 1.7 — Documentação oficial

Status: concluída.

- README, changelog, backlog e roadmap atualizados.
- Estado oficial do projeto documentado.

## Sprint 1.8 — Conveniência e clareza

Status: concluída.

- Complementares com modo rápido.
- Badge Principal/Complementar no histórico.
- Botão repetir último treino na Home.
- Complementares com nomes mais claros.

## Sprint 1.8.1 — Vídeos reais do Treino A

Status: concluída.

- Treino A recebeu 9 vídeos reais.
- Ordem dos exercícios preservada.
- Sem alteração de runner, histórico ou rotas.

## Sprint 1.8.1-QA — QA ampla

Status: concluída.

- Bateria de testes simulando usuário real.
- Home, Treino A, Treino B, complementares, histórico, persistência, navegação e vídeos testados.
- Bugs, riscos e melhorias futuras registrados.

## Sprint 1.8.1-FIX — Correções pós-teste manual

Status: concluída.

- Corrigida inconsistência dos vídeos reais do Treino A.
- Corrigida apresentação semântica de Anti-lesão.
- Complementares ajustados para não parecerem exercício simples isolado.

## Sprint 1.8.1-BLOCKER — Execução real dos complementares

Status: concluída.

- Mobilidade, Core e Anti-lesão passaram a executar por múltiplas etapas.
- Progresso deixou de ser `0/1` para complementares multi-exercício.
- Conclusão só ocorre após tratar as etapas reais.
- Cardio preservado como unidade única guiada.

## Sprint 1.8.1-REAL — Exercícios reais dos complementares

Status: concluída.

- PDFs oficiais usados como fonte dos complementares.
- Mobilidade com Peso: 8 exercícios reais.
- Mobilidade sem Peso: 8 exercícios reais.
- Mobilidade 3: 8 exercícios reais.
- Core 1: 8 exercícios reais.
- Core 2: 8 exercícios reais.
- Anti-lesão: 12 exercícios reais.
- Nomes mínimos/fictícios removidos.
- Reps, tempo, observações e PSE aplicados quando presentes nos PDFs.

## Sprint 1.8.1-QA2 — QA oficial rígida

Status: concluída.

- QA rígida executada sem alteração de código.
- Validado:
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
  - Persistência.
  - Vídeos/modal.
  - Semântica das categorias.
- Recomendação final: pronto com ressalvas.
- Bug real registrado: timer herdado ao reiniciar treino.

## Sprint 1.8.1-HOTFIX — Timer herdado

Status: concluída.

- Corrigido fluxo em que `?start=1` podia restaurar sessão ativa antiga.
- Sessão iniciada pelo CTA agora começa com progresso e timer zerados.
- Botão `Reiniciar treino` remove a sessão persistida antes de começar novamente.
- Fluxo manual de continuar sessão ativa foi preservado.
- Validação local:
  - `npm run lint`.
  - `npm run build`.
  - Navegador local com sessão ativa anterior.
  - Entrada por `?start=1`.
  - Continuação manual.
  - Reinício pelo botão do runner.

## Estado Atual Oficial

Etapa atual: **testes da semana**.

O APP JIU está funcional para uso semanal real. A próxima ação técnica prevista é a **Sprint 1.8.2** para melhorar a leitura do histórico local sem alterar a essência do app.
