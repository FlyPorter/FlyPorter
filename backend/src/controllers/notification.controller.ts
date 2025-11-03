import type { Request, Response } from "express";
import { Prisma } from "@prisma/client";
import { sendSuccess, sendError } from "../utils/response.util.js";
import {
    getUserNotifications,
    markNotificationAsRead,
    getUnreadNotificationsCount,
    markAllNotificationsAsRead,
} from "../services/notification.service.js";

/**
 * Parse integer ID from request parameter
 */
const parseId = (v: unknown) => {
    const id = Number(v);
    return Number.isInteger(id) && id > 0 ? id : null;
};

/**
 * Map Prisma errors to HTTP responses
 */
const mapPrismaError = (e: unknown) => {
    if (e instanceof Prisma.PrismaClientKnownRequestError) {
        if (e.code === "P2025") return { status: 404, msg: "Notification not found" };
    }
    return { status: 400, msg: "Database error" };
};

/**
 * GET /notifications
 * Get all notifications for the logged-in user
 */
export async function getNotificationsHandler(req: Request, res: Response) {
    const userId = (req as any).user?.userId;

    if (!userId) {
        return sendError(res, "User not authenticated", 401);
    }

    try {
        const notifications = await getUserNotifications(userId);
        return sendSuccess(res, notifications);
    } catch (e) {
        const { status, msg } = mapPrismaError(e);
        return sendError(res, msg, status);
    }
}

/**
 * GET /notifications/unread/count
 * Get count of unread notifications for the logged-in user
 */
export async function getUnreadCountHandler(req: Request, res: Response) {
    const userId = (req as any).user?.userId;

    if (!userId) {
        return sendError(res, "User not authenticated", 401);
    }

    try {
        const count = await getUnreadNotificationsCount(userId);
        return sendSuccess(res, { count });
    } catch (e) {
        const { status, msg } = mapPrismaError(e);
        return sendError(res, msg, status);
    }
}

/**
 * PATCH /notifications/:id/read
 * Mark a specific notification as read
 */
export async function markAsReadHandler(req: Request, res: Response) {
    const userId = (req as any).user?.userId;

    if (!userId) {
        return sendError(res, "User not authenticated", 401);
    }

    const notificationId = parseId(req.params.id);
    if (!notificationId) {
        return sendError(res, "Valid notification ID is required", 422);
    }

    try {
        const notification = await markNotificationAsRead(notificationId, userId);
        return sendSuccess(res, notification, "Notification marked as read");
    } catch (e: any) {
        // Handle specific error messages from service
        if (e.message?.includes("not found") || e.message?.includes("permission")) {
            return sendError(res, e.message, 404);
        }

        const { status, msg } = mapPrismaError(e);
        return sendError(res, msg, status);
    }
}

/**
 * PATCH /notifications/read-all
 * Mark all notifications as read for the logged-in user
 */
export async function markAllAsReadHandler(req: Request, res: Response) {
    const userId = (req as any).user?.userId;

    if (!userId) {
        return sendError(res, "User not authenticated", 401);
    }

    try {
        const result = await markAllNotificationsAsRead(userId);
        return sendSuccess(
            res,
            { count: result.count },
            `${result.count} notification(s) marked as read`
        );
    } catch (e) {
        const { status, msg } = mapPrismaError(e);
        return sendError(res, msg, status);
    }
}

