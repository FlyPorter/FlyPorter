/*
  Warnings:

  - The values [booking_confirmed,booking_cancelled,flight_cancelled] on the enum `NotificationType` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "NotificationType_new" AS ENUM ('BOOKING_CONFIRMATION', 'BOOKING_CANCELLATION', 'PAYMENT_SUCCESS', 'PAYMENT_FAILED', 'FLIGHT_REMINDER', 'FLIGHT_DELAYED', 'FLIGHT_CANCELLED', 'GENERAL');
ALTER TABLE "Notification" ALTER COLUMN "type" TYPE "NotificationType_new" USING ("type"::text::"NotificationType_new");
ALTER TYPE "NotificationType" RENAME TO "NotificationType_old";
ALTER TYPE "NotificationType_new" RENAME TO "NotificationType";
DROP TYPE "public"."NotificationType_old";
COMMIT;

-- AlterTable
ALTER TABLE "CustomerInfo" ALTER COLUMN "passport_number" DROP NOT NULL;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "push_token" VARCHAR(255);
