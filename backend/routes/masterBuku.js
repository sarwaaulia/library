const express = require('express');
const router = express.Router();
const bukuController = require('./bukuController');
const { authenticateToken } = require('./authMiddleware');

router.get('/', authenticateToken, bukuController.getBooks);
router.get('/:id', authenticateToken, bukuController.getBookById);
router.post('/', authenticateToken, bukuController.createBook);
router.put('/:id', authenticateToken, bukuController.updateBook);
router.delete('/:id', authenticateToken, bukuController.deleteBook);

router.get('/categories/all', authenticateToken, bukuController.getCategories);
router.post('/categories', authenticateToken, bukuController.createCategory);
router.put('/categories/:id', authenticateToken, bukuController.updateCategory);
router.delete('/categories/:id', authenticateToken, bukuController.deleteCategory);

module.exports = router;
