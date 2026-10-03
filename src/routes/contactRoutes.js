const express = require('express');
const router = express.Router();
const contactController = require('../controllers/contactController');

router.get('/contato', contactController.renderContact);
router.post('/contato', contactController.sendContactMessage);

module.exports = router;
