const Product = require('../models/Product');
const Order = require('../models/Order');
const mercadopagoConfig = require('../config/mercadopago');
const mailService = require('../services/mailService');

const getCartFromCookie = (req) => {
  try {
    return req.cookies.cart ? JSON.parse(req.cookies.cart) : [];
  } catch (e) {
    return [];
  }
};

const settingService = require('../services/settingService');

exports.getCheckout = async (req, res) => {
  try {
    const rawCart = getCartFromCookie(req);
    if (rawCart.length === 0) {
      return res.redirect('/carrinho');
    }

    const cartItems = [];
    let subtotal = 0;

    for (const item of rawCart) {
      const product = await Product.findById(item.productId);
      if (product) {
        const itemTotal = product.price * item.quantity;
        subtotal += itemTotal;
        cartItems.push({
          product,
          quantity: item.quantity,
          itemTotal,
        });
      }
    }

    const settings = await settingService.getSettings();
    const shippingFee = subtotal >= settings.freeShippingThreshold || subtotal === 0 ? 0 : settings.shippingFee;
    const total = subtotal + shippingFee;

    res.render('checkout', {
      title: 'Checkout Seguro | O Que É Isso?',
      cartItems,
      subtotal,
      shippingFee,
      total,
      user: req.user || null,
      error: req.query.error ? 'Houve um problema com o pagamento. Por favor, tente novamente.' : null,
    });
  } catch (error) {
    console.error('Erro ao renderizar checkout:', error);
    res.status(500).redirect('/carrinho');
  }
};

exports.processOrder = async (req, res) => {
  try {
    const rawCart = getCartFromCookie(req);
    if (rawCart.length === 0) {
      return res.redirect('/carrinho');
    }

    const {
      customerName,
      customerEmail,
      customerPhone,
      street,
      number,
      complement,
      neighborhood,
      city,
      state,
      zipCode,
      paymentMethod,
      notes,
    } = req.body;

    if (!customerName || !customerEmail || !street || !number || !city || !state || !zipCode) {
      return res.status(400).render('checkout', {
        title: 'Checkout Seguro | O Que É Isso?',
        cartItems: [],
        subtotal: 0,
        shippingFee: 0,
        total: 0,
        user: req.user || null,
        error: 'Por favor, preencha todos os campos obrigatórios do endereço e contato.',
      });
    }

    const items = [];
    let subtotal = 0;

    for (const item of rawCart) {
      const product = await Product.findById(item.productId);
      if (product) {
        const price = product.price;
        subtotal += price * item.quantity;
        items.push({
          product: product._id,
          name: product.name,
          price: price,
          quantity: item.quantity,
          image: product.images[0] || '',
          artisan: product.artisan,
        });

        // Abater estoque
        product.stock = Math.max(0, product.stock - item.quantity);
        await product.save();
      }
    }

    const settings = await settingService.getSettings();
    const shippingFee = subtotal >= settings.freeShippingThreshold || subtotal === 0 ? 0 : settings.shippingFee;
    const totalAmount = subtotal + shippingFee;
    const orderNumber = 'OQI-' + Math.floor(100000 + Math.random() * 900000);

    const order = await Order.create({
      orderNumber,
      user: req.user ? req.user._id : null,
      customerName,
      customerEmail,
      customerPhone: customerPhone || '',
      items,
      subtotal,
      shippingFee,
      totalAmount,
      shippingAddress: {
        street,
        number,
        complement: complement || '',
        neighborhood: neighborhood || '',
        city,
        state,
        zipCode,
      },
      paymentMethod: paymentMethod || 'pix',
      paymentStatus: 'Pendente',
      orderStatus: 'Pendente',
      notes: notes || '',
    });

    // Limpar carrinho após criar pedido
    res.clearCookie('cart');

    // ─── Processamento de Pagamento via Mercado Pago ───────────────────────
    let initPointUrl = null;
    if (paymentMethod === 'mercadopago' || paymentMethod === 'credit_card' || paymentMethod === 'boleto') {
      try {
        const pref = await mercadopagoConfig.createPreference(order);
        order.mercadopagoPreferenceId = pref.id;
        order.mercadopagoInitPoint = pref.init_point;
        await order.save();
        initPointUrl = pref.init_point;
      } catch (mpErr) {
        console.error('Erro ao gerar preferência Mercado Pago:', mpErr);
      }
    } else if (paymentMethod === 'pix') {
      try {
        const pixRes = await mercadopagoConfig.createPixPayment(order);
        if (pixRes.qrCode) {
          order.pixCode = pixRes.qrCode;
          order.pixQrCodeBase64 = pixRes.qrCodeBase64;
          order.mercadopagoPaymentId = pixRes.paymentId;
          await order.save();
        } else {
          // Fallback Pix
          order.pixCode = `00020126580014BR.GOV.BCB.PIX0136oqueeisso-artesanato-pix-${orderNumber}5204000053039865405${totalAmount.toFixed(2)}5802BR5920O QUE EISSO ARTESANATO6009SAO PAULO62070503***6304`;
          await order.save();
        }
      } catch (pixErr) {
        console.error('Erro ao gerar Pix no Mercado Pago:', pixErr);
        order.pixCode = `00020126580014BR.GOV.BCB.PIX0136oqueeisso-artesanato-pix-${orderNumber}5204000053039865405${totalAmount.toFixed(2)}5802BR5920O QUE EISSO ARTESANATO6009SAO PAULO62070503***6304`;
        await order.save();
      }
    }

    // Disparar e-mails de confirmação de pedido (para cliente) e alerta (para admin)
    mailService.sendOrderConfirmationEmail(order).catch((err) => console.error('[Mail] Erro order customer:', err.message));
    mailService.sendAdminNewOrderAlert(order).catch((err) => console.error('[Mail] Erro order admin:', err.message));

    if (initPointUrl) {
      return res.redirect(initPointUrl);
    }

    res.redirect(`/pedido/confirmacao/${order._id}`);
  } catch (error) {
    console.error('Erro ao processar pedido:', error);
    res.status(500).redirect('/carrinho');
  }
};

exports.getOrderConfirmation = async (req, res) => {
  try {
    const { id } = req.params;
    const order = await Order.findById(id).populate('items.product');

    if (!order) {
      return res.status(404).render('error', {
        title: 'Pedido Não Encontrado',
        message: 'Não encontramos as informações deste pedido.',
      });
    }

    // Se o retorno do Mercado Pago veio como aprovado
    if (req.query.status === 'approved' && order.paymentStatus !== 'Aprovado') {
      order.paymentStatus = 'Aprovado';
      order.orderStatus = 'Em Produção';
      await order.save();

      // Disparar e-mail de pagamento aprovado
      mailService.sendPaymentApprovedEmail(order).catch((err) => console.error('[Mail] Erro payment approved:', err.message));
    }

    res.render('order-confirmation', {
      title: `Pedido #${order.orderNumber} Confirmado | O Que É Isso?`,
      order,
    });
  } catch (error) {
    console.error('Erro na confirmação do pedido:', error);
    res.status(500).render('error', {
      title: 'Erro',
      message: 'Não foi possível carregar a confirmação do pedido.',
    });
  }
};

// ─── API Webhook do Mercado Pago (Notificações IPN em tempo real) ────────────
exports.handleWebhook = async (req, res) => {
  try {
    const { query, body } = req;
    const topic = query.topic || body.type;
    const id = query.id || (body.data && body.data.id);

    if (topic === 'payment' && id) {
      const paymentData = await mercadopagoConfig.getPayment(id);
      if (paymentData) {
        const { status, external_reference, metadata } = paymentData;
        const orderId = external_reference || (metadata && metadata.order_id);

        if (orderId) {
          const order = await Order.findById(orderId);
          if (order) {
            const previousPaymentStatus = order.paymentStatus;
            order.mercadopagoPaymentId = id.toString();

            if (status === 'approved') {
              order.paymentStatus = 'Aprovado';
              if (order.orderStatus === 'Pendente') {
                order.orderStatus = 'Em Produção';
              }
            } else if (status === 'rejected' || status === 'cancelled') {
              order.paymentStatus = 'Recusado';
            } else if (status === 'refunded') {
              order.paymentStatus = 'Reembolsado';
            }
            await order.save();
            console.log(`[MercadoPago Webhook] Pedido #${order.orderNumber} atualizado: status=${status} -> paymentStatus=${order.paymentStatus}`);

            // Se mudou para Aprovado agora, notificar cliente por e-mail
            if (status === 'approved' && previousPaymentStatus !== 'Aprovado') {
              mailService.sendPaymentApprovedEmail(order).catch((err) => console.error('[Mail] Erro payment approved webhook:', err.message));
            }
          }
        }
      }
    }
  } catch (error) {
    console.error('[MercadoPago Webhook Error]:', error);
  }

  res.sendStatus(200);
};

// ─── API Polling Status do Pedido (para atualização ao vivo da tela do Pix) ──
exports.getOrderStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const order = await Order.findById(id).select('paymentStatus orderStatus orderNumber');
    if (!order) return res.status(404).json({ error: 'Pedido não encontrado' });
    res.json({
      paymentStatus: order.paymentStatus,
      orderStatus: order.orderStatus,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
