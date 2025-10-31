import { Router } from "express";
import { authMiddleware } from "../middlewares/auth.middleware.js";
import { requireAdmin } from "../middlewares/role.middleware.js";
import { listSeatsHandler, updateSeatHandler, getSeatHandler } from "../controllers/seat.controller.js";

const router = Router();

// Public: list seats of a flight
router.get("/:flight_id", listSeatsHandler);
// Public: get a specific seat
router.get("/:flight_id/:seat_number", getSeatHandler);

// Admin: update seat class/availability/modifier
router.put("/:flight_id/:seat_number", authMiddleware, requireAdmin, updateSeatHandler);

export default router;
