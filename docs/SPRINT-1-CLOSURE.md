# Encerramento — Sprint 1

## Status oficial

Sprint 1 encerrada oficialmente.

O MVP do APP JIU / BJJ Training Log está funcional em produção na Vercel e foi validado em teste real com o Treino B Abril/26.

## Entregas principais

- App mobile-first em Next.js, TypeScript e Tailwind CSS.
- Catálogo de treinos.
- Tela de detalhe do treino.
- Execução guiada do treino.
- Pausar e retomar sessão.
- Validação de campos críticos, incluindo PSE real entre 0 e 10.
- Histórico local via `localStorage`.
- Persistência de sessão ativa por dispositivo/navegador.
- Vídeos dos exercícios.
- Vídeos reais do Treino B.
- Fallback direto para YouTube.
- Deploy em produção na Vercel.

## Hotfixes pós-teste real

- 05.2: corrigiu barra inferior da execução e melhorou fallback de vídeo.
- 05.2.1: corrigiu sessão concluída sendo tratada como sessão ativa.
- 05.2.2: corrigiu reinício após finalizar treino.
- 05.2.3: corrigiu flicker visual de treino concluído antigo durante validação do `localStorage`.
- 05.3: implementou `Opções do exercício`.

## Tarefa 05.3

Fluxo concluído e aprovado:

- `Fazer depois`: exercício adiado retorna ao fim da fila da sessão.
- `Não farei hoje`: exercício é registrado como pulado definitivo.
- `Cancelar`: fecha a action sheet sem alterar a sessão.
- Label final do botão: `Opções do exercício`.
- Fila dinâmica local por sessão.

## Decisões de escopo

- Não iniciar Sprint 2 ainda.
- Não implementar backend, login ou Supabase neste momento.
- Manter histórico local por dispositivo/navegador.
- Não alterar histórico antigo.

## Backlog futuro

05.4 — Execução correta de bi-set fica como refinamento futuro, não como pendência bloqueante da Sprint 1.
