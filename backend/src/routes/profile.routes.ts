import { Router } from "express";
import { authMiddleware } from "../middlewares/auth.middleware.js";
import {
    getProfileHandler,
    updateProfileHandler,
    registerPushTokenHandler,
} from "../controllers/profile.controller.js";

const router = Router();

// All profile routes require authentication
router.use(authMiddleware);

// GET /profile - Get current user's profile
router.get("/", getProfileHandler);

// PATCH /profile - Update current user's profile
router.patch("/", updateProfileHandler);

// POST /profile/push-token - Register push notification token
router.post("/push-token", registerPushTokenHandler);

export default router;

