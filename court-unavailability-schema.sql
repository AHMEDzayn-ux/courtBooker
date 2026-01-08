-- Create court_unavailability table for managing blocked/unavailable time slots
-- This allows admins to block slots for maintenance, practice sessions, etc.

CREATE TABLE IF NOT EXISTS court_unavailability (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  court_id UUID NOT NULL REFERENCES courts(id) ON DELETE CASCADE,
  unavailable_date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  reason TEXT,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT unique_court_unavailability UNIQUE (court_id, unavailable_date, start_time)
);

-- Add indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_court_unavailability_lookup 
ON court_unavailability(court_id, unavailable_date);

CREATE INDEX IF NOT EXISTS idx_court_unavailability_date_range 
ON court_unavailability(unavailable_date, start_time, end_time);

-- Add trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_court_unavailability_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_court_unavailability_updated_at
BEFORE UPDATE ON court_unavailability
FOR EACH ROW
EXECUTE FUNCTION update_court_unavailability_updated_at();

-- Row Level Security Policies

-- Enable RLS
ALTER TABLE court_unavailability ENABLE ROW LEVEL SECURITY;

-- Allow public read access to check unavailability (for booking page)
CREATE POLICY "Anyone can view court unavailability"
ON court_unavailability FOR SELECT
TO public
USING (true);

-- Only authenticated institution owners can insert unavailability
CREATE POLICY "Institution owners can block slots"
ON court_unavailability FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM courts c
    JOIN institution_admins ia ON c.institution_id = ia.institution_id
    WHERE c.id = court_unavailability.court_id
    AND ia.id = auth.uid()
  )
);

-- Only institution owners can update their unavailability records
CREATE POLICY "Institution owners can update their blocks"
ON court_unavailability FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM courts c
    JOIN institution_admins ia ON c.institution_id = ia.institution_id
    WHERE c.id = court_unavailability.court_id
    AND ia.id = auth.uid()
  )
);

-- Only institution owners can delete their unavailability records
CREATE POLICY "Institution owners can delete their blocks"
ON court_unavailability FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM courts c
    JOIN institution_admins ia ON c.institution_id = ia.institution_id
    WHERE c.id = court_unavailability.court_id
    AND ia.id = auth.uid()
  )
);

-- Add helpful comment
COMMENT ON TABLE court_unavailability IS 'Stores blocked/unavailable time slots for courts (maintenance, private sessions, etc.)';
COMMENT ON COLUMN court_unavailability.reason IS 'Reason for blocking the time slot (e.g., maintenance, practice session)';
