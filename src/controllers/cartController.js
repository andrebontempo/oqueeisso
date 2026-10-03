const Product = require('../models/Product');

const getCartFromCookie = (req) => {
  try {
    return req.cookies.cart ? JSON.parse(req.cookies.cart) : [];
  } catch (e) {
    return [];
  }
};

const saveCartCookie = (res, cart) => {
  res.cookie('cart', JSON.stringify(cart), {
    expires: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 dias
    httpOnly: true,
    sameSite: 'lax',
  });
};

exports.getCart = async (req, res) => {
  try {
    const rawCart = getCartFromCookie(req);
    const cartItems = [];
    let subtotal = 0;

    for (const item of rawCart) {
      const product = await Product.findById(item.productId).populate('category');
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

    const shippingFee = subtotal > 200 || subtotal === 0 ? 0 : 25; // Frete grátis acima de R$ 200
    const total = subtotal + shippingFee;

    res.render('cart', {
      title: 'Seu Carrinho | O Que É Isso?',
      cartItems,
      subtotal,
      shippingFee,
      total,
    });
  } catch (error) {
    console.error('Erro ao abrir carrinho:', error);
    res.status(500).render('error', {
      title: 'Erro',
      message: 'Não foi possível exibir o carrinho de compras.',
    });
  }
};

exports.addToCart = async (req, res) => {
  try {
    const { productId, quantity = 1 } = req.body;
    const qty = parseInt(quantity, 10);

    const product = await Product.findById(productId);
    if (!product) {
      if (req.xhr || req.headers.accept?.includes('json')) {
        return res.status(404).json({ error: 'Produto não encontrado' });
      }
      return res.redirect('/carrinho');
    }

    let cart = getCartFromCookie(req);
    const existingIndex = cart.findIndex((item) => item.productId === productId);

    if (existingIndex > -1) {
      cart[existingIndex].quantity += qty;
    } else {
      cart.push({ productId, quantity: qty });
    }

    saveCartCookie(res, cart);

    const totalCount = cart.reduce((acc, curr) => acc + curr.quantity, 0);

    if (req.xhr || req.headers.accept?.includes('json')) {
      return res.json({
        success: true,
        message: 'Produto adicionado ao carrinho!',
        cartCount: totalCount,
      });
    }

    res.redirect('/carrinho');
  } catch (error) {
    console.error('Erro ao adicionar ao carrinho:', error);
    res.status(500).redirect('/carrinho');
  }
};

exports.updateCart = async (req, res) => {
  try {
    const { productId, quantity } = req.body;
    const qty = parseInt(quantity, 10);

    let cart = getCartFromCookie(req);
    if (qty <= 0) {
      cart = cart.filter((item) => item.productId !== productId);
    } else {
      const index = cart.findIndex((item) => item.productId === productId);
      if (index > -1) {
        cart[index].quantity = qty;
      }
    }

    saveCartCookie(res, cart);

    if (req.xhr || req.headers.accept?.includes('json')) {
      return res.json({ success: true, cartCount: cart.reduce((a, b) => a + b.quantity, 0) });
    }

    res.redirect('/carrinho');
  } catch (error) {
    console.error('Erro ao atualizar carrinho:', error);
    res.redirect('/carrinho');
  }
};

exports.removeFromCart = (req, res) => {
  try {
    const { productId } = req.params;
    let cart = getCartFromCookie(req);
    cart = cart.filter((item) => item.productId !== productId);
    saveCartCookie(res, cart);
    res.redirect('/carrinho');
  } catch (error) {
    console.error('Erro ao remover item:', error);
    res.redirect('/carrinho');
  }
};
