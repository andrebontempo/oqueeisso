const Product = require('../models/Product');
const Category = require('../models/Category');
const Order = require('../models/Order');
const User = require('../models/User');
const slugify = require('slugify');

exports.getDashboard = async (req, res) => {
  try {
    const totalProducts = await Product.countDocuments();
    const totalOrders = await Order.countDocuments();
    const totalUsers = await User.countDocuments({ role: 'user' });

    const orders = await Order.find();
    const totalRevenue = orders.reduce((sum, order) => sum + (order.totalAmount || 0), 0);

    const recentOrders = await Order.find().sort({ createdAt: -1 }).limit(5);
    const lowStockProducts = await Product.find({ stock: { $lte: 3 } }).limit(5);

    res.render('admin/dashboard', {
      title: 'Painel Admin | O Que É Isso? Artesanato',
      totalProducts,
      totalOrders,
      totalUsers,
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
    res.render('admin/product-form', {
      title: 'Novo Produto | Admin',
      product: null,
      categories,
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

    if (!product) {
      return res.redirect('/admin/produtos');
    }

    res.render('admin/product-form', {
      title: `Editar ${product.name} | Admin`,
      product,
      categories,
      error: null,
    });
  } catch (error) {
    console.error('Erro ao carregar edição:', error);
    res.redirect('/admin/produtos');
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
