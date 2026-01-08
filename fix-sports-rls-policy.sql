-- =====================================================
-- FIX: Sports RLS Policy for Anonymous Access
-- =====================================================
-- This fixes the issue where sports are not visible
-- in the register institution form for unauthenticated users

-- Drop the existing policy
DROP POLICY IF EXISTS "Sports are viewable by everyone" ON sports;

-- Create new policy that explicitly allows anonymous (anon) and public access
CREATE POLICY "Sports are viewable by everyone" ON sports
  FOR SELECT
  TO anon, authenticated
  USING (true);

-- Grant necessary permissions
GRANT SELECT ON sports TO anon;
GRANT SELECT ON sports TO authenticated;
