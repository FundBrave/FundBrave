-- Fix Migration History Script
-- Run this BEFORE running `prisma migrate dev` or `prisma migrate deploy`
-- This updates the _prisma_migrations table to match renamed migration folders

-- Step 1: Check current migration history
SELECT id, migration_name, finished_at, applied_steps_count
FROM _prisma_migrations
ORDER BY finished_at;

-- Step 2: Update the OTP migration name if it exists with old name
UPDATE _prisma_migrations
SET migration_name = '20260111000000_add_otp_verification_fields'
WHERE migration_name = '20250111000000_add_otp_verification_fields';

-- Step 3: Update the remove_worldid migration name if it exists without timestamp
UPDATE _prisma_migrations
SET migration_name = '20251212120000_remove_worldid'
WHERE migration_name = 'remove_worldid';

-- Step 4: Verify the updates
SELECT id, migration_name, finished_at, applied_steps_count
FROM _prisma_migrations
ORDER BY finished_at;
