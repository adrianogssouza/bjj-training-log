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

## 2026-11-04 — Login e sincronização Supabase

- Login com e-mail e senha, tabela própria com RLS e cache por conta.
- Histórico e sessões em andamento na nuvem, importação legada e backup JSON.
- Controle de revisão contra sobrescrita concorrente, reconexão e atualização das telas.
- Retomada preserva sessão existente ao abrir um link de início. Reiniciar continua sendo uma ação explícita.
- Testes automatizados de armazenamento, sincronização e interface da conta.

## Redesign 2026 — Fase 1: plano semanal e temas

Status: em revisão (pull request).

- Planejador semanal em `/plano`: semana a semana, vários treinos por dia (ex.: Treino A + Cardio 3), copiar da semana anterior e limpar semana.
- Home com **Plano de hoje** (todos os treinos do dia, cada um com Iniciar/Continuar e selo Feito) e faixa **Plano da semana** com o que foi feito.
- Plano salvo no mesmo estado da conta (`bjj_training_states.data.plans`), sem migração SQL; no modo local fica em `bjj-training-log:weekly-plans:v1`.
- "A" e "B" no plano seguem o Treino A/B do ciclo vigente.
- Quatro temas escuros (Carvão · Vermelho, Preto · Verde-limão, Azul-noite · Ciano, Grafite · Dourado) no botão de aparência do cabeçalho, salvos por dispositivo.
- Cores dos componentes passam a vir de variáveis CSS; vermelho de perigo e cores de status não mudam com o tema.
- Fontes dos temas servidas pelo próprio app (`@fontsource`).

## Redesign 2026 — Fase 2: modo foco na execução

- Execução guiada passa a andar série por série; em bi-set, tri-set e circuito as séries são intercaladas por rodada.
- Modo foco: topo enxuto (tempo e progresso em séries), card com "Série X de Y" e indicadores de cada série, notas do exercício e última execução da mesma série. A carga da série anterior vem preenchida.
- Botão **Ver lista**: todos os exercícios agrupados por bloco, com séries feitas, puladas, atual e pendentes; tocar numa série pendente ou pulada a faz agora.
- **Descanso automático** (opcional, salvo por aparelho, desligado por padrão): ao terminar a rodada abre uma contagem regressiva com o tempo das notas do bloco (menor valor da faixa; 60s quando não informado), com "Pular descanso" e "Mais 30 segundos".
- Opções da série: Fazer depois, Pular esta série e Não farei hoje (pula as séries restantes do exercício).
- Compatível com histórico e sessões em andamento anteriores: a 1ª série mantém o id antigo e o campo `set` dos registros é opcional (sem migração SQL).
- Home conta o progresso em séries; Histórico agrupa as séries de cada exercício.
- Ajuste pós-teste no celular: card do exercício compacto (vídeo ao lado do nome, meta e PSE em uma linha), reps e PSE lado a lado, última execução numa linha, aviso flutuante e "Cancelar treino" fora da barra fixa, para os campos da série aparecerem sem rolar.
