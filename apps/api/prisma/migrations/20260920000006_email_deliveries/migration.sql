-- CreateEnum
CREATE TYPE "EmailType" AS ENUM ('WELCOME', 'ORDER_CONFIRMATION', 'PAYMENT_SUCCESS', 'PAYMENT_FAILED', 'ORDER_STATUS_CHANGED');

-- CreateEnum
CREATE TYPE "EmailStatus" AS ENUM ('PENDING', 'SENT', 'FAILED');

-- CreateTable
CREATE TABLE "EmailDelivery" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "orderId" TEXT,
    "type" "EmailType" NOT NULL,
    "provider" TEXT,
    "providerMessageId" TEXT,
    "status" "EmailStatus" NOT NULL DEFAULT 'PENDING',
    "dedupeKey" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EmailDelivery_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "EmailDelivery_dedupeKey_key" ON "EmailDelivery"("dedupeKey");

-- CreateIndex
CREATE INDEX "EmailDelivery_orderId_idx" ON "EmailDelivery"("orderId");

-- CreateIndex
CREATE INDEX "EmailDelivery_userId_idx" ON "EmailDelivery"("userId");

