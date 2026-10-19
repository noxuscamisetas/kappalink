# Ana — assistente virtual de cozinha

Ana Beatriz é uma personagem, conforme confirmado pelo proprietário. A marca não representa nutricionista nem anuncia CRN, consulta, diagnóstico, dieta ou adaptação terapêutica.

## Oferta e operação

Organização de até cinco receitas escolhidas pelo comprador, rendimento culinário ajustado, lista de compras consolidada e PDF; preço inicial R$ 29, pagamento único, uma revisão. A demonstração gratuita usa três receitas ilustrativas e permite baixar a lista sem fornecer dados.

1. O pedido é preparado no aparelho, com botões. O comprador confere e envia por e-mail ao contato central do projeto.
2. O operador confirma receitas completas (ingredientes, quantidades, preparo e rendimento original), direitos de uso do material, rendimento desejado e prazo antes do pagamento. Não solicitar dados de saúde nem documentos pessoais.
3. O operador traz o pedido à conversa com a IA, sem dados pessoais desnecessários. Conferir os cálculos e a coerência culinária; produzir o PDF e revisar a apresentação.
4. O operador encaminha o PDF e acompanha a única revisão incluída. Não há monitoramento automático de e-mail, pagamento integrado ou produção autônoma em segundo plano.

Não vender adequação a alergias, emagrecimento, doença ou objetivos clínicos. Não converter uma solicitação desse tipo em prescrição disfarçada. Os ingredientes devem ficar explícitos e a pessoa precisa conferir sua adequação. Para atendimento nutricional, orientar a buscar profissional habilitado.

## Endereços e privacidade

Preservados anabeatriz.kappalink.com e anabeatriznutricao.kappalink.com, com a pasta existente. Assets usam endereço absoluto do domínio principal para funcionar também nas rotas por pasta, sem duplicação de prefixos nos rewrites. Assinatura MindKappa discreta.

Sem analytics, conta, upload público ou armazenamento de pedidos. Resumos usam textContent; dados do comprador não entram no Git. O envio depende de ação explícita no aplicativo de e-mail, com opção de copiar o resumo e endereço visível.

## Antes de considerar venda concluída

Confirmar recebimento do pedido, pagamento acordado, produção e entrega efetiva. Página publicada e clique em botão não contam como venda. Preço inicial é uma hipótese comercial, não evidência de demanda.

## Amostra pública de entrega

`public/anabeatriznutricao/amostra.pdf` contém quatro páginas: lista consolidada e três receitas, cada uma com rendimento culinário aproximado de quatro porções. Gerar com `python scripts/generate-ana-sample.py` (ReportLab e fontes DejaVu). O script usa a mesma fonte de receitas e o mesmo consolidador da demonstração, sem recopiar quantidades manualmente.

Prévia da primeira página em `assets/amostra.jpg`; link para o PDF na abertura da vitrine. PDF renderizado e inspecionado página a página; somas verificadas, incluindo cebola (2 unidades) e azeite (5 colheres de sopa). Não contém dados de comprador nem constitui plano alimentar.
