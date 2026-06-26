-- CreateTable
CREATE TABLE `User` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `nama` VARCHAR(191) NOT NULL,
    `email` VARCHAR(191) NOT NULL,
    `password` VARCHAR(191) NOT NULL,
    `noHp` VARCHAR(191) NULL,
    `alamat` VARCHAR(191) NULL,
    `tipeUser` ENUM('tetap', 'guest') NOT NULL,
    `status` ENUM('aktif', 'nonaktif') NOT NULL DEFAULT 'aktif',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `User_email_key`(`email`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Jaminan` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `userId` INTEGER NOT NULL,
    `jenisJaminan` ENUM('ktp', 'uang') NOT NULL,
    `noKtp` VARCHAR(191) NULL,
    `fotoKtp` VARCHAR(191) NULL,
    `nominalUang` DECIMAL(12, 2) NULL,
    `status` ENUM('ditahan', 'dikembalikan') NOT NULL DEFAULT 'ditahan',
    `tanggalTerima` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `tanggalKembali` DATETIME(3) NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `KategoriBuku` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `namaKategori` VARCHAR(191) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `MasterBuku` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `judul` VARCHAR(191) NOT NULL,
    `penulis` VARCHAR(191) NOT NULL,
    `penerbit` VARCHAR(191) NULL,
    `isbn` VARCHAR(191) NULL,
    `kategoriId` INTEGER NULL,
    `tahunTerbit` INTEGER NULL,
    `deskripsi` VARCHAR(191) NULL,
    `coverImage` VARCHAR(191) NULL,

    UNIQUE INDEX `MasterBuku_isbn_key`(`isbn`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `StokBuku` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `masterBukuId` INTEGER NOT NULL,
    `kodeInventaris` VARCHAR(191) NOT NULL,
    `kondisi` VARCHAR(191) NULL,
    `status` ENUM('tersedia', 'dipinjam', 'rusak', 'hilang') NOT NULL DEFAULT 'tersedia',

    UNIQUE INDEX `StokBuku_kodeInventaris_key`(`kodeInventaris`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Peminjaman` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `userId` INTEGER NOT NULL,
    `stokBukuId` INTEGER NOT NULL,
    `tanggalPinjam` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `tanggalJatuhTempo` DATETIME(3) NOT NULL,
    `tanggalKembali` DATETIME(3) NULL,
    `status` ENUM('dipinjam', 'dikembalikan', 'terlambat') NOT NULL DEFAULT 'dipinjam',

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Denda` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `peminjamanId` INTEGER NOT NULL,
    `jumlahHariTelat` INTEGER NOT NULL,
    `tarifPerHari` DECIMAL(10, 2) NOT NULL,
    `totalDenda` DECIMAL(12, 2) NOT NULL,
    `statusBayar` ENUM('belum', 'lunas') NOT NULL DEFAULT 'belum',
    `tanggalBayar` DATETIME(3) NULL,

    UNIQUE INDEX `Denda_peminjamanId_key`(`peminjamanId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `Jaminan` ADD CONSTRAINT `Jaminan_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `MasterBuku` ADD CONSTRAINT `MasterBuku_kategoriId_fkey` FOREIGN KEY (`kategoriId`) REFERENCES `KategoriBuku`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `StokBuku` ADD CONSTRAINT `StokBuku_masterBukuId_fkey` FOREIGN KEY (`masterBukuId`) REFERENCES `MasterBuku`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Peminjaman` ADD CONSTRAINT `Peminjaman_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Peminjaman` ADD CONSTRAINT `Peminjaman_stokBukuId_fkey` FOREIGN KEY (`stokBukuId`) REFERENCES `StokBuku`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Denda` ADD CONSTRAINT `Denda_peminjamanId_fkey` FOREIGN KEY (`peminjamanId`) REFERENCES `Peminjaman`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
