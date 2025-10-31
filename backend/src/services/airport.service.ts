import { prisma } from "../config/prisma.js";

export interface CreateAirportInput {
  airport_code: string;
  airport_name: string;
  city_name: string;
}

export async function ensureCityExists(city_name: string) {
  const name = city_name;
  return prisma.city.upsert({
    where: { city_name: name },
    update: {},
    create: { city_name: name },
  });
}

export async function createAirport(input: CreateAirportInput) {
  const code = input.airport_code?.toUpperCase();
  const name = input.airport_name;
  const city = input.city_name;

  if (!code || !name || !city) {
    throw new Error("airport_code, airport_name and city_name are required");
  }

  await ensureCityExists(city);

  return prisma.airport.create({
    data: { airport_code: code, airport_name: name, city_name: city },
    select: { airport_code: true, airport_name: true, city_name: true, created_at: true },
  });
}

export async function listAirports() {
  return prisma.airport.findMany({
    orderBy: { airport_code: "asc" },
    select: { airport_code: true, airport_name: true, city_name: true, created_at: true },
  });
}

export async function getAirportByCode(code: string) {
  return prisma.airport.findUnique({
    where: { airport_code: code.toUpperCase() },
    select: { airport_code: true, airport_name: true, city_name: true, created_at: true },
  });
}

export async function updateAirportName(code: string, airport_name: string) {
  return prisma.airport.update({
    where: { airport_code: code.toUpperCase() },
    data: { airport_name },
    select: { airport_code: true, airport_name: true, city_name: true, created_at: true },
  });
}

export async function deleteAirport(code: string) {
  return prisma.airport.delete({
    where: { airport_code: code.toUpperCase() },
    select: { airport_code: true, airport_name: true, city_name: true, created_at: true },
  });
}
