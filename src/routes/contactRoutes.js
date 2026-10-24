const express = require('express');
const router = express.Router();
const contactController = require('../controllers/contactController');
const { contactRateLimiter } = require('../middleware/rateLimit');

router.get('/contato', contactController.renderContact);
router.post('/contato', contactRateLimiter({ maxAttempts: 3, windowMs: 10 * 60 * 1000 }), contactController.sendContactMessage);

module.exports = router;
