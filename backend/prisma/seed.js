const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  // Clear existing data
  await prisma.denda.deleteMany({});
  await prisma.peminjaman.deleteMany({});
  await prisma.stokBuku.deleteMany({});
  await prisma.masterBuku.deleteMany({});
  await prisma.kategoriBuku.deleteMany({});
  await prisma.jaminan.deleteMany({});
  await prisma.user.deleteMany({});

  console.log('Database cleared.');

  // Create Users
  const hashedPasswordAdmin = await bcrypt.hash('admin123', 10);
  const hashedPasswordUser = await bcrypt.hash('user123', 10);
  
  const admin = await prisma.user.create({
    data: {
      nama: 'Petugas Perpustakaan (Admin)',
      email: 'admin@library.com',
      password: hashedPasswordAdmin,
      noHp: '081111111111',
      alamat: 'Kantor Perpustakaan',
      tipeUser: 'tetap',
      status: 'aktif'
    }
  });
  
  const budi = await prisma.user.create({
    data: {
      nama: 'Budi Santoso',
      email: 'budi@example.com',
      password: hashedPasswordUser,
      noHp: '081234567890',
      alamat: 'Jl. Merdeka No. 10, Jakarta',
      tipeUser: 'tetap',
      status: 'aktif'
    }
  });

  console.log('Users seeded.');

  // Create Categories
  const fiksi = await prisma.kategoriBuku.create({
    data: { namaKategori: 'Novel & Fiksi' }
  });
  
  const sains = await prisma.kategoriBuku.create({
    data: { namaKategori: 'Sains & Teknologi' }
  });

  const sejarah = await prisma.kategoriBuku.create({
    data: { namaKategori: 'Sejarah & Budaya' }
  });

  console.log('Categories seeded.');

  // Create Master Books
  const laskar = await prisma.masterBuku.create({
    data: {
      judul: 'Laskar Pelangi',
      penulis: 'Andrea Hirata',
      penerbit: 'Bentang Pustaka',
      isbn: '9789793062791',
      kategoriId: fiksi.id,
      tahunTerbit: 2005,
      deskripsi: 'Novel terkenal tentang perjuangan anak-anak Belitong.',
      coverImage: 'https://images-na.ssl-images-amazon.com/images/S/compressed.photo.goodreads.com/books/1489498263i/1373574.jpg'
    }
  });

  const bumi = await prisma.masterBuku.create({
    data: {
      judul: 'Bumi Manusia',
      penulis: 'Pramoedya Ananta Toer',
      penerbit: 'Hasta Mitra',
      isbn: '9789799731234',
      kategoriId: fiksi.id,
      tahunTerbit: 1980,
      deskripsi: 'Novel sejarah mahakarya Pramoedya.'
    }
  });

  const coding = await prisma.masterBuku.create({
    data: {
      judul: 'Pengantar Coding Node.js',
      penulis: 'Budi Raharjo',
      penerbit: 'Informatika',
      isbn: '9786028759243',
      kategoriId: sains.id,
      tahunTerbit: 2020,
      deskripsi: 'Buku panduan praktis pemrograman Node.js.'
    }
  });

  console.log('Master books seeded.');

  // Create Stock records (StokBuku) and save references
  const copy1 = await prisma.stokBuku.create({
    data: { masterBukuId: laskar.id, kodeInventaris: 'INV-LP-001', status: 'dipinjam' }
  });
  const copy2 = await prisma.stokBuku.create({
    data: { masterBukuId: laskar.id, kodeInventaris: 'INV-LP-002', status: 'tersedia' }
  });
  const copy3 = await prisma.stokBuku.create({
    data: { masterBukuId: bumi.id, kodeInventaris: 'INV-BM-001', status: 'dipinjam' }
  });
  const copy4 = await prisma.stokBuku.create({
    data: { masterBukuId: coding.id, kodeInventaris: 'INV-CN-001', status: 'tersedia' }
  });

  console.log('Stock items seeded successfully.');

  // Create active loan transactions
  const tglPinjam1 = new Date();
  tglPinjam1.setDate(tglPinjam1.getDate() - 3); // 3 days ago
  const tglTempo1 = new Date();
  tglTempo1.setDate(tglTempo1.getDate() + 4); // 4 days remaining

  await prisma.peminjaman.create({
    data: {
      userId: budi.id,
      stokBukuId: copy1.id,
      tanggalPinjam: tglPinjam1,
      tanggalJatuhTempo: tglTempo1,
      status: 'dipinjam'
    }
  });

  const tglPinjam2 = new Date();
  tglPinjam2.setDate(tglPinjam2.getDate() - 10); // 10 days ago
  const tglTempo2 = new Date();
  tglTempo2.setDate(tglTempo2.getDate() - 3); // 3 days ago (overdue by 3 days)

  await prisma.peminjaman.create({
    data: {
      userId: budi.id,
      stokBukuId: copy3.id,
      tanggalPinjam: tglPinjam2,
      tanggalJatuhTempo: tglTempo2,
      status: 'dipinjam'
    }
  });

  console.log('Active borrow transactions seeded.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
