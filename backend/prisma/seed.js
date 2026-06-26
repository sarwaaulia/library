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
  const hashedPassword = await bcrypt.hash('user123', 10);
  
  const budi = await prisma.user.create({
    data: {
      nama: 'Budi Santoso',
      email: 'budi@example.com',
      password: hashedPassword,
      noHp: '081234567890',
      alamat: 'Jl. Merdeka No. 10, Jakarta',
      tipeUser: 'tetap',
      status: 'aktif'
    }
  });

  const agus = await prisma.user.create({
    data: {
      nama: 'Agus Tamu',
      email: 'agus@example.com',
      password: hashedPassword,
      noHp: '082345678901',
      alamat: 'Jl. Mawar No. 5, Bandung',
      tipeUser: 'guest',
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

  // Create Stock records (StokBuku)
  await prisma.stokBuku.createMany({
    data: [
      { masterBukuId: laskar.id, kodeInventaris: 'INV-LP-001', status: 'tersedia' },
      { masterBukuId: laskar.id, kodeInventaris: 'INV-LP-002', status: 'tersedia' },
      { masterBukuId: bumi.id, kodeInventaris: 'INV-BM-001', status: 'tersedia' },
      { masterBukuId: coding.id, kodeInventaris: 'INV-CN-001', status: 'tersedia' }
    ]
  });

  console.log('Stock items seeded successfully.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
