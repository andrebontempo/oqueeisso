const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { protect, adminOnly } = require('../middleware/auth');
const upload = require('../middleware/upload');

// Todas as rotas de admin exigem estar logado como admin
router.use(protect, adminOnly);

// Dashboard em Abas
router.get('/dashboard', adminController.getDashboard);
router.get('/documentacao', (req, res) => res.redirect('/admin/dashboard?tab=docs'));

// Produtos
router.get('/produtos', adminController.getProducts);
router.get('/produtos/novo', adminController.renderCreateProduct);
router.post('/produtos/novo', upload.array('images', 5), adminController.createProduct);
router.get('/produtos/editar/:id', adminController.renderEditProduct);
router.post('/produtos/editar/:id', upload.array('images', 5), adminController.updateProduct);
router.post('/produtos/excluir/:id', adminController.deleteProduct);

// Artesãos (Gestão da Família)
router.get('/artesaos', adminController.getArtisans);
router.get('/artesaos/novo', adminController.renderCreateArtisan);
router.post('/artesaos/novo', upload.single('avatar'), adminController.createArtisan);
router.get('/artesaos/editar/:id', adminController.renderEditArtisan);
router.post('/artesaos/editar/:id', upload.single('avatar'), adminController.updateArtisan);
router.post('/artesaos/excluir/:id', adminController.deleteArtisan);

// Usuários & Clientes
router.get('/usuarios', adminController.getUsers);
router.get('/usuarios/novo', adminController.renderCreateUser);
router.post('/usuarios/novo', adminController.createUser);
router.get('/usuarios/editar/:id', adminController.renderEditUser);
router.post('/usuarios/editar/:id', adminController.updateUser);
router.post('/usuarios/excluir/:id', adminController.deleteUser);

// Categorias
router.get('/categorias', adminController.getCategories);
router.get('/categorias/novo', adminController.renderCreateCategory);
router.post('/categorias/novo', upload.single('image'), adminController.createCategory);
router.get('/categorias/editar/:id', adminController.renderEditCategory);
router.post('/categorias/editar/:id', upload.single('image'), adminController.updateCategory);
router.post('/categorias/excluir/:id', adminController.deleteCategory);

// Pedidos
router.get('/pedidos', adminController.getOrders);
router.post('/pedidos/status/:id', adminController.updateOrderStatus);

// Configurações de Frete & Loja
router.post('/configuracoes', adminController.updateSettings);

module.exports = router;
