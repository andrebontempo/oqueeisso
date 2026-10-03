# 📘 Documentação Técnica Completa — O Que É Isso? Artesanato

Bem-vindo à documentação oficial do projeto **O Que É Isso?**, uma plataforma de e-commerce de artesanato feito à mão em família (Trabalhos em Madeira, Bolsas e Bonecas, e Crochê).

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

## 🔐 3. Autenticação com Google OAuth 2.0

### Configuração no Google Cloud Console:
1. Acesse o **[Google Cloud Console](https://console.cloud.google.com/)**.
2. Em **APIs e Serviços > Credenciais**, selecione ou crie seu ID do cliente OAuth 2.0.
3. Adicione nas **Origens JavaScript autorizadas**:
   - `https://oqueeisso.com`
4. Adicione nos **URIs de redirecionamento autorizados**:
   - `https://oqueeisso.com/auth/google/callback`
5. Cole o Client ID e Secret nas variáveis do `.env`.

---

## 💳 4. Integração com Mercado Pago & Webhooks

- **Pix / Cartão de Crédito**: A integração gera automaticamente a chave copia-e-cola Pix e o QR Code.
- **Webhook (`POST /api/payments/webhook`)**: Recebe chamadas assíncronas do Mercado Pago.
  - Quando um pagamento transiciona para `approved`, o status do pedido no banco de dados muda automaticamente para `Aprovado` ou `Em Produção`.
  - Dispara e-mail automático de **Pagamento Aprovado** para o cliente.

---

## ✉️ 5. Notificações por E-mail (Hostinger SMTP)

O serviço de e-mail (`src/services/mailService.js`) gerencia os seguintes disparos automáticos:

1. **Boas-vindas**: Enviado ao cliente ao se cadastrar.
2. **Alerta de Novo Usuário**: Enviado para `ADMIN_ALERT_EMAIL`.
3. **Confirmação de Pedido**: Enviado ao cliente com o resumo da compra e Pix.
4. **Alerta de Novo Pedido**: Enviado para o admin para iniciar a produção.
5. **Pagamento Aprovado**: Enviado ao cliente quando o Mercado Pago confirma a transação.
6. **Atualização de Status**: Enviado ao cliente quando o pedido mudo para *Enviado* ou *Entregue*.
7. **Formulário de Contato**: Enviado para o e-mail de atendimento com a mensagem do cliente.

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
