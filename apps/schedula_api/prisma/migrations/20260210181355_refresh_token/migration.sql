-- AlterTable
ALTER TABLE "User" ADD COLUMN     "refreshExpiresAt" TIMESTAMP(3),
ADD COLUMN     "refreshTokenHash" TEXT;
