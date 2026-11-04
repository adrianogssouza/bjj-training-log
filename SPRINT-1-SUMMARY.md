# Resumo Executivo — Sprint 1

## Status

Sprint 1 oficialmente concluída.

O MVP do BJJ Training Log está funcional, publicado em produção e validado em teste real com o Treino B Abril/26.

## Objetivo da Sprint

Criar uma primeira versão mobile-first para executar treinos de Jiu-Jitsu/BJJ, registrar progresso durante a sessão e consultar histórico local após o treino.

## Principais entregas

- App em Next.js, TypeScript e Tailwind CSS.
- Catálogo de treinos.
- Tela de detalhe do treino.
- Runner de execução.
- Pausar e retomar treino.
- Opções do exercício: fazer depois ou não fazer hoje.
- Fila dinâmica para exercícios adiados.
- Validações de campos críticos, incluindo PSE real entre 0 e 10.
- Histórico local com `localStorage`.
- Métricas simples do histórico.
- Vídeos dos exercícios.
- Vídeos reais do Treino B.
- Fallback direto para YouTube.
- Deploy na Vercel.
- Hotfixes pós-teste real no celular.

## Validação em campo

O Treino B Abril/26 foi executado em teste real no celular. O app conseguiu apoiar a sessão, salvar histórico e expor pontos reais de melhoria de UX.

## Decisões mantidas

- Sem login nesta fase.
- Sem backend/Supabase nesta fase.
- Histórico local por dispositivo/navegador.
- Priorizar aprendizado de uso real antes de refatorações grandes.

## Backlog futuro

A próxima tarefa recomendada é 05.4 — execução correta de bi-set, tratada como refinamento futuro e não como pendência bloqueante da Sprint 1.
