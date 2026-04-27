# BJJ Training Log

Aplicativo web para registrar, executar e revisar treinos de Jiu-Jitsu/BJJ.

## Objetivo

O BJJ Training Log ajuda atletas e professores a organizar sessões de treino, acompanhar a execução dos exercícios e consultar o histórico local de treinos concluídos.

Nesta primeira versão, o foco é validar o fluxo principal durante um treino real: escolher um treino, executar blocos de exercícios, registrar progresso e revisar o histórico no próprio dispositivo.

## Stack

- Next.js 16
- React 19
- TypeScript
- Tailwind CSS
- ESLint
- LocalStorage para persistência local

## Features atuais

- Listagem de treinos disponíveis.
- Tela de detalhe do treino com blocos e exercícios.
- Runner de treino com fluxo guiado.
- Registro de exercícios concluídos e pulados.
- Persistência de sessão ativa no navegador.
- Histórico local de treinos concluídos.
- Métricas simples de histórico: treinos, tempo total, PSE médio e exercícios registrados.
- Suporte a vídeos de execução por exercício.
- Interface responsiva com refinamentos para uso mobile.

## Como rodar localmente

Instale as dependências:

```bash
npm install
```

Rode o servidor de desenvolvimento:

```bash
npm run dev
```

Acesse:

```bash
http://localhost:3000
```

Valide build de produção:

```bash
npm run build
```

Execute lint:

```bash
npm run lint
```

## Rotas principais

- `/`
- `/workouts`
- `/workouts/[id]`
- `/workouts/[id]/start`
- `/history`

## Persistência local

O app usa `localStorage`, sem backend nesta fase.

- Sessão ativa: `bjj-training-log:active-session:{workoutId}`
- Histórico concluído: `bjj-training-log:workout-history`
- Chave legada suportada: `bjj-training-log:session:{workoutId}`

Limitações atuais:

- O histórico fica apenas no navegador/dispositivo atual.
- Limpar os dados do navegador remove os registros.
- Ainda não há conta de usuário, sincronização em nuvem, filtros avançados ou dashboard analítico.

## Status

Sprint 1 concluída.

MVP pronto para deploy na Vercel e teste real em treino.

## Próximos passos

- Publicar na Vercel.
- Testar em treino real no celular.
- Coletar feedback de uso.
- Planejar Sprint 2 com base no feedback.
- Avaliar autenticação, backend, sincronização, gráficos e edição de treinos.
