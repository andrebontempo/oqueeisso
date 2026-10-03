const express = require('express');
const router = express.Router();
const productController = require('../controllers/productController');

router.get('/', productController.getHome);
router.get('/categoria/:slug', productController.getCategory);
router.get('/produto/:id', productController.getProductDetails);
router.get('/busca', productController.searchProducts);

module.exports = router;
