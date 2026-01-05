-- =====================================================
-- ENHANCED BOOKING CONSTRAINTS FOR DOUBLE BOOKING PREVENTION
-- =====================================================

-- Drop existing constraint
ALTER TABLE bookings DROP CONSTRAINT IF EXISTS no_double_booking;

-- Add improved constraint to prevent ANY overlapping bookings
-- This checks for overlapping time ranges, not just identical start times
CREATE OR REPLACE FUNCTION check_no_overlapping_bookings()
RETURNS TRIGGER AS $$
BEGIN
  -- Check if there's any confirmed booking that overlaps with the new booking
  IF EXISTS (
    SELECT 1
    FROM bookings
    WHERE court_id = NEW.court_id
      AND booking_date = NEW.booking_date
      AND status = 'confirmed'
      AND id != COALESCE(NEW.id, '00000000-0000-0000-0000-000000000000'::uuid)
      AND (
        -- New booking starts during an existing booking
        (NEW.start_time >= start_time AND NEW.start_time < end_time)
        OR
        -- New booking ends during an existing booking
        (NEW.end_time > start_time AND NEW.end_time <= end_time)
        OR
        -- New booking completely encompasses an existing booking
        (NEW.start_time <= start_time AND NEW.end_time >= end_time)
      )
  ) THEN
    RAISE EXCEPTION 'This time slot overlaps with an existing booking';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to check for overlapping bookings
DROP TRIGGER IF EXISTS check_booking_overlap ON bookings;
CREATE TRIGGER check_booking_overlap
  BEFORE INSERT OR UPDATE ON bookings
  FOR EACH ROW
  EXECUTE FUNCTION check_no_overlapping_bookings();

-- =====================================================
-- IMPROVED SLOT AVAILABILITY CHECKING FUNCTION
-- =====================================================

-- Drop existing function if it exists
DROP FUNCTION IF EXISTS check_slot_available(UUID, DATE, TIME, TIME);

-- Create improved function with row-level locking
CREATE OR REPLACE FUNCTION check_slot_available(
  p_court_id UUID,
  p_booking_date DATE,
  p_start_time TIME,
  p_end_time TIME
)
RETURNS BOOLEAN AS $$
DECLARE
  v_overlap_count INTEGER;
BEGIN
  -- Lock the rows for this court and date to prevent concurrent modifications
  PERFORM 1
  FROM bookings
  WHERE court_id = p_court_id
    AND booking_date = p_booking_date
    AND status = 'confirmed'
  FOR UPDATE;

  -- Check for any overlapping confirmed bookings
  SELECT COUNT(*)
  INTO v_overlap_count
  FROM bookings
  WHERE court_id = p_court_id
    AND booking_date = p_booking_date
    AND status = 'confirmed'
    AND (
      -- Check if the requested slot overlaps with any existing booking
      (p_start_time >= start_time AND p_start_time < end_time)
      OR
      (p_end_time > start_time AND p_end_time <= end_time)
      OR
      (p_start_time <= start_time AND p_end_time >= end_time)
    );

  RETURN v_overlap_count = 0;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- ATOMIC BOOKING CREATION FUNCTION
-- =====================================================

-- Function to atomically check availability and create booking
CREATE OR REPLACE FUNCTION create_booking_atomic(
  p_court_id UUID,
  p_institution_id UUID,
  p_booking_date DATE,
  p_start_time TIME,
  p_end_time TIME,
  p_sport_id UUID,
  p_total_price NUMERIC,
  p_customer_name VARCHAR,
  p_customer_phone VARCHAR,
  p_customer_email VARCHAR
)
RETURNS TABLE (
  success BOOLEAN,
  booking_id UUID,
  reference_id VARCHAR,
  error_message TEXT
) AS $$
DECLARE
  v_is_available BOOLEAN;
  v_new_booking_id UUID;
  v_reference_id VARCHAR;
BEGIN
  -- Check availability with row locking
  v_is_available := check_slot_available(
    p_court_id,
    p_booking_date,
    p_start_time,
    p_end_time
  );

  IF NOT v_is_available THEN
    RETURN QUERY SELECT FALSE, NULL::UUID, NULL::VARCHAR, 'Time slot is no longer available'::TEXT;
    RETURN;
  END IF;

  -- Generate reference ID
  v_reference_id := 'BK' || LPAD(FLOOR(RANDOM() * 100000000)::TEXT, 8, '0');

  -- Insert the booking
  INSERT INTO bookings (
    court_id,
    institution_id,
    booking_date,
    start_time,
    end_time,
    sport_id,
    total_price,
    customer_name,
    customer_phone,
    customer_email,
    status,
    reference_id
  ) VALUES (
    p_court_id,
    p_institution_id,
    p_booking_date,
    p_start_time,
    p_end_time,
    p_sport_id,
    p_total_price,
    p_customer_name,
    p_customer_phone,
    p_customer_email,
    'confirmed',
    v_reference_id
  ) RETURNING id INTO v_new_booking_id;

  -- Return success
  RETURN QUERY SELECT TRUE, v_new_booking_id, v_reference_id, NULL::TEXT;
  
EXCEPTION
  WHEN OTHERS THEN
    -- Return error
    RETURN QUERY SELECT FALSE, NULL::UUID, NULL::VARCHAR, SQLERRM::TEXT;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- ENABLE REAL-TIME REPLICATION FOR BOOKINGS TABLE
-- =====================================================

-- Enable real-time for the bookings table so changes are broadcast
-- Run this in Supabase SQL Editor or via migration
ALTER PUBLICATION supabase_realtime ADD TABLE bookings;

-- Note: You may need to enable real-time in Supabase dashboard:
-- Database > Replication > enable real-time for 'bookings' table
