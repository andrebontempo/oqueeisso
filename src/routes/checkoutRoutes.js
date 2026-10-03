const express = require('express');
const router = express.Router();
const checkoutController = require('../controllers/checkoutController');

router.get('/checkout', checkoutController.getCheckout);
router.post('/checkout', checkoutController.processOrder);
router.get('/pedido/confirmacao/:id', checkoutController.getOrderConfirmation);

// Rotas de Pagamento & Webhook Mercado Pago
router.post('/api/payments/webhook', checkoutController.handleWebhook);
router.get('/api/pedidos/:id/status', checkoutController.getOrderStatus);

module.exports = router;
