import { PrismaClient, SeatClass, BookingStatus, UserRole } from "@prisma/client";
const prisma = new PrismaClient();

async function main() {
  // Create cities
  const toronto = await prisma.city.create({
    data: { city_name: "Toronto", country: "Canada", timezone: "America/Toronto" },
  });

  const vancouver = await prisma.city.create({
    data: { city_name: "Vancouver", country: "Canada", timezone: "America/Vancouver" },
  });

  // Create airports
  const yyz = await prisma.airport.create({
    data: {
      city_id: toronto.city_id,
      airport_code: "YYZ",
      airport_name: "Toronto Pearson International Airport",
    },
  });

  const yvr = await prisma.airport.create({
    data: {
      city_id: vancouver.city_id,
      airport_code: "YVR",
      airport_name: "Vancouver International Airport",
    },
  });

  // Create airline
  const airCanada = await prisma.airline.create({
    data: { airline_name: "Air Canada", airline_code: "AC" },
  });

  // Create route
  const route = await prisma.route.create({
    data: {
      airline_id: airCanada.airline_id,
      origin_airport_id: yyz.airport_id,
      destination_airport_id: yvr.airport_id,
      domestic: true,
      seasonal: false,
      active: true,
    },
  });

  // Create flight
  const flight = await prisma.flight.create({
    data: {
      airline_id: airCanada.airline_id,
      departure_airport_id: yyz.airport_id,
      arrival_airport_id: yvr.airport_id,
      departure_time: new Date("2025-11-01T09:00:00Z"),
      arrival_time: new Date("2025-11-01T11:00:00Z"),
      base_price: 350.0,
      seat_capacity: 3,
    },
  });

  // Create seats
  const seatA1 = await prisma.seat.create({
    data: {
      flight_id: flight.flight_id,
      seat_number: "A1",
      class: SeatClass.economy,
      price_modifier: 1.0,
    },
  });

  const seatA2 = await prisma.seat.create({
    data: {
      flight_id: flight.flight_id,
      seat_number: "A2",
      class: SeatClass.economy,
      price_modifier: 1.0,
    },
  });

  const seatB1 = await prisma.seat.create({
    data: {
      flight_id: flight.flight_id,
      seat_number: "B1",
      class: SeatClass.business,
      price_modifier: 1.5,
    },
  });

  // Create user
  const user = await prisma.user.create({
    data: {
      role: UserRole.customer,
      email: "john.doe@example.com",
      password_hash: "hashed_password_123",
      full_name: "John Doe",
      phone: "+1-416-555-1234",
      customer_info: {
        create: {
          passport_number: "X1234567",
          nationality: "Canadian",
          gender: "Male",
          address: "123 Main Street, Toronto",
          emergency_contact_name: "Jane Doe",
          emergency_contact_phone: "+1-416-555-5678",
        },
      },
    },
  });

  // Create booking (user books seat A1)
  const booking = await prisma.booking.create({
    data: {
      user_id: user.user_id,
      flight_id: flight.flight_id,
      seat_id: seatA1.seat_id,
      booking_time: new Date(),
      status: BookingStatus.confirmed,
      total_price: 350.0,
      confirmation_code: "CONF2025YYZ",
    },
  });

  console.log("✅ Seed completed successfully");
  console.table({
    city: toronto.city_name,
    route: `${yyz.airport_code} → ${yvr.airport_code}`,
    flight_id: flight.flight_id,
    seat: seatA1.seat_number,
    user: user.email,
    booking: booking.confirmation_code,
  });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

