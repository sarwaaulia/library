const express = require('express');
const router = express.Router();
const authController = require('./authController');

router.post('/daftar', authController.register);
router.post('/masuk', authController.login);

module.exports = router;
