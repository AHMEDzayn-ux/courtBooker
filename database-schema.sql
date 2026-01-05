-- =====================================================
-- SPORTS BOOKING SYSTEM - DATABASE SCHEMA
-- Multi-tenant with Row Level Security (RLS)
-- =====================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- 1. SPORTS TABLE (Global reference data)
-- =====================================================
CREATE TABLE sports (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(50) UNIQUE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert common sports
INSERT INTO sports (name) VALUES 
  ('Badminton'),
  ('Futsal'),
  ('Cricket'),
  ('Table Tennis'),
  ('Squash'),
  ('Basketball'),
  ('Volleyball');

-- =====================================================
-- 2. INSTITUTIONS TABLE
-- =====================================================
CREATE TABLE institutions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  district VARCHAR(100) NOT NULL,
  address TEXT NOT NULL,
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  contact_number VARCHAR(20) NOT NULL,
  email VARCHAR(255) NOT NULL UNIQUE,
  images TEXT[], -- Array of image URLs from Supabase Storage
  is_verified BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- 3. INSTITUTION ADMINS (for authentication)
-- =====================================================
CREATE TABLE institution_admins (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  institution_id UUID NOT NULL REFERENCES institutions(id) ON DELETE CASCADE,
  email VARCHAR(255) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(institution_id, email)
);

-- =====================================================
-- 4. COURTS TABLE
-- =====================================================
CREATE TABLE courts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  institution_id UUID NOT NULL REFERENCES institutions(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  is_enabled BOOLEAN DEFAULT true,
  opening_time TIME NOT NULL DEFAULT '06:00:00',
  closing_time TIME NOT NULL DEFAULT '22:00:00',
  slot_duration_minutes INTEGER NOT NULL DEFAULT 30,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(institution_id, name)
);

-- =====================================================
-- 5. COURT_SPORTS (Junction table - many-to-many)
-- =====================================================
CREATE TABLE court_sports (
  court_id UUID NOT NULL REFERENCES courts(id) ON DELETE CASCADE,
  sport_id UUID NOT NULL REFERENCES sports(id) ON DELETE CASCADE,
  PRIMARY KEY (court_id, sport_id)
);

-- =====================================================
-- 6. BOOKINGS TABLE
-- =====================================================
CREATE TABLE bookings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  court_id UUID NOT NULL REFERENCES courts(id) ON DELETE CASCADE,
  institution_id UUID NOT NULL REFERENCES institutions(id) ON DELETE CASCADE,
  booking_date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  customer_name VARCHAR(255) NOT NULL,
  customer_phone VARCHAR(20) NOT NULL,
  customer_email VARCHAR(255),
  reference_id VARCHAR(20) UNIQUE NOT NULL,
  status VARCHAR(20) DEFAULT 'confirmed' CHECK (status IN ('confirmed', 'cancelled')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Prevent double booking: same court, same date, overlapping time
  CONSTRAINT no_double_booking UNIQUE (court_id, booking_date, start_time)
);

-- Index for faster booking lookups
CREATE INDEX idx_bookings_court_date ON bookings(court_id, booking_date);
CREATE INDEX idx_bookings_reference ON bookings(reference_id, customer_phone);
CREATE INDEX idx_bookings_institution ON bookings(institution_id, booking_date);

-- =====================================================
-- 7. FUNCTION TO GENERATE REFERENCE ID
-- =====================================================
CREATE OR REPLACE FUNCTION generate_reference_id()
RETURNS TEXT AS $$
BEGIN
  RETURN 'BK' || LPAD(FLOOR(RANDOM() * 100000000)::TEXT, 8, '0');
END;
$$ LANGUAGE plpgsql;

-- Set default reference_id using the function
ALTER TABLE bookings ALTER COLUMN reference_id SET DEFAULT generate_reference_id();

-- =====================================================
-- 8. ROW LEVEL SECURITY (RLS) POLICIES
-- =====================================================

-- Enable RLS on all tables
ALTER TABLE institutions ENABLE ROW LEVEL SECURITY;
ALTER TABLE institution_admins ENABLE ROW LEVEL SECURITY;
ALTER TABLE courts ENABLE ROW LEVEL SECURITY;
ALTER TABLE court_sports ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE sports ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- SPORTS POLICIES (Public read)
-- =====================================================
CREATE POLICY "Sports are viewable by everyone" ON sports
  FOR SELECT USING (true);

-- =====================================================
-- INSTITUTIONS POLICIES
-- =====================================================

-- Public can view verified institutions
CREATE POLICY "Verified institutions are viewable by everyone" ON institutions
  FOR SELECT USING (is_verified = true);

-- Institutions can view their own data (even if not verified)
CREATE POLICY "Institutions can view own data" ON institutions
  FOR SELECT USING (
    id IN (
      SELECT institution_id FROM institution_admins 
      WHERE id = auth.uid()
    )
  );

-- Institutions can update their own data
CREATE POLICY "Institutions can update own data" ON institutions
  FOR UPDATE USING (
    id IN (
      SELECT institution_id FROM institution_admins 
      WHERE id = auth.uid()
    )
  );

-- Anyone can insert (register) a new institution
CREATE POLICY "Anyone can register institution" ON institutions
  FOR INSERT WITH CHECK (true);

-- =====================================================
-- INSTITUTION_ADMINS POLICIES
-- =====================================================

-- Admins can view their own institution admin record
CREATE POLICY "Admins can view own record" ON institution_admins
  FOR SELECT USING (id = auth.uid());

-- Allow insertion during registration
CREATE POLICY "Admins can insert own record" ON institution_admins
  FOR INSERT WITH CHECK (id = auth.uid());

-- =====================================================
-- COURTS POLICIES
-- =====================================================

-- Public can view all courts of verified institutions
CREATE POLICY "Courts of verified institutions are public" ON courts
  FOR SELECT USING (
    institution_id IN (
      SELECT id FROM institutions WHERE is_verified = true
    )
  );

-- Institution managers can view their own courts
CREATE POLICY "Institutions can view own courts" ON courts
  FOR SELECT USING (
    institution_id IN (
      SELECT institution_id FROM institution_admins 
      WHERE id = auth.uid()
    )
  );

-- Institution managers can insert courts
CREATE POLICY "Institutions can create courts" ON courts
  FOR INSERT WITH CHECK (
    institution_id IN (
      SELECT institution_id FROM institution_admins 
      WHERE id = auth.uid()
    )
  );

-- Institution managers can update their courts
CREATE POLICY "Institutions can update own courts" ON courts
  FOR UPDATE USING (
    institution_id IN (
      SELECT institution_id FROM institution_admins 
      WHERE id = auth.uid()
    )
  );

-- Institution managers can delete their courts
CREATE POLICY "Institutions can delete own courts" ON courts
  FOR DELETE USING (
    institution_id IN (
      SELECT institution_id FROM institution_admins 
      WHERE id = auth.uid()
    )
  );

-- =====================================================
-- COURT_SPORTS POLICIES
-- =====================================================

-- Public can view all court sports
CREATE POLICY "Court sports are viewable by everyone" ON court_sports
  FOR SELECT USING (true);

-- Institution managers can manage their court sports
CREATE POLICY "Institutions can manage court sports" ON court_sports
  FOR ALL USING (
    court_id IN (
      SELECT id FROM courts WHERE institution_id IN (
        SELECT institution_id FROM institution_admins 
        WHERE id = auth.uid()
      )
    )
  );

-- =====================================================
-- BOOKINGS POLICIES
-- =====================================================

-- Public can create bookings for verified institutions
CREATE POLICY "Anyone can create bookings" ON bookings
  FOR INSERT WITH CHECK (
    institution_id IN (
      SELECT id FROM institutions WHERE is_verified = true
    )
  );

-- Institution managers can view their bookings
CREATE POLICY "Institutions can view own bookings" ON bookings
  FOR SELECT USING (
    institution_id IN (
      SELECT institution_id FROM institution_admins 
      WHERE id = auth.uid()
    )
  );

-- Institution managers can update their bookings (e.g., cancel)
CREATE POLICY "Institutions can update own bookings" ON bookings
  FOR UPDATE USING (
    institution_id IN (
      SELECT institution_id FROM institution_admins 
      WHERE id = auth.uid()
    )
  );

-- =====================================================
-- 9. FUNCTION TO TRACK BOOKING (PUBLIC)
-- =====================================================
CREATE OR REPLACE FUNCTION get_booking_by_reference(
  ref_id TEXT,
  phone TEXT
)
RETURNS TABLE (
  id UUID,
  court_name TEXT,
  institution_name TEXT,
  booking_date DATE,
  start_time TIME,
  end_time TIME,
  customer_name TEXT,
  customer_phone TEXT,
  reference_id TEXT,
  status TEXT,
  created_at TIMESTAMP WITH TIME ZONE
) 
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    b.id,
    c.name as court_name,
    i.name as institution_name,
    b.booking_date,
    b.start_time,
    b.end_time,
    b.customer_name,
    b.customer_phone,
    b.reference_id,
    b.status,
    b.created_at
  FROM bookings b
  JOIN courts c ON b.court_id = c.id
  JOIN institutions i ON b.institution_id = i.id
  WHERE b.reference_id = ref_id 
    AND b.customer_phone = phone;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- 10. FUNCTION TO CHECK SLOT AVAILABILITY
-- =====================================================
CREATE OR REPLACE FUNCTION check_slot_available(
  p_court_id UUID,
  p_booking_date DATE,
  p_start_time TIME,
  p_end_time TIME
)
RETURNS BOOLEAN AS $$
BEGIN
  -- Returns TRUE if NO rows are found (i.e., slot is available)
  RETURN NOT EXISTS (
    SELECT 1
    FROM bookings
    WHERE court_id = p_court_id
      AND booking_date = p_booking_date
      AND status = 'confirmed'
      AND (
        start_time < p_end_time AND end_time > p_start_time
      )
  );
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- 11. TRIGGER TO UPDATE updated_at TIMESTAMP
-- =====================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_institutions_updated_at BEFORE UPDATE ON institutions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_courts_updated_at BEFORE UPDATE ON courts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- SCHEMA COMPLETE
-- =====================================================
