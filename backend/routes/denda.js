const express = require('express');
const router = express.Router();
const dendaController = require('./dendaController');
const { authenticateToken } = require('./authMiddleware');

router.get('/', authenticateToken, dendaController.getFines);
router.post('/', authenticateToken, dendaController.createFine);
router.post('/bayar', authenticateToken, dendaController.payFine);

module.exports = router;
