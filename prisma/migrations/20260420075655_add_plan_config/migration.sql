/*
  Warnings:

  - You are about to drop the column `stripeSubId` on the `subscription` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[stripeSubscriptionId]` on the table `subscription` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "subscription_stripeSubId_key";

-- AlterTable
ALTER TABLE "subscription" DROP COLUMN "stripeSubId",
ADD COLUMN     "cancelAtPeriodEnd" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "currentPeriodStart" TIMESTAMP(3),
ADD COLUMN     "planConfigId" TEXT,
ADD COLUMN     "stripeSubscriptionId" TEXT,
ALTER COLUMN "status" SET DEFAULT 'ACTIVE';

-- CreateTable
CREATE TABLE "plan_config" (
    "id" TEXT NOT NULL,
    "tier" "SubscriptionPlan" NOT NULL,
    "name" TEXT NOT NULL,
    "price" DOUBLE PRECISION NOT NULL,
    "interval" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "features" TEXT[],
    "maxProjects" INTEGER NOT NULL,
    "maxMembers" INTEGER NOT NULL,
    "maxStorage" INTEGER NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "plan_config_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "plan_config_tier_key" ON "plan_config"("tier");

-- CreateIndex
CREATE UNIQUE INDEX "subscription_stripeSubscriptionId_key" ON "subscription"("stripeSubscriptionId");

-- AddForeignKey
ALTER TABLE "subscription" ADD CONSTRAINT "subscription_planConfigId_fkey" FOREIGN KEY ("planConfigId") REFERENCES "plan_config"("id") ON DELETE SET NULL ON UPDATE CASCADE;
