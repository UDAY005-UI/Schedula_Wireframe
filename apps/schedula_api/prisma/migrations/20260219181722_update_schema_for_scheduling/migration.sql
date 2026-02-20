/*
  Warnings:

  - You are about to drop the column `isStream` on the `AvailabilitySlot` table. All the data in the column will be lost.
  - You are about to drop the column `streamBufferMin` on the `AvailabilitySlot` table. All the data in the column will be lost.
  - You are about to drop the column `endMin` on the `RecurringRule` table. All the data in the column will be lost.
  - You are about to drop the column `isStream` on the `RecurringRule` table. All the data in the column will be lost.
  - You are about to drop the column `slotSizeMin` on the `RecurringRule` table. All the data in the column will be lost.
  - Added the required column `durationMin` to the `AvailabilitySlot` table without a default value. This is not possible if the table is not empty.
  - Added the required column `durationMin` to the `RecurringRule` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "AvailabilitySlot" DROP COLUMN "isStream",
DROP COLUMN "streamBufferMin",
ADD COLUMN     "durationMin" INTEGER NOT NULL,
ALTER COLUMN "capacity" DROP DEFAULT;

-- AlterTable
ALTER TABLE "RecurringRule" DROP COLUMN "endMin",
DROP COLUMN "isStream",
DROP COLUMN "slotSizeMin",
ADD COLUMN     "durationMin" INTEGER NOT NULL,
ALTER COLUMN "capacity" DROP DEFAULT;
