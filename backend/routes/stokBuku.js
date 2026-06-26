const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const { authenticateToken } = require('./authMiddleware');

const prisma = new PrismaClient();

// Get all stock items
router.get('/', authenticateToken, async (req, res) => {
  const { idMasterBuku, status } = req.query;
  const where = {};
  
  if (idMasterBuku) where.masterBukuId = parseInt(idMasterBuku);
  if (status) where.status = status;

  try {
    const stock = await prisma.stokBuku.findMany({
      where,
      include: { masterBuku: true },
      orderBy: { kodeInventaris: 'asc' }
    });
    
    const formatted = stock.map(s => ({
      id: s.id,
      idMasterBuku: s.masterBukuId,
      kodeInventaris: s.kodeInventaris,
      kondisi: s.kondisi,
      status: s.status,
      masterBuku: s.masterBuku
    }));
    
    res.json(formatted);
  } catch (err) {
    console.error(err);
    res.status(500).json({ pesan: 'Gagal mengambil data stok buku' });
  }
});

// Get stock item by ID
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const item = await prisma.stokBuku.findUnique({
      where: { id: parseInt(req.params.id) },
      include: { masterBuku: true }
    });
    if (!item) return res.status(404).json({ pesan: 'Stok buku tidak ditemukan' });
    
    res.json({
      id: item.id,
      idMasterBuku: item.masterBukuId,
      kodeInventaris: item.kodeInventaris,
      kondisi: item.kondisi,
      status: item.status,
      masterBuku: item.masterBuku
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ pesan: 'Gagal mengambil detail stok buku' });
  }
});

// Create new stock item copy
router.post('/', authenticateToken, async (req, res) => {
  const { idMasterBuku, kodeInventaris, kondisi, status } = req.body;

  if (!idMasterBuku || !kodeInventaris) {
    return res.status(400).json({ pesan: 'idMasterBuku dan kodeInventaris wajib diisi' });
  }

  try {
    const existing = await prisma.stokBuku.findUnique({ where: { kodeInventaris } });
    if (existing) return res.status(400).json({ pesan: 'Kode inventaris sudah digunakan' });

    const item = await prisma.stokBuku.create({
      data: {
        masterBukuId: parseInt(idMasterBuku),
        kodeInventaris,
        kondisi: kondisi || null,
        status: status || 'tersedia'
      }
    });

    res.status(201).json({ pesan: 'Stok buku berhasil ditambahkan', idStokBuku: item.id });
  } catch (err) {
    console.error(err);
    res.status(500).json({ pesan: 'Gagal menambahkan stok buku' });
  }
});

// Update stock item
router.put('/:id', authenticateToken, async (req, res) => {
  const id = parseInt(req.params.id);
  const { kodeInventaris, kondisi, status } = req.body;

  try {
    const item = await prisma.stokBuku.findUnique({ where: { id } });
    if (!item) return res.status(404).json({ pesan: 'Stok buku tidak ditemukan' });

    if (kodeInventaris) {
      const existing = await prisma.stokBuku.findFirst({
        where: { kodeInventaris, NOT: { id } }
      });
      if (existing) return res.status(400).json({ pesan: 'Kode inventaris sudah digunakan' });
    }

    const updateData = {};
    if (kodeInventaris) updateData.kodeInventaris = kodeInventaris;
    if (kondisi !== undefined) updateData.kondisi = kondisi;
    if (status) updateData.status = status;

    await prisma.stokBuku.update({
      where: { id },
      data: updateData
    });

    res.json({ pesan: 'Stok buku berhasil diperbarui' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ pesan: 'Gagal memperbarui stok buku' });
  }
});

// Delete stock item
router.delete('/:id', authenticateToken, async (req, res) => {
  const id = parseInt(req.params.id);
  try {
    const item = await prisma.stokBuku.findUnique({ where: { id } });
    if (!item) return res.status(404).json({ pesan: 'Stok buku tidak ditemukan' });

    if (item.status === 'dipinjam') {
      return res.status(400).json({ pesan: 'Stok buku tidak dapat dihapus karena sedang dipinjam' });
    }

    await prisma.stokBuku.delete({ where: { id } });
    res.json({ pesan: 'Stok buku berhasil dihapus' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ pesan: 'Gagal menghapus stok buku. Pastikan tidak ada data peminjaman terkait.' });
  }
});

module.exports = router;
