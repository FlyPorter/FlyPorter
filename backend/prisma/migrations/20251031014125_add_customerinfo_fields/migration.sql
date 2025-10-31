/*
  Warnings:

  - You are about to drop the column `address` on the `CustomerInfo` table. All the data in the column will be lost.
  - You are about to drop the column `gender` on the `CustomerInfo` table. All the data in the column will be lost.
  - You are about to drop the column `nationality` on the `CustomerInfo` table. All the data in the column will be lost.
  - Made the column `full_name` on table `User` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "CustomerInfo" DROP COLUMN "address",
DROP COLUMN "gender",
DROP COLUMN "nationality";

-- AlterTable
ALTER TABLE "User" ALTER COLUMN "full_name" SET NOT NULL;
