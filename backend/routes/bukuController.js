const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// ==================== MASTER BUKU ====================

const getBooks = async (req, res) => {
  const { search, idKategori } = req.query;
  const where = {};

  if (search) {
    where.OR = [
      { judul: { contains: search } },
      { penulis: { contains: search } },
      { isbn: { contains: search } }
    ];
  }

  if (idKategori) {
    where.kategoriId = parseInt(idKategori);
  }

  try {
    const books = await prisma.masterBuku.findMany({
      where,
      include: {
        kategori: true,
        stokBuku: true
      },
      orderBy: { judul: 'asc' }
    });
    
    const formatted = books.map(b => ({
      id: b.id,
      judul: b.judul,
      penulis: b.penulis,
      penerbit: b.penerbit,
      isbn: b.isbn,
      idKategori: b.kategoriId,
      tahunTerbit: b.tahunTerbit,
      deskripsi: b.deskripsi,
      gambarCover: b.coverImage,
      kategori: b.kategori,
      stokBuku: b.stokBuku
    }));
    
    res.json(formatted);
  } catch (err) {
    console.error(err);
    res.status(500).json({ pesan: 'Gagal mengambil data buku master' });
  }
};

const getBookById = async (req, res) => {
  try {
    const book = await prisma.masterBuku.findUnique({
      where: { id: parseInt(req.params.id) },
      include: {
        kategori: true,
        stokBuku: true
      }
    });

    if (!book) return res.status(404).json({ pesan: 'Buku tidak ditemukan' });
    
    res.json({
      id: book.id,
      judul: book.judul,
      penulis: book.penulis,
      penerbit: book.penerbit,
      isbn: book.isbn,
      idKategori: book.kategoriId,
      tahunTerbit: book.tahunTerbit,
      deskripsi: book.deskripsi,
      gambarCover: book.coverImage,
      kategori: book.kategori,
      stokBuku: book.stokBuku
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ pesan: 'Gagal mengambil detail buku' });
  }
};

const createBook = async (req, res) => {
  const { judul, penulis, penerbit, isbn, idKategori, tahunTerbit, deskripsi, gambarCover } = req.body;

  if (!judul || !penulis) {
    return res.status(400).json({ pesan: 'Judul dan penulis wajib diisi' });
  }

  try {
    if (isbn) {
      const existing = await prisma.masterBuku.findUnique({ where: { isbn } });
      if (existing) return res.status(400).json({ pesan: 'ISBN sudah terdaftar' });
    }

    const book = await prisma.masterBuku.create({
      data: {
        judul,
        penulis,
        penerbit: penerbit || null,
        isbn: isbn || null,
        kategoriId: idKategori ? parseInt(idKategori) : null,
        tahunTerbit: tahunTerbit ? parseInt(tahunTerbit) : null,
        deskripsi: deskripsi || null,
        coverImage: gambarCover || null
      }
    });

    res.status(201).json({ pesan: 'Buku berhasil ditambahkan', idBuku: book.id });
  } catch (err) {
    console.error(err);
    res.status(500).json({ pesan: 'Gagal menambahkan buku' });
  }
};

const updateBook = async (req, res) => {
  const { id } = req.params;
  const { judul, penulis, penerbit, isbn, idKategori, tahunTerbit, deskripsi, gambarCover } = req.body;

  try {
    const book = await prisma.masterBuku.findUnique({ where: { id: parseInt(id) } });
    if (!book) return res.status(404).json({ pesan: 'Buku tidak ditemukan' });

    if (isbn) {
      const existing = await prisma.masterBuku.findFirst({
        where: { isbn, NOT: { id: parseInt(id) } }
      });
      if (existing) return res.status(400).json({ pesan: 'ISBN sudah digunakan oleh buku lain' });
    }

    const updateData = {};
    if (judul) updateData.judul = judul;
    if (penulis) updateData.penulis = penulis;
    if (penerbit !== undefined) updateData.penerbit = penerbit;
    if (isbn !== undefined) updateData.isbn = isbn;
    if (idKategori !== undefined) updateData.kategoriId = idKategori ? parseInt(idKategori) : null;
    if (tahunTerbit !== undefined) updateData.tahunTerbit = tahunTerbit ? parseInt(tahunTerbit) : null;
    if (deskripsi !== undefined) updateData.deskripsi = deskripsi;
    if (gambarCover !== undefined) updateData.coverImage = gambarCover;

    await prisma.masterBuku.update({
      where: { id: parseInt(id) },
      data: updateData
    });

    res.json({ pesan: 'Buku berhasil diperbarui' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ pesan: 'Gagal memperbarui buku' });
  }
};

const deleteBook = async (req, res) => {
  const { id } = req.params;
  try {
    const activeLoans = await prisma.peminjaman.findFirst({
      where: { stokBuku: { masterBukuId: parseInt(id) }, status: 'dipinjam' }
    });
    if (activeLoans) {
      return res.status(400).json({ pesan: 'Buku tidak dapat dihapus karena masih ada stok yang sedang dipinjam' });
    }

    await prisma.stokBuku.deleteMany({ where: { masterBukuId: parseInt(id) } });
    await prisma.masterBuku.delete({ where: { id: parseInt(id) } });

    res.json({ pesan: 'Buku master beserta data stok berhasil dihapus' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ pesan: 'Gagal menghapus buku master' });
  }
};

// ==================== KATEGORI BUKU ====================

const getCategories = async (req, res) => {
  try {
    const categories = await prisma.kategoriBuku.findMany({ orderBy: { namaKategori: 'asc' } });
    res.json(categories);
  } catch (err) {
    console.error(err);
    res.status(500).json({ pesan: 'Gagal mengambil kategori' });
  }
};

const createCategory = async (req, res) => {
  const { namaKategori } = req.body;
  if (!namaKategori) return res.status(400).json({ pesan: 'Nama kategori wajib diisi' });

  try {
    const cat = await prisma.kategoriBuku.create({ data: { namaKategori } });
    res.status(201).json(cat);
  } catch (err) {
    console.error(err);
    res.status(500).json({ pesan: 'Gagal menambahkan kategori' });
  }
};

const updateCategory = async (req, res) => {
  const { id } = req.params;
  const { namaKategori } = req.body;
  
  if (!namaKategori) return res.status(400).json({ pesan: 'Nama kategori wajib diisi' });

  try {
    await prisma.kategoriBuku.update({
      where: { id: parseInt(id) },
      data: { namaKategori }
    });
    res.json({ pesan: 'Kategori berhasil diperbarui' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ pesan: 'Gagal memperbarui kategori' });
  }
};

const deleteCategory = async (req, res) => {
  const { id } = req.params;
  try {
    await prisma.kategoriBuku.delete({ where: { id: parseInt(id) } });
    res.json({ pesan: 'Kategori berhasil dihapus' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ pesan: 'Gagal menghapus kategori. Pastikan tidak ada buku yang terkait.' });
  }
};

module.exports = {
  getBooks,
  getBookById,
  createBook,
  updateBook,
  deleteBook,
  getCategories,
  createCategory,
  updateCategory,
  deleteCategory
};
