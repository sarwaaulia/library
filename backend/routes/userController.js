const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

const getUsers = async (req, res) => {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        nama: true,
        email: true,
        noHp: true,
        alamat: true,
        tipeUser: true,
        status: true,
        createdAt: true
      },
      orderBy: { nama: 'asc' }
    });
    res.json(users);
  } catch (err) {
    console.error(err);
    res.status(500).json({ pesan: 'Gagal mengambil data user' });
  }
};

const getUserById = async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: parseInt(req.params.id) },
      select: {
        id: true,
        nama: true,
        email: true,
        noHp: true,
        alamat: true,
        tipeUser: true,
        status: true,
        createdAt: true
      }
    });

    if (!user) return res.status(404).json({ pesan: 'User tidak ditemukan' });
    res.json(user);
  } catch (err) {
    console.error(err);
    res.status(500).json({ pesan: 'Gagal mengambil detail user' });
  }
};

const createUser = async (req, res) => {
  const { nama, email, password, noHp, alamat, tipeUser } = req.body;

  if (!nama || !email || !password || !tipeUser) {
    return res.status(400).json({ pesan: 'Nama, email, password, dan tipeUser wajib diisi' });
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

    res.status(201).json({ pesan: 'User berhasil dibuat', idUser: user.id });
  } catch (err) {
    console.error(err);
    res.status(500).json({ pesan: 'Gagal membuat user' });
  }
};

const updateUser = async (req, res) => {
  const { nama, email, password, noHp, alamat, tipeUser, status } = req.body;
  const id = parseInt(req.params.id);

  try {
    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) return res.status(404).json({ pesan: 'User tidak ditemukan' });

    if (email) {
      const existing = await prisma.user.findFirst({
        where: { email, NOT: { id } }
      });
      if (existing) return res.status(400).json({ pesan: 'Email sudah digunakan' });
    }

    const updateData = {};
    if (nama) updateData.nama = nama;
    if (email) updateData.email = email;
    if (noHp !== undefined) updateData.noHp = noHp;
    if (alamat !== undefined) updateData.alamat = alamat;
    if (tipeUser) updateData.tipeUser = tipeUser;
    if (status) updateData.status = status;
    
    if (password && password.trim() !== '') {
      updateData.password = await bcrypt.hash(password, 10);
    }

    await prisma.user.update({
      where: { id },
      data: updateData
    });

    res.json({ pesan: 'User berhasil diperbarui' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ pesan: 'Gagal memperbarui user' });
  }
};

const deleteUser = async (req, res) => {
  const id = parseInt(req.params.id);
  try {
    const activeLoans = await prisma.peminjaman.findFirst({
      where: { userId: id, status: 'dipinjam' }
    });
    if (activeLoans) {
      return res.status(400).json({ pesan: 'User tidak bisa dihapus karena masih meminjam buku' });
    }

    await prisma.user.delete({ where: { id } });
    res.json({ pesan: 'User berhasil dihapus' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ pesan: 'Gagal menghapus user' });
  }
};

module.exports = {
  getUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser
};
