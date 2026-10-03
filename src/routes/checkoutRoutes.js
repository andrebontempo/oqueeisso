const express = require('express');
const router = express.Router();
const checkoutController = require('../controllers/checkoutController');

router.get('/checkout', checkoutController.getCheckout);
router.post('/checkout', checkoutController.processOrder);
router.get('/pedido/confirmacao/:id', checkoutController.getOrderConfirmation);

module.exports = router;
