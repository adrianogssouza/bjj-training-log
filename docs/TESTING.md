# Testing — APP JIU / BJJ Training Log

Guia operacional de testes do projeto.

## Validação Técnica

Use:

```bash
npm run lint
npm run build
```

Tarefas puramente documentais não exigem lint/build, desde que não alterem código, componentes, rotas, dados de treino ou configuração.

## QA Funcional Mínima

### Home

- Abrir `/`.
- Verificar CTA principal.
- Verificar Treinos do mês.
- Verificar Complementares.
- Verificar Última sessão.
- Verificar Repetir último treino.

### Treinos Principais

Testar:

- Treino A Abril/26.
- Treino B Abril/26.

Fluxos:

- Abrir detalhe.
- Abrir vídeo.
- Iniciar runner.
- Pausar.
- Retomar.
- Concluir item.
- Fazer depois.
- Não farei hoje.
- Concluir treino.
- Voltar para Home.
- Ver histórico.

### Complementares

Testar:

- Mobilidade com Peso.
- Mobilidade sem Peso.
- Mobilidade 3.
- Core 1.
- Core 2.
- Anti-lesão.
- Cardio.

Validar:

- Contagem real de etapas.
- Progresso correto.
- Finalização só na última etapa, exceto Cardio como unidade única.
- Histórico salvo.
- Retorno para Home.

### Histórico

Validar:

- Sessões aparecem.
- Badge Principal/Complementar aparece.
- Detalhes expandem.
- Métricas não parecem incoerentes.
- Registros antigos não quebram leitura.

### Persistência

Validar:

- Sessão ativa sobrevive a reload.
- Sessão concluída não reaparece como ativa por engano.
- Repetir treino funciona.
- Histórico antigo não quebra sessão atual.

## Conteúdo

Validar:

- Treino A mantém vídeos reais corretos.
- Treino B mantém vídeos reais corretos.
- Complementares usam nomes reais dos PDFs oficiais.
- Anti-lesão não aparece como Mobilidade.
- Cardio segue coerente como unidade única guiada.

## Registro de Bugs

Todo bug novo deve ir para `docs/QA.md` com:

- Contexto.
- Reprodução.
- Esperado.
- Observado.
- Severidade.
- Status.

Depois, se for relevante, deve ser priorizado em `docs/BACKLOG.md`.
