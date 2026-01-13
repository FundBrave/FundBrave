-- Migration: Remove WorldID Integration
-- Description: Removes WorldID verification fields from users table and WORLD_ID from VerificationBadge enum
-- This migration is DESTRUCTIVE - data in worldIdVerified and worldIdNullifier columns will be lost

-- Step 1: Remove the unique index on worldIdNullifier
DROP INDEX IF EXISTS "users_worldIdNullifier_key";

-- Step 2: Remove worldIdVerified and worldIdNullifier columns from users table
ALTER TABLE "users" DROP COLUMN IF EXISTS "worldIdVerified";
ALTER TABLE "users" DROP COLUMN IF EXISTS "worldIdNullifier";

-- Step 3: Update VerificationBadge enum to remove WORLD_ID
-- First, update any users who have WORLD_ID badge to NONE
UPDATE "users" SET "verificationBadge" = 'NONE' WHERE "verificationBadge" = 'WORLD_ID';

-- Create a new enum type without WORLD_ID
CREATE TYPE "VerificationBadge_new" AS ENUM ('NONE', 'VERIFIED_CREATOR', 'OFFICIAL', 'GOLD');

-- Update the column to use the new enum type
ALTER TABLE "users"
  ALTER COLUMN "verificationBadge" TYPE "VerificationBadge_new"
  USING ("verificationBadge"::text::"VerificationBadge_new");

-- Drop the old enum type
DROP TYPE "VerificationBadge";

-- Rename the new enum type to the original name
ALTER TYPE "VerificationBadge_new" RENAME TO "VerificationBadge";
