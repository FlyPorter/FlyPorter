import type { Request, Response } from "express";
import { sendSuccess, sendError } from "../utils/response.util.js";
import { updateSeat, listSeatsByFlight, getSeat } from "../services/seat.service.js";

export async function listSeatsHandler(req: Request, res: Response) {
  const idParam = req.params.flight_id;
  const flight_id = Number(idParam);
  if (!idParam || Number.isNaN(flight_id)) return sendError(res, "valid flight_id is required", 400);
  const items = await listSeatsByFlight(flight_id);
  return sendSuccess(res, items);
}

export async function getSeatHandler(req: Request, res: Response) {
  const idParam = req.params.flight_id;
  const seat_number = req.params.seat_number || "";
  const flight_id = Number(idParam);
  if (!idParam || Number.isNaN(flight_id)) return sendError(res, "valid flight_id is required", 400);
  if (!seat_number) return sendError(res, "seat_number is required", 400);
  const item = await getSeat(flight_id, seat_number);
  if (!item) return sendError(res, "Seat not found", 404);
  return sendSuccess(res, item);
}

export async function updateSeatHandler(req: Request, res: Response) {
  const idParam = req.params.flight_id;
  const seat_number = req.params.seat_number || "";
  const flight_id = Number(idParam);
  if (!idParam || Number.isNaN(flight_id)) return sendError(res, "valid flight_id is required", 400);
  if (!seat_number) return sendError(res, "seat_number is required", 400);
  try {
    const updated = await updateSeat(flight_id, seat_number, req.body || {});
    return sendSuccess(res, updated, "Seat updated");
  } catch (e: any) {
    const msg = e?.message || "Failed to update seat";
    const status = msg.includes("does not exist") ? 404 : 400;
    return sendError(res, msg, status);
  }
}
