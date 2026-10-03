const express = require('express');
const router = express.Router();
const cartController = require('../controllers/cartController');

router.get('/carrinho', cartController.getCart);
router.post('/carrinho/adicionar', cartController.addToCart);
router.post('/carrinho/atualizar', cartController.updateCart);
router.get('/carrinho/remover/:productId', cartController.removeFromCart);

module.exports = router;
