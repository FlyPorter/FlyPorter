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
    { city_name: "Calgary", country: "Canada", timezone: "America/Edmonton" },
    { city_name: "Edmonton", country: "Canada", timezone: "America/Edmonton" },
    { city_name: "Halifax", country: "Canada", timezone: "America/Halifax" },
    { city_name: "Winnipeg", country: "Canada", timezone: "America/Winnipeg" },
    { city_name: "Quebec City", country: "Canada", timezone: "America/Toronto" },
    { city_name: "Victoria", country: "Canada", timezone: "America/Vancouver" },
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
    { airport_code: "YYC", city_name: "Calgary", airport_name: "Calgary International Airport" },
    { airport_code: "YEG", city_name: "Edmonton", airport_name: "Edmonton International Airport" },
    { airport_code: "YHZ", city_name: "Halifax", airport_name: "Halifax Stanfield International Airport" },
    { airport_code: "YWG", city_name: "Winnipeg", airport_name: "Winnipeg James Armstrong Richardson International Airport" },
    { airport_code: "YQB", city_name: "Quebec City", airport_name: "Jean Lesage International Airport" },
    { airport_code: "YYJ", city_name: "Victoria", airport_name: "Victoria International Airport" },
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

  const routeMap: Record<string, number> = {};
  const airportCodes = airports.map((airport) => airport.airport_code);

  const routes: Array<{ origin_airport_code: string; destination_airport_code: string }> = [];

  for (const origin of airportCodes) {
    for (const destination of airportCodes) {
      if (origin === destination) continue;
      routes.push({ origin_airport_code: origin, destination_airport_code: destination });
    }
  }

  for (const route of routes) {
    const existing = await prisma.route.findFirst({
      where: route,
    });

    if (!existing) {
      const created = await prisma.route.create({
        data: route,
      });
      routeMap[`${route.origin_airport_code}_${route.destination_airport_code}`] = created.route_id;
    } else {
      routeMap[`${route.origin_airport_code}_${route.destination_airport_code}`] = existing.route_id;
    }
  }
  console.log(`Created or verified ${routes.length} routes (fully connected network)`);

  // ============================================
  // 6. Create Flights with Seats
  // ============================================
  console.log("\nCreating flights...");

  type SeatClass = "first" | "business" | "economy";

  const SEAT_LETTERS = ["A", "B", "C", "D", "E", "F"];
  const ROW_COUNT = 6;
  const seatCapacityPerFlight = ROW_COUNT * SEAT_LETTERS.length; // 36 seats per flight

  // Helper to generate seat data (2 rows per class, 6 columns)
  const generateSeats = (flightId: number) => {
    const priceModifierByClass: Record<SeatClass, number> = {
      first: 2.0,
      business: 1.5,
      economy: 1.0,
    };

    const seats: Array<{
      flight_id: number;
      seat_number: string;
      class: SeatClass;
      price_modifier: number;
      is_available: boolean;
    }> = [];

    for (let row = 1; row <= ROW_COUNT; row++) {
      let seatClass: SeatClass;
      if (row <= 2) {
        seatClass = "first";
      } else if (row <= 4) {
        seatClass = "business";
      } else {
        seatClass = "economy";
      }

      for (const letter of SEAT_LETTERS) {
        seats.push({
          flight_id: flightId,
          seat_number: `${row}${letter}`,
          class: seatClass,
          price_modifier: priceModifierByClass[seatClass],
          is_available: true,
        });
      }
    }

    return seats;
  };

  const routePriceReference: Record<string, number> = {
    YEG_YHZ: 354.59,
    YEG_YOW: 287.94,
    YEG_YQB: 304.01,
    YEG_YUL: 297.5,
    YEG_YVR: 124.7,
    YEG_YWG: 154.94,
    YEG_YYC: 79.68,
    YEG_YYJ: 128.93,
    YEG_YYZ: 275.15,
    YHZ_YEG: 354.59,
    YHZ_YOW: 136.38,
    YHZ_YQB: 111.71,
    YHZ_YUL: 124.33,
    YHZ_YVR: 414.31,
    YHZ_YWG: 266.13,
    YHZ_YYC: 359.61,
    YHZ_YYJ: 417.2,
    YHZ_YYZ: 163.02,
    YOW_YEG: 287.94,
    YOW_YHZ: 136.38,
    YOW_YQB: 89.45,
    YOW_YUL: 72.12,
    YOW_YVR: 344.13,
    YOW_YWG: 195.08,
    YOW_YYC: 290.28,
    YOW_YYJ: 346.58,
    YOW_YYZ: 89.05,
    YQB_YEG: 304.01,
    YQB_YHZ: 111.71,
    YQB_YOW: 89.45,
    YQB_YUL: 78.64,
    YQB_YVR: 362.96,
    YQB_YWG: 214.49,
    YQB_YYC: 308.38,
    YQB_YYJ: 365.76,
    YQB_YYZ: 118.49,
    YUL_YEG: 297.5,
    YUL_YHZ: 124.33,
    YUL_YOW: 72.12,
    YUL_YQB: 78.64,
    YUL_YVR: 354.54,
    YUL_YWG: 205.47,
    YUL_YYC: 300.44,
    YUL_YYJ: 357.09,
    YUL_YYZ: 100.54,
    YVR_YEG: 124.7,
    YVR_YHZ: 414.31,
    YVR_YOW: 344.13,
    YVR_YQB: 362.96,
    YVR_YUL: 354.54,
    YVR_YWG: 209.08,
    YVR_YYC: 114.88,
    YVR_YYJ: 65.09,
    YVR_YYZ: 327.64,
    YWG_YEG: 154.94,
    YWG_YHZ: 266.13,
    YWG_YOW: 195.08,
    YWG_YQB: 214.49,
    YWG_YUL: 205.47,
    YWG_YVR: 209.08,
    YWG_YYC: 155.31,
    YWG_YYJ: 211.63,
    YWG_YYZ: 180.35,
    YYC_YEG: 79.68,
    YYC_YHZ: 359.61,
    YYC_YOW: 290.28,
    YYC_YQB: 308.38,
    YYC_YUL: 300.44,
    YYC_YVR: 114.88,
    YYC_YWG: 155.31,
    YYC_YYJ: 118.19,
    YYC_YYZ: 275.16,
    YYJ_YEG: 128.93,
    YYJ_YHZ: 417.2,
    YYJ_YOW: 346.58,
    YYJ_YQB: 365.76,
    YYJ_YUL: 357.09,
    YYJ_YVR: 65.09,
    YYJ_YWG: 211.63,
    YYJ_YYC: 118.19,
    YYJ_YYZ: 329.68,
    YYZ_YEG: 275.15,
    YYZ_YHZ: 163.02,
    YYZ_YOW: 89.05,
    YYZ_YQB: 118.49,
    YYZ_YUL: 100.54,
    YYZ_YVR: 327.64,
    YYZ_YWG: 180.35,
    YYZ_YYC: 275.16,
    YYZ_YYJ: 329.68,
  };

  const airportMeta: Record<
    string,
    {
      lat: number;
      lon: number;
      defaultAirline: "FP" | "AC";
    }
  > = {
    YYZ: { lat: 43.6777, lon: -79.6248, defaultAirline: "FP" },
    YVR: { lat: 49.1951, lon: -123.1779, defaultAirline: "FP" },
    YUL: { lat: 45.4706, lon: -73.7408, defaultAirline: "AC" },
    YOW: { lat: 45.3208, lon: -75.6692, defaultAirline: "AC" },
    YYC: { lat: 51.1139, lon: -114.0203, defaultAirline: "FP" },
    YEG: { lat: 53.3097, lon: -113.579, defaultAirline: "FP" },
    YHZ: { lat: 44.8848, lon: -63.5147, defaultAirline: "AC" },
    YWG: { lat: 49.9097, lon: -97.2399, defaultAirline: "FP" },
    YQB: { lat: 46.7911, lon: -71.3933, defaultAirline: "AC" },
    YYJ: { lat: 48.6469, lon: -123.4258, defaultAirline: "FP" },
  };

  const toRadians = (degrees: number) => (degrees * Math.PI) / 180;

  const calculateDistanceKm = (originCode: string, destinationCode: string) => {
    const origin = airportMeta[originCode];
    const destination = airportMeta[destinationCode];

    if (!origin || !destination) {
      throw new Error(`Missing coordinate metadata for route ${originCode} -> ${destinationCode}`);
    }

    const EARTH_RADIUS_KM = 6371;

    const lat1 = toRadians(origin.lat);
    const lon1 = toRadians(origin.lon);
    const lat2 = toRadians(destination.lat);
    const lon2 = toRadians(destination.lon);

    const deltaLat = lat2 - lat1;
    const deltaLon = lon2 - lon1;

    const a =
      Math.sin(deltaLat / 2) ** 2 +
      Math.cos(lat1) * Math.cos(lat2) * Math.sin(deltaLon / 2) ** 2;
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return EARTH_RADIUS_KM * c;
  };

  const estimateDurationMinutes = (distanceKm: number) => {
    const averageCruiseSpeedKmPerMin = 800 / 60; // ~800 km/h
    const cruiseMinutes = distanceKm / averageCruiseSpeedKmPerMin;
    const bufferMinutes = 25; // taxi + takeoff/landing
    return Math.max(50, Math.round(cruiseMinutes + bufferMinutes));
  };

  const estimateBasePriceFallback = (distanceKm: number) => {
    let base: number;

    if (distanceKm <= 400) {
      base = 149 + distanceKm * 0.2;
    } else if (distanceKm <= 1000) {
      base = 199 + distanceKm * 0.18;
    } else if (distanceKm <= 2000) {
      base = 249 + distanceKm * 0.17;
    } else {
      base = 299 + distanceKm * 0.15;
    }

    // Slight fluctuation to avoid identical round-trip prices
    const variability = 5 + (distanceKm % 20);
    base += variability;

    return Number(Math.round(base * 100) / 100);
  };

  const getBasePrice = (originCode: string, destinationCode: string, distanceKm: number) => {
    const key = `${originCode}_${destinationCode}`;
    return routePriceReference[key] ?? estimateBasePriceFallback(distanceKm);
  };

  const getRouteConfig = (originCode: string, destinationCode: string) => {
    const distanceKm = calculateDistanceKm(originCode, destinationCode);
    let durationMinutes = estimateDurationMinutes(distanceKm);
    const base_price = getBasePrice(originCode, destinationCode, distanceKm);
    const originMeta = airportMeta[originCode];
    const destinationMeta = airportMeta[destinationCode];

    if (originMeta && destinationMeta) {
      if (originMeta.lon < destinationMeta.lon - 0.2) {
        // West → East tends to be faster due to prevailing winds
        durationMinutes = Math.max(45, Math.round(durationMinutes * 0.96));
      } else if (originMeta.lon > destinationMeta.lon + 0.2) {
        // East → West usually takes a bit longer
        durationMinutes = Math.max(45, Math.round(durationMinutes * 1.04));
      }
    }

    const airline_code = originMeta?.defaultAirline ?? "AC";

    return { airline_code, durationMinutes, base_price };
  };

  const DAY_IN_MS = 24 * 60 * 60 * 1000;

  const dateRangeStart = new Date(2025, 10, 27); // November 27, 2025
  const dateRangeEnd = new Date(2025, 11, 11); // December 11, 2025

  const travelDates: Date[] = [];
  for (let date = new Date(dateRangeStart); date <= dateRangeEnd; date = new Date(date.getTime() + DAY_IN_MS)) {
    travelDates.push(new Date(date));
  }

  const dailyDepartureTemplates = [
    { hour: 8, minute: 0 },
    { hour: 17, minute: 30 },
  ];

  const flightsToCreate: Array<{
    route_id: number;
    airline_code: string;
    departure_time: Date;
    arrival_time: Date;
    base_price: number;
    seat_capacity: number;
  }> = [];

  for (const route of routes) {
    const routeKey = `${route.origin_airport_code}_${route.destination_airport_code}`;
    const config = getRouteConfig(route.origin_airport_code, route.destination_airport_code);

    for (const travelDate of travelDates) {
      for (const template of dailyDepartureTemplates) {
        const departureTime = new Date(travelDate.getTime());
        departureTime.setHours(template.hour, template.minute, 0, 0);

        const arrivalTime = new Date(departureTime.getTime() + config.durationMinutes * 60 * 1000);

        flightsToCreate.push({
          route_id: routeMap[routeKey]!,
          airline_code: config.airline_code,
          departure_time: departureTime,
          arrival_time: arrivalTime,
          base_price: config.base_price,
          seat_capacity: seatCapacityPerFlight,
        });
      }
    }
  }

  let flightCount = 0;
  for (const flightData of flightsToCreate) {
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

      const seats = generateSeats(flight.flight_id);
      await prisma.seat.createMany({
        data: seats,
        skipDuplicates: true,
      });

      flightCount++;
    }
  }

  if (flightCount > 0) {
    console.log(
      `Created ${flightCount} flights with ${seatCapacityPerFlight} seats each between ${dateRangeStart.toDateString()} and ${dateRangeEnd.toDateString()}`
    );
  } else {
    console.log("Flights already exist for the specified date range");
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
  console.log(
    `Flights scheduled: ${flightsToCreate.length} (2 per direction per day with ${seatCapacityPerFlight} seats each)`
  );
  console.log(
    `Flight date range: ${dateRangeStart.toDateString()} - ${dateRangeEnd.toDateString()}`
  );
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
