const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { protect, adminOnly } = require('../middleware/auth');
const upload = require('../middleware/upload');

// Todas as rotas de admin exigem estar logado como admin
router.use(protect, adminOnly);

router.get('/dashboard', adminController.getDashboard);

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

// Pedidos
router.get('/pedidos', adminController.getOrders);
router.post('/pedidos/status/:id', adminController.updateOrderStatus);

module.exports = router;
