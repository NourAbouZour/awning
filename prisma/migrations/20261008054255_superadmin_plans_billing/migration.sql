-- AlterTable
ALTER TABLE `user` ADD COLUMN `active` BOOLEAN NOT NULL DEFAULT true,
    ADD COLUMN `billingPaid` BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN `plan` ENUM('stall', 'shopfront', 'arcade') NOT NULL DEFAULT 'stall',
    ADD COLUMN `role` ENUM('merchant', 'superadmin') NOT NULL DEFAULT 'merchant';

-- CreateTable
CREATE TABLE `SupportRequest` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `email` VARCHAR(191) NOT NULL,
    `subject` VARCHAR(191) NOT NULL,
    `message` TEXT NOT NULL,
    `handled` BOOLEAN NOT NULL DEFAULT false,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
