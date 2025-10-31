import { prisma } from "../config/prisma.js";

export async function listAirlines() {
  return prisma.airline.findMany({
    orderBy: { airline_code: "asc" },
    select: { airline_code: true, airline_name: true, created_at: true },
  });
}

export async function getAirlineByCode(code: string) {
  return prisma.airline.findUnique({
    where: { airline_code: code },
    select: { airline_code: true, airline_name: true, created_at: true },
  });
}

export async function createAirline(input: { airline_code: string; airline_name: string }) {
  return prisma.airline.create({
    data: { airline_code: input.airline_code, airline_name: input.airline_name },
    select: { airline_code: true, airline_name: true, created_at: true },
  });
}

export async function updateAirline(code: string, input: { airline_name: string }) {
  return prisma.airline.update({
    where: { airline_code: code },
    data: { airline_name: input.airline_name },
    select: { airline_code: true, airline_name: true, created_at: true },
  });
}

export async function deleteAirline(code: string) {
  return prisma.airline.delete({
    where: { airline_code: code },
    select: { airline_code: true, airline_name: true, created_at: true },
  });
}
