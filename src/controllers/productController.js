const Product = require('../models/Product');
const Category = require('../models/Category');
const Artisan = require('../models/Artisan');

exports.getHome = async (req, res) => {
  try {
    const categories = await Category.find().sort({ order: 1, name: 1 });
    const featuredProducts = await Product.find({ featured: true }).populate('category').limit(8);
    const bestSellers = await Product.find({ isBestSeller: true }).populate('category').limit(4);
    const recentProducts = await Product.find().sort({ createdAt: -1 }).populate('category').limit(8);

    // Garantir a ordem exata no banco de dados para os artesãos
    await Promise.all([
      Artisan.updateOne({ name: /nara/i }, { $set: { order: 1 } }),
      Artisan.updateOne({ name: /rosanilda/i }, { $set: { order: 2 } }),
      Artisan.updateOne({ name: /alcione/i }, { $set: { order: 3 } }),
      Artisan.updateOne({ name: /humberto/i }, { $set: { order: 4 } }),
    ]).catch((e) => console.error('Erro ao ordenar artesãos:', e));

    const artisans = await Artisan.find().sort({ order: 1 });

    const orderMap = { nara: 1, rosanilda: 2, alcione: 3, humberto: 4 };
    artisans.sort((a, b) => {
      const getRank = (art) => {
        const nameLower = (art.name || '').toLowerCase();
        for (const key of Object.keys(orderMap)) {
          if (nameLower.includes(key)) return orderMap[key];
        }
        return art.order || 99;
      };
      return getRank(a) - getRank(b);
    });

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

    if (!category) {
      if (slug.includes('bordado')) {
        category = await Category.findOne({
          $or: [
            { slug: 'bordados-e-afins' },
            { slug: 'bordados-afins' },
            { slug: 'bordados' },
            { name: /bordado/i }
          ]
        });
      } else if (slug.includes('bolsa') || slug.includes('boneca')) {
        category = await Category.findOne({
          $or: [
            { slug: 'bolsas-e-bonecas' },
            { slug: 'bolsas-bonecas' },
            { name: /bolsas/i }
          ]
        });
      } else if (slug.includes('croche')) {
        category = await Category.findOne({
          $or: [
            { slug: 'croches-e-afins' },
            { slug: 'croches-afins' },
            { slug: 'croche' },
            { name: /croch/i }
          ]
        });
      } else if (slug.includes('madeira')) {
        category = await Category.findOne({
          $or: [
            { slug: 'trabalhos-em-madeira' },
            { slug: 'madeira' },
            { name: /madeira/i }
          ]
        });
      }
    }

    // Se a categoria Bordados & Afins não existe sob nenhum alias, tenta criar ou recuperar por nome
    if (!category && slug.includes('bordado')) {
      try {
        category = await Category.create({
          name: 'Bordados & Afins',
          slug: 'bordados-e-afins',
          description: 'Bordados manuais, bastidores decorativos, panos de prato bordados e delicadezas feitas à mão.',
          image: '/images/cat-bolsas-bonecas.jpg',
          icon: 'fa-cut',
          order: 3,
        });
      } catch (createErr) {
        category = await Category.findOne({ name: /bordado/i });
      }
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

    const relatedProducts = product.category
      ? await Product.find({
          category: product.category._id,
          _id: { $ne: product._id },
        })
          .limit(4)
          .populate('category')
      : [];

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
