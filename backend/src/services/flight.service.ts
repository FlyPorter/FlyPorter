import { prisma } from "../config/prisma.js";

export interface CreateFlightByRouteIdInput {
  route_id?: number;
  origin_airport_code?: string;
  destination_airport_code?: string;
  airline_code: string;
  departure_time: string; // ISO
  arrival_time: string;   // ISO
  base_price: string | number; // Prisma accepts string/number for Decimal
  seat_capacity: number;
}

const SEAT_LETTERS = ["A", "B", "C", "D", "E", "F"] as const;
const PRICE_MODIFIER = {
  first: 2.0,
  business: 1.5,
  economy: 1.0,
} as const;

function formatDuration(departure: Date, arrival: Date): string {
  const diffMs = arrival.getTime() - departure.getTime();
  const totalMinutes = Math.floor(diffMs / (1000 * 60));
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  const parts: string[] = [];
  if (hours > 0) parts.push(`${hours}h`);
  if (minutes > 0) parts.push(`${minutes}m`);
  return parts.length > 0 ? parts.join(" ") : "0m";
}

async function findOrCreateRoute(params: { origin_airport_code: string; destination_airport_code: string; }) {
  const origin = params.origin_airport_code.toUpperCase();
  const dest = params.destination_airport_code.toUpperCase();
  if (origin === dest) throw new Error("origin and destination cannot be the same");

  // Ensure airports exist
  const [originAirport, destAirport] = await Promise.all([
    prisma.airport.findUnique({ where: { airport_code: origin } }),
    prisma.airport.findUnique({ where: { airport_code: dest } }),
  ]);
  if (!originAirport) throw new Error(`Origin airport not found: ${origin}`);
  if (!destAirport) throw new Error(`Destination airport not found: ${dest}`);

  // Try find existing route
  const existing = await prisma.route.findFirst({
    where: { origin_airport_code: origin, destination_airport_code: dest },
    select: { route_id: true },
  });
  if (existing) return existing.route_id;

  const created = await prisma.route.create({
    data: { origin_airport_code: origin, destination_airport_code: dest },
    select: { route_id: true },
  });
  return created.route_id;
}

function seatClassForRow(row: number): "first" | "business" | "economy" {
  if (row <= 2) return "first";
  if (row <= 6) return "business";
  return "economy";
}

async function generateSeatsForFlight(flightId: number, seatCapacity: number) {
  const totalRows = Math.ceil(seatCapacity / SEAT_LETTERS.length);
  const seats: Array<{ flight_id: number; seat_number: string; class: "first" | "business" | "economy"; price_modifier: number; is_available: boolean; }> = [];

  let createdCount = 0;
  for (let row = 1; row <= totalRows && createdCount < seatCapacity; row++) {
    const seatClass = seatClassForRow(row);
    const modifier = PRICE_MODIFIER[seatClass];
    for (let i = 0; i < SEAT_LETTERS.length && createdCount < seatCapacity; i++) {
      const seat_number = `${row}${SEAT_LETTERS[i]}`;
      seats.push({
        flight_id: flightId,
        seat_number,
        class: seatClass,
        price_modifier: modifier,
        is_available: true,
      });
      createdCount++;
    }
  }

  if (seats.length > 0) {
    await prisma.seat.createMany({ data: seats });
  }
}

export async function createFlight(input: CreateFlightByRouteIdInput) {
  const { route_id, origin_airport_code, destination_airport_code, airline_code } = input;
  if (!airline_code) throw new Error("airline_code is required");
  if (!input.departure_time || !input.arrival_time) throw new Error("departure_time and arrival_time are required");
  if (!input.base_price && input.base_price !== 0) throw new Error("base_price is required");
  if (!input.seat_capacity || input.seat_capacity <= 0) throw new Error("seat_capacity must be > 0");

  // Ensure airline exists
  const airline = await prisma.airline.findUnique({ where: { airline_code: airline_code.toUpperCase() } });
  if (!airline) throw new Error(`Airline not found: ${airline_code}`);

  let resolvedRouteId: number | undefined = route_id;
  if (!resolvedRouteId) {
    if (!origin_airport_code || !destination_airport_code) {
      throw new Error("Provide either route_id or origin_airport_code and destination_airport_code");
    }
    resolvedRouteId = await findOrCreateRoute({
      origin_airport_code,
      destination_airport_code,
    });
  }

  const created = await prisma.flight.create({
    data: {
      route_id: resolvedRouteId!,
      airline_code: airline_code.toUpperCase(),
      departure_time: new Date(input.departure_time),
      arrival_time: new Date(input.arrival_time),
      base_price: input.base_price as any,
      seat_capacity: input.seat_capacity,
    },
    select: {
      flight_id: true,
      airline_code: true,
      departure_time: true,
      arrival_time: true,
      base_price: true,
      seat_capacity: true,
      route: {
        select: {
          route_id: true,
          origin_airport_code: true,
          destination_airport_code: true,
        },
      },
    },
  });

  await generateSeatsForFlight(created.flight_id, input.seat_capacity);

  return {
    ...created,
    duration: formatDuration(created.departure_time, created.arrival_time),
  };
}

export async function listFlights() {
  const flights = await prisma.flight.findMany({
    orderBy: { flight_id: "asc" },
    select: {
      flight_id: true,
      airline_code: true,
      departure_time: true,
      arrival_time: true,
      base_price: true,
      seat_capacity: true,
      route: {
        select: {
          route_id: true,
          origin_airport_code: true,
          destination_airport_code: true,
        },
      },
      airline: { select: { airline_code: true, airline_name: true } },
    },
  });
  return flights.map((f) => ({
    ...f,
    duration: formatDuration(f.departure_time, f.arrival_time),
  }));
}

export async function getFlightById(flight_id: number) {
  const flight = await prisma.flight.findUnique({
    where: { flight_id },
    select: {
      flight_id: true,
      airline_code: true,
      departure_time: true,
      arrival_time: true,
      base_price: true,
      seat_capacity: true,
      route: {
        select: {
          route_id: true,
          origin_airport_code: true,
          destination_airport_code: true,
        },
      },
      airline: { select: { airline_code: true, airline_name: true } },
    },
  });
  if (!flight) return null;
  return {
    ...flight,
    duration: formatDuration(flight.departure_time, flight.arrival_time),
  };
}

export async function updateFlightById(
  flight_id: number,
  input: Partial<{
    route_id: number;
    origin_airport_code: string;
    destination_airport_code: string;
    airline_code: string;
    departure_time: string; // ISO
    arrival_time: string;   // ISO
    base_price: string | number;
    seat_capacity: number;
  }>
) {
  const data: any = {};

  if (input.airline_code) {
    // Validate airline exists
    const airline = await prisma.airline.findUnique({ where: { airline_code: input.airline_code.toUpperCase() } });
    if (!airline) throw new Error(`Airline not found: ${input.airline_code}`);
    data.airline_code = input.airline_code.toUpperCase();
  }

  if (input.departure_time) data.departure_time = new Date(input.departure_time);
  if (input.arrival_time) data.arrival_time = new Date(input.arrival_time);
  if (input.base_price !== undefined) data.base_price = input.base_price as any;
  if (input.seat_capacity !== undefined) data.seat_capacity = input.seat_capacity;

  // Resolve route change if provided
  if (input.route_id) {
    data.route_id = input.route_id;
  } else if (input.origin_airport_code && input.destination_airport_code) {
    data.route_id = await findOrCreateRoute({
      origin_airport_code: input.origin_airport_code,
      destination_airport_code: input.destination_airport_code,
    });
  }

  const updated = await prisma.flight.update({
    where: { flight_id },
    data,
    select: {
      flight_id: true,
      airline_code: true,
      departure_time: true,
      arrival_time: true,
      base_price: true,
      seat_capacity: true,
      route: {
        select: {
          route_id: true,
          origin_airport_code: true,
          destination_airport_code: true,
        },
      },
    },
  });

  return {
    ...updated,
    duration: formatDuration(updated.departure_time, updated.arrival_time),
  };
}

export async function deleteFlightById(flight_id: number) {
  return prisma.flight.delete({
    where: { flight_id },
    select: { flight_id: true, airline_code: true },
  });
}
