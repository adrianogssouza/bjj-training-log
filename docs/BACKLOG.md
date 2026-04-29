# Backlog — APP JIU / BJJ Training Log

Backlog priorizado com base no uso real das próximas duas semanas.

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

- Complementares reais adicionados.
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
- Fluxos completos testados nos treinos principais e complementares.

## Prioridade alta — próximas duas semanas

### 1. Simplificar execução de complementares

Problema real:

Complementares com vídeo único não precisam necessariamente do mesmo nível de registro de um treino principal.

Proposta:

- Criar modo de execução complementar mais leve.
- Reduzir fricção para concluir sequência.
- Avaliar se PSE continua obrigatório ou vira opcional.

Modelo ideal:

- GPT-5 High

### 2. Organizar `/workouts` por categorias

Problema real:

A Home está organizada, mas `/workouts` ainda pode misturar treinos principais e complementares.

Proposta:

- Seção Treinos do mês.
- Seção Mobilidade.
- Seção Core.
- Seção Cardio.
- Seção Anti-lesão.

Modelo ideal:

- GPT-5 Medium

### 3. Resolver vídeos pendentes do Treino A

Problema real:

Treino A ainda tem vídeos aproximados/placeholders conhecidos.

Proposta:

- Revisar todos os vídeos do Treino A.
- Substituir placeholders por vídeos reais.
- Manter URLs no schema atual.

Modelo ideal:

- GPT-5 Medium

## Prioridade média

### 4. Histórico por tipo de treino

Problema real:

Treinos principais e complementares entram no mesmo histórico, mas têm natureza diferente.

Proposta:

- Exibir tipo de treino no histórico.
- Separar métricas de treino principal e complementar.
- Evitar distorção de indicadores.

Modelo ideal:

- GPT-5 High

### 5. Atalho para repetir último treino

Problema real:

Usuário pode querer repetir rapidamente o último treino feito.

Proposta:

- Mostrar último treino na Home.
- Adicionar CTA para abrir esse treino.

Modelo ideal:

- GPT-5 Medium

### 6. Recomendação semanal simples

Problema real:

O app ainda não sugere o treino do dia.

Proposta:

- Começar com recomendação simples e manual.
- Exemplo: `Hoje: Core` ou `Hoje: Mobilidade`.
- Evitar calendário complexo por enquanto.

Modelo ideal:

- GPT-5 Medium

## Prioridade baixa

### 7. Melhorar nomes dos complementares

Problema real:

Nomes como `Core 1` e `Cardio 3` são funcionais, mas pouco descritivos.

Proposta:

- Renomear com base no objetivo real.
- Exemplo: `Core anti-rotação`, `Cardio intervalado leve`, etc.

Modelo ideal:

- GPT-5 Low

### 8. Observações rápidas por sessão

Problema real:

Ainda não existe campo simples para anotar sensação geral.

Proposta:

- Adicionar nota curta na conclusão.
- Manter opcional.

Modelo ideal:

- GPT-5 Medium

## Fora do escopo atual

- Login.
- Supabase.
- Backend.
- Sincronização entre dispositivos.
- Dashboard analítico avançado.
- Refatoração ampla de arquitetura.

Esses itens só devem voltar ao backlog quando o uso real exigir.
