# 📘 Documentação Técnica Completa — O Que É Isso? Artesanato

Bem-vindo à documentação oficial do projeto **O Que É Isso?**, uma plataforma de e-commerce de artesanato feito à mão em família (Bolsas & Bonecas, Crochês & Afins, e Trabalhos em Madeira).

---

## 🏗️ 1. Arquitetura do Sistema & Stack Tecnológica

| Camada | Tecnologia Utilizada | Descrição |
|---|---|---|
| **Backend** | Node.js (v20) + Express.js | API RESTful e renderização server-side (SSR). |
| **Banco de Dados** | MongoDB (v7.0) + Mongoose | Banco NoSQL estruturado em containers Docker com volume persistente. |
| **Frontend** | EJS + Vanilla CSS3 + FontAwesome | Interface responsiva moderna com Design System customizado (temas artesanais). |
| **Autenticação** | Passport.js + JWT + Cookies | Suporte a login tradicional (E-mail/Senha) e Google OAuth 2.0. |
| **Pagamentos** | Mercado Pago SDK v2 | Checkout transparente para Pix, Cartão de Crédito, Boleto e Webhook automático. |
| **E-mails** | Nodemailer + Hostinger SMTP | Notificações responsivas em HTML para clientes e administradores. |
| **PWA** | Service Worker + Manifest | Instalação mobile em Android e iOS com funcionamento offline. |
| **Infraestrutura** | Docker + Nginx Proxy Manager | Orquestração por `docker-compose` em rede `proxy` integrada. |

---

## ⚙️ 2. Variáveis de Ambiente (`.env`)

O arquivo `.env` fica localizado na raiz da aplicação (`/opt/docker/oqueeisso/.env` na VPS).

```env
# Servidor & Banco de Dados
NODE_ENV=production
PORT=80
MONGODB_URI=mongodb://mongo:27017/oqueeisso
JWT_SECRET=sua_chave_jwt_super_segura_aqui

# URLs da Aplicação
BASE_URL=https://oqueeisso.com
WEBHOOK_URL=https://oqueeisso.com

# Google OAuth 2.0
GOOGLE_CLIENT_ID=seu_client_id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=seu_client_secret
GOOGLE_CALLBACK_URL=https://oqueeisso.com/auth/google/callback

# Mercado Pago
MERCADOPAGO_ACCESS_TOKEN=APP_USR-seu_access_token_aqui

# E-mail SMTP (Hostinger)
SMTP_HOST=smtp.hostinger.com
SMTP_PORT=465
SMTP_USER=atendimento@oqueeisso.com
SMTP_PASS=sua_senha_do_email
SMTP_FROM_NAME="O Que É Isso? Artesanato"
ADMIN_ALERT_EMAIL=atendimento@oqueeisso.com
```

---

## 🔐 3. Autenticação Híbrida & Recuperação de Senha

A plataforma adota o padrão moderno de e-commerce com autenticação híbrida:

### 3.1. Google OAuth 2.0 (1-Click Login)
Permite login instantâneo para usuários com conta Google:
- **Origens JavaScript autorizadas**: `https://oqueeisso.com`
- **URIs de redirecionamento**: `https://oqueeisso.com/auth/google/callback`

### 3.2. Contas Locais (E-mail e Senha)
Para clientes que utilizam outros provedores (Outlook, Yahoo, iCloud, corporativos):
- **Criptografia**: Senhas salvas com hash `bcryptjs` (salt 10).
- **Proteção contra Força Bruta**: Middleware `loginRateLimiter` em memória protegendo contra abusos no endpoint `/login` e `/esqueci-senha`.

### 3.3. Fluxo "Esqueceu a senha?" (Password Reset)
1. **Solicitação (`GET/POST /esqueci-senha`)**: O usuário informa o e-mail cadastrado.
2. **Geração de Token Seguro**: É gerado um token criptográfico pseudo-aleatório (`crypto.randomBytes(32)`), com hash SHA-256 armazenado no banco (`resetPasswordToken`) e validade de 1 hora (`resetPasswordExpires`).
3. **Disparo do E-mail**: Um e-mail transacional estilizado é enviado com o link direto `https://oqueeisso.com/redefinir-senha/{token}`.
4. **Redefinição (`GET/POST /redefinir-senha/:token`)**: O usuário define a nova senha com validação de comprimento e confirmação. Ao salvar, a nova senha é hasheada via pre-save hook e o usuário é redirecionado ao login com mensagem de sucesso.

---

## 💳 4. Integração com Mercado Pago & Webhooks

- **Pix / Cartão de Crédito**: A integração gera automaticamente a chave copia-e-cola Pix e o QR Code.
- **Webhook (`POST /api/payments/webhook`)**: Recebe chamadas assíncronas do Mercado Pago.
  - Quando um pagamento transiciona para `approved`, o status do pedido no banco de dados muda automaticamente para `Aprovado` ou `Em Produção`.
  - Dispara e-mail automático de **Pagamento Aprovado** para o cliente.

---

## ✉️ 5. Notificações por E-mail (Hostinger SMTP & Cloudflare DNS)

O serviço de e-mail (`src/services/mailService.js`) gerencia toda a comunicação transacional da loja através do servidor SMTP da Hostinger (`smtp.hostinger.com:465` via SSL).

### 🌐 5.1. Configuração de Registros DNS no Cloudflare
Para garantir o envio, recebimento e evitar que mensagens caiam na caixa de spam (reputação com SPF, DKIM e DMARC), a zona DNS no Cloudflare está estruturada da seguinte forma:

| Tipo | Nome | Conteúdo / Destino | Prioridade | Status no Cloudflare | Descrição |
|---|---|---|:---:|:---:|---|
| **MX** | `@` | `mx1.hostinger.com` | `5` | *Automático* | Servidor primário de recebimento Hostinger |
| **MX** | `@` | `mx2.hostinger.com` | `10` | *Automático* | Servidor secundário de recebimento Hostinger |
| **TXT** | `@` | `v=spf1 include:_spf.mail.hostinger.com ~all` | - | *Automático* | Autorização SPF contra spoofing/antispam |
| **TXT** | `_dmarc` | `v=DMARC1; p=none` | - | *Automático* | Política DMARC para validação de remetente |
| **CNAME** | `hostingemail-a._domainkey` | `hostingemail-a.dkim.mail.hostinger.com` | - | **DNS Only (Nuvem Cinza ⚪)** | Chave DKIM A (Criptografia) |
| **CNAME** | `hostingemail-b._domainkey` | `hostingemail-b.dkim.mail.hostinger.com` | - | **DNS Only (Nuvem Cinza ⚪)** | Chave DKIM B (Criptografia) |
| **CNAME** | `hostingemail-c._domainkey` | `hostingemail-c.dkim.mail.hostinger.com` | - | **DNS Only (Nuvem Cinza ⚪)** | Chave DKIM C (Criptografia) |
| **CNAME** | `autodiscover` | `autodiscover.mail.hostinger.com` | - | **DNS Only (Nuvem Cinza ⚪)** | Autodescoberta para clientes Outlook |
| **CNAME** | `autoconfig` | `autoconfig.mail.hostinger.com` | - | **DNS Only (Nuvem Cinza ⚪)** | Autoconfiguração para clientes Thunderbird |

> ⚠️ **Importante sobre o Cloudflare**: Todos os registros CNAME de e-mail (`_domainkey`, `autodiscover`, `autoconfig`) devem permanecer estritamente em **DNS Only (Nuvem Cinza)**. Ativar o Proxy (Nuvem Laranja) nestes registros interfere na validação de chaves e quebra a assinatura DKIM. Registros do tipo `A` e `CNAME www` apontam para o servidor web da aplicação, não para o e-mail.

---

### 📦 5.2. Ciclo de Vida e Notificações de Pedidos

A aplicação emite notificações ricas em HTML formatadas de forma responsiva para acompanhamento em qualquer dispositivo:

```
[Cliente Finaliza Pedido]
       │
       ├──► 📧 Cliente: Confirmação de Pedido Recebido (#OQI-XXXXXX) + Resumo + Pix Copia/Cola
       └──► 🚨 Admin: Alerta de Novo Pedido no Ateliê com itens, comprador e telefone
       
[Mercado Pago Aprova Pagamento / Webhook IPN]
       │
       └──► ✅ Cliente: Notificação de Pagamento Aprovado (#OQI-XXXXXX) -> "Em Produção"
       
[Admin Altera Status no Painel]
       │
       └──► 📦 Cliente: Atualização de Envio (ex: "Em Trânsito", código de rastreio, "Entregue")
```

1. **Confirmação de Pedido (`sendOrderConfirmationEmail`)**:
   - Enviado imediatamente ao cliente ao concluir o checkout.
   - Apresenta tabela com itens comprados, fotos, artesão responsável, frete, endereço completo e código Pix copia-e-cola (se aplicável).
2. **Alerta de Pedido no Ateliê (`sendAdminNewOrderAlert`)**:
   - Enviado para `ADMIN_ALERT_EMAIL` (`atendimento@oqueeisso.com`).
   - Notifica a equipe com dados do comprador, telefone de contato e lista dos itens para separação de estoque e produção.
3. **Pagamento Confirmado (`sendPaymentApprovedEmail`)**:
   - Disparado pelo Webhook do Mercado Pago ou no retorno de aprovação.
   - Informa que a cobrança foi liquidada e o pedido avançou para a etapa de confecção/preparação.
4. **Atualização de Status (`sendStatusUpdateEmail`)**:
   - Disparado sempre que o administrador avança o status do pedido pelo painel administrativo.
5. **Outros Disparos do Sistema**:
   - **Recuperação de Senha (`sendPasswordResetEmail`)**: Link seguro com token SHA-256 e validade de 1 hora.
   - **Boas-vindas (`sendWelcomeEmail`)**: Recepção ao usuário recém-cadastrado.
   - **Alerta de Cadastro (`sendAdminNewUserAlert`)**: Notifica a administração sobre novos clientes.
   - **Formulário de Contato (`sendContactEmail`)**: Envia a mensagem recebida para o admin e uma cópia de confirmação para o solicitante.

---

## 📱 6. PWA (Progressive Web App)

- **Instalação**: Usuários no Android e iOS podem instalar a loja direto na tela inicial do celular.
- **Manifesto**: Disponível em `/manifest.json`.
- **Service Worker**: Gerenciado por `/sw.js` com estratégia de cache para alta velocidade.
- **Prompt Inteligente**: O script `/js/pwa.js` detecta o dispositivo e exibe um banner de instalação.

---

## 🐳 7. Deploy & Estrutura Docker

### Arquivos principais:
- `docker-compose.yml`: Define o serviço `app` e `mongo` conectados às redes `app-network` e `proxy`.
- `Dockerfile`: Imagem Node.js 20 Alpine otimizada.
- `.dockerignore`: Ignora `data/`, `node_modules`, `.env` para garantir builds rápidos.
- `deploy.sh`: Script de atualização rápida com limpeza de containers antigos e purge via `git clean`.

### Comandos de Utilidade na VPS:
- **Executar o Povoamento Inicial de Dados (Seed)**:
  ```bash
  docker exec -it oqueeisso-app npm run seed
  ```
- **Ver Logs da Aplicação em Tempo Real**:
  ```bash
  docker logs -f oqueeisso-app
  ```
- **Reiniciar os Containers**:
  ```bash
  ./deploy.sh
  ```

---

## 🛠️ 8. Modo de Manutenção Programada

A loja possui um sistema inteligente de **Modo de Manutenção** gerenciado dinamicamente via banco de dados:

- **Ativação / Desativação Instantânea**: Pelo Painel Admin (`/admin/dashboard?tab=frete`), o administrador pode ativar ou desativar com apenas um clique e salvar. Não requer rebuild, reinicialização de containers nem conexões SSH.
- **Bypass para Administradores**: Administradores autenticados continuam navegando livremente pela loja (com um banner amarelo de aviso no topo), permitindo cadastrar produtos, ajustar layouts e testar pedidos antes de reabrir a loja ao público.
- **Segurança de Acesso**: As rotas de login (`/login`), autenticação Google (`/auth/*`), painel administrativo (`/admin/*`) e arquivos estáticos (`/css`, `/js`, imagens) permanecem 100% operacionais para o admin entrar e desativar o modo de manutenção a qualquer momento.
- **SEO & Google Friendly**: Para visitantes comuns, a tela acolhedora de manutenção é entregue com o código **HTTP 503 (Service Unavailable)** e cabeçalho `Retry-After: 3600`, preservando o ranqueamento das páginas no Google.
- **Personalização**: É possível definir Título, Mensagem explicativa e Previsão de Retorno.

---

## 🛡️ 9. Proteção Anti-Spam no Formulário de Contato

Para impedir o envio de mensagens em massa e disparos de robôs automatizados (spambots) sem gerar atrito para os clientes reais, o formulário de contato (`/contato`) utiliza uma proteção invisível em camadas:

1. **Honeypot (Armadilha Oculta)**:
   - Um campo `website_url` é adicionado ao formulário de forma invisível via CSS para humanos.
   - Spambots que varrem o código preenchem automaticamente todos os inputs encontrados.
   - Se o campo for recebido preenchido, o backend descarta o envio de e-mails e simula sucesso, enganando o robô para que ele não tente contornar o filtro.

2. **Time-Gate (Trava de Tempo)**:
   - Um timestamp do momento em que o formulário foi aberto é enviado no campo `_form_time`.
   - Como seres humanos levam mais de 3 segundos para digitar seus dados e mensagem, envios concluídos em menos de 3 segundos são bloqueados como robôs automatizados.

3. **Limitador de Requisições (`contactRateLimiter`)**:
   - Limita a 3 envios a cada 10 minutos por endereço IP, prevenindo ataques de negação de serviço e inundações na caixa de entrada.


