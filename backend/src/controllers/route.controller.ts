import type { Request, Response } from "express";
import { sendSuccess, sendError } from "../utils/response.util.js";
import {
  createRoute,
  listRoutes,
  getRouteById,
  updateRouteById,
  deleteRouteById,
} from "../services/route.service.js";

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

export async function updateRouteHandler(req: Request, res: Response) {
  const idParam = req.params.id;
  const id = Number(idParam);
  if (!idParam || Number.isNaN(id)) return sendError(res, "valid id is required", 400);

  const { origin_airport_code, destination_airport_code } = req.body || {};

  // At least one field must be provided
  if (!origin_airport_code && !destination_airport_code) {
    return sendError(
      res,
      "At least one of origin_airport_code or destination_airport_code is required",
      400
    );
  }

  try {
    const updated = await updateRouteById(id, { origin_airport_code, destination_airport_code });
    return sendSuccess(res, updated, "Route updated");
  } catch (e: any) {
    const msg = e?.message || "Failed to update route";
    const status = msg.includes("not found") ? 404 : 400;
    return sendError(res, msg, status);
  }
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


