/*
  Warnings:

  - You are about to drop the column `platformRole` on the `user` table. All the data in the column will be lost.
  - The `role` column on the `user` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('SUPER_ADMIN', 'OWNER', 'ADMIN', 'MEMBER');

-- AlterTable
ALTER TABLE "user" DROP COLUMN "platformRole",
DROP COLUMN "role",
ADD COLUMN     "role" "UserRole" NOT NULL DEFAULT 'MEMBER';

-- DropEnum
DROP TYPE "CompanyRole";

-- DropEnum
DROP TYPE "PlatformRole";
