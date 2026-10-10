# MCD no KappaLink

Ferramenta experimental que descreve distribuição, sequência e ritmo de escolhas binárias sob condições explícitas. Não fornece diagnóstico ou perfil de personalidade.

## Endereços

- Vitrine: `/mcd/`
- Experimento: `/mcd/experimento.html`
- Método: `/mcd/metodologia.html`
- Coleta: POST `/api/mcd-session`

## Banco e publicação

Configure `DATABASE_URL` no ambiente de produção do projeto KappaLink na Vercel. A URL é secreta e não deve entrar no Git nem em arquivos públicos. O endpoint cria a tabela separada `mcd_sessions_v2` se o usuário do banco tiver permissão, preservando as tabelas antigas. Salva o JSON bruto, protocolo, métricas calculadas no servidor e hash para evitar duplicatas.

O envio exige consentimento explícito. Sem conexão configurada ou se o banco falhar, a interface informa que a sessão não foi salva; exportação e histórico local continuam disponíveis.

Antes de incorporar a branch, verificar a conexão com o Neon e testar o envio de uma sessão identificada como teste técnico, sua presença no banco e uma segunda submissão idêntica sem duplicação. Não tratar a aprovação do deploy como prova de salvamento no banco.

## Protocolo e resultados

Versão `mcd-2.0.0`: seis escolhas de treino excluídas das métricas; três condições sorteadas de 40 tentativas — Livre, Meio a meio e Com prazo (1500 ms). Posições balanceadas por condição, cor e lado separados, pausas e ausências preservadas como lacunas. Contexto e relato de estratégia opcionais.

Quantidade, trocas de cor, repetição e tempo mediano aparecem em resumo visual. R, AC1, custo de troca, deriva e janelas permanecem em detalhes. JSON e CSV exportam o registro; histórico local depende de ação explícita.

## Verificação

`npm run test:mcd` executa os 17 testes de métricas, validação, persistência simulada e controlador com DOM/relógio simulados. Eles não substituem a conferência em navegador real nem o teste com o banco real.

## Banco provisionado

Um banco novo foi criado no Neon, com ambientes separados de produção e verificação. A migração versionada em `migrations/001_mcd_sessions_v2.sql` foi aplicada nos dois ambientes. A inserção sintética e o reenvio sem duplicação foram verificados por SQL no ambiente de teste; a produção permanece vazia.

Pendente: configurar `DATABASE_URL` na Vercel e verificar o envio pela API publicada. O acesso às variáveis da equipe foi recusado com 403. A verificação por SQL não substitui o teste ponta a ponta.
