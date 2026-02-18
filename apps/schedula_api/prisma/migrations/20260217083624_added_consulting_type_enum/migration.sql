/*
  Warnings:

  - Added the required column `consultingType` to the `Appointment` table without a default value. This is not possible if the table is not empty.
  - Made the column `complaint` on table `Appointment` required. This step will fail if there are existing NULL values in that column.
  - Made the column `visitType` on table `Appointment` required. This step will fail if there are existing NULL values in that column.

*/
-- CreateEnum
CREATE TYPE "ConsultingType" AS ENUM ('REGULAR', 'REVISIT', 'FOLLOW_UP');

-- AlterTable
ALTER TABLE "Appointment" DROP COLUMN "consultingType",
ADD COLUMN     "consultingType" "ConsultingType" NOT NULL,
ALTER COLUMN "complaint" SET NOT NULL,
ALTER COLUMN "visitType" SET NOT NULL;
