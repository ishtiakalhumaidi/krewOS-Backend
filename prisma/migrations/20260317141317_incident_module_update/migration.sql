-- AlterTable
ALTER TABLE "incident" ADD COLUMN     "isResolved" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "resolutionNotes" TEXT;
