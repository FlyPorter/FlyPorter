-- Add push_token column to User table
ALTER TABLE "User" ADD COLUMN "push_token" VARCHAR(255);

-- Update existing NotificationType enum values
-- First, add new values to the enum
ALTER TYPE "NotificationType" ADD VALUE IF NOT EXISTS 'BOOKING_CONFIRMATION';
ALTER TYPE "NotificationType" ADD VALUE IF NOT EXISTS 'BOOKING_CANCELLATION';
ALTER TYPE "NotificationType" ADD VALUE IF NOT EXISTS 'PAYMENT_SUCCESS';
ALTER TYPE "NotificationType" ADD VALUE IF NOT EXISTS 'PAYMENT_FAILED';
ALTER TYPE "NotificationType" ADD VALUE IF NOT EXISTS 'FLIGHT_REMINDER';
ALTER TYPE "NotificationType" ADD VALUE IF NOT EXISTS 'FLIGHT_DELAYED';
ALTER TYPE "NotificationType" ADD VALUE IF NOT EXISTS 'FLIGHT_CANCELLED';
ALTER TYPE "NotificationType" ADD VALUE IF NOT EXISTS 'GENERAL';

-- Update existing records to use new enum values
UPDATE "Notification" SET type = 'BOOKING_CONFIRMATION' WHERE type = 'booking_confirmed';
UPDATE "Notification" SET type = 'BOOKING_CANCELLATION' WHERE type = 'booking_cancelled';
UPDATE "Notification" SET type = 'FLIGHT_CANCELLED' WHERE type = 'flight_cancelled';

-- Note: To remove old enum values, you would need to recreate the enum type
-- This is a more complex operation and should be done carefully in production
-- For now, we keep both old and new values to maintain backward compatibility

