/*
  Warnings:

  - You are about to drop the column `date` on the `AvailabilitySlot` table. All the data in the column will be lost.
  - Changed the type of `appointmentTime` on the `Appointment` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `startTime` on the `AvailabilitySlot` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `endTime` on the `AvailabilitySlot` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- AlterTable
ALTER TABLE "Appointment" DROP COLUMN "appointmentTime",
ADD COLUMN     "appointmentTime" TIMESTAMP(3) NOT NULL;

-- AlterTable
ALTER TABLE "AvailabilitySlot" DROP COLUMN "date",
ADD COLUMN     "bookedCount" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "capacity" INTEGER NOT NULL DEFAULT 1,
ADD COLUMN     "isStream" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "ruleId" TEXT,
ADD COLUMN     "streamBufferMin" INTEGER,
DROP COLUMN "startTime",
ADD COLUMN     "startTime" TIMESTAMP(3) NOT NULL,
DROP COLUMN "endTime",
ADD COLUMN     "endTime" TIMESTAMP(3) NOT NULL;

-- CreateTable
CREATE TABLE "RecurringRule" (
    "id" TEXT NOT NULL,
    "doctorId" TEXT NOT NULL,
    "weekdayMask" INTEGER NOT NULL,
    "startMin" INTEGER NOT NULL,
    "endMin" INTEGER NOT NULL,
    "slotSizeMin" INTEGER NOT NULL,
    "capacity" INTEGER NOT NULL DEFAULT 1,
    "isStream" BOOLEAN NOT NULL DEFAULT false,
    "validFrom" TIMESTAMP(3) NOT NULL,
    "validUntil" TIMESTAMP(3),
    "sessionType" "SessionType" NOT NULL,

    CONSTRAINT "RecurringRule_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "AvailabilitySlot" ADD CONSTRAINT "AvailabilitySlot_ruleId_fkey" FOREIGN KEY ("ruleId") REFERENCES "RecurringRule"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RecurringRule" ADD CONSTRAINT "RecurringRule_doctorId_fkey" FOREIGN KEY ("doctorId") REFERENCES "Doctor"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
