const Product = require('../models/Product');
const Category = require('../models/Category');
const Order = require('../models/Order');
const User = require('../models/User');
const Artisan = require('../models/Artisan');
const slugify = require('slugify');

exports.getDashboard = async (req, res) => {
  try {
    const totalProducts = await Product.countDocuments();
    const totalOrders = await Order.countDocuments();
    const totalUsers = await User.countDocuments({ role: 'user' });
    const totalArtisans = await Artisan.countDocuments();

    const orders = await Order.find();
    const totalRevenue = orders.reduce((sum, order) => sum + (order.totalAmount || 0), 0);

    const recentOrders = await Order.find().sort({ createdAt: -1 }).limit(5);
    const lowStockProducts = await Product.find({ stock: { $lte: 3 } }).limit(5);

    res.render('admin/dashboard', {
      title: 'Painel Admin | O Que É Isso? Artesanato',
      totalProducts,
      totalOrders,
      totalUsers,
      totalArtisans,
      totalRevenue,
      recentOrders,
      lowStockProducts,
    });
  } catch (error) {
    console.error('Erro no dashboard admin:', error);
    res.status(500).render('error', {
      title: 'Erro Admin',
      message: 'Erro ao carregar o painel de administração.',
    });
  }
};

exports.getProducts = async (req, res) => {
  try {
    const products = await Product.find().populate('category').sort({ createdAt: -1 });
    res.render('admin/products', {
      title: 'Gerenciar Produtos | Admin',
      products,
      success: req.query.success || null,
    });
  } catch (error) {
    console.error('Erro ao listar produtos admin:', error);
    res.status(500).redirect('/admin/dashboard');
  }
};

exports.renderCreateProduct = async (req, res) => {
  try {
    const categories = await Category.find();
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
    res.redirect('/admin/produtos');
  }
};

exports.createProduct = async (req, res) => {
  try {
    const { name, description, price, originalPrice, categoryId, artisan, stock, featured, isBestSeller, dimensions, materials } = req.body;

    if (!name || !description || !price || !categoryId) {
      const categories = await Category.find();
      return res.status(400).render('admin/product-form', {
        title: 'Novo Produto | Admin',
        product: req.body,
        categories,
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

    res.redirect('/admin/produtos?success=Produto+criado+com+sucesso');
  } catch (error) {
    console.error('Erro ao criar produto:', error);
    const categories = await Category.find();
    res.status(500).render('admin/product-form', {
      title: 'Novo Produto | Admin',
      product: req.body,
      categories,
      error: 'Erro ao cadastrar produto.',
    });
  }
};

exports.renderEditProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const product = await Product.findById(id);
    const categories = await Category.find();
    const artisans = await Artisan.find().sort({ order: 1 });

    if (!product) {
      return res.redirect('/admin/produtos');
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
    res.redirect('/admin/produtos');
  }
};

// ==========================================
// CRUD DE ARTESÃOS
// ==========================================

exports.getArtisans = async (req, res) => {
  try {
    const artisans = await Artisan.find().sort({ order: 1 });
    res.render('admin/artisans', {
      title: 'Gerenciar Artesãos | Admin',
      artisans,
      success: req.query.success || null,
    });
  } catch (error) {
    console.error('Erro ao listar artesãos:', error);
    res.redirect('/admin/dashboard');
  }
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

    res.redirect('/admin/artesaos?success=Artesão+cadastrado+com+sucesso');
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
      return res.redirect('/admin/artesaos');
    }

    res.render('admin/artisan-form', {
      title: `Editar ${artisan.name} | Admin`,
      artisan,
      error: null,
    });
  } catch (error) {
    console.error('Erro ao carregar edição de artesão:', error);
    res.redirect('/admin/artesaos');
  }
};

exports.updateArtisan = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, role, specialty, bio, order } = req.body;

    const artisan = await Artisan.findById(id);
    if (!artisan) {
      return res.redirect('/admin/artesaos');
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
    res.redirect('/admin/artesaos?success=Artesão+atualizado+com+sucesso');
  } catch (error) {
    console.error('Erro ao atualizar artesão:', error);
    res.redirect('/admin/artesaos');
  }
};

exports.deleteArtisan = async (req, res) => {
  try {
    const { id } = req.params;
    await Artisan.findByIdAndDelete(id);
    res.redirect('/admin/artesaos?success=Artesão+removido+com+sucesso');
  } catch (error) {
    console.error('Erro ao excluir artesão:', error);
    res.redirect('/admin/artesaos');
  }
};

exports.updateProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, price, originalPrice, categoryId, artisan, stock, featured, isBestSeller, dimensions, materials } = req.body;

    const product = await Product.findById(id);
    if (!product) {
      return res.redirect('/admin/produtos');
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
    res.redirect('/admin/produtos?success=Produto+atualizado+com+sucesso');
  } catch (error) {
    console.error('Erro ao atualizar produto:', error);
    res.redirect('/admin/produtos');
  }
};

exports.deleteProduct = async (req, res) => {
  try {
    const { id } = req.params;
    await Product.findByIdAndDelete(id);
    res.redirect('/admin/produtos?success=Produto+removido+com+sucesso');
  } catch (error) {
    console.error('Erro ao excluir produto:', error);
    res.redirect('/admin/produtos');
  }
};

exports.getOrders = async (req, res) => {
  try {
    const orders = await Order.find().sort({ createdAt: -1 });
    res.render('admin/orders', {
      title: 'Gerenciar Pedidos | Admin',
      orders,
      success: req.query.success || null,
    });
  } catch (error) {
    console.error('Erro ao carregar pedidos admin:', error);
    res.redirect('/admin/dashboard');
  }
};

exports.updateOrderStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { orderStatus, paymentStatus } = req.body;

    const order = await Order.findById(id);
    if (order) {
      if (orderStatus) order.orderStatus = orderStatus;
      if (paymentStatus) order.paymentStatus = paymentStatus;
      await order.save();
    }

    res.redirect('/admin/pedidos?success=Status+do+pedido+atualizado');
  } catch (error) {
    console.error('Erro ao atualizar status do pedido:', error);
    res.redirect('/admin/pedidos');
  }
};
