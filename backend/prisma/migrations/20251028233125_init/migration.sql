-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('customer', 'admin');

-- CreateEnum
CREATE TYPE "SeatClass" AS ENUM ('economy', 'business', 'first');

-- CreateEnum
CREATE TYPE "BookingStatus" AS ENUM ('pending', 'confirmed', 'cancelled');

-- CreateTable
CREATE TABLE "User" (
    "user_id" SERIAL NOT NULL,
    "role" "UserRole" NOT NULL DEFAULT 'customer',
    "email" VARCHAR(100) NOT NULL,
    "password_hash" TEXT NOT NULL,
    "full_name" VARCHAR(100),
    "phone" VARCHAR(20),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "User_pkey" PRIMARY KEY ("user_id")
);

-- CreateTable
CREATE TABLE "City" (
    "city_id" SERIAL NOT NULL,
    "city_name" VARCHAR(100) NOT NULL,
    "country" VARCHAR(100),
    "timezone" VARCHAR(50),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "City_pkey" PRIMARY KEY ("city_id")
);

-- CreateTable
CREATE TABLE "Airport" (
    "airport_id" SERIAL NOT NULL,
    "city_id" INTEGER NOT NULL,
    "airport_code" VARCHAR(10) NOT NULL,
    "airport_name" VARCHAR(150) NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Airport_pkey" PRIMARY KEY ("airport_id")
);

-- CreateTable
CREATE TABLE "Airline" (
    "airline_id" SERIAL NOT NULL,
    "airline_name" VARCHAR(100) NOT NULL,
    "airline_code" VARCHAR(10) NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Airline_pkey" PRIMARY KEY ("airline_id")
);

-- CreateTable
CREATE TABLE "Route" (
    "route_id" SERIAL NOT NULL,
    "airline_id" INTEGER NOT NULL,
    "origin_airport_id" INTEGER NOT NULL,
    "destination_airport_id" INTEGER NOT NULL,
    "domestic" BOOLEAN NOT NULL DEFAULT true,
    "seasonal" BOOLEAN NOT NULL DEFAULT false,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "notes" TEXT,

    CONSTRAINT "Route_pkey" PRIMARY KEY ("route_id")
);

-- CreateTable
CREATE TABLE "Flight" (
    "flight_id" SERIAL NOT NULL,
    "airline_id" INTEGER NOT NULL,
    "departure_airport_id" INTEGER NOT NULL,
    "arrival_airport_id" INTEGER NOT NULL,
    "departure_time" TIMESTAMPTZ(6) NOT NULL,
    "arrival_time" TIMESTAMPTZ(6) NOT NULL,
    "base_price" DECIMAL(10,2) NOT NULL,
    "seat_capacity" INTEGER NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Flight_pkey" PRIMARY KEY ("flight_id")
);

-- CreateTable
CREATE TABLE "Seat" (
    "seat_id" SERIAL NOT NULL,
    "flight_id" INTEGER NOT NULL,
    "seat_number" VARCHAR(5) NOT NULL,
    "class" "SeatClass" NOT NULL,
    "price_modifier" DECIMAL(5,2) NOT NULL DEFAULT 1.0,
    "is_available" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "Seat_pkey" PRIMARY KEY ("seat_id")
);

-- CreateTable
CREATE TABLE "Booking" (
    "booking_id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "flight_id" INTEGER NOT NULL,
    "seat_id" INTEGER NOT NULL,
    "booking_time" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status" "BookingStatus" NOT NULL,
    "total_price" DECIMAL(10,2),
    "confirmation_code" VARCHAR(12),
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Booking_pkey" PRIMARY KEY ("booking_id")
);

-- CreateTable
CREATE TABLE "CustomerInfo" (
    "info_id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "passport_number" VARCHAR(30),
    "nationality" VARCHAR(50),
    "date_of_birth" DATE,
    "gender" VARCHAR(10),
    "address" TEXT,
    "emergency_contact_name" VARCHAR(100),
    "emergency_contact_phone" VARCHAR(20),

    CONSTRAINT "CustomerInfo_pkey" PRIMARY KEY ("info_id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Airport_airport_code_key" ON "Airport"("airport_code");

-- CreateIndex
CREATE UNIQUE INDEX "Airline_airline_code_key" ON "Airline"("airline_code");

-- CreateIndex
CREATE UNIQUE INDEX "Seat_flight_id_seat_number_key" ON "Seat"("flight_id", "seat_number");

-- CreateIndex
CREATE UNIQUE INDEX "Booking_confirmation_code_key" ON "Booking"("confirmation_code");

-- CreateIndex
CREATE UNIQUE INDEX "CustomerInfo_user_id_key" ON "CustomerInfo"("user_id");

-- AddForeignKey
ALTER TABLE "Airport" ADD CONSTRAINT "Airport_city_id_fkey" FOREIGN KEY ("city_id") REFERENCES "City"("city_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Route" ADD CONSTRAINT "Route_airline_id_fkey" FOREIGN KEY ("airline_id") REFERENCES "Airline"("airline_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Route" ADD CONSTRAINT "Route_origin_airport_id_fkey" FOREIGN KEY ("origin_airport_id") REFERENCES "Airport"("airport_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Route" ADD CONSTRAINT "Route_destination_airport_id_fkey" FOREIGN KEY ("destination_airport_id") REFERENCES "Airport"("airport_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Flight" ADD CONSTRAINT "Flight_airline_id_fkey" FOREIGN KEY ("airline_id") REFERENCES "Airline"("airline_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Flight" ADD CONSTRAINT "Flight_departure_airport_id_fkey" FOREIGN KEY ("departure_airport_id") REFERENCES "Airport"("airport_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Flight" ADD CONSTRAINT "Flight_arrival_airport_id_fkey" FOREIGN KEY ("arrival_airport_id") REFERENCES "Airport"("airport_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Seat" ADD CONSTRAINT "Seat_flight_id_fkey" FOREIGN KEY ("flight_id") REFERENCES "Flight"("flight_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Booking" ADD CONSTRAINT "Booking_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("user_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Booking" ADD CONSTRAINT "Booking_flight_id_fkey" FOREIGN KEY ("flight_id") REFERENCES "Flight"("flight_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Booking" ADD CONSTRAINT "Booking_seat_id_fkey" FOREIGN KEY ("seat_id") REFERENCES "Seat"("seat_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CustomerInfo" ADD CONSTRAINT "CustomerInfo_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("user_id") ON DELETE CASCADE ON UPDATE CASCADE;
