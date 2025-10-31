import { PrismaClient, Prisma } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seeding...');

  // Cities
  console.log('📍 Seeding cities...');
  await prisma.city.createMany({
    data: [
      { city_name: 'Toronto', country: 'Canada', timezone: 'America/Toronto' },
      { city_name: 'Vancouver', country: 'Canada', timezone: 'America/Vancouver' },
      { city_name: 'Montréal', country: 'Canada', timezone: 'America/Toronto' },
    ],
    skipDuplicates: true,
  });

  // Airports
  console.log('✈️  Seeding airports...');
  await prisma.airport.createMany({
    data: [
      {
        airport_code: 'YYZ',
        city_name: 'Toronto',
        airport_name: 'Toronto Pearson International Airport',
      },
      {
        airport_code: 'YVR',
        city_name: 'Vancouver',
        airport_name: 'Vancouver International Airport',
      },
      {
        airport_code: 'YUL',
        city_name: 'Montréal',
        airport_name: 'Montréal–Trudeau International Airport',
      },
    ],
    skipDuplicates: true,
  });

  // Airlines
  console.log('🛫 Seeding airlines...');
  await prisma.airline.createMany({
    data: [
      { airline_code: 'AC', airline_name: 'Air Canada' },
      { airline_code: 'WS', airline_name: 'WestJet' },
    ],
    skipDuplicates: true,
  });

  // Routes
  console.log('🗺️  Seeding routes...');
  const routes = await Promise.all([
    prisma.route.upsert({
      where: { route_id: 1 },
      update: {},
      create: {
        origin_airport_code: 'YYZ',
        destination_airport_code: 'YVR',
      },
    }),
    prisma.route.upsert({
      where: { route_id: 2 },
      update: {},
      create: {
        origin_airport_code: 'YYZ',
        destination_airport_code: 'YUL',
      },
    }),
  ]);

  // Flights for next 3 days
  console.log('🛩️  Seeding flights...');
  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);

  for (let day = 1; day <= 3; day++) {
    for (const route of routes) {
      const departureTime = new Date(today);
      departureTime.setUTCDate(today.getUTCDate() + day);
      departureTime.setUTCHours(9, 0, 0, 0);

      const arrivalTime = new Date(departureTime);
      arrivalTime.setUTCHours(12, 0, 0, 0);

      const flight = await prisma.flight.create({
        data: {
          route_id: route.route_id,
          airline_code: 'AC',
          departure_time: departureTime,
          arrival_time: arrivalTime,
          base_price: 199.0,
          seat_capacity: 120,
        },
      });

      // Create seats for this flight
      console.log(`  💺 Creating seats for flight ${flight.flight_id}...`);
      const seats: Array<{
        flight_id: number;
        seat_number: string;
        class: 'business' | 'economy' | 'first';
        price_modifier: number;
        is_available: boolean;
      }> = [];
      const letters = ['A', 'B', 'C', 'D', 'E', 'F'];
      
      for (let row = 1; row <= 20; row++) {
        for (const letter of letters) {
          const seatNumber = `${row}${letter}`;
          const isBusinessClass = row <= 3;
          
          seats.push({
            flight_id: flight.flight_id,
            seat_number: seatNumber,
            class: isBusinessClass ? 'business' : 'economy',
            price_modifier: isBusinessClass ? 1.8 : 1.0,
            is_available: true,
          });
        }
      }

      await prisma.seat.createMany({
        data: seats,
        skipDuplicates: true,
      });
    }
  }

  // Demo user
  console.log('👤 Seeding demo user...');
  const passwordHash = await bcrypt.hash('demo123', 10);
  
  const user = await prisma.user.upsert({
    where: { email: 'demo@example.com' },
    update: {},
    create: {
      role: 'customer',
      email: 'demo@example.com',
      password_hash: passwordHash,
    },
  });

  await prisma.customerInfo.upsert({
    where: { user_id: user.user_id },
    update: {},
    create: {
      user_id: user.user_id,
      full_name: 'Demo User',
      phone: '+1-000-000-0000',
      passport_number: 'DEMO123456',
      date_of_birth: new Date('1990-01-01'),
      emergency_contact_name: 'Emergency Contact',
      emergency_contact_phone: '+1-000-000-0001',
    },
  });

  console.log('✅ Database seeding completed!');
  console.log('📊 Summary:');
  console.log('  - 3 cities');
  console.log('  - 3 airports');
  console.log('  - 2 airlines');
  console.log('  - 2 routes');
  console.log('  - 6 flights (3 days × 2 routes)');
  console.log('  - 720 seats (120 seats × 6 flights)');
  console.log('  - 1 demo user (email: demo@example.com, password: demo123)');
}

main()
  .catch((e) => {
    console.error('❌ Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

