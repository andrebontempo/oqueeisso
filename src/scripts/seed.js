const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');
const fs = require('fs');

dotenv.config();

const User = require('../models/User');
const Category = require('../models/Category');
const Product = require('../models/Product');
const Order = require('../models/Order');
const Artisan = require('../models/Artisan');

// Copiar imagens geradas para public/images se existirem
const artifactDir = '/home/andre/.gemini/antigravity/brain/37619418-56eb-4d6f-aff8-654f880253da';
const targetDir = path.join(__dirname, '../../public/images');

if (!fs.existsSync(targetDir)) {
  fs.mkdirSync(targetDir, { recursive: true });
}

const copyImageIfExist = (searchPattern, targetFilename) => {
  try {
    if (fs.existsSync(artifactDir)) {
      const files = fs.readdirSync(artifactDir);
      const match = files.find(f => f.startsWith(searchPattern) && f.endsWith('.png'));
      if (match) {
        fs.copyFileSync(path.join(artifactDir, match), path.join(targetDir, targetFilename));
        console.log(`[Seed] Copiada imagem: ${targetFilename}`);
      }
    }
  } catch (e) {
    console.error(`[Seed] Erro ao copiar imagem ${targetFilename}:`, e.message);
  }
};

copyImageIfExist('hero_artesanato', 'hero-artesanato.jpg');
copyImageIfExist('cat_madeira', 'cat-madeira.jpg');
copyImageIfExist('cat_bolsas_bonecas', 'cat-bolsas-bonecas.jpg');
copyImageIfExist('cat_croche', 'cat-croche.jpg');

copyImageIfExist('artisan_fernanda', 'artisan-fernanda.jpg');
copyImageIfExist('artisan_rodrigo', 'artisan-rodrigo.jpg');
copyImageIfExist('artisan_marcia', 'artisan-marcia.jpg');
copyImageIfExist('artisan_juliana', 'artisan-juliana.jpg');

const seedDB = async () => {
  try {
    const connStr = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/oqueeisso';
    await mongoose.connect(connStr);
    console.log('[Seed] Conectado ao MongoDB para inicialização de dados.');

    // Limpar coleções existentes
    await User.deleteMany({});
    await Category.deleteMany({});
    await Product.deleteMany({});
    await Order.deleteMany({});
    await Artisan.deleteMany({});

    console.log('[Seed] Coleções antigas limpas.');

    // 0. Criar Artesãos da Família
    const artisansData = [
      {
        name: 'Fernanda',
        role: 'Esposa',
        specialty: 'Crochê & Amigurumis',
        bio: 'Dedica horas tecendo com carinho tapetes rendados, amigurumis e caminhos de mesa em fio de algodão.',
        avatar: '/images/artisan-fernanda.jpg',
        order: 1,
      },
      {
        name: 'Rodrigo',
        role: 'Irmão',
        specialty: 'Trabalhos em Madeira',
        bio: 'Mestre no entalhe de madeiras nobres, esculpindo tábuas rústicas gourmet e peças funcionais para o lar.',
        avatar: '/images/artisan-rodrigo.jpg',
        order: 2,
      },
      {
        name: 'Márcia',
        role: 'Cunhada',
        specialty: 'Bolsas & Costura Criativa',
        bio: 'Confecciona bolsas em tecido de alta durabilidade, niqueleiras com fecho vintage e acessórios elegantes.',
        avatar: '/images/artisan-marcia.jpg',
        order: 3,
      },
      {
        name: 'Juliana',
        role: 'Cunhada',
        specialty: 'Bonecas de Pano Afetivas',
        bio: 'Cria bonecas de pano artesanais cheias de charme, vestidinhos florais e detalhes únicos de vestuário.',
        avatar: '/images/artisan-juliana.jpg',
        order: 4,
      },
    ];

    await Artisan.insertMany(artisansData);
    console.log('[Seed] Artesãos da família cadastrados com sucesso!');

    // 1. Criar Usuário Admin Padrão e Usuário Cliente de Teste
    const adminUser = await User.create({
      name: 'Rodrigo (Admin O Que É Isso)',
      email: 'admin@oqueeisso.com',
      password: 'admin123', // Será hasheado automaticamente via pre('save')
      role: 'admin',
      phone: '(11) 98888-7777',
      address: {
        street: 'Rua das Flores',
        number: '123',
        neighborhood: 'Centro',
        city: 'São Paulo',
        state: 'SP',
        zipCode: '01001-000',
      },
    });

    const clientUser = await User.create({
      name: 'Maria Fernanda Silva',
      email: 'cliente@exemplo.com',
      password: 'cliente123',
      role: 'user',
      phone: '(11) 97777-6666',
      address: {
        street: 'Av. Paulista',
        number: '1000',
        complement: 'Apto 42',
        neighborhood: 'Bela Vista',
        city: 'São Paulo',
        state: 'SP',
        zipCode: '01310-100',
      },
    });

    console.log('[Seed] Usuários criados: Admin (admin@oqueeisso.com) e Cliente.');

    // 2. Criar as 3 Categorias Solicitadas
    const catMadeira = await Category.create({
      name: 'Trabalhos em Madeira',
      slug: 'trabalhos-em-madeira',
      description: 'Peças artesanais entalhadas e lixadas à mão em madeira nobre sustentável.',
      image: '/images/cat-madeira.jpg',
      icon: 'fa-tree',
    });

    const catBolsasBonecas = await Category.create({
      name: 'Bolsas e Bonecas',
      slug: 'bolsas-e-bonecas',
      description: 'Bolsas de tecido bordadas, niqueleiras e bonecas de pano afetivas confeccionadas à mão.',
      image: '/images/cat-bolsas-bonecas.jpg',
      icon: 'fa-shopping-bag',
    });

    const catCroche = await Category.create({
      name: 'Crochê',
      slug: 'croche',
      description: 'Tapetes, caminhos de mesa, amigurumis e artigos aconchegantes tecidos em fio de algodão.',
      image: '/images/cat-croche.jpg',
      icon: 'fa-certificate',
    });

    console.log('[Seed] Categorias criadas com sucesso!');

    // 3. Criar Produtos Exclusivos
    const productsData = [
      // TRABALHOS EM MADEIRA (Irmão - Rodrigo)
      {
        name: 'Tábua Rústica em Madeira Nobre Cumaru',
        slug: 'tabua-rustica-madeira-cumaru',
        description: 'Tábua gourmet para corte e servimento entalhada à mão em madeira Cumaru. Possui alça anatômica e sulco para retenção de líquidos. Tratada exclusivamente com óleo mineral atóxico e cera de abelha natural.',
        price: 149.90,
        originalPrice: 180.00,
        category: catMadeira._id,
        artisan: 'Irmão (Rodrigo)',
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
        description: 'Baú decorativo pequeno em madeira de reflorestamento com entalhes florais na tampa. Fecho em latão envelhecido e interior aveludado, perfeita para guardar joias e lembranças.',
        price: 119.00,
        originalPrice: 140.00,
        category: catMadeira._id,
        artisan: 'Irmão (Rodrigo)',
        stock: 3,
        images: ['/images/hero-artesanato.jpg'],
        featured: true,
        isBestSeller: false,
        dimensions: '22cm x 15cm x 10cm',
        materials: 'Madeira Pinus Nobre, Latão, Veludo Interno',
      },
      {
        name: 'Descanso de Panela Rústico Hexagonal (Par)',
        slug: 'descanso-de-panela-rustico-hexagonal',
        description: 'Conjunto com 2 descansos de panela em formato hexagonal confeccionados com pequenas ripas de madeira maciça de peroba rosa de reuso. Protege sua mesa com elegância rústica.',
        price: 65.00,
        category: catMadeira._id,
        artisan: 'Irmão (Rodrigo)',
        stock: 8,
        images: ['/images/cat-madeira.jpg'],
        featured: false,
        isBestSeller: true,
        dimensions: '20cm x 20cm x 2cm',
        materials: 'Peroba Rosa de Reuso',
      },

      // BOLSAS E BONECAS (Cunhadas - Márcia e Juliana)
      {
        name: 'Bolsa Tote em Tecido Botânico com Alça em Couro',
        slug: 'bolsa-tote-tecido-botanico-alca-couro',
        description: 'Bolsa espaçosa e elegante confeccionada em sarja de algodão com estampa botânica exclusiva. Alças resistentes em couro sintético e fecho interno com botão magnético.',
        price: 189.90,
        originalPrice: 220.00,
        category: catBolsasBonecas._id,
        artisan: 'Cunhada (Márcia)',
        stock: 4,
        images: ['/images/cat-bolsas-bonecas.jpg', '/images/hero-artesanato.jpg'],
        featured: true,
        isBestSeller: true,
        dimensions: '38cm x 32cm x 12cm',
        materials: 'Sarja 100% Algodão, Alças de Couro Sintético',
      },
      {
        name: 'Boneca de Pano Afetiva "Clarinha"',
        slug: 'boneca-de-pano-afetiva-clarinha',
        description: 'Encantadora boneca de pano articulada artesanal. Vestidinho floral em tricoline com detalhes em renda guipir e cabelos em lã natural trançados com laço.',
        price: 135.00,
        originalPrice: 160.00,
        category: catBolsasBonecas._id,
        artisan: 'Cunhada (Juliana)',
        stock: 6,
        images: ['/images/cat-bolsas-bonecas.jpg'],
        featured: true,
        isBestSeller: true,
        dimensions: 'Alt: 40cm, Larg: 18cm',
        materials: 'Algodão Cru, Tricoline, Enchimento Anti-alérgico',
      },
      {
        name: 'Necessaire Niqueleira Vintage com Fecho da Vovó',
        slug: 'necessaire-niqueleira-vintage-fecho-vovó',
        description: 'Porta-moedas e maquiagem artesanal com fecho da vovó metálico retrô. Forro reforçado em linho cru e tecido externo estampa vintage.',
        price: 48.00,
        category: catBolsasBonecas._id,
        artisan: 'Cunhada (Márcia)',
        stock: 10,
        images: ['/images/hero-artesanato.jpg'],
        featured: false,
        isBestSeller: false,
        dimensions: '16cm x 12cm x 6cm',
        materials: 'Linho, Algodão, Fecho Metálico Bronze',
      },

      // CROCHÊ (Esposa - Fernanda)
      {
        name: 'Caminho de Mesa em Crochê Rendado Algodão Cru',
        slug: 'caminho-de-mesa-croche-rendado-algodao',
        description: 'Trilho de mesa minunciosamente tecido à mão em ponto rendado florido. Perfeito para mesas de 6 ou 8 lugares, trazendo aconchego e sofisticação ao ambiente.',
        price: 159.00,
        originalPrice: 190.00,
        category: catCroche._id,
        artisan: 'Esposa (Fernanda)',
        stock: 3,
        images: ['/images/cat-croche.jpg', '/images/hero-artesanato.jpg'],
        featured: true,
        isBestSeller: true,
        dimensions: '140cm x 40cm',
        materials: 'Fio Barroco 100% Algodão Cru',
      },
      {
        name: 'Tapete Redondo de Crochê Terracota e Bege',
        slug: 'tapete-redondo-croche-terracota-bege',
        description: 'Tapete macio e encorpado confeccionado em barbante ecológico de alta gramatura. Design circular degradê em tons de bege e terracota.',
        price: 179.90,
        originalPrice: 210.00,
        category: catCroche._id,
        artisan: 'Esposa (Fernanda)',
        stock: 2,
        images: ['/images/cat-croche.jpg'],
        featured: true,
        isBestSeller: false,
        dimensions: 'Diâmetro: 95cm',
        materials: 'Barbante Ecológico nº 8',
      },
      {
        name: 'Amigurumi Ursinho de Pelúcia em Crochê',
        slug: 'amigurumi-ursinho-pelucia-croche',
        description: 'Bichinho amigurumi fofinho tecido à mão com olhos de segurança. Ideal para decoração do quarto de bebê ou presente afetivo.',
        price: 89.90,
        category: catCroche._id,
        artisan: 'Esposa (Fernanda)',
        stock: 5,
        images: ['/images/hero-artesanato.jpg'],
        featured: false,
        isBestSeller: true,
        dimensions: 'Altura: 24cm',
        materials: 'Fio Amigurumi Soft, Enchimento Anti-alérgico',
      },
    ];

    await Product.insertMany(productsData);
    console.log(`[Seed] Inseridos ${productsData.length} produtos de exemplo com sucesso!`);

    // 4. Criar Pedido de Teste para o Admin visualizar no Dashboard
    await Order.create({
      orderNumber: 'OQI-849201',
      user: clientUser._id,
      customerName: clientUser.name,
      customerEmail: clientUser.email,
      customerPhone: clientUser.phone,
      items: [
        {
          product: (await Product.findOne({ slug: 'tabua-rustica-madeira-cumaru' }))._id,
          name: 'Tábua Rústica em Madeira Nobre Cumaru',
          price: 149.90,
          quantity: 1,
          image: '/images/cat-madeira.jpg',
          artisan: 'Irmão (Rodrigo)',
        },
      ],
      subtotal: 149.90,
      shippingFee: 25.00,
      totalAmount: 174.90,
      shippingAddress: clientUser.address,
      paymentMethod: 'pix',
      paymentStatus: 'Aprovado',
      orderStatus: 'Em Produção',
      pixCode: '00020126580014BR.GOV.BCB.PIX0136oqueeisso-artesanato-pix-OQI-849201',
    });

    console.log('[Seed] Pedido inicial de demonstração criado com sucesso!');
    console.log('====================================================');
    console.log('✨ SEED CONCLUÍDO COM SUCESSO!');
    console.log('👤 Login Admin: admin@oqueeisso.com / admin123');
    console.log('👤 Login Cliente: cliente@exemplo.com / cliente123');
    console.log('====================================================');

    process.exit(0);
  } catch (err) {
    console.error('[Seed] Erro durante o povoamento do banco:', err);
    process.exit(1);
  }
};

seedDB();
