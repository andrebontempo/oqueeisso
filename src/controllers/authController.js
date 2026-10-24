const User = require('../models/User');
const jwt = require('jsonwebtoken');
const passport = require('passport');
const crypto = require('crypto');
const mailService = require('../services/mailService');

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET || 'oqueeisso_super_secret_jwt_key_2026_artesanato', {
    expiresIn: '7d',
  });
};

const sendTokenCookie = (user, statusCode, res, redirectUrl = '/') => {
  const token = generateToken(user._id);
  const options = {
    expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    httpOnly: true,
    sameSite: 'lax',
  };

  res.cookie('token', token, options);

  if (res.req.xhr || res.req.headers.accept?.includes('json')) {
    return res.status(statusCode).json({
      success: true,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  }

  res.redirect(redirectUrl);
};

exports.renderLogin = (req, res) => {
  if (req.user) {
    return res.redirect('/');
  }
  let error = null;
  let success = null;
  if (req.query.error === 'google_failed') {
    error = 'Não foi possível autenticar com o Google. Tente novamente.';
  }
  if (req.query.reset === 'success') {
    success = 'Sua senha foi redefinida com sucesso! Você já pode entrar com sua nova senha.';
  }
  res.render('auth/login', {
    title: 'Entrar | O Que É Isso? Artesanato',
    redirect: req.query.redirect || '/',
    error: error,
    success: success,
  });
};

exports.login = async (req, res) => {
  try {
    const { email, password, redirect } = req.body;
    const redirectUrl = redirect || '/';

    if (!email || !password) {
      return res.status(400).render('auth/login', {
        title: 'Entrar | O Que É Isso?',
        redirect: redirectUrl,
        error: 'Por favor, informe o e-mail e a senha.',
      });
    }

    const user = await User.findOne({ email }).select('+password');
    if (!user || !(await user.matchPassword(password))) {
      return res.status(401).render('auth/login', {
        title: 'Entrar | O Que É Isso?',
        redirect: redirectUrl,
        error: 'E-mail ou senha inválidos.',
      });
    }

    sendTokenCookie(user, 200, res, redirectUrl);
  } catch (error) {
    console.error('Erro no login:', error);
    res.status(500).render('auth/login', {
      title: 'Entrar | O Que É Isso?',
      redirect: '/',
      error: 'Ocorreu um erro interno. Tente novamente.',
    });
  }
};

exports.renderRegister = (req, res) => {
  if (req.user) {
    return res.redirect('/');
  }
  res.render('auth/register', {
    title: 'Criar Conta | O Que É Isso? Artesanato',
    error: null,
    formData: {},
  });
};

exports.register = async (req, res) => {
  try {
    const { name, email, password, confirmPassword, phone } = req.body;

    if (!name || !email || !password) {
      return res.status(400).render('auth/register', {
        title: 'Criar Conta | O Que É Isso?',
        error: 'Por favor, preencha todos os campos obrigatórios.',
        formData: { name, email, phone },
      });
    }

    if (password !== confirmPassword) {
      return res.status(400).render('auth/register', {
        title: 'Criar Conta | O Que É Isso?',
        error: 'As senhas não coincidem.',
        formData: { name, email, phone },
      });
    }

    if (password.length < 6) {
      return res.status(400).render('auth/register', {
        title: 'Criar Conta | O Que É Isso?',
        error: 'A senha deve ter pelo menos 6 caracteres.',
        formData: { name, email, phone },
      });
    }

    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).render('auth/register', {
        title: 'Criar Conta | O Que É Isso?',
        error: 'Este e-mail já está cadastrado. Faça login para continuar.',
        formData: { name, email, phone },
      });
    }

    const user = await User.create({
      name,
      email,
      password,
      phone: phone || '',
    });

    // Enviar e-mail de boas-vindas ao cliente e alerta para a administração (não-bloqueante)
    mailService.sendWelcomeEmail(user).catch((err) => console.error('[Mail] Erro welcome:', err.message));
    mailService.sendAdminNewUserAlert(user).catch((err) => console.error('[Mail] Erro alert admin:', err.message));

    sendTokenCookie(user, 201, res, '/');
  } catch (error) {
    console.error('Erro no cadastro:', error);
    res.status(500).render('auth/register', {
      title: 'Criar Conta | O Que É Isso?',
      error: 'Ocorreu um erro ao criar a conta.',
      formData: req.body,
    });
  }
};

exports.logout = (req, res) => {
  res.clearCookie('token');
  res.redirect('/');
};

exports.googleAuth = (req, res, next) => {
  const redirect = req.query.redirect || '/';
  passport.authenticate('google', {
    scope: ['profile', 'email'],
    session: false,
    state: redirect,
  })(req, res, next);
};

exports.googleCallback = (req, res, next) => {
  passport.authenticate('google', { session: false }, (err, user, info) => {
    if (err || !user) {
      console.error('Erro na autenticação via Google:', err || info);
      return res.redirect('/login?error=google_failed');
    }
    const redirectUrl = req.query.state || '/';
    sendTokenCookie(user, 200, res, redirectUrl);
  })(req, res, next);
};

// ─── ESQUECEU A SENHA / RECUPERAÇÃO ──────────────────────────────────────────

exports.renderForgotPassword = (req, res) => {
  if (req.user) {
    return res.redirect('/');
  }
  res.render('auth/forgot-password', {
    title: 'Esqueci Minha Senha | O Que É Isso? Artesanato',
    error: null,
    success: null,
    email: '',
  });
};

exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).render('auth/forgot-password', {
        title: 'Esqueci Minha Senha | O Que É Isso?',
        error: 'Por favor, informe o seu e-mail cadastrado.',
        success: null,
        email: '',
      });
    }

    const cleanEmail = email.toLowerCase().trim();
    const user = await User.findOne({ email: cleanEmail });

    if (!user) {
      // Mensagem amigável para segurança
      return res.render('auth/forgot-password', {
        title: 'Esqueci Minha Senha | O Que É Isso?',
        error: null,
        success: `Se o e-mail "${cleanEmail}" estiver cadastrado em nossa loja, você receberá o link de recuperação em instantes. Verifique também a pasta de spam.`,
        email: cleanEmail,
      });
    }

    // Se a conta for apenas Google (sem senha cadastrada)
    if (user.authProvider === 'google' && !user.password) {
      return res.render('auth/forgot-password', {
        title: 'Esqueci Minha Senha | O Que É Isso?',
        error: 'Esta conta foi criada através do Google. Por favor, acesse utilizando o botão "Entrar com o Google".',
        success: null,
        email: cleanEmail,
      });
    }

    // Gerar token seguro
    const resetToken = user.createPasswordResetToken();
    await user.save({ validateBeforeSave: false });

    // Enviar e-mail com link
    await mailService.sendPasswordResetEmail(user, resetToken);

    res.render('auth/forgot-password', {
      title: 'Esqueci Minha Senha | O Que É Isso?',
      error: null,
      success: `Enviamos as instruções de recuperação para ${cleanEmail}. Por favor, consulte sua caixa de entrada e a pasta de spam.`,
      email: cleanEmail,
    });
  } catch (error) {
    console.error('Erro em forgotPassword:', error);
    res.status(500).render('auth/forgot-password', {
      title: 'Esqueci Minha Senha | O Que É Isso?',
      error: 'Ocorreu um erro ao processar sua solicitação. Tente novamente mais tarde.',
      success: null,
      email: req.body.email || '',
    });
  }
};

exports.renderResetPassword = async (req, res) => {
  if (req.user) {
    return res.redirect('/');
  }

  const { token } = req.params;
  const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

  const user = await User.findOne({
    resetPasswordToken: hashedToken,
    resetPasswordExpires: { $gt: Date.now() },
  });

  if (!user) {
    return res.render('auth/reset-password', {
      title: 'Redefinir Senha | O Que É Isso?',
      token,
      invalidToken: true,
      error: 'O link de recuperação de senha é inválido ou já expirou. Por favor, solicite um novo link.',
    });
  }

  res.render('auth/reset-password', {
    title: 'Redefinir Senha | O Que É Isso?',
    token,
    invalidToken: false,
    error: null,
  });
};

exports.resetPassword = async (req, res) => {
  try {
    const { token } = req.params;
    const { password, confirmPassword } = req.body;

    if (!password || !confirmPassword) {
      return res.status(400).render('auth/reset-password', {
        title: 'Redefinir Senha | O Que É Isso?',
        token,
        invalidToken: false,
        error: 'Por favor, preencha os dois campos de senha.',
      });
    }

    if (password !== confirmPassword) {
      return res.status(400).render('auth/reset-password', {
        title: 'Redefinir Senha | O Que É Isso?',
        token,
        invalidToken: false,
        error: 'As senhas digitadas não coincidem.',
      });
    }

    if (password.length < 6) {
      return res.status(400).render('auth/reset-password', {
        title: 'Redefinir Senha | O Que É Isso?',
        token,
        invalidToken: false,
        error: 'A nova senha deve ter no mínimo 6 caracteres.',
      });
    }

    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');
    const user = await User.findOne({
      resetPasswordToken: hashedToken,
      resetPasswordExpires: { $gt: Date.now() },
    });

    if (!user) {
      return res.render('auth/reset-password', {
        title: 'Redefinir Senha | O Que É Isso?',
        token,
        invalidToken: true,
        error: 'O link de recuperação de senha é inválido ou já expirou. Solicite um novo link.',
      });
    }

    user.password = password;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();

    console.log(`[Auth] Senha do usuário ${user.email} redefinida com sucesso.`);
    res.redirect('/login?reset=success');
  } catch (error) {
    console.error('Erro em resetPassword:', error);
    res.status(500).render('auth/reset-password', {
      title: 'Redefinir Senha | O Que É Isso?',
      token: req.params.token,
      invalidToken: false,
      error: 'Ocorreu um erro interno ao salvar a nova senha. Tente novamente.',
    });
  }
};
