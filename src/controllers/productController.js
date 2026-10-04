const Product = require('../models/Product');
const Category = require('../models/Category');
const Artisan = require('../models/Artisan');

exports.getHome = async (req, res) => {
  try {
    const categories = await Category.find().sort({ order: 1, name: 1 });
    const featuredProducts = await Product.find({ featured: true }).populate('category').limit(8);
    const bestSellers = await Product.find({ isBestSeller: true }).populate('category').limit(4);
    const recentProducts = await Product.find().sort({ createdAt: -1 }).populate('category').limit(8);
    const artisans = await Artisan.find().sort({ order: 1 });

    res.render('index', {
      title: 'O Que É Isso? - Peças Exclusivas de Artesanato Feitas à Mão',
      categories,
      featuredProducts,
      bestSellers,
      recentProducts,
      artisans,
    });
  } catch (error) {
    console.error('Erro ao carregar home:', error);
    res.status(500).render('error', {
      title: 'Erro',
      message: 'Não foi possível carregar os produtos no momento.',
    });
  }
};

exports.getCategory = async (req, res) => {
  try {
    const { slug } = req.params;
    const { sort, minPrice, maxPrice } = req.query;

    let category = await Category.findOne({ slug });
    if (!category && slug === 'croche') {
      category = await Category.findOne({ slug: 'croches-e-afins' });
    } else if (!category && slug === 'croches-e-afins') {
      category = await Category.findOne({ slug: 'croche' });
    }

    if (!category) {
      return res.status(404).render('error', {
        title: 'Categoria Não Encontrada',
        message: 'A categoria solicitada não existe ou foi removida.',
      });
    }

    let filter = { category: category._id };

    if (minPrice || maxPrice) {
      filter.price = {};
      if (minPrice) filter.price.$gte = Number(minPrice);
      if (maxPrice) filter.price.$lte = Number(maxPrice);
    }

    let sortOption = { createdAt: -1 };
    if (sort === 'price_asc') sortOption = { price: 1 };
    if (sort === 'price_desc') sortOption = { price: -1 };
    if (sort === 'name') sortOption = { name: 1 };

    const products = await Product.find(filter).populate('category').sort(sortOption);
    const allCategories = await Category.find().sort({ order: 1, name: 1 });

    res.render('category', {
      title: `${category.name} | O Que É Isso? Artesanato`,
      category,
      products,
      allCategories,
      sort: sort || 'recent',
      minPrice: minPrice || '',
      maxPrice: maxPrice || '',
    });
  } catch (error) {
    console.error('Erro ao carregar categoria:', error);
    res.status(500).render('error', {
      title: 'Erro',
      message: 'Erro ao carregar a categoria.',
    });
  }
};

exports.getProductDetails = async (req, res) => {
  try {
    const { id } = req.params;

    let product;
    if (id.match(/^[0-9a-fA-F]{24}$/)) {
      product = await Product.findById(id).populate('category');
    } else {
      product = await Product.findOne({ slug: id }).populate('category');
    }

    if (!product) {
      return res.status(404).render('error', {
        title: 'Produto Não Encontrado',
        message: 'O produto procurado não está disponível.',
      });
    }

    const relatedProducts = await Product.find({
      category: product.category._id,
      _id: { $ne: product._id },
    })
      .limit(4)
      .populate('category');

    res.render('product-details', {
      title: `${product.name} | O Que É Isso?`,
      product,
      relatedProducts,
    });
  } catch (error) {
    console.error('Erro nos detalhes do produto:', error);
    res.status(500).render('error', {
      title: 'Erro',
      message: 'Erro ao carregar os detalhes do produto.',
    });
  }
};

exports.searchProducts = async (req, res) => {
  try {
    const q = req.query.q || '';
    const regex = new RegExp(q, 'i');

    const products = await Product.find({
      $or: [{ name: regex }, { description: regex }, { artisan: regex }],
    }).populate('category');

    const categories = await Category.find().sort({ order: 1, name: 1 });

    res.render('search', {
      title: `Busca por "${q}" | O Que É Isso?`,
      query: q,
      products,
      categories,
    });
  } catch (error) {
    console.error('Erro na busca:', error);
    res.status(500).render('error', {
      title: 'Erro',
      message: 'Erro ao realizar a busca.',
    });
  }
};
