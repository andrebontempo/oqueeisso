const Product = require('../models/Product');
const Category = require('../models/Category');
const Order = require('../models/Order');
const User = require('../models/User');
const Artisan = require('../models/Artisan');
const slugify = require('slugify');
const mailService = require('../services/mailService');

// ==========================================
// DASHBOARD UNIFICADO EM ABAS
// ==========================================
exports.getDashboard = async (req, res) => {
  try {
    const activeTab = req.query.tab || 'overview';

    // Estatísticas Globais
    const totalProducts = await Product.countDocuments();
    const totalOrders = await Order.countDocuments();
    const totalUsers = await User.countDocuments();
    const totalArtisans = await Artisan.countDocuments();
    const totalCategories = await Category.countDocuments();

    const allOrders = await Order.find().sort({ createdAt: -1 });
    const totalRevenue = allOrders.reduce((sum, order) => sum + (order.totalAmount || 0), 0);

    const recentOrders = allOrders.slice(0, 5);
    const lowStockProducts = await Product.find({ stock: { $lte: 3 } }).limit(5);

    // Dados Completos para as Abas
    const products = await Product.find().populate('category').sort({ createdAt: -1 });
    const artisans = await Artisan.find().sort({ order: 1 });
    const categories = await Category.find().sort({ order: 1, name: 1 });

    // Usuários com contagem de pedidos
    const usersRaw = await User.find().sort({ createdAt: -1 });
    const users = await Promise.all(
      usersRaw.map(async (u) => {
        const orderCount = await Order.countDocuments({ user: u._id });
        return {
          ...u.toObject(),
          orderCount,
        };
      })
    );

    res.render('admin/dashboard', {
      title: 'Painel Unificado Admin | O Que É Isso? Artesanato',
      activeTab,
      totalProducts,
      totalOrders,
      totalUsers,
      totalArtisans,
      totalCategories,
      totalRevenue,
      recentOrders,
      lowStockProducts,
      products,
      orders: allOrders,
      users,
      artisans,
      categories,
      success: req.query.success || null,
      error: req.query.error || null,
    });
  } catch (error) {
    console.error('Erro no dashboard admin:', error);
    res.status(500).render('error', {
      title: 'Erro Admin',
      message: 'Erro ao carregar o painel de administração.',
    });
  }
};

// ==========================================
// CRUD DE PRODUTOS
// ==========================================
exports.getProducts = async (req, res) => {
  res.redirect('/admin/dashboard?tab=produtos' + (req.query.success ? `&success=${encodeURIComponent(req.query.success)}` : ''));
};

exports.renderCreateProduct = async (req, res) => {
  try {
    const categories = await Category.find().sort({ order: 1, name: 1 });
    const artisans = await Artisan.find().sort({ order: 1 });
    res.render('admin/product-form', {
      title: 'Novo Produto | Admin',
      product: null,
      categories,
      artisans,
      error: null,
    });
  } catch (error) {
    console.error('Erro no formulário de produto:', error);
    res.redirect('/admin/dashboard?tab=produtos');
  }
};

exports.createProduct = async (req, res) => {
  try {
    const { name, description, price, originalPrice, categoryId, artisan, stock, featured, isBestSeller, dimensions, materials } = req.body;

    if (!name || !description || !price || !categoryId) {
      const categories = await Category.find().sort({ order: 1, name: 1 });
      const artisans = await Artisan.find().sort({ order: 1 });
      return res.status(400).render('admin/product-form', {
        title: 'Novo Produto | Admin',
        product: req.body,
        categories,
        artisans,
        error: 'Preencha os campos obrigatórios (Nome, Descrição, Preço e Categoria).',
      });
    }

    const slug = slugify(name, { lower: true, strict: true }) + '-' + Date.now();

    const images = [];
    if (req.files && req.files.length > 0) {
      req.files.forEach((file) => {
        images.push(`/uploads/${file.filename}`);
      });
    } else {
      images.push('/images/product-placeholder.jpg');
    }

    await Product.create({
      name,
      slug,
      description,
      price: Number(price),
      originalPrice: originalPrice ? Number(originalPrice) : 0,
      category: categoryId,
      artisan: artisan || 'Família O Que É Isso',
      stock: Number(stock) || 1,
      images,
      featured: featured === 'on' || featured === true,
      isBestSeller: isBestSeller === 'on' || isBestSeller === true,
      dimensions: dimensions || '',
      materials: materials || '',
    });

    res.redirect('/admin/dashboard?tab=produtos&success=Produto+criado+com+sucesso');
  } catch (error) {
    console.error('Erro ao criar produto:', error);
    const categories = await Category.find().sort({ order: 1, name: 1 });
    const artisans = await Artisan.find().sort({ order: 1 });
    res.status(500).render('admin/product-form', {
      title: 'Novo Produto | Admin',
      product: req.body,
      categories,
      artisans,
      error: 'Erro ao cadastrar produto.',
    });
  }
};

exports.renderEditProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const product = await Product.findById(id);
    const categories = await Category.find().sort({ order: 1, name: 1 });
    const artisans = await Artisan.find().sort({ order: 1 });

    if (!product) {
      return res.redirect('/admin/dashboard?tab=produtos');
    }

    res.render('admin/product-form', {
      title: `Editar ${product.name} | Admin`,
      product,
      categories,
      artisans,
      error: null,
    });
  } catch (error) {
    console.error('Erro ao carregar edição:', error);
    res.redirect('/admin/dashboard?tab=produtos');
  }
};

exports.updateProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, price, originalPrice, categoryId, artisan, stock, featured, isBestSeller, dimensions, materials } = req.body;

    const product = await Product.findById(id);
    if (!product) {
      return res.redirect('/admin/dashboard?tab=produtos');
    }

    product.name = name;
    product.description = description;
    product.price = Number(price);
    product.originalPrice = originalPrice ? Number(originalPrice) : 0;
    product.category = categoryId;
    product.artisan = artisan || product.artisan;
    product.stock = Number(stock);
    product.featured = featured === 'on' || featured === true;
    product.isBestSeller = isBestSeller === 'on' || isBestSeller === true;
    product.dimensions = dimensions || '';
    product.materials = materials || '';

    if (req.files && req.files.length > 0) {
      const newImages = req.files.map((file) => `/uploads/${file.filename}`);
      product.images = newImages;
    }

    await product.save();
    res.redirect('/admin/dashboard?tab=produtos&success=Produto+atualizado+com+sucesso');
  } catch (error) {
    console.error('Erro ao atualizar produto:', error);
    res.redirect('/admin/dashboard?tab=produtos');
  }
};

exports.deleteProduct = async (req, res) => {
  try {
    const { id } = req.params;
    await Product.findByIdAndDelete(id);
    res.redirect('/admin/dashboard?tab=produtos&success=Produto+removido+com+sucesso');
  } catch (error) {
    console.error('Erro ao excluir produto:', error);
    res.redirect('/admin/dashboard?tab=produtos');
  }
};

// ==========================================
// CRUD DE ARTESÃOS
// ==========================================
exports.getArtisans = async (req, res) => {
  res.redirect('/admin/dashboard?tab=artesaos' + (req.query.success ? `&success=${encodeURIComponent(req.query.success)}` : ''));
};

exports.renderCreateArtisan = (req, res) => {
  res.render('admin/artisan-form', {
    title: 'Novo Artesão | Admin',
    artisan: null,
    error: null,
  });
};

exports.createArtisan = async (req, res) => {
  try {
    const { name, role, specialty, bio, order } = req.body;

    if (!name || !role || !specialty || !bio) {
      return res.status(400).render('admin/artisan-form', {
        title: 'Novo Artesão | Admin',
        artisan: req.body,
        error: 'Preencha todos os campos obrigatórios.',
      });
    }

    let avatar = '/images/artisan-default.jpg';
    if (req.file) {
      avatar = `/uploads/${req.file.filename}`;
    }

    await Artisan.create({
      name,
      role,
      specialty,
      bio,
      avatar,
      order: Number(order) || 0,
    });

    res.redirect('/admin/dashboard?tab=artesaos&success=Artesão+cadastrado+com+sucesso');
  } catch (error) {
    console.error('Erro ao cadastrar artesão:', error);
    res.status(500).render('admin/artisan-form', {
      title: 'Novo Artesão | Admin',
      artisan: req.body,
      error: 'Erro ao cadastrar artesão.',
    });
  }
};

exports.renderEditArtisan = async (req, res) => {
  try {
    const { id } = req.params;
    const artisan = await Artisan.findById(id);

    if (!artisan) {
      return res.redirect('/admin/dashboard?tab=artesaos');
    }

    res.render('admin/artisan-form', {
      title: `Editar ${artisan.name} | Admin`,
      artisan,
      error: null,
    });
  } catch (error) {
    console.error('Erro ao carregar edição de artesão:', error);
    res.redirect('/admin/dashboard?tab=artesaos');
  }
};

exports.updateArtisan = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, role, specialty, bio, order } = req.body;

    const artisan = await Artisan.findById(id);
    if (!artisan) {
      return res.redirect('/admin/dashboard?tab=artesaos');
    }

    artisan.name = name;
    artisan.role = role;
    artisan.specialty = specialty;
    artisan.bio = bio;
    artisan.order = Number(order) || 0;

    if (req.file) {
      artisan.avatar = `/uploads/${req.file.filename}`;
    }

    await artisan.save();
    res.redirect('/admin/dashboard?tab=artesaos&success=Artesão+atualizado+com+sucesso');
  } catch (error) {
    console.error('Erro ao atualizar artesão:', error);
    res.redirect('/admin/dashboard?tab=artesaos');
  }
};

exports.deleteArtisan = async (req, res) => {
  try {
    const { id } = req.params;
    await Artisan.findByIdAndDelete(id);
    res.redirect('/admin/dashboard?tab=artesaos&success=Artesão+removido+com+sucesso');
  } catch (error) {
    console.error('Erro ao excluir artesão:', error);
    res.redirect('/admin/dashboard?tab=artesaos');
  }
};

// ==========================================
// CRUD DE USUÁRIOS E CLIENTES
// ==========================================
exports.getUsers = async (req, res) => {
  res.redirect('/admin/dashboard?tab=usuarios' + (req.query.success ? `&success=${encodeURIComponent(req.query.success)}` : ''));
};

exports.renderCreateUser = (req, res) => {
  res.render('admin/user-form', {
    title: 'Novo Usuário / Cliente | Admin',
    userForm: null,
    error: null,
  });
};

exports.createUser = async (req, res) => {
  try {
    const { name, email, password, role, phone, street, number, neighborhood, city, state, zipCode } = req.body;

    if (!name || !email || !password) {
      return res.status(400).render('admin/user-form', {
        title: 'Novo Usuário / Cliente | Admin',
        userForm: req.body,
        error: 'Preencha os campos obrigatórios (Nome, E-mail e Senha).',
      });
    }

    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).render('admin/user-form', {
        title: 'Novo Usuário / Cliente | Admin',
        userForm: req.body,
        error: 'Este e-mail já está cadastrado.',
      });
    }

    await User.create({
      name,
      email,
      password,
      role: role || 'user',
      phone: phone || '',
      address: {
        street: street || '',
        number: number || '',
        neighborhood: neighborhood || '',
        city: city || '',
        state: state || '',
        zipCode: zipCode || '',
      },
    });

    res.redirect('/admin/dashboard?tab=usuarios&success=Usuário+cadastrado+com+sucesso');
  } catch (error) {
    console.error('Erro ao criar usuário:', error);
    res.status(500).render('admin/user-form', {
      title: 'Novo Usuário / Cliente | Admin',
      userForm: req.body,
      error: 'Erro ao cadastrar usuário.',
    });
  }
};

exports.renderEditUser = async (req, res) => {
  try {
    const { id } = req.params;
    const userForm = await User.findById(id);

    if (!userForm) {
      return res.redirect('/admin/dashboard?tab=usuarios');
    }

    res.render('admin/user-form', {
      title: `Editar Usuário ${userForm.name} | Admin`,
      userForm,
      error: null,
    });
  } catch (error) {
    console.error('Erro ao carregar edição de usuário:', error);
    res.redirect('/admin/dashboard?tab=usuarios');
  }
};

exports.updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, email, password, role, phone, street, number, neighborhood, city, state, zipCode } = req.body;

    const userToUpdate = await User.findById(id);
    if (!userToUpdate) {
      return res.redirect('/admin/dashboard?tab=usuarios');
    }

    userToUpdate.name = name || userToUpdate.name;
    userToUpdate.email = email || userToUpdate.email;
    userToUpdate.role = role || userToUpdate.role;
    userToUpdate.phone = phone || '';
    userToUpdate.address = {
      street: street || '',
      number: number || '',
      neighborhood: neighborhood || '',
      city: city || '',
      state: state || '',
      zipCode: zipCode || '',
    };

    if (password && password.trim().length >= 6) {
      userToUpdate.password = password;
    }

    await userToUpdate.save();
    res.redirect('/admin/dashboard?tab=usuarios&success=Usuário+atualizado+com+sucesso');
  } catch (error) {
    console.error('Erro ao atualizar usuário:', error);
    res.redirect('/admin/dashboard?tab=usuarios');
  }
};

exports.deleteUser = async (req, res) => {
  try {
    const { id } = req.params;

    // Não permitir excluir a si próprio
    if (id === req.user._id.toString()) {
      return res.redirect('/admin/dashboard?tab=usuarios&error=Você+não+pode+excluir+sua+própria+conta+conectada');
    }

    await User.findByIdAndDelete(id);
    res.redirect('/admin/dashboard?tab=usuarios&success=Usuário+removido+com+sucesso');
  } catch (error) {
    console.error('Erro ao excluir usuário:', error);
    res.redirect('/admin/dashboard?tab=usuarios');
  }
};

// ==========================================
// CRUD DE CATEGORIAS
// ==========================================
exports.getCategories = async (req, res) => {
  res.redirect('/admin/dashboard?tab=categorias' + (req.query.success ? `&success=${encodeURIComponent(req.query.success)}` : ''));
};

exports.renderCreateCategory = (req, res) => {
  res.render('admin/category-form', {
    title: 'Nova Categoria | Admin',
    category: null,
    error: null,
  });
};

exports.createCategory = async (req, res) => {
  try {
    const { name, description, icon, order } = req.body;

    if (!name) {
      return res.status(400).render('admin/category-form', {
        title: 'Nova Categoria | Admin',
        category: req.body,
        error: 'O nome da categoria é obrigatório.',
      });
    }

    const slug = slugify(name, { lower: true, strict: true });

    let image = '/images/category-default.jpg';
    if (req.file) {
      image = `/uploads/${req.file.filename}`;
    }

    await Category.create({
      name,
      slug,
      description: description || '',
      icon: icon || 'fa-shapes',
      image,
      order: order !== undefined && order !== '' ? Number(order) : 99,
    });

    res.redirect('/admin/dashboard?tab=categorias&success=Categoria+criada+com+sucesso');
  } catch (error) {
    console.error('Erro ao criar categoria:', error);
    res.status(500).render('admin/category-form', {
      title: 'Nova Categoria | Admin',
      category: req.body,
      error: 'Erro ao cadastrar categoria.',
    });
  }
};

exports.renderEditCategory = async (req, res) => {
  try {
    const { id } = req.params;
    const category = await Category.findById(id);

    if (!category) {
      return res.redirect('/admin/dashboard?tab=categorias');
    }

    res.render('admin/category-form', {
      title: `Editar Categoria ${category.name} | Admin`,
      category,
      error: null,
    });
  } catch (error) {
    console.error('Erro ao carregar edição de categoria:', error);
    res.redirect('/admin/dashboard?tab=categorias');
  }
};

exports.updateCategory = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, icon, order } = req.body;

    const category = await Category.findById(id);
    if (!category) {
      return res.redirect('/admin/dashboard?tab=categorias');
    }

    category.name = name;
    category.slug = slugify(name, { lower: true, strict: true });
    category.description = description || '';
    category.icon = icon || 'fa-shapes';
    if (order !== undefined && order !== '') {
      category.order = Number(order);
    }

    if (req.file) {
      category.image = `/uploads/${req.file.filename}`;
    }

    await category.save();
    res.redirect('/admin/dashboard?tab=categorias&success=Categoria+atualizada+com+sucesso');
  } catch (error) {
    console.error('Erro ao atualizar categoria:', error);
    res.redirect('/admin/dashboard?tab=categorias');
  }
};

exports.deleteCategory = async (req, res) => {
  try {
    const { id } = req.params;
    await Category.findByIdAndDelete(id);
    res.redirect('/admin/dashboard?tab=categorias&success=Categoria+removida+com+sucesso');
  } catch (error) {
    console.error('Erro ao excluir categoria:', error);
    res.redirect('/admin/dashboard?tab=categorias');
  }
};

// ==========================================
// GESTÃO DE PEDIDOS
// ==========================================
exports.getOrders = async (req, res) => {
  res.redirect('/admin/dashboard?tab=pedidos' + (req.query.success ? `&success=${encodeURIComponent(req.query.success)}` : ''));
};

exports.updateOrderStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { orderStatus, paymentStatus } = req.body;

    const order = await Order.findById(id);
    if (order) {
      const oldOrderStatus = order.orderStatus;
      const oldPaymentStatus = order.paymentStatus;

      if (orderStatus) order.orderStatus = orderStatus;
      if (paymentStatus) order.paymentStatus = paymentStatus;
      await order.save();

      // Disparar e-mail de notificação de alteração de status se houver mudança
      if ((orderStatus && orderStatus !== oldOrderStatus) || (paymentStatus && paymentStatus !== oldPaymentStatus)) {
        mailService.sendStatusUpdateEmail(order).catch((err) => console.error('[Mail] Erro status update:', err.message));
      }
    }

    res.redirect('/admin/dashboard?tab=pedidos&success=Status+do+pedido+atualizado');
  } catch (error) {
    console.error('Erro ao atualizar status do pedido:', error);
    res.redirect('/admin/dashboard?tab=pedidos');
  }
};
