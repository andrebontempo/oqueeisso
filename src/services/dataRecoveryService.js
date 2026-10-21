const Category = require('../models/Category');
const Artisan = require('../models/Artisan');
const Product = require('../models/Product');
const User = require('../models/User');

const OFFICIAL_CATEGORIES = [
  {
    name: 'Bolsas & Bonecas',
    slug: 'bolsas-e-bonecas',
    description: 'Bolsas de tecido bordadas, niqueleiras e bonecas de pano afetivas por Nara Bontempo.',
    image: '/images/cat-bolsas-bonecas.jpg',
    icon: 'fa-shopping-bag',
    order: 1,
  },
  {
    name: 'Bordados & Afins',
    slug: 'bordados-e-afins',
    description: 'Bordados manuais, bastidores decorativos, panos de prato bordados e delicadezas feitas à mão por Rosanilda Maciel.',
    image: '/images/cat-bordados.jpg',
    icon: 'fa-cut',
    order: 2,
  },
  {
    name: 'Crochês & Afins',
    slug: 'croches-e-afins',
    description: 'Tapetes, caminhos de mesa, amigurumis e artigos aconchegantes em crochê por Alcione Pereira.',
    image: '/images/cat-croche.jpg',
    icon: 'fa-certificate',
    order: 3,
  },
  {
    name: 'Trabalhos em Madeira',
    slug: 'trabalhos-em-madeira',
    description: 'Peças artesanais entalhadas e lixadas à mão em madeira nobre sustentável por Humberto Bontempo.',
    image: '/images/cat-madeira.jpg',
    icon: 'fa-tree',
    order: 4,
  },
];

const OFFICIAL_ARTISANS = [
  {
    name: 'Nara Bontempo',
    role: 'Artesã',
    specialty: 'Bolsas & Bonecas',
    bio: 'Confecciona bolsas em tecido de alta durabilidade, niqueleiras com fecho vintage e bonecas de pano afetivas cheias de charme.',
    avatar: '/images/artisan-nara.jpg',
    order: 1,
  },
  {
    name: 'Rosanilda Maciel',
    role: 'Artesã',
    specialty: 'Bordados & Afins',
    bio: 'Especialista em bordados delicados em bastidores, panos de copa refinados e peças têxteis com rica precisão artesanal.',
    avatar: '/images/artisan-rosanilda.jpg',
    order: 2,
  },
  {
    name: 'Alcione Pereira',
    role: 'Artesã',
    specialty: 'Crochês & Afins',
    bio: 'Dedica horas tecendo com carinho tapetes rendados, amigurumis e artigos aconchegantes em fio de algodão.',
    avatar: '/images/artisan-alcione.jpg',
    order: 3,
  },
  {
    name: 'Humberto Bontempo',
    role: 'Artesão',
    specialty: 'Trabalhos em Madeira',
    bio: 'Mestre no entalhe de madeiras nobres sustentáveis, esculpindo tábuas rústicas gourmet e peças funcionais para o lar.',
    avatar: '/images/artisan-humberto.jpg',
    order: 4,
  },
];

/**
 * Executa a restauração e sincronização automática e segura dos dados principais da loja
 */
const runDataRecovery = async () => {
  try {
    console.log('[Auto-Recovery] 🛡️ Verificando integridade dos dados essenciais...');

    // 1. Restaurar Categorias Oficiais
    for (const catData of OFFICIAL_CATEGORIES) {
      const existing = await Category.findOne({
        $or: [{ slug: catData.slug }, { name: new RegExp(`^${catData.name}$`, 'i') }],
      });

      if (!existing) {
        await Category.create(catData);
        console.log(`[Auto-Recovery] ✅ Categoria restaurada: ${catData.name}`);
      } else {
        // Garante que imagem, ícone e ordem estejam corretos
        await Category.updateOne(
          { _id: existing._id },
          {
            $set: {
              name: catData.name,
              slug: catData.slug,
              description: existing.description || catData.description,
              image: catData.image,
              icon: catData.icon,
              order: catData.order,
            },
          }
        );
      }
    }

    // 2. Restaurar Artesãos Oficiais da Família
    for (const artData of OFFICIAL_ARTISANS) {
      const keyword = artData.name.split(' ')[0].toLowerCase();
      const existing = await Artisan.findOne({
        $or: [{ name: new RegExp(keyword, 'i') }],
      });

      if (!existing) {
        await Artisan.create(artData);
        console.log(`[Auto-Recovery] ✅ Artesão restaurado: ${artData.name}`);
      } else {
        await Artisan.updateOne(
          { _id: existing._id },
          {
            $set: {
              name: artData.name,
              role: artData.role,
              specialty: artData.specialty,
              bio: artData.bio,
              avatar: artData.avatar,
              order: artData.order,
            },
          }
        );
      }
    }

    // 3. Garantir Usuário Admin Ativo
    const adminEmail = process.env.ADMIN_ALERT_EMAIL || 'admin@oqueeisso.com';
    let adminUser = await User.findOne({ role: 'admin' });
    if (!adminUser) {
      adminUser = await User.create({
        name: 'Humberto Bontempo (Admin)',
        email: adminEmail,
        password: process.env.ADMIN_PASSWORD || 'admin123',
        role: 'admin',
        phone: '(11) 98888-7777',
      });
      console.log(`[Auto-Recovery] ✅ Usuário administrador criado: ${adminEmail}`);
    }

    // 4. Restaurar Produtos Iniciais caso o catálogo esteja vazio
    const totalProducts = await Product.countDocuments();
    if (totalProducts === 0) {
      console.log('[Auto-Recovery] 📦 Nenhum produto encontrado. Restaurando catálogo artesanal inicial...');
      
      const catMadeira = await Category.findOne({ slug: 'trabalhos-em-madeira' });
      const catBolsas = await Category.findOne({ slug: 'bolsas-e-bonecas' });
      const catCroche = await Category.findOne({ slug: 'croches-e-afins' });
      const catBordados = await Category.findOne({ slug: 'bordados-e-afins' });

      const defaultProducts = [
        // TRABALHOS EM MADEIRA
        {
          name: 'Tábua Rústica em Madeira Nobre Cumaru',
          slug: 'tabua-rustica-madeira-cumaru',
          description: 'Tábua gourmet para corte e servimento entalhada à mão em madeira Cumaru. Possui alça anatômica e sulco para retenção de líquidos. Tratada exclusivamente com óleo mineral atóxico e cera de abelha natural.',
          price: 149.9,
          originalPrice: 180.0,
          category: catMadeira?._id,
          artisan: 'Humberto Bontempo',
          stock: 5,
          images: ['/images/cat-madeira.jpg', '/images/hero-artesanato.jpg'],
          featured: true,
          isBestSeller: true,
          dimensions: '45cm x 28cm x 3cm',
          materials: 'Madeira Cumaru, Óleo Mineral Atóxico',
        },
        {
          name: 'Caixa Organizadora Entalhada em Madeira',
          slug: 'caixa-organizadora-entalhada-madeira',
          description: 'Baú decorativo pequeno em madeira de reflorestamento com entalhes florais na tampa. Fecho em latão envelhecido e interior aveludado.',
          price: 119.0,
          originalPrice: 140.0,
          category: catMadeira?._id,
          artisan: 'Humberto Bontempo',
          stock: 3,
          images: ['/images/hero-artesanato.jpg'],
          featured: true,
          isBestSeller: false,
          dimensions: '22cm x 15cm x 10cm',
          materials: 'Madeira Pinus Nobre, Latão',
        },
        {
          name: 'Descanso de Panela Rústico Hexagonal (Par)',
          slug: 'descanso-de-panela-rustico-hexagonal',
          description: 'Conjunto com 2 descansos de panela em formato hexagonal confeccionados com ripas de madeira maciça de peroba rosa de reuso.',
          price: 65.0,
          category: catMadeira?._id,
          artisan: 'Humberto Bontempo',
          stock: 8,
          images: ['/images/cat-madeira.jpg'],
          featured: false,
          isBestSeller: true,
          dimensions: '20cm x 20cm x 2cm',
          materials: 'Peroba Rosa de Reuso',
        },

        // BOLSAS E BONECAS
        {
          name: 'Bolsa Tote em Tecido Botânico com Alça em Couro',
          slug: 'bolsa-tote-tecido-botanico-alca-couro',
          description: 'Bolsa espaçosa e elegante confeccionada em sarja de algodão com estampa botânica exclusiva. Alças resistentes em couro sintético e fecho interno.',
          price: 189.9,
          originalPrice: 220.0,
          category: catBolsas?._id,
          artisan: 'Nara Bontempo',
          stock: 4,
          images: ['/images/cat-bolsas-bonecas.jpg', '/images/hero-artesanato.jpg'],
          featured: true,
          isBestSeller: true,
          dimensions: '38cm x 32cm x 12cm',
          materials: 'Sarja 100% Algodão',
        },
        {
          name: 'Boneca de Pano Afetiva "Clarinha"',
          slug: 'boneca-de-pano-afetiva-clarinha',
          description: 'Encantadora boneca de pano articulada artesanal. Vestidinho floral em tricoline com detalhes em renda guipir e cabelos em lã natural trançados.',
          price: 135.0,
          originalPrice: 160.0,
          category: catBolsas?._id,
          artisan: 'Nara Bontempo',
          stock: 6,
          images: ['/images/cat-bolsas-bonecas.jpg'],
          featured: true,
          isBestSeller: true,
          dimensions: 'Alt: 40cm, Larg: 18cm',
          materials: 'Algodão Cru, Tricoline',
        },
        {
          name: 'Necessaire Niqueleira Vintage com Fecho da Vovó',
          slug: 'necessaire-niqueleira-vintage-fecho-vovo',
          description: 'Porta-moedas e maquiagem artesanal com fecho da vovó metálico retrô. Forro reforçado em linho cru.',
          price: 48.0,
          category: catBolsas?._id,
          artisan: 'Nara Bontempo',
          stock: 10,
          images: ['/images/hero-artesanato.jpg'],
          featured: false,
          isBestSeller: false,
          dimensions: '16cm x 12cm x 6cm',
          materials: 'Linho, Algodão',
        },

        // CROCHÊ
        {
          name: 'Caminho de Mesa em Crochê Rendado Algodão Cru',
          slug: 'caminho-de-mesa-croche-rendado-algodao',
          description: 'Trilho de mesa minunciosamente tecido à mão em ponto rendado florido. Perfeito para mesas de 6 ou 8 lugares.',
          price: 159.0,
          originalPrice: 190.0,
          category: catCroche?._id,
          artisan: 'Alcione Pereira',
          stock: 3,
          images: ['/images/cat-croche.jpg', '/images/hero-artesanato.jpg'],
          featured: true,
          isBestSeller: true,
          dimensions: '140cm x 40cm',
          materials: 'Fio Barroco 100% Algodão',
        },
        {
          name: 'Tapete Redondo de Crochê Terracota e Bege',
          slug: 'tapete-redondo-croche-terracota-bege',
          description: 'Tapete macio e encorpado confeccionado em barbante ecológico de alta gramatura. Design circular degradê em tons bege e terracota.',
          price: 179.9,
          originalPrice: 210.0,
          category: catCroche?._id,
          artisan: 'Alcione Pereira',
          stock: 2,
          images: ['/images/cat-croche.jpg'],
          featured: true,
          isBestSeller: false,
          dimensions: 'Diâmetro: 95cm',
          materials: 'Barbante Ecológico',
        },
        {
          name: 'Amigurumi Ursinho de Pelúcia em Crochê',
          slug: 'amigurumi-ursinho-pelucia-croche',
          description: 'Bichinho amigurumi fofinho tecido à mão com olhos de segurança. Ideal para decoração do quarto de bebê ou presente afetivo.',
          price: 89.9,
          category: catCroche?._id,
          artisan: 'Alcione Pereira',
          stock: 5,
          images: ['/images/hero-artesanato.jpg'],
          featured: false,
          isBestSeller: true,
          dimensions: 'Altura: 24cm',
          materials: 'Fio Amigurumi Soft',
        },

        // BORDADOS & AFINS
        {
          name: 'Bastidor Decorativo Bordado Flor de Laranjeira',
          slug: 'bastidor-decorativo-bordado-flor-laranjeira',
          description: 'Quadro bastidor de madeira redondo com bordado livre em algodão cru, retratando ramos delicados de flor de laranjeira.',
          price: 95.0,
          originalPrice: 115.0,
          category: catBordados?._id,
          artisan: 'Rosanilda Maciel',
          stock: 4,
          images: ['/images/cat-bordados.jpg', '/images/hero-artesanato.jpg'],
          featured: true,
          isBestSeller: true,
          dimensions: 'Diâmetro: 20cm',
          materials: 'Algodão Cru, Linha de Meada, Bastidor de Madeira',
        },
      ];

      // Filtra produtos que tenham categoria vinculada
      const validProducts = defaultProducts.filter((p) => Boolean(p.category));
      if (validProducts.length > 0) {
        await Product.insertMany(validProducts);
        console.log(`[Auto-Recovery] ✅ ${validProducts.length} produtos artesanais restaurados com sucesso!`);
      }
    }

    console.log('[Auto-Recovery] ✨ Sincronização e restauração de dados concluída!');
  } catch (error) {
    console.error('[Auto-Recovery] ❌ Erro durante a auto-recuperação:', error);
  }
};

module.exports = {
  runDataRecovery,
  OFFICIAL_CATEGORIES,
  OFFICIAL_ARTISANS,
};
