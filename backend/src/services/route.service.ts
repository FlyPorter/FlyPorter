import { prisma } from "../config/prisma.js";

export interface CreateRouteInput {
  origin_airport_code: string;
  destination_airport_code: string;
}

export async function createRoute(input: CreateRouteInput) {
  const origin = input.origin_airport_code?.toUpperCase();
  const dest = input.destination_airport_code?.toUpperCase();
  if (!origin || !dest) throw new Error("origin_airport_code and destination_airport_code are required");
  if (origin === dest) throw new Error("origin and destination cannot be the same");

  // Ensure airports exist
  const [originAirport, destAirport] = await Promise.all([
    prisma.airport.findUnique({ where: { airport_code: origin } }),
    prisma.airport.findUnique({ where: { airport_code: dest } }),
  ]);
  if (!originAirport) throw new Error(`Origin airport not found: ${origin}`);
  if (!destAirport) throw new Error(`Destination airport not found: ${dest}`);

  return prisma.route.create({
    data: {
      origin_airport_code: origin,
      destination_airport_code: dest,
    },
    select: {
      route_id: true,
      origin_airport_code: true,
      destination_airport_code: true,
      origin_airport: { select: { airport_code: true, airport_name: true, city_name: true } },
      destination_airport: { select: { airport_code: true, airport_name: true, city_name: true } },
    },
  });
}

export async function listRoutes() {
  return prisma.route.findMany({
    orderBy: { route_id: "asc" },
    select: {
      route_id: true,
      origin_airport_code: true,
      destination_airport_code: true,
      origin_airport: { select: { airport_code: true, airport_name: true, city_name: true } },
      destination_airport: { select: { airport_code: true, airport_name: true, city_name: true } },
    },
  });
}

export async function getRouteById(route_id: number) {
  return prisma.route.findUnique({
    where: { route_id },
    select: {
      route_id: true,
      origin_airport_code: true,
      destination_airport_code: true,
      origin_airport: { select: { airport_code: true, airport_name: true, city_name: true } },
      destination_airport: { select: { airport_code: true, airport_name: true, city_name: true } },
    },
  });
}

export async function updateRouteById(
  route_id: number,
  input: { origin_airport_code?: string; destination_airport_code?: string }
) {
  const origin = input.origin_airport_code?.toUpperCase();
  const dest = input.destination_airport_code?.toUpperCase();

  // At least one field must be provided
  if (!origin && !dest) {
    throw new Error("At least one of origin_airport_code or destination_airport_code is required");
  }

  // If both provided, they cannot be the same
  if (origin && dest && origin === dest) {
    throw new Error("origin and destination cannot be the same");
  }

  // Check if route exists
  const existingRoute = await prisma.route.findUnique({ where: { route_id } });
  if (!existingRoute) {
    throw new Error("Route not found");
  }

  // Prepare update data
  const updateData: { origin_airport_code?: string; destination_airport_code?: string } = {};
  if (origin) updateData.origin_airport_code = origin;
  if (dest) updateData.destination_airport_code = dest;

  // Ensure airports exist if they are being updated
  if (origin) {
    const originAirport = await prisma.airport.findUnique({ where: { airport_code: origin } });
    if (!originAirport) throw new Error(`Origin airport not found: ${origin}`);
  }
  if (dest) {
    const destAirport = await prisma.airport.findUnique({ where: { airport_code: dest } });
    if (!destAirport) throw new Error(`Destination airport not found: ${dest}`);
  }

  return prisma.route.update({
    where: { route_id },
    data: updateData,
    select: {
      route_id: true,
      origin_airport_code: true,
      destination_airport_code: true,
      origin_airport: { select: { airport_code: true, airport_name: true, city_name: true } },
      destination_airport: { select: { airport_code: true, airport_name: true, city_name: true } },
    },
  });
}

export async function deleteRouteById(route_id: number) {
  return prisma.route.delete({
    where: { route_id },
    select: { route_id: true, origin_airport_code: true, destination_airport_code: true },
  });
}

