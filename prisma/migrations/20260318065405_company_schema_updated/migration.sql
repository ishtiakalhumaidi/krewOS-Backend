-- CreateEnum
CREATE TYPE "CompanyStatus" AS ENUM ('ACTIVE', 'SUSPENDED', 'INACTIVE');

-- AlterTable
ALTER TABLE "company" ADD COLUMN     "status" "CompanyStatus" NOT NULL DEFAULT 'ACTIVE';
