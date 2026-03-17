/*
  Warnings:

  - You are about to drop the column `workerCount` on the `daily_site_report` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "daily_site_report" DROP COLUMN "workerCount",
ADD COLUMN     "totalWorkers" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "workersAbsent" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "workersPresent" INTEGER NOT NULL DEFAULT 0;
