/*
  Warnings:

  - The values [booking_confirmed,booking_cancelled,flight_cancelled] on the enum `NotificationType` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum - Safe migration approach
-- Recreate enum type with new values and convert existing data in one step
CREATE TYPE "NotificationType_new" AS ENUM ('BOOKING_CONFIRMATION', 'BOOKING_CANCELLATION', 'PAYMENT_SUCCESS', 'PAYMENT_FAILED', 'FLIGHT_REMINDER', 'FLIGHT_DELAYED', 'FLIGHT_CANCELLED', 'GENERAL');

-- Convert existing data to new enum values during type change
ALTER TABLE "Notification" ALTER COLUMN "type" TYPE "NotificationType_new" USING (
  CASE "type"::text
    WHEN 'booking_confirmed' THEN 'BOOKING_CONFIRMATION'::"NotificationType_new"
    WHEN 'booking_cancelled' THEN 'BOOKING_CANCELLATION'::"NotificationType_new"
    WHEN 'flight_cancelled' THEN 'FLIGHT_CANCELLED'::"NotificationType_new"
    ELSE "type"::text::"NotificationType_new"
  END
);

-- Replace old enum with new one
ALTER TYPE "NotificationType" RENAME TO "NotificationType_old";
ALTER TYPE "NotificationType_new" RENAME TO "NotificationType";
DROP TYPE "public"."NotificationType_old";

-- AlterTable
ALTER TABLE "CustomerInfo" ALTER COLUMN "passport_number" DROP NOT NULL;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "push_token" VARCHAR(255);
