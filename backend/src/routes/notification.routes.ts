import { Router } from "express";
import { authMiddleware } from "../middlewares/auth.middleware.js";
import {
    getNotificationsHandler,
    getUnreadCountHandler,
    markAsReadHandler,
    markAllAsReadHandler,
} from "../controllers/notification.controller.js";

const router = Router();

// All notification routes require authentication
router.use(authMiddleware);

// GET /notifications - Get all notifications for the logged-in user
router.get("/", getNotificationsHandler);

// GET /notifications/unread/count - Get unread notifications count
router.get("/unread/count", getUnreadCountHandler);

// PATCH /notifications/read-all - Mark all notifications as read
router.patch("/read-all", markAllAsReadHandler);

// PATCH /notifications/:id/read - Mark a specific notification as read
router.patch("/:id/read", markAsReadHandler);

export default router;

