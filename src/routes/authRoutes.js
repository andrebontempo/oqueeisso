const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

const { loginRateLimiter } = require('../middleware/rateLimit');

router.get('/login', authController.renderLogin);
router.post('/login', loginRateLimiter({ maxAttempts: 5, windowMs: 15 * 60 * 1000 }), authController.login);
router.get('/registro', authController.renderRegister);
router.post('/registro', authController.register);
router.get('/logout', authController.logout);

// Rotas de Autenticação Google OAuth
router.get('/auth/google', authController.googleAuth);
router.get('/auth/google/callback', authController.googleCallback);

module.exports = router;
