const Product = require('../models/Product');
const Order = require('../models/Order');

const getCartFromCookie = (req) => {
  try {
    return req.cookies.cart ? JSON.parse(req.cookies.cart) : [];
  } catch (e) {
    return [];
  }
};

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

    const shippingFee = subtotal > 200 || subtotal === 0 ? 0 : 25;
    const total = subtotal + shippingFee;

    res.render('checkout', {
      title: 'Checkout Seguro | O Que É Isso?',
      cartItems,
      subtotal,
      shippingFee,
      total,
      user: req.user || null,
      error: null,
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
        cartItems: [], // Preencher no render se necessário
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

    const shippingFee = subtotal > 200 ? 0 : 25;
    const totalAmount = subtotal + shippingFee;

    const orderNumber = 'OQI-' + Math.floor(100000 + Math.random() * 900000);

    // Gerar código Pix simulado se método for Pix
    let pixCode = '';
    if (paymentMethod === 'pix') {
      pixCode = `00020126580014BR.GOV.BCB.PIX0136oqueeisso-artesanato-pix-${orderNumber}5204000053039865405${totalAmount.toFixed(2)}5802BR5920O QUE EISSO ARTESANATO6009SAO PAULO62070503***6304`;
    }

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
      paymentMethod,
      paymentStatus: paymentMethod === 'pix' ? 'Pendente' : 'Aprovado',
      orderStatus: 'Pendente',
      pixCode,
      notes: notes || '',
    });

    // Limpar carrinho
    res.clearCookie('cart');

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
