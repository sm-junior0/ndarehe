-- Fix TEMPORARY status bookings
-- This script converts all TEMPORARY status bookings to PENDING status

UPDATE "bookings" 
SET "status" = 'PENDING', "updatedAt" = NOW()
WHERE "status" = 'TEMPORARY';
