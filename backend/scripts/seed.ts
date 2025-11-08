import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("Starting seed...");

  // ============================================
  // 1. Create Admin + Customer Users
  // ============================================
  const adminEmail = "admin@123.com";
  const adminPassword = "admin123";

  const existingAdmin = await prisma.user.findUnique({
    where: { email: adminEmail },
  });

  if (existingAdmin) {
    console.log("Admin user already exists");
  } else {
    const passwordHash = await bcrypt.hash(adminPassword, 10);
    const admin = await prisma.user.create({
      data: {
        email: adminEmail,
        password_hash: passwordHash,
        role: "admin",
      },
    });
    console.log("Created admin user:", {
      email: admin.email,
      role: admin.role,
    });
  }

  console.log("\nCreating demo customers...");

  const customers = [
    {
      email: "customer.one@example.com",
      password: "password123",
      info: {
        full_name: "Alex Johnson",
        phone: "+14165550100",
        passport_number: "CA1234567",
        date_of_birth: new Date("1992-05-15"),
        emergency_contact_name: "Taylor Johnson",
        emergency_contact_phone: "+14165550999",
      },
    },
    {
      email: "customer.two@example.com",
      password: "password123",
      info: {
        full_name: "Morgan Lee",
        phone: "+16045550111",
        passport_number: "CA7654321",
        date_of_birth: new Date("1988-11-02"),
        emergency_contact_name: "Jordan Lee",
        emergency_contact_phone: "+16045550777",
      },
    },
  ];

  for (const customer of customers) {
    const existingUser = await prisma.user.findUnique({
      where: { email: customer.email },
      include: { customer_info: true },
    });

    let userId: number;

    if (existingUser) {
      userId = existingUser.user_id;
      console.log(`Customer user already exists: ${customer.email}`);
    } else {
      const passwordHash = await bcrypt.hash(customer.password, 10);
      const user = await prisma.user.create({
        data: {
          email: customer.email,
          password_hash: passwordHash,
          role: "customer",
        },
      });
      userId = user.user_id;
      console.log(`Created customer user: ${customer.email}`);
    }

    if (!existingUser?.customer_info) {
      await prisma.customerInfo.upsert({
        where: { user_id: userId },
        create: {
          user_id: userId,
          ...customer.info,
        },
        update: {
          ...customer.info,
        },
      });
      console.log(`   Added passenger profile for ${customer.email}`);
    } else {
      console.log(`   Passenger profile already exists for ${customer.email}`);
    }
  }

  // ============================================
  // 2. Create Cities
  // ============================================
  console.log("\nCreating cities...");
  
  const cities = [
    { city_name: "Toronto", country: "Canada", timezone: "America/Toronto" },
    { city_name: "Vancouver", country: "Canada", timezone: "America/Vancouver" },
    { city_name: "Montreal", country: "Canada", timezone: "America/Montreal" },
    { city_name: "Ottawa", country: "Canada", timezone: "America/Toronto" },
  ];

  for (const city of cities) {
    await prisma.city.upsert({
      where: { city_name: city.city_name },
      update: {},
      create: city,
    });
  }
  console.log(`Created ${cities.length} cities`);

  // ============================================
  // 3. Create Airports
  // ============================================
  console.log("\nCreating airports...");
  
  const airports = [
    { airport_code: "YYZ", city_name: "Toronto", airport_name: "Toronto Pearson International Airport" },
    { airport_code: "YVR", city_name: "Vancouver", airport_name: "Vancouver International Airport" },
    { airport_code: "YUL", city_name: "Montreal", airport_name: "Montreal-Pierre Elliott Trudeau International Airport" },
    { airport_code: "YOW", city_name: "Ottawa", airport_name: "Ottawa Macdonald-Cartier International Airport" },
  ];

  for (const airport of airports) {
    await prisma.airport.upsert({
      where: { airport_code: airport.airport_code },
      update: {},
      create: airport,
    });
  }
  console.log(`Created ${airports.length} airports`);

  // ============================================
  // 4. Create Airlines
  // ============================================
  console.log("\nCreating airlines...");
  
  const airlines = [
    { airline_code: "FP", airline_name: "FlyPorter Airlines" },
    { airline_code: "AC", airline_name: "Air Canada" },
  ];

  for (const airline of airlines) {
    await prisma.airline.upsert({
      where: { airline_code: airline.airline_code },
      update: {},
      create: airline,
    });
  }
  console.log(`Created ${airlines.length} airlines`);

  // ============================================
  // 5. Create Routes
  // ============================================
  console.log("\nCreating routes...");
  
  const routes = [
    { origin_airport_code: "YYZ", destination_airport_code: "YVR" }, // Toronto → Vancouver
    { origin_airport_code: "YVR", destination_airport_code: "YYZ" }, // Vancouver → Toronto
    { origin_airport_code: "YYZ", destination_airport_code: "YUL" }, // Toronto → Montreal
    { origin_airport_code: "YUL", destination_airport_code: "YYZ" }, // Montreal → Toronto
    { origin_airport_code: "YYZ", destination_airport_code: "YOW" }, // Toronto → Ottawa
    { origin_airport_code: "YOW", destination_airport_code: "YYZ" }, // Ottawa → Toronto
  ];

  const createdRoutes: Array<{ route_id: number; origin_airport_code: string; destination_airport_code: string }> = [];
  for (const route of routes) {
    const existing = await prisma.route.findFirst({
      where: route,
    });
    
    if (!existing) {
      const created = await prisma.route.create({
        data: route,
      });
      createdRoutes.push(created);
    } else {
      createdRoutes.push(existing);
    }
  }
  console.log(`Created ${routes.length} routes`);

  // ============================================
  // 6. Create Flights with Seats
  // ============================================
  console.log("\nCreating flights...");
  
  // Helper to generate seat data
  const generateSeats = (flightId: number, capacity: number) => {
    const SEAT_LETTERS = ["A", "B", "C", "D", "E", "F"];
    const seats: Array<{
      flight_id: number;
      seat_number: string;
      class: "first" | "business" | "economy";
      price_modifier: number;
      is_available: boolean;
    }> = [];
    const totalRows = Math.ceil(capacity / SEAT_LETTERS.length);
    
    let createdCount = 0;
    for (let row = 1; row <= totalRows && createdCount < capacity; row++) {
      const seatClass: "first" | "business" | "economy" = row <= 2 ? "first" : row <= 6 ? "business" : "economy";
      const priceModifier = seatClass === "first" ? 2.0 : seatClass === "business" ? 1.5 : 1.0;
      
      for (let i = 0; i < SEAT_LETTERS.length && createdCount < capacity; i++) {
        seats.push({
          flight_id: flightId,
          seat_number: `${row}${SEAT_LETTERS[i]}`,
          class: seatClass,
          price_modifier: priceModifier,
          is_available: true,
        });
        createdCount++;
      }
    }
    return seats;
  };

  // Get future dates for test flights
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(8, 0, 0, 0);

  const nextWeek = new Date();
  nextWeek.setDate(nextWeek.getDate() + 7);
  nextWeek.setHours(14, 0, 0, 0);

  const DAY_IN_MS = 24 * 60 * 60 * 1000;

  const farFutureOutboundYYZToYVR = new Date();
  farFutureOutboundYYZToYVR.setFullYear(farFutureOutboundYYZToYVR.getFullYear() + 50, 5, 10);
  farFutureOutboundYYZToYVR.setHours(9, 30, 0, 0);

  const farFutureReturnYVRToYYZ = new Date(farFutureOutboundYYZToYVR.getTime() + 7 * DAY_IN_MS);
  farFutureReturnYVRToYYZ.setHours(18, 15, 0, 0);

  const farFutureOutboundYYZToYUL = new Date();
  farFutureOutboundYYZToYUL.setFullYear(farFutureOutboundYYZToYUL.getFullYear() + 50, 8, 4);
  farFutureOutboundYYZToYUL.setHours(8, 45, 0, 0);

  const farFutureReturnYULToYYZ = new Date(farFutureOutboundYYZToYUL.getTime() + 5 * DAY_IN_MS);
  farFutureReturnYULToYYZ.setHours(20, 30, 0, 0);

  const flights = [
    {
      route_id: createdRoutes[0]!.route_id, // YYZ → YVR
      airline_code: "FP",
      departure_time: tomorrow,
      arrival_time: new Date(tomorrow.getTime() + 5 * 60 * 60 * 1000), // +5 hours
      base_price: 249.99,
      seat_capacity: 24,
    },
    {
      route_id: createdRoutes[1]!.route_id, // YVR → YYZ
      airline_code: "FP",
      departure_time: nextWeek,
      arrival_time: new Date(nextWeek.getTime() + 5 * 60 * 60 * 1000), // +5 hours
      base_price: 299.99,
      seat_capacity: 24,
    },
    {
      route_id: createdRoutes[2]!.route_id, // YYZ → YUL
      airline_code: "AC",
      departure_time: new Date(tomorrow.getTime() + 3 * 60 * 60 * 1000), // tomorrow 11am
      arrival_time: new Date(tomorrow.getTime() + 4 * 60 * 60 * 1000), // +1 hour
      base_price: 149.99,
      seat_capacity: 18,
    },
    // Super-future round trip flights to keep availability far out
    {
      route_id: createdRoutes[0]!.route_id, // YYZ → YVR (far future)
      airline_code: "FP",
      departure_time: farFutureOutboundYYZToYVR,
      arrival_time: new Date(farFutureOutboundYYZToYVR.getTime() + 5 * 60 * 60 * 1000),
      base_price: 375.99,
      seat_capacity: 40,
    },
    {
      route_id: createdRoutes[1]!.route_id, // YVR → YYZ (return, far future)
      airline_code: "FP",
      departure_time: farFutureReturnYVRToYYZ,
      arrival_time: new Date(farFutureReturnYVRToYYZ.getTime() + 5 * 60 * 60 * 1000),
      base_price: 385.99,
      seat_capacity: 40,
    },
    {
      route_id: createdRoutes[2]!.route_id, // YYZ → YUL (far future)
      airline_code: "AC",
      departure_time: farFutureOutboundYYZToYUL,
      arrival_time: new Date(farFutureOutboundYYZToYUL.getTime() + 90 * 60 * 1000),
      base_price: 189.99,
      seat_capacity: 28,
    },
    {
      route_id: createdRoutes[3]!.route_id, // YUL → YYZ (return, far future)
      airline_code: "AC",
      departure_time: farFutureReturnYULToYYZ,
      arrival_time: new Date(farFutureReturnYULToYYZ.getTime() + 90 * 60 * 1000),
      base_price: 199.99,
      seat_capacity: 28,
    },
  ];

  let flightCount = 0;
  for (const flightData of flights) {
    const existing = await prisma.flight.findFirst({
      where: {
        route_id: flightData.route_id,
        departure_time: flightData.departure_time,
      },
    });

    if (!existing) {
      const flight = await prisma.flight.create({
        data: flightData,
      });

      // Create seats for this flight
      const seats = generateSeats(flight.flight_id, flightData.seat_capacity);
      await prisma.seat.createMany({
        data: seats,
        skipDuplicates: true,
      });

      flightCount++;
      console.log(`Created flight ${flight.flight_id} with ${seats.length} seats`);
    }
  }

  if (flightCount > 0) {
    console.log(`Created ${flightCount} flights with seats`);
  } else {
    console.log("Flights already exist");
  }

  // ============================================
  // Summary
  // ============================================
  console.log("\nSeed Summary:");
  console.log("================");
  console.log(`Admin: ${adminEmail} / ${adminPassword}`);
  console.log("Customers:");
  customers.forEach((customer) => {
    console.log(` - ${customer.email} / ${customer.password}`);
  });
  console.log(`Cities: ${cities.length}`);
  console.log(`Airports: ${airports.length}`);
  console.log(`Airlines: ${airlines.length}`);
  console.log(`Routes: ${routes.length}`);
  console.log(`Flights: ${flights.length} (with auto-generated seats)`);
  console.log("\nReady to test! Just login as customer and book a flight!");
  console.log("Seed finished!");
}

main()
  .catch((e) => {
    console.error("Seed error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
