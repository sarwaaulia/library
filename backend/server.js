require('dotenv').config();
const express = require('express');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

// Routes
app.use('/auth', require('./routes/auth'));
app.use('/users', require('./routes/users'));
app.use('/master-buku', require('./routes/masterBuku'));
app.use('/stok-buku', require('./routes/stokBuku'));
app.use('/peminjaman', require('./routes/peminjaman'));
app.use('/denda', require('./routes/denda'));

const PORT = process.env.PORT || 5000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server jalan di http://0.0.0.0:${PORT}`);
});