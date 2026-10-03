const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.hostinger.com',
  port: parseInt(process.env.SMTP_PORT || '465'),
  secure: true,
  auth: {
    user: process.env.SMTP_USER || 'atendimento@oqueeisso.com',
    pass: (process.env.SMTP_PASS || 'Sites#@184').replace(/^["']|["']$/g, ''),
  },
  tls: {
    rejectUnauthorized: false,
  },
});

const FROM_NAME = process.env.SMTP_FROM_NAME || 'O Que É Isso? Artesanato';
const FROM_EMAIL = process.env.SMTP_USER || 'atendimento@oqueeisso.com';
const FROM = `"${FROM_NAME}" <${FROM_EMAIL}>`;
const ADMIN_ALERT_EMAIL = process.env.ADMIN_ALERT_EMAIL || 'atendimento@oqueeisso.com';

const sendEmail = async ({ to, subject, html }) => {
  try {
    const info = await transporter.sendMail({
      from: FROM,
      to,
      subject,
      html,
    });
    console.log(`[MailService] E-mail enviado com sucesso para ${to}: ${info.messageId}`);
    return info;
  } catch (err) {
    console.error(`[MailService] Erro ao enviar e-mail para ${to}:`, err.message);
    return null;
  }
};

const formatBRL = (val) => {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val || 0);
};

// ─── 1. E-MAIL DE BOAS-VINDAS (CLIENTE) ─────────────────────────────────────────
const sendWelcomeEmail = async (user) => {
  const html = `
    <div style="font-family: 'Segoe UI', Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #ffffff; border: 1px solid #eaeaea; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 15px rgba(0,0,0,0.05);">
      <div style="background: linear-gradient(135deg, #2C1A11 0%, #4A2818 100%); padding: 32px 24px; text-align: center; color: #ffffff;">
        <h1 style="margin: 0; font-size: 26px; letter-spacing: -0.5px;">🌸 O Que É Isso?</h1>
        <p style="margin: 8px 0 0; font-size: 14px; color: #E85D04; text-transform: uppercase; letter-spacing: 1px;">Artesanato Feito à Mão</p>
      </div>
      <div style="padding: 32px 28px; color: #333333; line-height: 1.6;">
        <h2 style="color: #2C1A11; margin-top: 0;">Bem-vindo(a), ${user.name}! ❤️</h2>
        <p>É uma alegria imensa ter você conosco! Sua conta foi criada com sucesso na plataforma <strong>O Que É Isso? Artesanato</strong>.</p>
        <p>Aqui cada peça é produzida com dedicação, carinho e o talento único dos nossos artesãos parceiros.</p>
        
        <div style="background: #FFF9F3; border-left: 4px solid #E85D04; padding: 16px; margin: 24px 0; border-radius: 4px;">
          <p style="margin: 0; font-size: 14px; color: #4A2818;">
            <strong>Seu e-mail de acesso:</strong> ${user.email}<br/>
            <strong>Status da conta:</strong> Ativa e Pronta para Compras
          </p>
        </div>

        <div style="text-align: center; margin: 32px 0;">
          <a href="${process.env.BASE_URL || 'http://localhost:3000'}" style="background: #E85D04; color: #ffffff; padding: 14px 32px; border-radius: 30px; text-decoration: none; font-weight: bold; font-size: 15px; display: inline-block;">
            Explorar Coleções Exclusivas
          </a>
        </div>
        
        <p style="font-size: 14px; color: #666666;">Se tiver qualquer dúvida, basta responder a este e-mail. Nossa equipe terá prazer em ajudar!</p>
      </div>
      <div style="background: #FAF7F2; padding: 20px; text-align: center; font-size: 12px; color: #888888; border-top: 1px solid #eaeaea;">
        <p style="margin: 0;">O Que É Isso? Artesanato &copy; ${new Date().getFullYear()} — atendimento@oqueeisso.com</p>
      </div>
    </div>
  `;

  return sendEmail({
    to: user.email,
    subject: `🌸 Bem-vindo(a) à O Que É Isso? Artesanato!`,
    html,
  });
};

// ─── 2. ALERTA DE NOVO CADASTRO (ADMINISTRATIVO) ──────────────────────────────
const sendAdminNewUserAlert = async (user) => {
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 2px solid #E85D04; border-radius: 8px; padding: 24px; background: #ffffff;">
      <h2 style="color: #E85D04; margin-top: 0;">👤 Novo Cliente Cadastrado!</h2>
      <p>Um novo usuário se cadastrou na loja <strong>O Que É Isso?</strong>:</p>
      <table style="width: 100%; border-collapse: collapse; margin: 16px 0; background: #FAF7F2; padding: 12px; border-radius: 6px;">
        <tr><td style="padding: 6px; font-weight: bold;">Nome:</td><td style="padding: 6px;">${user.name}</td></tr>
        <tr><td style="padding: 6px; font-weight: bold;">E-mail:</td><td style="padding: 6px;">${user.email}</td></tr>
        <tr><td style="padding: 6px; font-weight: bold;">Provedor:</td><td style="padding: 6px;">${user.authProvider || 'Local'}</td></tr>
        <tr><td style="padding: 6px; font-weight: bold;">Data:</td><td style="padding: 6px;">${new Date().toLocaleString('pt-BR')}</td></tr>
      </table>
    </div>
  `;

  return sendEmail({
    to: ADMIN_ALERT_EMAIL,
    subject: `🔔 [Admin] Novo Cadastro de Cliente: ${user.name}`,
    html,
  });
};

// ─── 3. CONFIRMAÇÃO DE PEDIDO (CLIENTE) ───────────────────────────────────────
const sendOrderConfirmationEmail = async (order) => {
  const itemsList = order.items
    .map(
      (item) => `
      <tr style="border-bottom: 1px solid #eee;">
        <td style="padding: 10px; font-size: 14px;"><strong>${item.name}</strong><br/><small style="color: #777;">Artesão: ${item.artisan || 'O Que É Isso?'}</small></td>
        <td style="padding: 10px; font-size: 14px; text-align: center;">${item.quantity}</td>
        <td style="padding: 10px; font-size: 14px; text-align: right; font-weight: bold; color: #2C1A11;">${formatBRL(item.price * item.quantity)}</td>
      </tr>
    `
    )
    .join('');

  const pixInstructions =
    order.paymentMethod === 'pix' && order.pixCode
      ? `
        <div style="background: #F0FDFB; border: 2px dashed #32BCAD; padding: 18px; border-radius: 8px; margin: 20px 0; text-align: center;">
          <h3 style="color: #32BCAD; margin-top: 0;">Pagamento via Pix (Mercado Pago)</h3>
          <p style="font-size: 13px; color: #555;">Utilize o código Pix abaixo no app do seu banco para concluir o pagamento:</p>
          <div style="background: #ffffff; padding: 10px; border: 1px solid #ccc; font-family: monospace; font-size: 11px; word-break: break-all; margin: 10px 0;">${order.pixCode}</div>
        </div>
      `
      : '';

  const html = `
    <div style="font-family: 'Segoe UI', Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #ffffff; border: 1px solid #eaeaea; border-radius: 12px; overflow: hidden;">
      <div style="background: #2C1A11; padding: 24px; text-align: center; color: #ffffff;">
        <h1 style="margin: 0; font-size: 22px;">Pedido Recebido #${order.orderNumber}</h1>
        <p style="margin: 6px 0 0; color: #E85D04; font-size: 13px; text-transform: uppercase;">O Que É Isso? Artesanato</p>
      </div>

      <div style="padding: 28px;">
        <p>Olá, <strong>${order.customerName}</strong>!</p>
        <p>Recebemos o seu pedido com muito carinho. Confira os detalhes abaixo:</p>

        ${pixInstructions}

        <h3 style="border-bottom: 2px solid #FAF7F2; padding-bottom: 8px; color: #2C1A11;">Itens Solicitados</h3>
        <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
          <thead>
            <tr style="background: #FAF7F2; text-align: left;">
              <th style="padding: 8px; font-size: 13px;">Produto</th>
              <th style="padding: 8px; font-size: 13px; text-align: center;">Qtd</th>
              <th style="padding: 8px; font-size: 13px; text-align: right;">Total</th>
            </tr>
          </thead>
          <tbody>
            ${itemsList}
          </tbody>
        </table>

        <div style="background: #FAF7F2; padding: 16px; border-radius: 8px; margin-bottom: 24px;">
          <div style="display: flex; justify-content: space-between; margin-bottom: 4px; font-size: 14px;">
            <span>Subtotal:</span><strong>${formatBRL(order.subtotal)}</strong>
          </div>
          <div style="display: flex; justify-content: space-between; margin-bottom: 4px; font-size: 14px;">
            <span>Frete:</span><strong>${order.shippingFee === 0 ? 'GRÁTIS' : formatBRL(order.shippingFee)}</strong>
          </div>
          <div style="display: flex; justify-content: space-between; font-size: 16px; font-weight: bold; color: #E85D04; border-top: 1px solid #ddd; padding-top: 8px; margin-top: 6px;">
            <span>Total do Pedido:</span><span>${formatBRL(order.totalAmount)}</span>
          </div>
        </div>

        <h3 style="color: #2C1A11; margin-bottom: 8px;">Endereço de Entrega</h3>
        <p style="font-size: 13px; color: #555; margin: 0; line-height: 1.5;">
          ${order.shippingAddress.street}, ${order.shippingAddress.number} ${order.shippingAddress.complement ? '- ' + order.shippingAddress.complement : ''}<br/>
          ${order.shippingAddress.neighborhood} — ${order.shippingAddress.city} / ${order.shippingAddress.state}<br/>
          CEP: ${order.shippingAddress.zipCode}
        </p>

        <div style="text-align: center; margin-top: 32px;">
          <a href="${process.env.BASE_URL || 'http://localhost:3000'}/pedido/confirmacao/${order._id}" style="background: #2C1A11; color: #ffffff; padding: 12px 28px; border-radius: 20px; text-decoration: none; font-weight: bold; font-size: 14px;">
            Acompanhar Status do Pedido
          </a>
        </div>
      </div>
    </div>
  `;

  return sendEmail({
    to: order.customerEmail,
    subject: `🛍️ Pedido #${order.orderNumber} Recebido — O Que É Isso? Artesanato`,
    html,
  });
};

// ─── 4. ALERTA DE NOVO PEDIDO (ADMINISTRATIVO / ATELIÊ) ───────────────────────
const sendAdminNewOrderAlert = async (order) => {
  const itemsText = order.items.map((i) => `• ${i.name} (x${i.quantity}) - Artesão: ${i.artisan || 'Geral'}`).join('<br/>');

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 2px solid #2C1A11; border-radius: 8px; padding: 24px; background: #ffffff;">
      <h2 style="color: #2C1A11; margin-top: 0;">🛍️ NOVO PEDIDO RECEBIDO! #${order.orderNumber}</h2>
      <p>Um novo pedido foi realizado no e-commerce:</p>

      <div style="background: #FFF9F3; padding: 16px; border-radius: 6px; border-left: 4px solid #E85D04; margin-bottom: 20px;">
        <p style="margin: 4px 0;"><strong>Cliente:</strong> ${order.customerName} (${order.customerEmail})</p>
        <p style="margin: 4px 0;"><strong>Telefone:</strong> ${order.customerPhone || 'Não informado'}</p>
        <p style="margin: 4px 0;"><strong>Forma de Pagamento:</strong> ${order.paymentMethod.toUpperCase()}</p>
        <p style="margin: 4px 0;"><strong>Valor Total:</strong> ${formatBRL(order.totalAmount)}</p>
      </div>

      <h3 style="margin-bottom: 8px; color: #2C1A11;">Itens:</h3>
      <div style="background: #FAF7F2; padding: 12px; border-radius: 6px; font-size: 14px; margin-bottom: 20px;">
        ${itemsText}
      </div>

      <p style="font-size: 13px; color: #666;">Acesse o painel administrativo para visualizar o pedido completo.</p>
    </div>
  `;

  return sendEmail({
    to: ADMIN_ALERT_EMAIL,
    subject: `🚨 [NOVO PEDIDO] #${order.orderNumber} - ${formatBRL(order.totalAmount)} (${order.customerName})`,
    html,
  });
};

// ─── 5. NOTIFICAÇÃO DE PAGAMENTO APROVADO (CLIENTE) ───────────────────────────
const sendPaymentApprovedEmail = async (order) => {
  const html = `
    <div style="font-family: 'Segoe UI', Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #ffffff; border: 1px solid #eaeaea; border-radius: 12px; overflow: hidden;">
      <div style="background: #059669; padding: 24px; text-align: center; color: #ffffff;">
        <h1 style="margin: 0; font-size: 24px;">✅ Pagamento Confirmado!</h1>
        <p style="margin: 6px 0 0; font-size: 14px;">Pedido #${order.orderNumber}</p>
      </div>

      <div style="padding: 28px; line-height: 1.6;">
        <p>Olá, <strong>${order.customerName}</strong>!</p>
        <p>Temos ótimas notícias! O pagamento do seu pedido <strong>#${order.orderNumber}</strong> foi confirmado com sucesso.</p>
        
        <div style="background: #D1FAE5; border-left: 4px solid #059669; padding: 16px; border-radius: 6px; margin: 20px 0; color: #065F46;">
          <strong style="display: block; font-size: 15px;">Status Atual: Em Produção / Preparação</strong>
          Nossos artesãos já foram notificados e suas peças estão sendo preparadas com todo carinho.
        </div>

        <p>Você receberá novas atualizações por e-mail assim que o pedido for despachado para entrega.</p>
      </div>
    </div>
  `;

  return sendEmail({
    to: order.customerEmail,
    subject: `✅ Pagamento Aprovado! Pedido #${order.orderNumber} — O Que É Isso?`,
    html,
  });
};

// ─── 6. NOTIFICAÇÃO DE ATUALIZAÇÃO DE STATUS (CLIENTE) ───────────────────────
const sendStatusUpdateEmail = async (order) => {
  const html = `
    <div style="font-family: 'Segoe UI', Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #ffffff; border: 1px solid #eaeaea; border-radius: 12px; overflow: hidden;">
      <div style="background: #2C1A11; padding: 24px; text-align: center; color: #ffffff;">
        <h1 style="margin: 0; font-size: 22px;">Atualização do Pedido #${order.orderNumber}</h1>
      </div>

      <div style="padding: 28px; line-height: 1.6;">
        <p>Olá, <strong>${order.customerName}</strong>!</p>
        <p>O status do seu pedido <strong>#${order.orderNumber}</strong> foi atualizado:</p>

        <div style="background: #FFF9F3; border: 1px solid #E85D04; padding: 18px; border-radius: 8px; text-align: center; margin: 20px 0;">
          <span style="font-size: 13px; color: #888; text-transform: uppercase; letter-spacing: 1px; display: block; margin-bottom: 4px;">Novo Status do Pedido</span>
          <strong style="font-size: 20px; color: #E85D04;">${order.orderStatus}</strong>
        </div>

        <p>Qualquer dúvida, entre em contato conosco respondendo a este e-mail.</p>
      </div>
    </div>
  `;

  return sendEmail({
    to: order.customerEmail,
    subject: `📦 Atualização do Pedido #${order.orderNumber}: ${order.orderStatus}`,
    html,
  });
};

// ─── 7. MENSAGEM DE CONTATO (ADMIN & CONFIRMAÇÃO CLIENTE) ──────────────────────
const sendContactEmail = async ({ name, email, phone, subject, message }) => {
  const adminHtml = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 2px solid #E85D04; border-radius: 8px; padding: 24px; background: #ffffff;">
      <h2 style="color: #E85D04; margin-top: 0;">📬 Nova Mensagem de Contato!</h2>
      <p>Recebemos uma nova mensagem através da página de contato do site:</p>
      
      <div style="background: #FFF9F3; padding: 16px; border-radius: 6px; border-left: 4px solid #E85D04; margin: 16px 0;">
        <p style="margin: 4px 0;"><strong>Nome:</strong> ${name}</p>
        <p style="margin: 4px 0;"><strong>E-mail:</strong> ${email}</p>
        <p style="margin: 4px 0;"><strong>Telefone:</strong> ${phone || 'Não informado'}</p>
        <p style="margin: 4px 0;"><strong>Assunto:</strong> ${subject || 'Contato via Site'}</p>
        <p style="margin: 4px 0;"><strong>Data:</strong> ${new Date().toLocaleString('pt-BR')}</p>
      </div>

      <h3 style="color: #2C1A11; margin-bottom: 8px;">Mensagem:</h3>
      <div style="background: #FAF7F2; padding: 16px; border-radius: 6px; font-size: 14px; line-height: 1.6; white-space: pre-wrap;">${message}</div>
    </div>
  `;

  const customerHtml = `
    <div style="font-family: 'Segoe UI', Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #ffffff; border: 1px solid #eaeaea; border-radius: 12px; overflow: hidden;">
      <div style="background: #2C1A11; padding: 24px; text-align: center; color: #ffffff;">
        <h1 style="margin: 0; font-size: 22px;">Mensagem Recebida! 🌸</h1>
        <p style="margin: 6px 0 0; color: #E85D04; font-size: 13px; text-transform: uppercase;">O Que É Isso? Artesanato</p>
      </div>

      <div style="padding: 28px; line-height: 1.6; color: #333333;">
        <p>Olá, <strong>${name}</strong>!</p>
        <p>Agradecemos o seu contato com a <strong>O Que É Isso? Artesanato</strong>. Recebemos sua mensagem sobre "<strong>${subject || 'Contato'}</strong>" e em breve nossa equipe retornará a você.</p>
        
        <div style="background: #FFF9F3; border-left: 4px solid #E85D04; padding: 16px; border-radius: 6px; margin: 20px 0; font-size: 14px;">
          <strong>Sua Mensagem:</strong><br/>
          <em style="color: #555;">"${message}"</em>
        </div>

        <p style="font-size: 14px; color: #666666;">Nosso atendimento funciona via e-mail (<strong>atendimento@oqueeisso.com</strong>). Tenha um excelente dia!</p>
      </div>
    </div>
  `;

  await sendEmail({
    to: ADMIN_ALERT_EMAIL,
    subject: `📬 [Contato Site] ${subject || 'Nova Mensagem'} — ${name}`,
    html: adminHtml,
  });

  return sendEmail({
    to: email,
    subject: `🌸 Recebemos sua mensagem — O Que É Isso? Artesanato`,
    html: customerHtml,
  });
};

module.exports = {
  sendEmail,
  sendWelcomeEmail,
  sendAdminNewUserAlert,
  sendOrderConfirmationEmail,
  sendAdminNewOrderAlert,
  sendPaymentApprovedEmail,
  sendStatusUpdateEmail,
  sendContactEmail,
};
