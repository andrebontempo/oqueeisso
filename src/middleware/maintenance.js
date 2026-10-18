/**
 * Middleware para Modo de Manutenção Programada
 * 
 * Permite que o administrador coloque a loja em manutenção instantaneamente pelo painel,
 * retornando HTTP 503 para visitantes (boa prática de SEO) enquanto administradores
 * autenticados continuam navegando normalmente com visualização prévia.
 */

const maintenanceMiddleware = (req, res, next) => {
  const isEnvMaintenance = process.env.MAINTENANCE_MODE === 'true';
  const isDbMaintenance = !!(res.locals.settings && res.locals.settings.isMaintenanceMode);
  const isMaintenanceActive = isEnvMaintenance || isDbMaintenance;

  // Se o modo de manutenção não estiver ativo, segue normalmente
  if (!isMaintenanceActive) {
    return next();
  }

  const currentPath = req.path || '';
  const originalUrl = req.originalUrl || '';

  // 1. Rotas essenciais sempre liberadas:
  // - Painel administrativo (/admin)
  // - Autenticação (/login, /logout, /auth) para permitir que o admin entre
  // - Arquivos estáticos e mídias
  const isAllowedRoute = 
    originalUrl.startsWith('/admin') ||
    currentPath.startsWith('/admin') ||
    currentPath === '/login' ||
    currentPath === '/logout' ||
    currentPath.startsWith('/auth') ||
    currentPath.startsWith('/css') ||
    currentPath.startsWith('/js') ||
    currentPath.startsWith('/images') ||
    currentPath.startsWith('/uploads') ||
    currentPath === '/favicon.ico' ||
    /\.(css|js|png|jpe?g|gif|svg|ico|webp|woff2?|ttf|eot)$/i.test(currentPath);

  if (isAllowedRoute) {
    return next();
  }

  // 2. Administrador autenticado tem bypass para testar o site
  if (req.user && req.user.role === 'admin') {
    res.locals.inMaintenanceBypass = true;
    return next();
  }

  // 3. Visitantes comuns: Retornar HTTP 503 (Service Unavailable) com Retry-After para SEO
  res.status(503);
  res.setHeader('Retry-After', '3600'); // Solicita que crawlers (Google) voltem em 1 hora

  // Se for chamada de API / AJAX
  if (req.xhr || req.headers.accept?.includes('json')) {
    return res.json({
      error: 'Loja em Manutenção',
      message: res.locals.settings?.maintenanceMessage || 'Estamos em manutenção programada. Voltaremos em breve.',
      estimatedReturn: res.locals.settings?.maintenanceEstimatedReturn || null,
    });
  }

  // Renderizar a tela de manutenção com identidade visual da loja
  return res.render('maintenance', {
    title: res.locals.settings?.maintenanceTitle || 'Estamos em Manutenção Programada',
    message: res.locals.settings?.maintenanceMessage || 'Estamos preparando novidades e melhorias em nossas peças artesanais. Voltaremos muito em breve!',
    estimatedReturn: res.locals.settings?.maintenanceEstimatedReturn || '',
  });
};

module.exports = maintenanceMiddleware;
