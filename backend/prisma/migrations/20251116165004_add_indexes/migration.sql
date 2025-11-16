/*
  Warnings:

  - A unique constraint covering the columns `[origin_airport_code,destination_airport_code]` on the table `Route` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE INDEX "Airport_city_name_idx" ON "Airport"("city_name");

-- CreateIndex
CREATE INDEX "Booking_user_id_idx" ON "Booking"("user_id");

-- CreateIndex
CREATE INDEX "Booking_flight_id_idx" ON "Booking"("flight_id");

-- CreateIndex
CREATE INDEX "Booking_user_id_status_idx" ON "Booking"("user_id", "status");

-- CreateIndex
CREATE INDEX "Flight_route_id_departure_time_idx" ON "Flight"("route_id", "departure_time");

-- CreateIndex
CREATE INDEX "Flight_airline_code_idx" ON "Flight"("airline_code");

-- CreateIndex
CREATE INDEX "Route_origin_airport_code_idx" ON "Route"("origin_airport_code");

-- CreateIndex
CREATE INDEX "Route_destination_airport_code_idx" ON "Route"("destination_airport_code");

-- CreateIndex
CREATE UNIQUE INDEX "Route_origin_airport_code_destination_airport_code_key" ON "Route"("origin_airport_code", "destination_airport_code");

-- CreateIndex
CREATE INDEX "Seat_flight_id_is_available_idx" ON "Seat"("flight_id", "is_available");
