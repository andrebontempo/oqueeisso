const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const dotenv = require('dotenv');
const connectDB = require('./config/db');
const { optionalAuth } = require('./middleware/auth');

const passport = require('passport');
const configurePassport = require('./config/passport');

// Carregar variáveis de ambiente
dotenv.config();

// Configurar Passport
configurePassport();

// Conectar ao MongoDB
connectDB();

const app = express();

// Configurações do View Engine (EJS)
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Middlewares Globais
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(passport.initialize());

// Arquivos Estáticos
app.use(express.static(path.join(__dirname, '../public')));

// Middleware de Autenticação Opcional / Contexto da Sessão
app.use(optionalAuth);

// Helper para formatar moeda em reais nos templates EJS
app.locals.formatMoney = (value) => {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value || 0);
};

// Rotas da Aplicação
app.use('/', require('./routes/productRoutes'));
app.use('/', require('./routes/authRoutes'));
app.use('/', require('./routes/cartRoutes'));
app.use('/', require('./routes/checkoutRoutes'));
app.use('/', require('./routes/userRoutes'));
app.use('/admin', require('./routes/adminRoutes'));

// Tratar Rota Não Encontrada (404)
app.use((req, res) => {
  res.status(404).render('error', {
    title: 'Página Não Encontrada',
    message: 'Desculpe, a página que você procura não foi encontrada ou mudou de endereço.',
  });
});

// Middleware Global de Tratamento de Erros
app.use((err, req, res, next) => {
  console.error('Erro global na aplicação:', err);
  res.status(500).render('error', {
    title: 'Erro no Servidor',
    message: 'Ocorreu um erro interno. Nossa equipe já foi notificada.',
  });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`====================================================`);
  console.log(`🌸 Servidor O Que É Isso? rodando na porta ${PORT}`);
  console.log(`👉 Acesse localmente: http://localhost:${PORT}`);
  console.log(`====================================================`);
});
