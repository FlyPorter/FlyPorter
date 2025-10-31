import { Router } from "express";
import { authMiddleware } from "../middlewares/auth.middleware.js";
import { requireAdmin } from "../middlewares/role.middleware.js";
import { createAirportHandler, listAirportsHandler, getAirportHandler, updateAirportHandler, deleteAirportHandler } from "../controllers/airport.controller.js";

const router = Router();

// Public reads
router.get("/", listAirportsHandler);
router.get("/:code", getAirportHandler);

// Admin mutations
router.post("/", authMiddleware, requireAdmin, createAirportHandler);
router.put("/:code", authMiddleware, requireAdmin, updateAirportHandler);
router.delete("/:code", authMiddleware, requireAdmin, deleteAirportHandler);

export default router;

