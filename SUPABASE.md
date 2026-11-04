# Ativar login e sincronização

Pode usar o mesmo projeto Supabase do NutriPlan. O BJJ Training Log usa a tabela
`bjj_training_states`; a tabela e os dados do NutriPlan não são alterados.
Os usuários do mesmo projeto podem entrar nos dois apps com o mesmo e-mail e senha.

## 1. Supabase

1. Abra o projeto já configurado para o NutriPlan.
2. Entre em **SQL Editor → New query**.
3. Copie o conteúdo de `supabase/migrations/20261104_bjj_training_states.sql`.
4. Clique em **Run**. Se aparecer o aviso sobre RLS, escolha **Run and enable RLS**.
5. Confira o resultado: **Success. No rows returned**.

O script pode ser executado novamente. Ele ativa RLS e permite que cada usuário
autenticado leia e altere somente a própria linha. Não libera acesso anônimo.

## 2. Vercel — projeto do BJJ Training Log

Em **Settings → Environment Variables**, adicione:

| Key | Value | Ambiente |
| --- | --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | A mesma URL configurada no NutriPlan | Production |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | A mesma chave pública `sb_publishable_…` do NutriPlan | Production |

Use **Config** para as duas variáveis. Não use secret key, service role ou senha do banco.
Se for testar um deploy de Preview, cadastre também as duas variáveis em **Preview**.

## 3. Publicar a atualização

Se recebeu um pull request: abra a alteração no GitHub e faça **Merge pull request → Confirm merge**.
A Vercel deve iniciar o deploy da branch de produção automaticamente.

Se recebeu um ZIP: extraia, abra a raiz do repositório, escolha **Add file → Upload files**
e envie os arquivos e pastas extraídos na raiz, sem criar uma pasta extra.
Mensagem de commit sugerida: `Adiciona login e sincronização Supabase ao BJJ Training Log`.

Se as variáveis foram adicionadas depois do último deploy, abra **Deployments → último deploy → ⋯ → Redeploy**.
Espere o status **Ready** e abra o domínio de produção.

## 4. Trazer o histórico antigo

1. Abra o app no navegador e endereço em que os registros antigos estão salvos.
2. Entre com sua conta do Supabase — a mesma do NutriPlan, se usou o mesmo projeto.
3. No primeiro acesso, toque em **Importar dados deste navegador**.
4. Espere aparecer **Sincronizado**.
5. No outro dispositivo, abra o app e entre com a mesma conta.

A importação leva histórico e sessões em andamento. As chaves antigas não são apagadas.
Se já criou a conta vazia, ou tiver registros antigos em outro navegador, use
**Conta e backup → Importar registros antigos deste navegador**. A importação mescla
sessões pelo treino e início, mantendo a versão existente na conta quando houver duplicidade.

## 5. Uso diário

- Os registros e exclusões são salvos automaticamente na conta.
- Espere **Sincronizado** antes de mudar de dispositivo.
- Para retomar uma sessão, abra o treino e use **Continuar treino**. O botão de iniciar
  também preserva uma sessão já existente; para zerar, use a ação de reiniciar no treino.
- O app verifica atualizações da nuvem a cada 15 segundos e ao voltar à aba.
- Use uma aba por vez. Navegadores com Web Locks bloqueiam a segunda aba da mesma conta.
- Em falha de rede durante o uso, as alterações ficam na cópia local da conta.
  A sincronização tenta novamente ao reconectar. A abertura inicial e o login precisam de conexão.
- Um conflito entre dispositivos interrompe a edição. Exporte a cópia local antes de carregar
  a versão da nuvem. Se precisar recuperar o histórico exportado, importe esse JSON depois.
  A mesclagem mantém versões já existentes; não resolve automaticamente edições concorrentes da mesma sessão.
- **Limpar histórico** também limpa o histórico da conta nos outros dispositivos.
- **Conta e backup** permite exportar/importar JSON, sem exigir backup manual para sincronizar.

## Verificação após publicar

1. Cadastre parte de um treino e espere **Sincronizado**.
2. Abra em outro dispositivo e confira as cargas, repetições e progresso.
3. Finalize o treino e confira o histórico nos dois dispositivos.
4. Saia e entre de novo para confirmar que os dados permanecem.

Sem as duas variáveis, o app continua no modo local e mostra esse aviso na tela.
Com apenas uma variável ou valores inválidos, mostra orientação de configuração.

## Desenvolvimento

Node 22.13+ (ou 24) e npm. Copie `.env.example` para `.env.local` e preencha as duas variáveis públicas.

```sh
npm ci
npm test
npm run lint
npm run typecheck
npm run build
```

Os testes de integração usam Supabase simulado: validam importação, cache, retomada,
isolamento do armazenamento local e atualização das telas. A validação real de login,
políticas e troca de dispositivos deve ser feita no projeto Supabase após executar o SQL.
