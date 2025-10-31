import { Router } from "express";
import { authMiddleware } from "../middlewares/auth.middleware.js";
import { requireAdmin } from "../middlewares/role.middleware.js";
import {
  getAllAirlines,
  getAirline,
  createAirlineHandler,
  updateAirlineHandler,
  deleteAirlineHandler,
} from "../controllers/airline.controller.js";

const router = Router();

// Public reads
router.get("/", getAllAirlines);
router.get("/:code", getAirline);

// Admin mutations
router.post("/", authMiddleware, requireAdmin, createAirlineHandler);
router.patch("/:code", authMiddleware, requireAdmin, updateAirlineHandler);
router.delete("/:code", authMiddleware, requireAdmin, deleteAirlineHandler);

export default router;
