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

export async function deleteRouteById(route_id: number) {
  return prisma.route.delete({
    where: { route_id },
    select: { route_id: true, origin_airport_code: true, destination_airport_code: true },
  });
}
