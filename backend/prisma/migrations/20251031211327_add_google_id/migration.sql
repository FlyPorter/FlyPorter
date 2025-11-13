-- AlterTable
ALTER TABLE "User" ADD COLUMN "google_id" VARCHAR(100);

-- AlterTable
ALTER TABLE "User" ALTER COLUMN "password_hash" DROP NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "User_google_id_key" ON "User"("google_id");


