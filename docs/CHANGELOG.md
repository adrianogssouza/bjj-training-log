# Changelog — BJJ Training Log

## Sprint 1

- Criação do app.
- Rotas principais.
- Catálogo de treinos.
- Tela de detalhe do treino.
- Execução guiada de treino.
- Pausa e retomada de sessão.
- Opção de pular exercício.
- Opções do exercício com `Fazer depois` e `Não farei hoje`.
- Validações obrigatórias durante o treino.
- Histórico local com `localStorage`.
- Métricas simples do histórico.
- Vídeos dos exercícios.
- Vídeos reais do Treino B.
- Deploy na Vercel.
- Correções críticas antes do teste real.

## Correções críticas

- Sessão fantasma ao abrir treino sem progresso real.
- PSE inválido acima de 10.
- Teclado mobile do campo de cardio.
- Cache/produção Vercel durante validação em celular.
- Vídeos do Treino B.

## Estado atual

Sprint 1 oficialmente concluída, MVP funcional em produção e teste real do Treino B Abril/26 concluído.

## Pós-teste real

- 05.2: ajuste da barra inferior da execução e melhoria do fallback de vídeo para YouTube.
- 05.2.1: sessão concluída deixou de ser tratada como sessão ativa.
- 05.2.2: reinício do mesmo treino após conclusão no fluxo mobile.
- 05.2.3: remoção de flicker visual da tela antiga `Treino concluído` durante validação do `localStorage`.
- 05.3: fluxo `Opções do exercício`, separando `Fazer depois` de `Não farei hoje`.
- 05.3A: ajuste de UX no label do botão para `Opções do exercício`.

## Tarefa 05.3

- `Fazer depois`: move o exercício atual para o final da fila da sessão.
- `Não farei hoje`: registra o exercício como pulado definitivo.
- Fila dinâmica por sessão com `stepOrder`.
- Histórico antigo preservado.
- Label do botão atualizado para refletir o novo comportamento.

## Estado atual

Sprint 1 encerrada. Próximas mudanças devem ser tratadas como refinamentos futuros, começando por 05.4 se priorizado.
