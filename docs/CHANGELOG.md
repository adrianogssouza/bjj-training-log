# Changelog — BJJ Training Log

## Sprint 1

- Criação do app.
- Rotas principais.
- Catálogo de treinos.
- Tela de detalhe do treino.
- Execução guiada de treino.
- Pausa e retomada de sessão.
- Opção de pular exercício.
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

Sprint 1 concluída, MVP em produção e teste real do Treino B Abril/26 concluído.

## Pós-teste real

- 05.2: ajuste da barra inferior da execução e melhoria do fallback de vídeo para YouTube.
- 05.2.1: sessão concluída deixou de ser tratada como sessão ativa.
- 05.2.2: reinício do mesmo treino após conclusão no fluxo mobile.
- 05.2.3: remoção de flicker visual da tela antiga `Treino concluído` durante validação do `localStorage`.

## Estado atual

Pronto para melhorias incrementais pós-teste, antes de uma Sprint 2 maior.
