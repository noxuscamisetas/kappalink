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

## Regras dos cálculos

Saldo de hoje + entradas não recebidas entre hoje e 7 dias − contas abertas vencidas ou com vencimento até 7 dias. Datas antigas de entradas não contam como dinheiro futuro. A previsão agregada não garante disponibilidade antes de cada vencimento.

Cartões são referência manual: limite não é renda. Fatura só entra na previsão quando cadastrada em Contas; o app informa isso explicitamente e não soma faturas duas vezes automaticamente.

Pagar exige saldo suficiente, desconta uma vez e marca a conta paga. Recebi soma a entrada uma vez; “Já está no saldo” confirma sem somar. Editar apenas contas/entradas abertas; registros liquidados são histórico. A simulação de uma conta já incluída não desconta duas vezes. Não estima juros, recomenda crédito ou executa pagamentos.

## Verificação

`npm test` inclui `tests/oqpagar.test.js`, além das suítes anteriores. Conferência visual no celular ainda necessária quando navegador de QA não estiver disponível.
