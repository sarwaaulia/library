const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const getFines = async (req, res) => {
  const { statusBayar } = req.query;
  const where = {};

  if (statusBayar) {
    where.statusBayar = statusBayar;
  }

  try {
    const fines = await prisma.denda.findMany({
      where,
      include: {
        peminjaman: {
          include: {
            user: true,
            stokBuku: {
              include: { masterBuku: true }
            }
          }
        }
      },
      orderBy: { id: 'desc' }
    });
    
    const formatted = fines.map(f => ({
      id: f.id,
      idPeminjaman: f.peminjamanId,
      hariTerlambat: f.jumlahHariTelat,
      tarifPerHari: parseFloat(f.tarifPerHari),
      totalDenda: parseFloat(f.totalDenda),
      statusBayar: f.statusBayar,
      tanggalBayar: f.tanggalBayar,
      peminjaman: f.peminjaman
    }));
    
    res.json(formatted);
  } catch (err) {
    console.error(err);
    res.status(500).json({ pesan: 'Gagal mengambil data denda' });
  }
};

const payFine = async (req, res) => {
  const { idDenda } = req.body;

  if (!idDenda) {
    return res.status(400).json({ pesan: 'idDenda wajib diisi' });
  }

  try {
    const fine = await prisma.denda.findUnique({ where: { id: parseInt(idDenda) } });
    if (!fine) return res.status(404).json({ pesan: 'Data denda tidak ditemukan' });
    if (fine.statusBayar === 'lunas') return res.status(400).json({ pesan: 'Denda sudah lunas dibayar' });

    await prisma.denda.update({
      where: { id: fine.id },
      data: {
        statusBayar: 'lunas',
        tanggalBayar: new Date()
      }
    });

    res.json({ pesan: 'Denda berhasil dibayar dan dilunasi' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ pesan: 'Gagal memproses pembayaran denda' });
  }
};

const createFine = async (req, res) => {
  const { idPeminjaman, totalDenda, hariTerlambat } = req.body;

  if (!idPeminjaman || totalDenda === undefined || totalDenda === null) {
    return res.status(400).json({ pesan: 'idPeminjaman dan totalDenda wajib diisi' });
  }

  try {
    const existing = await prisma.denda.findUnique({ where: { peminjamanId: parseInt(idPeminjaman) } });
    if (existing) {
      await prisma.denda.update({
        where: { peminjamanId: parseInt(idPeminjaman) },
        data: {
          totalDenda: parseFloat(totalDenda),
          jumlahHariTelat: parseInt(hariTerlambat) || 0
        }
      });
      return res.json({ pesan: 'Denda berhasil diperbarui' });
    }

    const fine = await prisma.denda.create({
      data: {
        peminjamanId: parseInt(idPeminjaman),
        jumlahHariTelat: parseInt(hariTerlambat) || 0,
        tarifPerHari: 2000,
        totalDenda: parseFloat(totalDenda),
        statusBayar: 'belum'
      }
    });

    res.status(201).json({ pesan: 'Denda berhasil dicatat', idDenda: fine.id });
  } catch (err) {
    console.error(err);
    res.status(500).json({ pesan: 'Gagal mencatat denda' });
  }
};

module.exports = {
  getFines,
  payFine,
  createFine
};
