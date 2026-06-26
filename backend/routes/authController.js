const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
require('dotenv').config();

const prisma = new PrismaClient();

const register = async (req, res) => {
  const { nama, email, password, noHp, alamat, tipeUser } = req.body;

  if (!nama || !email || !password || !tipeUser) {
    return res.status(400).json({ pesan: 'Nama, email, password, dan tipeUser wajib diisi' });
  }

  if (tipeUser !== 'tetap' && tipeUser !== 'guest') {
    return res.status(400).json({ pesan: 'tipeUser harus bernilai "tetap" atau "guest"' });
  }

  try {
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return res.status(400).json({ pesan: 'Email sudah terdaftar' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        nama,
        email,
        password: hashedPassword,
        noHp: noHp || null,
        alamat: alamat || null,
        tipeUser
      }
    });

    res.status(201).json({
      pesan: 'Registrasi berhasil',
      idUser: user.id
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ pesan: 'Terjadi kesalahan server saat registrasi' });
  }
};

const login = async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ pesan: 'Email dan password wajib diisi' });
  }

  try {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return res.status(400).json({ pesan: 'Email atau password salah' });
    }

    if (user.status !== 'aktif') {
      return res.status(400).json({ pesan: 'Akun Anda dinonaktifkan' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ pesan: 'Email atau password salah' });
    }

    const token = jwt.sign(
      {
        id: user.id,
        nama: user.nama,
        email: user.email,
        tipeUser: user.tipeUser
      },
      process.env.JWT_SECRET || 'super_secret_library_key_12345!',
      { expiresIn: '24h' }
    );

    res.json({
      pesan: 'Login berhasil',
      token,
      pengguna: {
        id: user.id,
        nama: user.nama,
        email: user.email,
        tipeUser: user.tipeUser,
        noHp: user.noHp,
        alamat: user.alamat
      }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ pesan: 'Terjadi kesalahan server saat login' });
  }
};

module.exports = {
  register,
  login
};
