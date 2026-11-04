# Cardio na Bike — módulo independente do BJJ Training Log

## Objetivo

Programa progressivo de 6 semanas de bicicleta ergométrica vertical, em horários separados da musculação. Prioriza exercícios aeróbicos moderados e autorregistro. Não substitui prescrição individual nem avaliação clínica.

## Prescrição de referência (ajustável após avaliação profissional)

| Semana | Sessões planejadas | Minutos por sessão | Total semanal (inclui aquecimento/desaquecimento) |
|---|---:|---:|---:|
| 1 | 3 | 25 | 75 |
| 2 | 3 | 30 | 90 |
| 3 | 4 | 30 | 120 |
| 4 | 4 | 35 | 140 |
| 5 | 5 | 35 | 175 |
| 6 | 5 | 40 | 200 |

Toda sessão contém 5 min de aquecimento fácil, bloco principal em ritmo conversável e 5 min de desaquecimento. PSE alvo 3–4/10. A referência genérica de FC 105–125 BPM não é um teto clínico nem substitui teste da fala, histórico médico, pressão arterial ou exame cardiorrespiratório.

A progressão depende de tolerância, recuperação e eventuais sintomas, e **não deve ser automatizada exclusivamente por volume concluído**. Se houver sinais de alerta, interromper o esforço e procurar avaliação clínica. Não somar os treinos intervalados PSE 8–9 de outros programas nesta fase sem revisão da prescrição.

## Funcionalidades

- Página exclusiva `/bike`, preservando os seis cardios complementares já existentes.
- Planejamento de seis semanas com fase, duração e instruções detalhadas.
- Registro de sessão realizada ou não realizada, data, minutos, FC média e pico, PSE, teste da fala, distância, resistência, fadiga das pernas, sintomas e comentários.
- Edição e exclusão de sessões.
- Resumo e comparação de minutos planejados x realizados e quantidade de sessões.
- Registro de peso, gordura estimada, cintura e pressão arterial, todos opcionais.
- Edição e exclusão de medições, além de meta opcional de peso.
- Exportação CSV de sessões, backup JSON de todas as informações e restauração de backup.
- Sincronização com o Supabase da conta já existente; a importação legada consegue trazer dados locais no primeiro acesso, se essa opção for selecionada.
- Interface mobile-first, acessível no navegador e sem novas dependências.

## Persistência e privacidade

O módulo integra-se ao mesmo `TrainingState` já sincronizado com a conta Supabase em `bjj_training_states` (campo opcional `bike`, sem migração SQL). Os dados são privados à conta via RLS existente. Quando não há Supabase configurado, usa `localStorage` separado (`bjj-training-log:bike-cardio:v1`), sem criptografia ou sincronização. O primeiro acesso a conta pode importar dados locais via fluxo legado. Faça backups periódicos; não publique JSON ou CSV no GitHub. Não foram embutidos no código dados pessoais, medicamentos nem resultados de exames.

## Primeira configuração sugerida

Na tela `/bike`, preencher data de início do novo ciclo, meta de peso e uma primeira medição real. A ferramenta **não contém dados pessoais pré-carregados**, por razões de privacidade do repositório público. Usuário pode inserir os resultados que já possui no campo de medidas.

## Checklist de QA

1. `npm install` e `npm run lint` / `npm run build`.
2. Abrir Home, encontrar card “Cardio na Bike” e link de navegação.
3. Registrar sessão de 25 min na primeira semana; verificar contador e gráfico.
4. Registrar sessão “Não realizado”; não deve contar minutos executados.
5. Editar, salvar e excluir uma sessão.
6. Testar validação de BPM médio maior que pico, campos numéricos vazios e duração inválida.
7. Registrar apenas peso; registrar pressão sistólica + diastólica; testar erro quando só uma pressão é informada.
8. Editar e excluir medição.
9. Exportar JSON, limpar registros em ambiente de teste, importar JSON e verificar restauração.
9b. Com Supabase ativo, entrar no PC e no celular, salvar no primeiro e verificar atualização no segundo após sincronizar. Confirmar que histórico BJJ permanece intacto.
10. Exportar CSV; verificar caracteres em português e separadores.
11. Alterar data de início; confirmar reagrupamento de semanas conforme datas.
12. Testar modo mobile (largura 320–390 px), sem scroll horizontal e sem quebrar botões.
13. Verificar isolamento: histórico de treinos BJJ continua intacto.
14. Testar página Vercel depois do deploy, incluindo registro persistente após recarregar.

## Limitações intencionais

- Não há leitura automática de relógio, bicicleta ou Apple Health. É preciso inserir FC e demais valores medidos manualmente.
- Não calcula calorias queimadas porque dados insuficientes tornariam os resultados enganosos.
- Não substitui personal trainer, nutricionista ou avaliação médica.
- Não envia dados para o plano nutricional ou Supabase de outro app.
- Com login, utiliza a mesma sincronização do BJJ Training Log; sem login, permanece local. A sincronização depende de conexão, permissões RLS e configuração do Supabase.
