import type { Request, Response } from "express";
import { sendSuccess, sendError } from "../utils/response.util.js";
import { createRoute, listRoutes, getRouteById, deleteRouteById } from "../services/route.service.js";

export async function createRouteHandler(req: Request, res: Response) {
  const { origin_airport_code, destination_airport_code } = req.body || {};
  try {
    const created = await createRoute({ origin_airport_code, destination_airport_code });
    return sendSuccess(res, created, "Route created", 201);
  } catch (e: any) {
    const msg = e?.message || "Failed to create route";
    return sendError(res, msg, 400);
  }
}

export async function listRoutesHandler(_req: Request, res: Response) {
  const items = await listRoutes();
  return sendSuccess(res, items);
}

export async function getRouteHandler(req: Request, res: Response) {
  const idParam = req.params.id;
  const id = Number(idParam);
  if (!idParam || Number.isNaN(id)) return sendError(res, "valid id is required", 400);
  const item = await getRouteById(id);
  if (!item) return sendError(res, "Route not found", 404);
  return sendSuccess(res, item);
}

export async function deleteRouteHandler(req: Request, res: Response) {
  const idParam = req.params.id;
  const id = Number(idParam);
  if (!idParam || Number.isNaN(id)) return sendError(res, "valid id is required", 400);
  try {
    const deleted = await deleteRouteById(id);
    return sendSuccess(res, deleted, "Route deleted");
  } catch (e: any) {
    const msg = e?.message || "Failed to delete route";
    const status = msg.includes("does not exist") ? 404 : 400;
    return sendError(res, msg, status);
  }
}

