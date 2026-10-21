/**
 * Middleware leve em memória para proteção contra ataques de força bruta no login
 */
const loginAttempts = new Map();

// Limpeza periódica a cada 10 minutos para não acumular memória
setInterval(() => {
  const now = Date.now();
  for (const [ip, data] of loginAttempts.entries()) {
    if (now > data.resetTime) {
      loginAttempts.delete(ip);
    }
  }
}, 10 * 60 * 1000);

const loginRateLimiter = (options = {}) => {
  const maxAttempts = options.maxAttempts || 5;
  const windowMs = options.windowMs || 15 * 60 * 1000; // 15 minutos

  return (req, res, next) => {
    // Apenas aplica na rota POST /login
    if (req.method !== 'POST') {
      return next();
    }

    const clientIp =
      req.headers['cf-connecting-ip'] ||
      req.headers['x-real-ip'] ||
      req.headers['x-forwarded-for']?.split(',')[0].trim() ||
      req.socket.remoteAddress ||
      'unknown';

    const now = Date.now();
    const record = loginAttempts.get(clientIp);

    if (record) {
      if (now < record.resetTime) {
        if (record.count >= maxAttempts) {
          const remainingMinutes = Math.ceil((record.resetTime - now) / 60000);
          return res.status(429).render('auth/login', {
            title: 'Muitas Tentativas | O Que É Isso?',
            redirect: req.body.redirect || '/',
            error: `Muitas tentativas de login incorretas deste endereço. Por segurança, tente novamente em ${remainingMinutes} minuto(s).`,
          });
        }
      } else {
        // Janela expirada, reseta
        loginAttempts.set(clientIp, { count: 0, resetTime: now + windowMs });
      }
    } else {
      loginAttempts.set(clientIp, { count: 0, resetTime: now + windowMs });
    }

    // Registra falha de login caso a resposta retorne com erro
    const originalRender = res.render.bind(res);
    res.render = function (view, locals, callback) {
      if (view === 'auth/login' && locals && locals.error) {
        const cur = loginAttempts.get(clientIp) || { count: 0, resetTime: now + windowMs };
        cur.count += 1;
        loginAttempts.set(clientIp, cur);
      }
      return originalRender(view, locals, callback);
    };

    next();
  };
};

module.exports = { loginRateLimiter };
