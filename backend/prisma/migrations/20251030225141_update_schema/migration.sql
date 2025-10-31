/*
  Warnings:

  - You are about to drop the column `airline_id` on the `Flight` table. All the data in the column will be lost.
  - You are about to drop the column `arrival_airport_id` on the `Flight` table. All the data in the column will be lost.
  - You are about to drop the column `departure_airport_id` on the `Flight` table. All the data in the column will be lost.
  - You are about to drop the column `active` on the `Route` table. All the data in the column will be lost.
  - You are about to drop the column `domestic` on the `Route` table. All the data in the column will be lost.
  - You are about to drop the column `notes` on the `Route` table. All the data in the column will be lost.
  - You are about to drop the column `seasonal` on the `Route` table. All the data in the column will be lost.
  - You are about to drop the column `full_name` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `phone` on the `User` table. All the data in the column will be lost.
  - The values [pending] on the enum `BookingStatus` will be removed. If these variants are still used in the database, this will fail.
  - Added the required column `full_name` to the `CustomerInfo` table without a default value. This is not possible if there are existing NULL values in that column.
  - Added the required column `route_id` to the `Flight` table without a default value. This is not possible if there are existing NULL values in that column.
  - Made the column `date_of_birth` on table `CustomerInfo` required, but there are existing NULL values.
  - Made the column `passport_number` on table `CustomerInfo` required, but there are existing NULL values.

*/
-- Delete existing data that would cause conflicts
-- Delete bookings and seats related to flights first (if they exist)
DELETE FROM "Booking" WHERE "flight_id" IN (SELECT "flight_id" FROM "Flight");
DELETE FROM "Seat" WHERE "flight_id" IN (SELECT "flight_id" FROM "Flight");
DELETE FROM "Flight";
DELETE FROM "CustomerInfo";

-- AlterEnum (Remove 'pending' from BookingStatus)
-- Update existing bookings with 'pending' status to 'confirmed'
UPDATE "Booking" SET "status" = 'confirmed' WHERE "status" = 'pending';
-- Create new enum without 'pending'
CREATE TYPE "BookingStatus_new" AS ENUM ('confirmed', 'cancelled');
ALTER TABLE "Booking" ALTER COLUMN "status" TYPE "BookingStatus_new" USING ("status"::text::"BookingStatus_new");
DROP TYPE "BookingStatus";
ALTER TYPE "BookingStatus_new" RENAME TO "BookingStatus";

-- CreateEnum (NotificationType)
CREATE TYPE "NotificationType" AS ENUM ('booking_confirmed', 'booking_cancelled', 'flight_cancelled');

-- AlterTable (CustomerInfo - add full_name, phone, make passport_number and date_of_birth required)
ALTER TABLE "CustomerInfo" ADD COLUMN "full_name" VARCHAR(100) NOT NULL DEFAULT '';
ALTER TABLE "CustomerInfo" ADD COLUMN "phone" VARCHAR(20);
ALTER TABLE "CustomerInfo" ALTER COLUMN "full_name" DROP DEFAULT;
ALTER TABLE "CustomerInfo" ALTER COLUMN "passport_number" SET NOT NULL;
ALTER TABLE "CustomerInfo" ALTER COLUMN "passport_number" SET DATA TYPE VARCHAR(30);
ALTER TABLE "CustomerInfo" ALTER COLUMN "date_of_birth" SET NOT NULL;

-- AlterTable (Flight - remove old columns and add route_id)
-- Since we deleted all flights, we can safely add route_id without default
ALTER TABLE "Flight" DROP CONSTRAINT IF EXISTS "Flight_airline_id_fkey";
ALTER TABLE "Flight" DROP CONSTRAINT IF EXISTS "Flight_departure_airport_id_fkey";
ALTER TABLE "Flight" DROP CONSTRAINT IF EXISTS "Flight_arrival_airport_id_fkey";
ALTER TABLE "Flight" DROP COLUMN IF EXISTS "airline_id";
ALTER TABLE "Flight" DROP COLUMN IF EXISTS "departure_airport_id";
ALTER TABLE "Flight" DROP COLUMN IF EXISTS "arrival_airport_id";
ALTER TABLE "Flight" ADD COLUMN "route_id" INTEGER NOT NULL;

-- AlterTable (Route - remove unused columns)
ALTER TABLE "Route" DROP COLUMN "domestic";
ALTER TABLE "Route" DROP COLUMN "seasonal";
ALTER TABLE "Route" DROP COLUMN "active";
ALTER TABLE "Route" DROP COLUMN "notes";

-- AlterTable (User - remove full_name and phone)
ALTER TABLE "User" DROP COLUMN "full_name";
ALTER TABLE "User" DROP COLUMN "phone";

-- CreateTable (Notification)
CREATE TABLE "Notification" (
    "notification_id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "booking_id" INTEGER,
    "flight_id" INTEGER,
    "type" "NotificationType" NOT NULL,
    "title" VARCHAR(200) NOT NULL,
    "message" TEXT NOT NULL,
    "is_read" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Notification_pkey" PRIMARY KEY ("notification_id")
);

-- No unique indexes needed for booking_id and flight_id (a booking/flight can have multiple notifications)

-- AddForeignKey (Flight to Route)
ALTER TABLE "Flight" ADD CONSTRAINT "Flight_route_id_fkey" FOREIGN KEY ("route_id") REFERENCES "Route"("route_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey (Notification to User, Booking, Flight)
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("user_id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_booking_id_fkey" FOREIGN KEY ("booking_id") REFERENCES "Booking"("booking_id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_flight_id_fkey" FOREIGN KEY ("flight_id") REFERENCES "Flight"("flight_id") ON DELETE CASCADE ON UPDATE CASCADE;

