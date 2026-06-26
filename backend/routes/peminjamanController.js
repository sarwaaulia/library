const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const getLoans = async (req, res) => {
  const { status, idUser, search } = req.query;
  const where = {};

  if (status) {
    if (status === 'overdue') {
      where.status = 'dipinjam';
      where.tanggalJatuhTempo = { lt: new Date() };
    } else {
      where.status = status;
    }
  }

  if (idUser) {
    where.userId = parseInt(idUser);
  }

  if (search) {
    where.OR = [
      { user: { nama: { contains: search } } },
      { stokBuku: { masterBuku: { judul: { contains: search } } } }
    ];
  }

  try {
    const loans = await prisma.peminjaman.findMany({
      where,
      include: {
        user: true,
        stokBuku: {
          include: { masterBuku: true }
        },
        denda: true
      },
      orderBy: { id: 'desc' }
    });

    const formatted = loans.map(loan => {
      let estimatedFine = 0;
      let lateDays = 0;

      if (loan.status === 'dipinjam') {
        const today = new Date();
        today.setHours(0,0,0,0);
        const dueDate = new Date(loan.tanggalJatuhTempo);
        dueDate.setHours(0,0,0,0);

        if (today > dueDate) {
          const diff = Math.abs(today - dueDate);
          lateDays = Math.ceil(diff / (1000 * 60 * 60 * 24));
          estimatedFine = lateDays * 2000;
        }
      }

      return {
        id: loan.id,
        idUser: loan.userId,
        idStokBuku: loan.stokBukuId,
        tanggalPinjam: loan.tanggalPinjam,
        tanggalJatuhTempo: loan.tanggalJatuhTempo,
        tanggalKembali: loan.tanggalKembali,
        status: loan.status,
        user: loan.user,
        stokBuku: loan.stokBuku,
        denda: loan.denda,
        hariTerlambat: loan.denda ? loan.denda.jumlahHariTelat : lateDays,
        jumlahDenda: loan.denda ? parseFloat(loan.denda.totalDenda) : estimatedFine
      };
    });

    res.json(formatted);
  } catch (err) {
    console.error(err);
    res.status(500).json({ pesan: 'Gagal mengambil data peminjaman' });
  }
};

const getLoanById = async (req, res) => {
  try {
    const loan = await prisma.peminjaman.findUnique({
      where: { id: parseInt(req.params.id) },
      include: {
        user: true,
        stokBuku: {
          include: { masterBuku: true }
        },
        denda: true
      }
    });

    if (!loan) return res.status(404).json({ pesan: 'Peminjaman tidak ditemukan' });

    let estimatedFine = 0;
    let lateDays = 0;

    if (loan.status === 'dipinjam') {
      const today = new Date();
      today.setHours(0,0,0,0);
      const dueDate = new Date(loan.tanggalJatuhTempo);
      dueDate.setHours(0,0,0,0);

      if (today > dueDate) {
        const diff = Math.abs(today - dueDate);
        lateDays = Math.ceil(diff / (1000 * 60 * 60 * 24));
        estimatedFine = lateDays * 2000;
      }
    }

    res.json({
      id: loan.id,
      idUser: loan.userId,
      idStokBuku: loan.stokBukuId,
      tanggalPinjam: loan.tanggalPinjam,
      tanggalJatuhTempo: loan.tanggalJatuhTempo,
      tanggalKembali: loan.tanggalKembali,
      status: loan.status,
      user: loan.user,
      stokBuku: loan.stokBuku,
      denda: loan.denda,
      hariTerlambat: loan.denda ? loan.denda.jumlahHariTelat : lateDays,
      jumlahDenda: loan.denda ? parseFloat(loan.denda.totalDenda) : estimatedFine
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ pesan: 'Gagal mengambil detail peminjaman' });
  }
};

const borrowBook = async (req, res) => {
  const { idUser, idMasterBuku, idStokBuku, tanggalPinjam, tanggalJatuhTempo, jenisJaminan, detailJaminan } = req.body;

  if (!idUser || (!idMasterBuku && !idStokBuku)) {
    return res.status(400).json({ pesan: 'idUser dan (idMasterBuku atau idStokBuku) wajib ditentukan' });
  }

  try {
    // 1. Cek User
    const user = await prisma.user.findUnique({ where: { id: parseInt(idUser) } });
    if (!user) return res.status(404).json({ pesan: 'User tidak ditemukan' });

    // 2. Cek apakah user punya peminjaman aktif yang sudah telat
    const overdue = await prisma.peminjaman.findFirst({
      where: {
        userId: parseInt(idUser),
        status: 'dipinjam',
        tanggalJatuhTempo: { lt: new Date() }
      }
    });
    if (overdue) {
      return res.status(400).json({ pesan: 'Peminjaman ditolak: User memiliki peminjaman buku yang terlambat dikembalikan' });
    }

    // 3. Tentukan StokBuku yang akan dipinjam
    let targetStockId = null;
    if (idStokBuku) {
      const stock = await prisma.stokBuku.findUnique({ where: { id: parseInt(idStokBuku) } });
      if (!stock) return res.status(404).json({ pesan: 'Stok buku tidak ditemukan' });
      if (stock.status !== 'tersedia') return res.status(400).json({ pesan: 'Stok buku sedang tidak tersedia / dipinjam' });
      targetStockId = stock.id;
    } else {
      const availableStock = await prisma.stokBuku.findFirst({
        where: {
          masterBukuId: parseInt(idMasterBuku),
          status: 'tersedia'
        }
      });
      if (!availableStock) return res.status(400).json({ pesan: 'Buku ini sedang kosong (semua copy sedang dipinjam/rusak)' });
      targetStockId = availableStock.id;
    }

    // 4. Validasi Jaminan untuk Guest
    let guaranteeRecord = null;
    if (user.tipeUser === 'guest') {
      if (!jenisJaminan || jenisJaminan === 'none') {
        return res.status(400).json({ pesan: 'Peminjaman ditolak: Anggota Guest WAJIB menyertakan jaminan (ktp atau uang)' });
      }
      if (!detailJaminan || detailJaminan.trim() === '') {
        return res.status(400).json({ pesan: 'Peminjaman ditolak: Detail jaminan wajib diisi' });
      }

      guaranteeRecord = {
        jenisJaminan: jenisJaminan,
        noKtp: jenisJaminan === 'ktp' ? detailJaminan : null,
        nominalUang: jenisJaminan === 'uang' ? parseFloat(detailJaminan) : null,
        status: 'ditahan'
      };
    }

    // 5. Hitung tanggal pinjam & jatuh tempo
    const pinjamDate = tanggalPinjam ? new Date(tanggalPinjam) : new Date();
    let tempoDate;
    if (tanggalJatuhTempo) {
      tempoDate = new Date(tanggalJatuhTempo);
    } else {
      tempoDate = new Date(pinjamDate);
      tempoDate.setDate(tempoDate.getDate() + 7); // Default 7 hari
    }

    // 6. Jalankan Transaksi Database
    const result = await prisma.$transaction(async (tx) => {
      const loan = await tx.peminjaman.create({
        data: {
          userId: user.id,
          stokBukuId: targetStockId,
          tanggalPinjam: pinjamDate,
          tanggalJatuhTempo: tempoDate,
          status: 'dipinjam'
        }
      });

      await tx.stokBuku.update({
        where: { id: targetStockId },
        data: { status: 'dipinjam' }
      });

      if (guaranteeRecord) {
        await tx.jaminan.create({
          data: {
            userId: user.id,
            ...guaranteeRecord
          }
        });
      }

      return loan;
    });

    res.status(201).json({
      pesan: 'Peminjaman buku berhasil dicatat',
      idPeminjaman: result.id,
      tanggalJatuhTempo: tempoDate.toISOString().slice(0, 10)
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ pesan: 'Terjadi kesalahan internal saat memproses peminjaman' });
  }
};

const returnBook = async (req, res) => {
  const { idPeminjaman, tanggalKembali } = req.body;

  if (!idPeminjaman) {
    return res.status(400).json({ pesan: 'idPeminjaman wajib diisi' });
  }

  try {
    const loan = await prisma.peminjaman.findUnique({
      where: { id: parseInt(idPeminjaman) },
      include: { user: true }
    });

    if (!loan) return res.status(404).json({ pesan: 'Data peminjaman tidak ditemukan' });
    if (loan.status === 'dikembalikan') return res.status(400).json({ pesan: 'Buku sudah dikembalikan sebelumnya' });

    const retDate = tanggalKembali ? new Date(tanggalKembali) : new Date();
    retDate.setHours(0,0,0,0);
    const dueDate = new Date(loan.tanggalJatuhTempo);
    dueDate.setHours(0,0,0,0);

    let lateDays = 0;
    let fineAmount = 0;

    if (retDate > dueDate) {
      const diff = Math.abs(retDate - dueDate);
      lateDays = Math.ceil(diff / (1000 * 60 * 60 * 24));
      fineAmount = lateDays * 2000;
    }

    await prisma.$transaction(async (tx) => {
      await tx.peminjaman.update({
        where: { id: loan.id },
        data: {
          tanggalKembali: retDate,
          status: 'dikembalikan'
        }
      });

      await tx.stokBuku.update({
        where: { id: loan.stokBukuId },
        data: { status: 'tersedia' }
      });

      if (fineAmount > 0) {
        await tx.denda.create({
          data: {
            peminjamanId: loan.id,
            jumlahHariTelat: lateDays,
            tarifPerHari: 2000,
            totalDenda: fineAmount,
            statusBayar: 'belum'
          }
        });
      }

      if (loan.user.tipeUser === 'guest') {
        const activeJaminan = await tx.jaminan.findFirst({
          where: {
            userId: loan.userId,
            status: 'ditahan'
          }
        });

        if (activeJaminan) {
          await tx.jaminan.update({
            where: { id: activeJaminan.id },
            data: {
              status: 'dikembalikan',
              tanggalKembali: retDate
            }
          });
        }
      }
    });

    res.json({
      pesan: 'Buku berhasil dikembalikan',
      hariTerlambat: lateDays,
      jumlahDenda: fineAmount,
      jaminanDikembalikan: loan.user.tipeUser === 'guest'
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ pesan: 'Terjadi kesalahan saat memproses pengembalian' });
  }
};

module.exports = {
  getLoans,
  getLoanById,
  borrowBook,
  returnBook
};
