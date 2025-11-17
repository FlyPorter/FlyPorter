import { Expo } from 'expo-server-sdk';
import { prisma } from '../config/prisma.js';

// Create a new Expo SDK client
const expo = new Expo();

// Types
type ExpoPushMessage = {
  to: string | string[];
  sound?: 'default' | null;
  title?: string;
  body?: string;
  data?: object;
  badge?: number;
  priority?: 'default' | 'normal' | 'high';
};

/**
 * Send a push notification to a user
 */
export async function sendPushNotification(
  userId: number,
  title: string,
  message: string,
  data?: { [key: string]: any }
): Promise<boolean> {
  try {
    // Get user's push token
    const user = await prisma.user.findUnique({
      where: { user_id: userId },
      select: { push_token: true },
    });

    if (!user?.push_token) {
      console.log(`User ${userId} does not have a push token registered`);
      return false;
    }

    // Check that the push token is valid
    if (!Expo.isExpoPushToken(user.push_token)) {
      console.error(`Push token ${user.push_token} is not a valid Expo push token`);
      return false;
    }

    // Construct the push notification message
    const messages: ExpoPushMessage[] = [
      {
        to: user.push_token,
        sound: 'default',
        title,
        body: message,
        data: data || {},
      },
    ];

    // Send the push notification
    const chunks = expo.chunkPushNotifications(messages);
    const tickets: any[] = [];

    for (const chunk of chunks) {
      try {
        const ticketChunk = await expo.sendPushNotificationsAsync(chunk);
        tickets.push(...ticketChunk);
      } catch (error) {
        console.error('Error sending push notification chunk:', error);
      }
    }

    // Check if the notification was sent successfully
    for (const ticket of tickets) {
      if (ticket.status === 'error') {
        console.error(
          `Push notification error: ${ticket.message || 'Unknown error'}`,
          ticket.details || {}
        );
        return false;
      }
    }

    console.log(`Push notification sent successfully to user ${userId}`);
    return true;
  } catch (error) {
    console.error(`Error sending push notification to user ${userId}:`, error);
    return false;
  }
}

/**
 * Send a booking cancellation push notification
 */
export async function sendBookingCancellationNotification(
  userId: number,
  bookingId: number,
  flightDetails: string
): Promise<boolean> {
  return sendPushNotification(
    userId,
    'Booking Cancelled',
    `Your flight ${flightDetails} has been cancelled.`,
    { bookingId, type: 'BOOKING_CANCELLATION' }
  );
}

export async function sendBookingConfirmationNotification(
  userId: number,
  confirmationCode: string | null | undefined,
  bookingId: number,
  flightDate?: Date | string | null
): Promise<boolean> {
  let readableDate: string | null = null;
  if (flightDate) {
    try {
      const date = new Date(flightDate);
      if (!Number.isNaN(date.getTime())) {
        readableDate = date.toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
        });
      }
    } catch {
      readableDate = null;
    }
  }

  const confirmationText = confirmationCode ? ` ${confirmationCode}` : '';
  const body = readableDate
    ? `Your booking${confirmationText} has been confirmed for flight on ${readableDate}.`
    : `Your booking${confirmationText} has been confirmed.`;

  return sendPushNotification(
    userId,
    'Booking Confirmed',
    body.trim(),
    {
      bookingId,
      confirmationCode,
      type: 'BOOKING_CONFIRMATION',
    }
  );
}

