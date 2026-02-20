-- AlterTable
ALTER TABLE "RecurringRule" ADD COLUMN     "endMin" INTEGER,
ADD COLUMN     "isStream" BOOLEAN NOT NULL DEFAULT true;
