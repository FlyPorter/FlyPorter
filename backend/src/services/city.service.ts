import { prisma } from "../config/prisma.js";

export interface CreateCityInput {
  city_name: string;
  country?: string | null;
  timezone?: string | null;
}

export async function createCity(input: CreateCityInput) {
  return prisma.city.create({
    data: {
      city_name: input.city_name,
      country: input.country ?? null,
      timezone: input.timezone ?? null,
    },
    select: { city_name: true, country: true, timezone: true, created_at: true },
  });
}

export async function listCities() {
  return prisma.city.findMany({
    orderBy: { city_name: "asc" },
    select: { city_name: true, country: true, timezone: true, created_at: true },
  });
}

export async function getCityByName(name: string) {
  return prisma.city.findFirst({
    where: { city_name: { equals: name, mode: "insensitive" } },
    select: {
      city_name: true,
      country: true,
      timezone: true,
      created_at: true,
      airports: {
        select: {
          airport_code: true,
          airport_name: true,
          created_at: true,
        },
        orderBy: { airport_code: "asc" },
      },
    },
  });
}

export async function deleteCityByName(name: string) {
  return prisma.city.deleteMany({
    where: { city_name: { equals: name, mode: "insensitive" } },
  });
}
