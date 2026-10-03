const { MercadoPagoConfig, Preference, Payment } = require('mercadopago');

const accessToken = process.env.MERCADOPAGO_ACCESS_TOKEN || 'APP_USR-1405440861025958-040416-e5c2da97461244ee003a4c3cdc22f743-3244936674';

const client = new MercadoPagoConfig({ accessToken });

const preferenceClient = new Preference(client);
const paymentClient = new Payment(client);

function getNotificationUrl() {
  const webhookUrl = process.env.WEBHOOK_URL || '';
  if (webhookUrl && !webhookUrl.includes('localhost') && !webhookUrl.includes('127.0.0.1')) {
    return `${webhookUrl.replace(/\/$/, '')}/api/payments/webhook`;
  }
  return undefined;
}

/**
 * Criar preferência de pagamento no Mercado Pago para Checkout Transparente / Redirecionamento
 * @param {Object} order Objeto do Pedido Mongoose
 * @returns {Promise<{id: string, init_point: string, sandbox_init_point: string}>}
 */
async function createPreference(order) {
  const baseUrl = (process.env.BASE_URL || 'http://localhost:3000').replace(/\/$/, '');
  const notification_url = getNotificationUrl();

  const items = order.items.map((item) => ({
    id: item.product ? item.product.toString() : item.name,
    title: item.name,
    quantity: item.quantity,
    unit_price: Number(item.price.toFixed(2)),
    currency_id: 'BRL',
    picture_url: item.image || undefined,
  }));

  if (order.shippingFee > 0) {
    items.push({
      id: 'shipping-fee',
      title: 'Frete de Entrega',
      quantity: 1,
      unit_price: Number(order.shippingFee.toFixed(2)),
      currency_id: 'BRL',
    });
  }

  const nameParts = (order.customerName || 'Cliente').trim().split(' ');
  const firstName = nameParts[0];
  const lastName = nameParts.slice(1).join(' ') || 'Artesanato';

  const body = {
    items,
    payer: {
      name: firstName,
      surname: lastName,
      email: order.customerEmail,
      phone: order.customerPhone ? { number: order.customerPhone.replace(/\D/g, '') } : undefined,
      address: {
        zip_code: order.shippingAddress.zipCode.replace(/\D/g, ''),
        street_name: order.shippingAddress.street,
        street_number: order.shippingAddress.number,
      },
    },
    back_urls: {
      success: `${baseUrl}/pedido/confirmacao/${order._id}?status=approved`,
      failure: `${baseUrl}/checkout?error=payment_failed`,
      pending: `${baseUrl}/pedido/confirmacao/${order._id}?status=pending`,
    },
    auto_return: 'approved',
    external_reference: order._id.toString(),
    notification_url,
    statement_descriptor: 'OQUEEISSO',
    metadata: {
      order_id: order._id.toString(),
      order_number: order.orderNumber,
    },
  };

  const response = await preferenceClient.create({ body });
  return {
    id: response.id,
    init_point: response.init_point,
    sandbox_init_point: response.sandbox_init_point,
  };
}

/**
 * Criar pagamento Pix diretamente via API do Mercado Pago (QR Code e Copia e Cola reais)
 * @param {Object} order Objeto do Pedido Mongoose
 * @returns {Promise<{paymentId: string, qrCode: string, qrCodeBase64: string, status: string}>}
 */
async function createPixPayment(order) {
  const notification_url = getNotificationUrl();

  const nameParts = (order.customerName || 'Cliente').trim().split(' ');
  const firstName = nameParts[0];
  const lastName = nameParts.slice(1).join(' ') || 'Artesanato';

  const body = {
    transaction_amount: Number(order.totalAmount.toFixed(2)),
    description: `Pedido #${order.orderNumber} — O Que É Isso? Artesanato`,
    payment_method_id: 'pix',
    payer: {
      email: order.customerEmail,
      first_name: firstName,
      last_name: lastName,
    },
    external_reference: order._id.toString(),
    notification_url,
    metadata: {
      order_id: order._id.toString(),
      order_number: order.orderNumber,
    },
  };

  const response = await paymentClient.create({ body });
  const poi = response.point_of_interaction?.transaction_data || {};

  return {
    paymentId: response.id ? response.id.toString() : '',
    qrCode: poi.qr_code || '',
    qrCodeBase64: poi.qr_code_base64 || '',
    status: response.status || 'pending',
  };
}

/**
 * Consultar detalhes de um pagamento por ID no Mercado Pago
 * @param {string|number} paymentId ID do pagamento no MP
 */
async function getPayment(paymentId) {
  return await paymentClient.get({ id: paymentId });
}

module.exports = {
  client,
  preferenceClient,
  paymentClient,
  createPreference,
  createPixPayment,
  getPayment,
};
