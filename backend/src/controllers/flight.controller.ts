import type { Request, Response } from "express";
import type { FlightSearchFilters } from "../services/flight.service.js";
import { createFlight, listFlights, getFlightById, deleteFlightById, updateFlightById, searchFlights } from "../services/flight.service.js";
import { sendSuccess, sendError } from "../utils/response.util.js";

export async function searchFlightsHandler(req: Request, res: Response) {
  const parsed = parseFlightSearchQuery(req.query);
  if ("error" in parsed) {
    return sendError(res, parsed.error, 400);
  }

  try {
    const results = await searchFlights(parsed.filters);
    return sendSuccess(res, results);
  } catch (e: any) {
    const msg = e?.message || "Failed to search flights";
    return sendError(res, msg, 500);
  }
}

export async function createFlightHandler(req: Request, res: Response) {
  try {
    const created = await createFlight(req.body || {});
    return sendSuccess(res, created, "Flight created", 201);
  } catch (e: any) {
    const msg = e?.message || "Failed to create flight";
    return sendError(res, msg, 400);
  }
}

export async function listFlightsHandler(_req: Request, res: Response) {
  const items = await listFlights();
  return sendSuccess(res, items);
}

export async function getFlightHandler(req: Request, res: Response) {
  const idParam = req.params.id;
  const id = Number(idParam);
  if (!idParam || Number.isNaN(id)) return sendError(res, "valid id is required", 400);
  const item = await getFlightById(id);
  if (!item) return sendError(res, "Flight not found", 404);
  return sendSuccess(res, item);
}

export async function updateFlightHandler(req: Request, res: Response) {
  const idParam = req.params.id;
  const id = Number(idParam);
  if (!idParam || Number.isNaN(id)) return sendError(res, "valid id is required", 400);
  try {
    const updated = await updateFlightById(id, req.body || {});
    return sendSuccess(res, updated, "Flight updated");
  } catch (e: any) {
    const msg = e?.message || "Failed to update flight";
    const status = msg.includes("does not exist") ? 404 : 400;
    return sendError(res, msg, status);
  }
}

export async function deleteFlightHandler(req: Request, res: Response) {
  const idParam = req.params.id;
  const id = Number(idParam);
  if (!idParam || Number.isNaN(id)) return sendError(res, "valid id is required", 400);
  try {
    const deleted = await deleteFlightById(id);
    return sendSuccess(res, deleted, "Flight deleted");
  } catch (e: any) {
    const msg = e?.message || "Failed to delete flight";
    const status = msg.includes("does not exist") ? 404 : 400;
    return sendError(res, msg, status);
  }
}

function parseFlightSearchQuery(query: Request["query"]): { filters: FlightSearchFilters } | { error: string } {
  const departureAirportRaw = getSingleQueryValue(query.departure_airport);
  const destinationAirportRaw = getSingleQueryValue(query.destination_airport);
  const dateRaw = getSingleQueryValue(query.date);
  const minPriceRaw = getSingleQueryValue(query.min_price);
  const maxPriceRaw = getSingleQueryValue(query.max_price);
  const minDurationRaw = getSingleQueryValue(query.min_duration);
  const maxDurationRaw = getSingleQueryValue(query.max_duration);
  const minDepartureTimeRaw = getSingleQueryValue(query.min_departure_time);
  const maxDepartureTimeRaw = getSingleQueryValue(query.max_departure_time);

  const filters: FlightSearchFilters = {};

  if (departureAirportRaw) {
    const airport = departureAirportRaw.toUpperCase();
    if (!AIRPORT_CODE_REGEX.test(airport)) {
      return { error: "departure_airport must be a 3-letter airport code" };
    }
    filters.departureAirport = airport;
  }

  if (destinationAirportRaw) {
    const airport = destinationAirportRaw.toUpperCase();
    if (!AIRPORT_CODE_REGEX.test(airport)) {
      return { error: "destination_airport must be a 3-letter airport code" };
    }
    filters.destinationAirport = airport;
  }

  if (dateRaw) {
    if (!DATE_REGEX.test(dateRaw)) {
      return { error: "date must be in YYYY-MM-DD format" };
    }
    const range = buildDateRange(dateRaw);
    if (!range) {
      return { error: "date is invalid" };
    }
    filters.departureDateRange = range;
  }

  if (minPriceRaw !== undefined) {
    const parsed = parseNonNegativeNumber(minPriceRaw);
    if (parsed === null) {
      return { error: "min_price must be a non-negative number" };
    }
    filters.minPrice = parsed;
  }

  if (maxPriceRaw !== undefined) {
    const parsed = parseNonNegativeNumber(maxPriceRaw);
    if (parsed === null) {
      return { error: "max_price must be a non-negative number" };
    }
    filters.maxPrice = parsed;
  }

  if (
    filters.minPrice != null &&
    filters.maxPrice != null &&
    filters.minPrice > filters.maxPrice
  ) {
    return { error: "min_price cannot be greater than max_price" };
  }

  if (minDurationRaw !== undefined) {
    const parsed = parseNonNegativeInteger(minDurationRaw);
    if (parsed === null) {
      return { error: "min_duration must be a non-negative integer" };
    }
    filters.minDurationMinutes = parsed;
  }

  if (maxDurationRaw !== undefined) {
    const parsed = parseNonNegativeInteger(maxDurationRaw);
    if (parsed === null) {
      return { error: "max_duration must be a non-negative integer" };
    }
    filters.maxDurationMinutes = parsed;
  }

  if (
    filters.minDurationMinutes != null &&
    filters.maxDurationMinutes != null &&
    filters.minDurationMinutes > filters.maxDurationMinutes
  ) {
    return { error: "min_duration cannot be greater than max_duration" };
  }

  if (minDepartureTimeRaw !== undefined) {
    const parsed = parseTimeToMinutes(minDepartureTimeRaw);
    if (parsed === null) {
      return { error: "min_departure_time must be in HH:mm (24-hour) format" };
    }
    filters.minDepartureMinutes = parsed;
  }

  if (maxDepartureTimeRaw !== undefined) {
    const parsed = parseTimeToMinutes(maxDepartureTimeRaw);
    if (parsed === null) {
      return { error: "max_departure_time must be in HH:mm (24-hour) format" };
    }
    filters.maxDepartureMinutes = parsed;
  }

  if (
    filters.minDepartureMinutes != null &&
    filters.maxDepartureMinutes != null &&
    filters.minDepartureMinutes > filters.maxDepartureMinutes
  ) {
    return { error: "min_departure_time cannot be greater than max_departure_time" };
  }

  return { filters };
}

const AIRPORT_CODE_REGEX = /^[A-Z]{3}$/;
const DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;
const TIME_REGEX = /^([01]\d|2[0-3]):([0-5]\d)$/;

function getSingleQueryValue(
  value: Request["query"][string]
): string | undefined {
  if (Array.isArray(value)) {
    for (const item of value) {
      if (typeof item === "string") {
        const trimmedItem = item.trim();
        if (trimmedItem.length > 0) {
          return trimmedItem;
        }
      }
    }
    return undefined;
  }
  if (typeof value === "string") {
    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : undefined;
  }
  return undefined;
}

function buildDateRange(date: string): FlightSearchFilters["departureDateRange"] | null {
  const start = new Date(`${date}T00:00:00.000Z`);
  if (Number.isNaN(start.getTime())) return null;
  const end = new Date(start.getTime() + 24 * 60 * 60 * 1000);
  return { start, end };
}

function parseNonNegativeNumber(value: string): number | null {
  if (value.trim().length === 0) return null;
  const num = Number(value);
  if (!Number.isFinite(num) || num < 0) return null;
  return num;
}

function parseNonNegativeInteger(value: string): number | null {
  if (!/^\d+$/.test(value)) return null;
  const num = Number.parseInt(value, 10);
  if (Number.isNaN(num)) return null;
  return num;
}

function parseTimeToMinutes(value: string): number | null {
  const match = TIME_REGEX.exec(value);
  if (!match) return null;
  const hours = Number(match[1]);
  const minutes = Number(match[2]);
  return hours * 60 + minutes;
}
