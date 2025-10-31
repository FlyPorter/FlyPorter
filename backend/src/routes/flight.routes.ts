import { Router } from "express";
import { authMiddleware } from "../middlewares/auth.middleware.js";
import { requireAdmin } from "../middlewares/role.middleware.js";
import { createFlightHandler, listFlightsHandler, getFlightHandler, deleteFlightHandler, updateFlightHandler } from "../controllers/flight.controller.js";

const router = Router();

// Public reads
router.get("/", listFlightsHandler);
router.get("/:id", getFlightHandler);

// Admin mutations
router.post("/", authMiddleware, requireAdmin, createFlightHandler);
router.put("/:id", authMiddleware, requireAdmin, updateFlightHandler);
router.delete("/:id", authMiddleware, requireAdmin, deleteFlightHandler);

export default router;
