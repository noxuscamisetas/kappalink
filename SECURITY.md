# Segurança e entrada de clientes

Revisão técnica: 17/10/2026. Escopo: código versionado, dependências, rotas, formulários e testes de produção sem dados reais.

## Modelo atual

As vitrines são HTML estático; não existe painel público de edição, login de cliente ou upload. Alterações exigem acesso autorizado ao GitHub e ao deploy. Código e imagens publicados são públicos; dados privados, chaves, documentos, exportações e arquivos de cliente não devem entrar em `public/` nem no histórico Git. Não conceder acesso ao repositório compartilhado a clientes. Separar projetos/repos quando precisarem editar código.

Os formulários de lojas apenas preparam mensagens no aparelho. Não enviam nem salvam pedidos automaticamente no servidor. O MCD é separado: sua API pública recebe uma sessão com consentimento e grava no Neon; não tem endpoint de leitura, edição ou exclusão pública. O endpoint público ainda pode receber spam técnico; validação e origem não substituem rate limiting persistente.

## Aplicado

- Cabeçalhos: nosniff, negação de frames, referrer desativado, recursos de câmera/microfone/localização/pagamento desativados; CSP limita base, objetos e frames. Não é uma CSP completa de scripts: páginas legadas usam scripts inline.
- Subdomínios cadastrados encaminham à pasta explícita; nomes desconhecidos recebem 404. As pastas são vitrines públicas, não fronteiras de autorização para dados privados.
- Analytics removido dos formulários de contato/pedido.
- API: consentimento, payload limitado e validado, profundidade limitada, origem explícita quando presente, tipo JSON, consultas parametrizadas e não exposição de erros internos.
- Cadastro `config/stores.json` e `npm run check:security` verificam aliases, pastas, duplicações, proteção e padrões conhecidos de segredo em arquivos públicos.
- CI executa verificações e 19 testes. CI só vira impedimento obrigatório de merge com proteção de branch configurada; não presumir que já existe.
- Atualização do sharp para 0.35.5; npm audit sem vulnerabilidades conhecidas na data. Auditoria não prova ausência de falhas.

## Antes de ativar CADA cliente real

1. Registrar o subdomínio exato e aliases em `config/stores.json`, confirmar titularidade e verificar a regra de rota.
2. Confirmar com o responsável e testar destinatários próprios de e-mail/WhatsApp. Os três cadastros atuais permanecem `demo: true`, `contact_verified: false`: Festa Linda/Ana usam e-mail central e número compartilhado nos exemplos. Nunca copiar esses contatos para cliente novo. Só mudar `demo: false` após confirmação e preencher `contact_verified: true`.
3. Usar só imagens autorizadas. Nesta versão não aceitar uploads de HTML, JS, SVG ativo, credenciais ou documentos privados. Futuro upload exige autenticação, autorização por cliente, limites, validação de conteúdo e armazenamento isolado.
4. Testar domínio com HTTPS, fotos, pedido, resumo e destinatário final. Nenhuma mensagem de teste real deve ser enviada sem autorização. Testar endereço curto/longo aprovado, com/sem barra e acesso móvel.
5. Executar `npm test`, revisar diff e publicar; conferir produção e manter commit de rollback.
6. Conferir 2FA, colaboradores, aplicativos e proteção de main no GitHub; membros, tokens e proteção de deploy na Vercel. Não compartilhar chaves administrativas. Não confirmado por esta revisão por falta de acesso administrativo suficiente.
7. MCD: revisar papel de banco com menor privilégio, retenção/exclusão e adicionar limite persistente de requisições na plataforma. WAF não foi alterado nem considerado auditado.

## Limitações / bloqueios

A conexão Vercel retorna projeto não encontrado/sem acesso para consultas administrativas. Não foi possível certificar membros, tokens, firewall, logs, 2FA, branch protection ou todos os acessos ao Neon. Não houve pentest externo nem garantia de segurança absoluta. O estado é reforçado para vitrines estáticas geridas pelo proprietário; não está homologado como plataforma multiusuário com painel, upload ou pagamentos.
