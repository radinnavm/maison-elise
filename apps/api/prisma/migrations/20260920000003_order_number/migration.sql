-- AlterTable
ALTER TABLE "Order" ADD COLUMN     "sequence" SERIAL NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "Order_sequence_key" ON "Order"("sequence");

