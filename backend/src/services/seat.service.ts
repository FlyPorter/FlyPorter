import { prisma } from "../config/prisma.js";
import type { SeatClass } from "@prisma/client";

export async function listSeatsByFlight(flight_id: number) {
  return prisma.seat.findMany({
    where: { flight_id },
    orderBy: [{ seat_number: "asc" }],
    select: {
      flight_id: true,
      seat_number: true,
      class: true,
      price_modifier: true,
      is_available: true,
    },
  });
}

export async function getSeat(flight_id: number, seat_number: string) {
  return prisma.seat.findUnique({
    where: { flight_id_seat_number: { flight_id, seat_number } },
    select: {
      flight_id: true,
      seat_number: true,
      class: true,
      price_modifier: true,
      is_available: true,
    },
  });
}

export async function updateSeat(
  flight_id: number,
  seat_number: string,
  input: Partial<{ class: SeatClass; is_available: boolean; price_modifier: number }>
) {
  const data: any = {};
  if (input.class) data.class = input.class;
  if (input.is_available !== undefined) data.is_available = input.is_available;
  if (input.price_modifier !== undefined) data.price_modifier = input.price_modifier;

  return prisma.seat.update({
    where: { flight_id_seat_number: { flight_id, seat_number } },
    data,
    select: {
      flight_id: true,
      seat_number: true,
      class: true,
      price_modifier: true,
      is_available: true,
    },
  });
}
