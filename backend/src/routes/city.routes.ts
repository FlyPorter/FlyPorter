import { Router } from "express";
import { authMiddleware } from "../middlewares/auth.middleware.js";
import { requireAdmin } from "../middlewares/role.middleware.js";
import { createCityHandler, listCitiesHandler, getCityHandler, deleteCityHandler } from "../controllers/city.controller.js";

const router = Router();

// Public reads
router.get("/", listCitiesHandler);
router.get("/:city_name", getCityHandler);

// Admin create/delete
router.post("/", authMiddleware, requireAdmin, createCityHandler);
router.delete("/:city_name", authMiddleware, requireAdmin, deleteCityHandler);

export default router;
