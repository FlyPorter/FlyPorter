-- Add optional phone number directly on the User table for registrations
ALTER TABLE "User" ADD COLUMN "phone" VARCHAR(20);
