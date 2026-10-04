const jwt = require('jsonwebtoken');
const User = require('../models/User');

const settingService = require('../services/settingService');

// Verifica se o usuário está autenticado e injeta req.user e res.locals.user
const optionalAuth = async (req, res, next) => {
  try {
    const settings = await settingService.getSettings();
    res.locals.settings = settings;
    res.locals.shippingFee = settings.shippingFee;
    res.locals.freeShippingThreshold = settings.freeShippingThreshold;
  } catch (e) {
    res.locals.shippingFee = 25;
    res.locals.freeShippingThreshold = 200;
  }

  try {
    let token;
    if (req.cookies && req.cookies.token) {
      token = req.cookies.token;
    } else if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (token) {
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'oqueeisso_super_secret_jwt_key_2026_artesanato');
      const user = await User.findById(decoded.id).select('-password');
      if (user) {
        req.user = user;
        res.locals.user = user;
      }
    }
  } catch (error) {
    // Token inválido ou expirado - limpa o cookie se houver
    res.clearCookie('token');
  }

  // Inicializa carrinho na sessão/cookie locals se não existir
  if (!req.cookies.cart) {
    res.locals.cartCount = 0;
  } else {
    try {
      const cart = JSON.parse(req.cookies.cart);
      res.locals.cartCount = cart.reduce((total, item) => total + item.quantity, 0);
    } catch (e) {
      res.locals.cartCount = 0;
    }
  }

  next();
};

// Exige autenticação
const protect = async (req, res, next) => {
  if (!req.user) {
    if (req.xhr || req.headers.accept?.includes('json')) {
      return res.status(401).json({ error: 'Não autorizado. Por favor faça login.' });
    }
    return res.redirect('/login?redirect=' + encodeURIComponent(req.originalUrl));
  }
  next();
};

// Exige perfil admin
const adminOnly = (req, res, next) => {
  if (!req.user || req.user.role !== 'admin') {
    if (req.xhr || req.headers.accept?.includes('json')) {
      return res.status(403).json({ error: 'Acesso restrito a administradores.' });
    }
    return res.status(403).render('error', {
      title: 'Acesso Negado',
      message: 'Você não tem permissão para acessar esta página administrativa.',
    });
  }
  next();
};

module.exports = { optionalAuth, protect, adminOnly };
