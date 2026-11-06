# Oqpagar

Organizador pessoal próprio, distinto das vitrines comerciais. Origem canônica: https://oqpagar.kappalink.com/. A home oferece um link identificado como ferramenta pessoal.

## Dados e segurança

- Sem backend financeiro, cadastro, telemetria ou analytics. Nenhuma anotação inicial fictícia.
- localStorage `oqpagar_v2`, isolado por origem. A rota do domínio principal redireciona ao subdomínio; o JavaScript bloqueia gravações em outras origens.
- Dados locais não são criptografados nem protegidos por senha. Quem acessa o navegador pode vê-los. O usuário deve guardar backups privados.
- CSP restrita: scripts e estilos locais, conexão bloqueada, formulários bloqueados, sem iframe.
- Não introduzir dependências ou scripts de vitrines/analytics nesta origem.
- Backup JSON até 2 MB, 2.000 itens por lista, validação estrita, IDs regenerados na importação e escape de conteúdo ao renderizar.
- Backup antigo `oqpagar_v1` é aceito. O armazenamento do HTML antigo não migra entre origens; exportar no original e restaurar no novo. A versão antiga não distinguia recebimentos: confirmar cada entrada e conferir saldo depois da restauração.
- Falha ao ler armazenamento bloqueia gravação para evitar sobrescrever dados. Mudanças de outra aba bloqueiam gravação até recarregar.
- A hospedagem pode reter dados técnicos de acesso, sem valores anotados nas requisições do app.

## Experiência e cálculos

Uma tela: resumo dos próximos 30 dias (hoje + 29 dias), cartões por tipo, períodos antes e a partir do vale (dia 20 editável), tabela cronológica e formulário único de entrada/saída. Contas até o próximo dia 15 recebem um subtotal; dias 16–19 continuam na previsão. O saldo final do primeiro período passa ao segundo. Não há abas nem simulação separada.

Saldo atual + entradas futuras não recebidas − contas abertas até o fim da janela, incluindo atrasadas. Entradas com data passada não contam como previsão; permanecem disponíveis para confirmar ou editar. A tabela mostra o saldo após cada evento e sinaliza falta de dinheiro anterior a uma entrada. Eventos do mesmo dia consideram entradas primeiro; não há previsão de horário ou garantia de recebimento.

Crédito normal, alimentação, refeição, outros benefícios e limite especial ficam separados do dinheiro próprio. Benefícios mostram saldo informado; crédito e especial mostram limite menos valor utilizado. Tipos de entrada: salário, vale, Pix, diária, venda, reembolso, empréstimo e outras; saídas: casa, mercado, transporte, saúde, educação, fatura, empréstimo, imposto, lazer e outras.

Novos cartões de crédito incluem a fatura automaticamente pelo próximo vencimento, salvo a opção “Já lancei essa fatura como saída”. Cartões existentes/importados mantêm a regra manual anterior para não duplicar contas: fatura incluída nas saídas. Cartão sem vencimento gera aviso e não é somado silenciosamente. Saldos/limites dos cartões são atualizados manualmente; as movimentações do formulário representam dinheiro, não compras ou recargas automáticas em cartão.

Pagar exige saldo suficiente e desconta uma vez. Recebi soma uma vez; “Já no saldo” confirma sem somar. Pagar fatura automática desconta o dinheiro e zera a fatura anotada, com registro no histórico. Não executa pagamentos, calcula juros nem recomenda crédito.

A chave `oqpagar_v2` e a versão 2 de backup são mantidas, com novos campos opcionais compatíveis. Campos antigos não são descartados; não há sobrescrita ao abrir. Dados inválidos e alterações em outra aba bloqueiam gravações.

## Verificação

`npm test` inclui `tests/oqpagar.test.js`, além das suítes anteriores. Conferência visual no celular ainda necessária quando navegador de QA não estiver disponível.
