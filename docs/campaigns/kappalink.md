# KappaLink — campanha da vitrine

Oferta: criação + primeiro mês R$ 150; depois R$ 99/mês. Pequenos ajustes e manutenção, com escopo combinado antes da contratação. Sem promessa de vendas, tráfego ou resultados.

Mensagem: Seu cliente clica. Escolhe. Você já sabe como atender.

## Links

Post/story orgânico: https://www.kappalink.com/?utm_source=instagram&utm_medium=organic_social&utm_campaign=lancamento_kappalink

Bio: https://www.kappalink.com/?utm_source=instagram&utm_medium=organic_social&utm_campaign=perfil_kappalink

Campanha Google, somente após aprovação de anúncio e orçamento: https://www.kappalink.com/?utm_source=google&utm_medium=cpc&utm_campaign=lancamento_kappalink

Nenhuma campanha paga foi criada ou ativada. Não colocar nomes, telefones ou contatos nos parâmetros.

## Medição implementada na home

ID GA4 existente reaproveitado: G-038DM4PDTG. Carrega somente nos hosts principais e após permissão. Não carrega em previews. Recusa é persistida localmente; revogação recarrega a página sem carregar a tag. Não envia valores dos campos, texto da mensagem, query arbitrária, fragmento ou URL do referenciador. Apenas os parâmetros de campanha listados no código são permitidos. As páginas legadas mantêm suas tags anteriores; esta alteração não representa auditoria dessas páginas.

Eventos: `demo_cta`, `start_cta`, `example_open`, `demo_select`, `demo_complete`, `request_start`, `contact_intent`. Eventos deduplicados por nome + opção nesta visita. `contact_intent` com method email/copy significa tentativa de abrir o e-mail ou cópia confirmada, nunca envio confirmado, lead recebido ou venda. Não usar generate_lead/purchase sem uma confirmação real de servidor.

## Pendente na conta Google

1. Confirmar que o fluxo GA4 existente pertence à home e que a propriedade continua recebendo dados. Conferir uma visita consentida em Tempo real; sem consentimento não haverá dados.
2. Em Medição otimizada do fluxo, desativar coleta automática de formulários e revisar eventos automáticos duplicados e termos de pesquisa. A implementação própria não envia conteúdo de campos. Não ativar coleta de dados fornecidos por usuários.
3. Se útil, registrar `method` e `example` como dimensões de evento. Decidir conscientemente se contact_intent será evento principal: mede intenção, não recebimento.
4. Verificar propriedade do domínio kappalink.com no Search Console por DNS ou método autorizado disponível. Não inserir meta de verificação fictícia. Enviar https://www.kappalink.com/sitemap.xml e inspecionar a home. Arquivos SEO permitem descoberta, não garantem indexação ou posição.
5. Integração disponível encontrada: Windsor.ai (terceiro), com leitura de GA4 e Search Console após conectar as respectivas contas. Instalação/conexão não confirmada. Sem acesso administrativo confirmado ao Google.

## Verificação

Testes locais: comportamento de consentimento, filtragem dos eventos/campanhas, isolamento de host e pedido para e-mail/cópia. Testes existentes de segurança e produtos preservados. Sem teste visual em navegador neste ambiente. Nenhum recebimento real de lead ou relatório Google confirmado.
