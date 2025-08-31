-- Fix TEMPORARY status bookings before schema update
-- This script converts all TEMPORARY status bookings to PENDING status

BEGIN;

-- Update all bookings with TEMPORARY status to PENDING status
UPDATE bookings 
SET status = 'PENDING', "updatedAt" = NOW()
WHERE status = 'TEMPORARY';

-- Log the number of updated records
DO $$
DECLARE
    updated_count INTEGER;
BEGIN
    GET DIAGNOSTICS updated_count = ROW_COUNT;
    RAISE NOTICE 'Updated % bookings from TEMPORARY to PENDING status', updated_count;
END $$;

COMMIT;
