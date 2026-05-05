# Backlog — APP JIU / BJJ Training Log

Backlog priorizado com base no uso real e na QA oficial até **Sprint 1.8.1-QA2**.

## Estado Atual

Etapa atual: **testes da semana**.

Não abrir nova sprint até haver novo retorno de uso real, salvo hotfix crítico.

## Concluído

### Sprint 1

- MVP funcional.
- Treino A e Treino B.
- Execução guiada.
- Histórico local.
- Vídeos por exercício.
- Pular exercício.
- Fazer depois.
- Não farei hoje.
- Deploy e teste real.

### Sprint 1.5

- Complementares adicionados.
- Vídeos oficiais dos complementares.
- Home reorganizada para rotina semanal.
- Navegação completa para complementares.

### Sprint 1.5.1

- Home compactada.
- CTA principal no topo.
- Complementares agrupados.
- Scroll reduzido.
- Microcopy ajustada.

### Sprint 1.6

- Pós-conclusão volta para Home.
- Campo de carga/método aceita texto livre.
- Complementares apresentados como sequência, circuito, combo ou cardio guiado.

### Sprint 1.7

- Documentação oficial reescrita para o estado real da época.

### Sprint 1.8

- Modo rápido em complementares.
- Badge Principal/Complementar no histórico.
- Repetir último treino na Home.
- Complementares com nomes mais claros.

### Sprint 1.8.1

- Vídeos reais do Treino A.

### Sprint 1.8.1-QA

- QA ampla antes de teste manual.

### Sprint 1.8.1-FIX

- Ajustes pós-teste manual.
- Treino A com vídeos reais refletindo corretamente.
- Anti-lesão com categoria/label coerente.
- Complementares com apresentação menos enganosa.

### Sprint 1.8.1-BLOCKER

- Complementares multi-exercício passaram a executar por etapas.
- Mobilidade, Core e Anti-lesão deixaram de ser `0/1`.
- Cardio preservado como unidade única guiada.

### Sprint 1.8.1-REAL

- PDFs oficiais usados como fonte.
- Exercícios reais aplicados em Mobilidade, Core e Anti-lesão.
- Nomes fictícios removidos.

### Sprint 1.8.1-QA2

- QA rígida oficial executada.
- Produto pronto com ressalvas.
- Bug de timer herdado registrado.

### Sprint 1.8.1-HOTFIX

- Timer herdado ao reiniciar treino corrigido.
- `?start=1` passa a criar sessão nova mesmo quando existe sessão ativa antiga.
- Botão `Reiniciar treino` limpa a sessão persistida antes de começar de novo.
- Validação local em navegador confirmou progresso zerado e timer fresco.

## Prioridade Alta

### 1. Filtro no histórico

Problema:

Histórico mistura muitos registros principais, complementares, antigos e novos.

Proposta:

- Filtro Principal/Complementar.
- Futuro filtro por treino e período.

Modelo ideal:

- GPT-5 Medium

### 2. Aviso de registros antigos

Problema:

Registros antigos de complementares podem aparecer com `1` ou `6` concluídos, enquanto o modelo novo usa `8` ou `12`.

Proposta:

- Indicar que registros antigos seguem modelo anterior.
- Evitar interpretação errada de métricas.

Modelo ideal:

- GPT-5 Medium

## Prioridade Média

### 3. Melhorar `Carregando histórico...`

Problema:

Estado transitório aparece na Home/Histórico antes da hidratação do `localStorage`.

Proposta:

- Melhorar skeleton/copy.
- Evitar aparência de app travado.

Modelo ideal:

- GPT-5 Low

### 4. Métricas separadas entre histórico antigo e novo

Problema:

Métricas agregadas misturam registros criados em modelos diferentes.

Proposta:

- Separar ou sinalizar métricas pós-modelagem real.
- Preservar histórico antigo sem migração destrutiva.

Modelo ideal:

- GPT-5 High

## Prioridade Baixa

### 5. Refinos de microcopy pós-teste semanal

- Ajustar textos conforme feedback real.
- Melhorar nomes curtos sem alterar dados oficiais.

Modelo ideal:

- GPT-5 Low

### 6. Observações rápidas por sessão

- Campo opcional de sensação geral.
- Pode entrar apenas se uso real pedir.

Modelo ideal:

- GPT-5 Medium

## Base de QA

Bugs novos encontrados em QA ou uso real devem ser adicionados em `docs/QA.md` e avaliados para priorização neste backlog.

## Fora do Escopo Atual

- Login.
- Supabase.
- Backend.
- Sincronização entre dispositivos.
- Dashboard analítico avançado.
- Refatoração ampla de arquitetura.
