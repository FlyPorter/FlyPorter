import type { Request, Response } from "express";
import { sendSuccess, sendError } from "../utils/response.util.js";
import { createFlight, listFlights, getFlightById, deleteFlightById, updateFlightById } from "../services/flight.service.js";

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
