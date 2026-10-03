const Order = require('../models/Order');
const User = require('../models/User');

exports.getAccount = async (req, res) => {
  try {
    const orders = await Order.find({ user: req.user._id }).sort({ createdAt: -1 });

    res.render('account/dashboard', {
      title: 'Minha Conta | O Que É Isso? Artesanato',
      user: req.user,
      orders,
      success: req.query.updated ? 'Dados atualizados com sucesso!' : null,
      error: null,
    });
  } catch (error) {
    console.error('Erro na conta do usuário:', error);
    res.status(500).render('error', {
      title: 'Erro',
      message: 'Não foi possível carregar as informações da sua conta.',
    });
  }
};

exports.updateProfile = async (req, res) => {
  try {
    const { name, phone, street, number, complement, neighborhood, city, state, zipCode } = req.body;

    const user = await User.findById(req.user._id);
    if (!user) {
      return res.redirect('/login');
    }

    user.name = name || user.name;
    user.phone = phone || user.phone;
    user.address = {
      street: street || '',
      number: number || '',
      complement: complement || '',
      neighborhood: neighborhood || '',
      city: city || '',
      state: state || '',
      zipCode: zipCode || '',
    };

    await user.save();
    res.redirect('/minha-conta?updated=true');
  } catch (error) {
    console.error('Erro ao atualizar perfil:', error);
    res.redirect('/minha-conta');
  }
};

exports.getOrderDetail = async (req, res) => {
  try {
    const { id } = req.params;
    const order = await Order.findOne({ _id: id, user: req.user._id });

    if (!order) {
      return res.status(404).render('error', {
        title: 'Pedido Não Encontrado',
        message: 'Pedido não localizado ou não pertence à sua conta.',
      });
    }

    res.render('account/order-detail', {
      title: `Pedido #${order.orderNumber} | O Que É Isso?`,
      order,
    });
  } catch (error) {
    console.error('Erro ao carregar detalhe do pedido:', error);
    res.status(500).render('error', {
      title: 'Erro',
      message: 'Erro ao carregar detalhes do pedido.',
    });
  }
};
