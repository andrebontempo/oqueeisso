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

// Pedidos
router.get('/pedidos', adminController.getOrders);
router.post('/pedidos/status/:id', adminController.updateOrderStatus);

module.exports = router;
