import type { Request, Response } from "express";
import { sendSuccess, sendError } from "../utils/response.util.js";
import { createCity, listCities, getCityByName, deleteCityByName } from "../services/city.service.js";

export async function createCityHandler(req: Request, res: Response) {
  const { city_name, country, timezone } = req.body || {};
  if (!city_name) return sendError(res, "city_name is required", 400);
  try {
    const created = await createCity({ city_name, country, timezone });
    return sendSuccess(res, created, "City created", 201);
  } catch (e: any) {
    const msg = e?.message || "Failed to create city";
    return sendError(res, msg, 400);
  }
}

export async function listCitiesHandler(_req: Request, res: Response) {
  const items = await listCities();
  return sendSuccess(res, items);
}

export async function getCityHandler(req: Request, res: Response) {
  const name = req.params.city_name || "";
  if (!name) return sendError(res, "city_name is required", 400);
  const item = await getCityByName(name);
  if (!item) return sendError(res, "City not found", 404);
  return sendSuccess(res, item);
}

export async function deleteCityHandler(req: Request, res: Response) {
  const name = req.params.city_name || "";
  if (!name) return sendError(res, "city_name is required", 400);
  const result = await deleteCityByName(name);
  if (result.count === 0) return sendError(res, "City not found", 404);
  return sendSuccess(res, { deleted: result.count }, "City deleted");
}
