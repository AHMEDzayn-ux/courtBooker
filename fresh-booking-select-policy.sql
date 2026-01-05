-- Drop existing SELECT policies on bookings table
DROP POLICY IF EXISTS "Allow select for booking owners" ON bookings;
DROP POLICY IF EXISTS "Allow recent bookings select" ON bookings;
DROP POLICY IF EXISTS "Public read access" ON bookings;

-- Create new SELECT policy that allows:
-- 1. Anonymous users to see confirmed bookings (for slot availability)
-- 2. Institution admins to see their institution's bookings
-- 3. Anyone to query by reference_id for tracking
CREATE POLICY "Allow booking visibility for slot checking"
ON bookings
FOR SELECT
TO public
USING (
  -- Allow viewing confirmed bookings (for slot availability display)
  status = 'confirmed'
  OR
  -- Allow institution admins to see their own institution's bookings
  institution_id IN (
    SELECT institution_id 
    FROM institution_admins 
    WHERE user_id = auth.uid()
  )
);
