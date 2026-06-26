const express = require('express');
const router = express.Router();
const peminjamanController = require('./peminjamanController');
const { authenticateToken } = require('./authMiddleware');

router.get('/', authenticateToken, peminjamanController.getLoans);
router.get('/:id', authenticateToken, peminjamanController.getLoanById);
router.post('/pinjam', authenticateToken, peminjamanController.borrowBook);
router.post('/kembali', authenticateToken, peminjamanController.returnBook);

module.exports = router;
