-- CreateEnum
CREATE TYPE "ComponentVisibility" AS ENUM ('PUBLIC', 'PRIVATE');

-- AlterTable
ALTER TABLE "Component" ADD COLUMN     "visibility" "ComponentVisibility" NOT NULL DEFAULT 'PUBLIC';
