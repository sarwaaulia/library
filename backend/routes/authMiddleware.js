const jwt = require('jsonwebtoken');
require('dotenv').config();

const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ message: 'Akses ditolak: Token tidak ditemukan' });
  }

  try {
    const verified = jwt.verify(token, process.env.JWT_SECRET || 'super_secret_library_key_12345!');
    req.user = verified;
    next();
  } catch (err) {
    res.status(403).json({ message: 'Token tidak valid atau sudah kedaluwarsa' });
  }
};

module.exports = {
  authenticateToken
};
