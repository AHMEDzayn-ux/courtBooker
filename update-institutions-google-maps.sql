-- Migration: Replace latitude/longitude with Google Maps link
-- This script removes the latitude and longitude columns and adds a google_maps_link column

-- Add the new google_maps_link column
ALTER TABLE public.institutions 
ADD COLUMN google_maps_link text NULL;

-- Drop the old latitude and longitude columns
ALTER TABLE public.institutions 
DROP COLUMN IF EXISTS latitude,
DROP COLUMN IF EXISTS longitude;

-- Add comment to the new column
COMMENT ON COLUMN public.institutions.google_maps_link IS 'Google Maps link for the institution location';
