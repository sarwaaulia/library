const express = require('express');
const router = express.Router();
const userController = require('./userController');
const { authenticateToken } = require('./authMiddleware');

router.get('/', authenticateToken, userController.getUsers);
router.get('/:id', authenticateToken, userController.getUserById);
router.post('/', authenticateToken, userController.createUser);
router.put('/:id', authenticateToken, userController.updateUser);
router.delete('/:id', authenticateToken, userController.deleteUser);

module.exports = router;
