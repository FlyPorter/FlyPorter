import { Router } from "express";
import { authMiddleware } from "../middlewares/auth.middleware.js";
import { requireAdmin } from "../middlewares/role.middleware.js";
import { createRouteHandler, listRoutesHandler, getRouteHandler, deleteRouteHandler } from "../controllers/route.controller.js";

const router = Router();

// Public reads
router.get("/", listRoutesHandler);
router.get("/:id", getRouteHandler);

// Admin mutations
router.post("/", authMiddleware, requireAdmin, createRouteHandler);
router.delete("/:id", authMiddleware, requireAdmin, deleteRouteHandler);

export default router;

