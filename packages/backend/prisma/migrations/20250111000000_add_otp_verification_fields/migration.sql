-- Add OTP email verification fields to users table
-- Migration: Add 4-digit OTP email verification system

-- Add OTP verification fields
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "emailVerificationOtp" TEXT;
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "otpExpiresAt" TIMESTAMP(3);
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "otpAttempts" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "otpLastAttemptAt" TIMESTAMP(3);
