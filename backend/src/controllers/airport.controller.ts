import type { Request, Response } from "express";
import { sendSuccess, sendError } from "../utils/response.util.js";
import { createAirport, listAirports, getAirportByCode, updateAirportName, deleteAirport } from "../services/airport.service.js";

export async function createAirportHandler(req: Request, res: Response) {
  const { airport_code, airport_name, city_name } = req.body || {};
  if (!airport_code || !airport_name || !city_name) {
    return sendError(res, "airport_code, airport_name and city_name are required", 400);
  }
  try {
    const created = await createAirport({ airport_code, airport_name, city_name });
    return sendSuccess(res, created, "Airport created", 201);
  } catch (e: any) {
    const msg = e?.message || "Failed to create airport";
    const status = msg.includes("Unique") || msg.includes("unique") ? 409 : 400;
    return sendError(res, msg, status);
  }
}

export async function listAirportsHandler(_req: Request, res: Response) {
  const items = await listAirports();
  return sendSuccess(res, items);
}

export async function getAirportHandler(req: Request, res: Response) {
  const code = req.params.code || "";
  if (!code) return sendError(res, "airport code is required", 400);
  const item = await getAirportByCode(code);
  if (!item) return sendError(res, "Airport not found", 404);
  return sendSuccess(res, item);
}

export async function updateAirportHandler(req: Request, res: Response) {
  const code = req.params.code || "";
  const { airport_name } = req.body || {};
  if (!code) return sendError(res, "airport code is required", 400);
  if (!airport_name) return sendError(res, "airport_name is required", 400);
  try {
    const updated = await updateAirportName(code, airport_name);
    return sendSuccess(res, updated, "Airport updated");
  } catch (e: any) {
    const msg = e?.message || "Failed to update airport";
    const status = msg.includes("Record to update not found") ? 404 : 400;
    return sendError(res, msg, status);
  }
}

export async function deleteAirportHandler(req: Request, res: Response) {
  const code = req.params.code || "";
  if (!code) return sendError(res, "airport code is required", 400);
  try {
    const deleted = await deleteAirport(code);
    return sendSuccess(res, deleted, "Airport deleted");
  } catch (e: any) {
    const msg = e?.message || "Failed to delete airport";
    const status = msg.includes("Record to delete does not exist") ? 404 : 400;
    return sendError(res, msg, status);
  }
}
