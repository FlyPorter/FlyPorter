import { prisma } from "../config/prisma.js";
import type { NotificationType } from "@prisma/client";

export interface CreateNotificationInput {
    user_id: number;
    booking_id?: number;
    flight_id?: number;
    type: NotificationType;
    title: string;
    message: string;
}

/**
 * Create a notification
 */
export async function createNotification(input: CreateNotificationInput) {
    return prisma.notification.create({
        data: input,
        select: {
            notification_id: true,
            user_id: true,
            booking_id: true,
            flight_id: true,
            type: true,
            title: true,
            message: true,
            is_read: true,
            created_at: true,
        },
    });
}

/**
 * Get all notifications for a user
 */
export async function getUserNotifications(userId: number) {
    return prisma.notification.findMany({
        where: { user_id: userId },
        orderBy: { created_at: "desc" },
        select: {
            notification_id: true,
            user_id: true,
            booking_id: true,
            flight_id: true,
            type: true,
            title: true,
            message: true,
            is_read: true,
            created_at: true,
        },
    });
}

/**
 * Mark notification as read
 */
export async function markNotificationAsRead(notificationId: number, userId: number) {
    // Verify the notification belongs to the user before updating
    const notification = await prisma.notification.findFirst({
        where: {
            notification_id: notificationId,
            user_id: userId,
        },
    });

    if (!notification) {
        throw new Error("Notification not found or you don't have permission to update it");
    }

    return prisma.notification.update({
        where: { notification_id: notificationId },
        data: { is_read: true },
        select: {
            notification_id: true,
            user_id: true,
            booking_id: true,
            flight_id: true,
            type: true,
            title: true,
            message: true,
            is_read: true,
            created_at: true,
        },
    });
}

/**
 * Get unread notifications count for a user
 */
export async function getUnreadNotificationsCount(userId: number): Promise<number> {
    return prisma.notification.count({
        where: {
            user_id: userId,
            is_read: false,
        },
    });
}

/**
 * Mark all notifications as read for a user
 */
export async function markAllNotificationsAsRead(userId: number) {
    return prisma.notification.updateMany({
        where: {
            user_id: userId,
            is_read: false,
        },
        data: { is_read: true },
    });
}

