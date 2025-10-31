import type { Request, Response } from "express";
import { sendSuccess, sendError } from "../utils/response.util.js";
import {
  listAirlines,
  getAirlineByCode,
  createAirline,
  updateAirline,
  deleteAirline,
} from "../services/airline.service.js";

export async function getAllAirlines(_req: Request, res: Response) {
  const items = await listAirlines();
  return sendSuccess(res, items);
}

export async function getAirline(req: Request, res: Response) {
  const code = (req.params.code || "").toUpperCase();
  if (!code) return sendError(res, "Airline code is required", 400);
  const item = await getAirlineByCode(code);
  if (!item) return sendError(res, "Airline not found", 404);
  return sendSuccess(res, item);
}

export async function createAirlineHandler(req: Request, res: Response) {
  const { airline_code, airline_name } = req.body || {};
  if (!airline_code || !airline_name) {
    return sendError(res, "airline_code and airline_name are required", 400);
  }
  try {
    const created = await createAirline({ airline_code: String(airline_code).toUpperCase(), airline_name });
    return sendSuccess(res, created, "Airline created", 201);
  } catch (e: any) {
    const msg = e?.message || "Failed to create airline";
    const status = msg.includes("Unique") || msg.includes("unique") ? 409 : 400;
    return sendError(res, msg, status);
  }
}

export async function updateAirlineHandler(req: Request, res: Response) {
  const code = (req.params.code || "").toUpperCase();
  const { airline_name } = req.body || {};
  if (!code) return sendError(res, "Airline code is required", 400);
  if (!airline_name) return sendError(res, "airline_name is required", 400);
  try {
    const updated = await updateAirline(code, { airline_name });
    return sendSuccess(res, updated, "Airline updated");
  } catch (e: any) {
    const msg = e?.message || "Failed to update airline";
    const status = msg.includes("Record to update not found") ? 404 : 400;
    return sendError(res, msg, status);
  }
}

export async function deleteAirlineHandler(req: Request, res: Response) {
  const code = (req.params.code || "").toUpperCase();
  if (!code) return sendError(res, "Airline code is required", 400);
  try {
    const deleted = await deleteAirline(code);
    return sendSuccess(res, deleted, "Airline deleted");
  } catch (e: any) {
    const msg = e?.message || "Failed to delete airline";
    const status = msg.includes("Record to delete does not exist") ? 404 : 400;
    return sendError(res, msg, status);
  }
}
