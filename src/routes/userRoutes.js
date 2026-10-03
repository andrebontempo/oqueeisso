const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { protect } = require('../middleware/auth');

router.get('/minha-conta', protect, userController.getAccount);
router.post('/minha-conta/perfil', protect, userController.updateProfile);
router.get('/minha-conta/pedido/:id', protect, userController.getOrderDetail);

module.exports = router;
