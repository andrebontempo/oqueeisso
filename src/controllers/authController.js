const User = require('../models/User');
const jwt = require('jsonwebtoken');

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
  res.render('auth/login', {
    title: 'Entrar | O Que É Isso? Artesanato',
    redirect: req.query.redirect || '/',
    error: null,
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
