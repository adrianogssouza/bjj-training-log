# Changelog — APP JIU / BJJ Training Log

Registro interno das entregas concluídas até o estado atual do projeto.

## Sprint 1 — MVP funcional

Status: concluída.

Principais entregas:

- Criação do app com Next.js, TypeScript e Tailwind CSS.
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

Correções pós-teste da Sprint 1:

- Sessão fantasma ao abrir treino sem progresso real.
- Sessão concluída não fica mais como sessão ativa.
- Reinício do mesmo treino após conclusão.
- Ajustes mobile na barra inferior.
- Ajustes de vídeo no mobile/5G.
- Fluxo `Opções do exercício`.
- `Fazer depois` move exercício para o fim da fila.
- `Não farei hoje` registra pulo definitivo.
- Fila dinâmica por sessão com `stepOrder`.

## Sprint 1.5 — Rotina semanal real

Status: concluída.

Principais entregas:

- Adição de complementares reais ao seed:
  - Mobilidade com Peso
  - Mobilidade sem Peso
  - Mobilidade 3
  - Core 1
  - Core 2
  - Cardio 1
  - Cardio 2
  - Cardio 3
  - Cardio 4
  - Cardio 5
  - Cardio 6
  - Anti-lesão
- Complementares adicionados como `type: "complementary"`.
- URLs oficiais dos vídeos dos complementares adicionadas em `items[].videoUrl`.
- Rotas dinâmicas passaram a abrir complementares em `/workouts/[id]`.
- Home redesenhada para rotina semanal:
  - Treinos do mês
  - Complementares
  - Última sessão / histórico
- Cards abrem diretamente o detalhe do treino.

Validações:

- `npm run lint`
- `npm run build`
- QA visual no navegador.
- Abertura de rotas dos complementares.

## Sprint 1.5.1 — Polimento da Home

Status: concluída.

Principais entregas:

- CTA principal no topo para Treino A.
- Treino B como alternativa imediata.
- Complementares compactados por categoria.
- Redução de scroll na Home.
- Microcopy melhorada para uso antes do treino.
- Visual dark e mobile-first mantidos.

Validações:

- `npm run lint`
- `npm run build`
- QA visual no in-app browser.

## Sprint 1.6 — Correções vindas de teste real

Status: concluída.

Principais entregas:

- Ao concluir qualquer treino, a ação principal agora volta para Home `/`.
- `Ver histórico` permanece como ação secundária.
- `Repetir este treino` fica disponível após conclusão.
- Campo de carga/método aceita texto livre.
- Complementares deixam de parecer exercício único simples.
- Complementares passam a ser apresentados como:
  - Sequência / combo
  - Circuito / combo
  - Cardio guiado
- Tela de detalhe usa `Sequência do complementar` para treinos complementares.
- Métrica de complementares mostra `Formato / Sequência`.

Fluxos completos testados:

- Treino A Abril/26.
- Treino B Abril/26.
- Mobilidade com Peso.
- Core 1.
- Cardio 1.
- Anti-lesão.

Validações:

- `npm run lint`
- `npm run build`
- Conclusão de treino retornando para Home.
- Apresentação correta dos complementares.

## Estado atual oficial

O APP JIU está funcional para uso semanal real com treinos principais e complementares.

Ainda não há backend, login ou sincronização. A estratégia continua sendo priorizar uso real antes de adicionar infraestrutura.
