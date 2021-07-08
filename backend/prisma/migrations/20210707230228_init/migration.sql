-- CreateTable
CREATE TABLE `User` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `loginId` VARCHAR(255) NOT NULL,
    `password` VARCHAR(255) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `AccessToken` (
    `userId` INTEGER NOT NULL,
    `accessToken` VARCHAR(255) NOT NULL,

    UNIQUE INDEX `AccessToken.userId_unique`(`userId`),
    UNIQUE INDEX `AccessToken.accessToken_unique`(`accessToken`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Account` (
    `userId` INTEGER NOT NULL,
    `stripeAccountId` VARCHAR(255) NOT NULL,
    `draft` BOOLEAN NOT NULL DEFAULT false,

    UNIQUE INDEX `Account.userId_unique`(`userId`),
    UNIQUE INDEX `Account.stripeAccountId_unique`(`stripeAccountId`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Product` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `userId` INTEGER NOT NULL,
    `name` VARCHAR(255) NOT NULL,
    `amount` INTEGER NOT NULL,
    `url` VARCHAR(255) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `OrderParent` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `transferGroupId` VARCHAR(255) NOT NULL,
    `amount` INTEGER NOT NULL,
    `status` ENUM('ORDER', 'PAID', 'REFUND') NOT NULL DEFAULT 'ORDER',
    `createdAt` TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    `paidAt` TIMESTAMP(6),
    `chargeId` VARCHAR(255),

    UNIQUE INDEX `OrderParent.transferGroupId_unique`(`transferGroupId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `OrderItem` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `parentId` INTEGER NOT NULL,
    `productId` INTEGER NOT NULL,
    `transfer` INTEGER NOT NULL,
    `fee` INTEGER NOT NULL,
    `transferId` VARCHAR(255),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `AccessToken` ADD FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Account` ADD FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Product` ADD FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `OrderItem` ADD FOREIGN KEY (`parentId`) REFERENCES `OrderParent`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `OrderItem` ADD FOREIGN KEY (`productId`) REFERENCES `Product`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
