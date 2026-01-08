-- =====================================================
-- FINAL SECURITY & PERFORMANCE ENHANCEMENTS
-- Run this after initial schema setup
-- =====================================================

-- =====================================================
-- 1. ENHANCED DOUBLE BOOKING PREVENTION
-- =====================================================

-- Drop and recreate with stronger locking
DROP FUNCTION IF EXISTS check_no_overlapping_bookings() CASCADE;
DROP FUNCTION IF EXISTS check_slot_available(UUID, DATE, TIME, TIME) CASCADE;
DROP FUNCTION IF EXISTS create_booking_atomic(UUID, UUID, DATE, TIME, TIME, UUID, NUMERIC, VARCHAR, VARCHAR, VARCHAR) CASCADE;

-- Trigger function with SERIALIZABLE isolation level hints
CREATE OR REPLACE FUNCTION check_no_overlapping_bookings()
RETURNS TRIGGER AS $$
BEGIN
  -- Only check for confirmed bookings (allow updates to cancelled bookings)
  IF NEW.status != 'confirmed' THEN
    RETURN NEW;
  END IF;

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
    RAISE EXCEPTION 'DOUBLE_BOOKING: This time slot overlaps with an existing confirmed booking'
      USING ERRCODE = '23505'; -- Unique violation code for consistent error handling
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recreate trigger
DROP TRIGGER IF EXISTS check_booking_overlap ON bookings;
CREATE TRIGGER check_booking_overlap
  BEFORE INSERT OR UPDATE ON bookings
  FOR EACH ROW
  EXECUTE FUNCTION check_no_overlapping_bookings();

-- =====================================================
-- 2. IMPROVED ATOMIC BOOKING WITH ROW LOCKING
-- =====================================================

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
  v_new_booking_id UUID;
  v_reference_id VARCHAR;
  v_court_exists BOOLEAN;
  v_is_past_date BOOLEAN;
  v_overlap_count INTEGER;
BEGIN
  -- 1. Validate court exists and belongs to institution
  SELECT EXISTS(
    SELECT 1 FROM courts 
    WHERE id = p_court_id 
      AND institution_id = p_institution_id 
      AND is_enabled = true
  ) INTO v_court_exists;
  
  IF NOT v_court_exists THEN
    RETURN QUERY SELECT FALSE, NULL::UUID, NULL::VARCHAR, 'Invalid or disabled court'::TEXT;
    RETURN;
  END IF;

  -- 2. Validate date is not in the past
  IF p_booking_date < CURRENT_DATE THEN
    RETURN QUERY SELECT FALSE, NULL::UUID, NULL::VARCHAR, 'Cannot book dates in the past'::TEXT;
    RETURN;
  END IF;

  -- 3. Validate times
  IF p_start_time >= p_end_time THEN
    RETURN QUERY SELECT FALSE, NULL::UUID, NULL::VARCHAR, 'End time must be after start time'::TEXT;
    RETURN;
  END IF;

  -- 4. Lock all confirmed bookings for this court and date to prevent race conditions
  -- Using FOR UPDATE NOWAIT will fail immediately if rows are locked (better UX)
  BEGIN
    PERFORM 1
    FROM bookings
    WHERE court_id = p_court_id
      AND booking_date = p_booking_date
      AND status = 'confirmed'
    FOR UPDATE NOWAIT;
  EXCEPTION
    WHEN lock_not_available THEN
      -- Another transaction is processing a booking - tell user to retry
      RETURN QUERY SELECT FALSE, NULL::UUID, NULL::VARCHAR, 'Booking in progress by another user. Please try again.'::TEXT;
      RETURN;
  END;

  -- 5. Check for overlapping bookings with explicit lock
  SELECT COUNT(*)
  INTO v_overlap_count
  FROM bookings
  WHERE court_id = p_court_id
    AND booking_date = p_booking_date
    AND status = 'confirmed'
    AND (
      (p_start_time >= start_time AND p_start_time < end_time)
      OR
      (p_end_time > start_time AND p_end_time <= end_time)
      OR
      (p_start_time <= start_time AND p_end_time >= end_time)
    );

  IF v_overlap_count > 0 THEN
    RETURN QUERY SELECT FALSE, NULL::UUID, NULL::VARCHAR, 'Time slot is no longer available'::TEXT;
    RETURN;
  END IF;

  -- 6. Generate unique reference ID with collision check
  LOOP
    v_reference_id := 'BK' || LPAD(FLOOR(RANDOM() * 100000000)::TEXT, 8, '0');
    EXIT WHEN NOT EXISTS (SELECT 1 FROM bookings WHERE reference_id = v_reference_id);
  END LOOP;

  -- 7. Insert the booking
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

  -- 8. Return success
  RETURN QUERY SELECT TRUE, v_new_booking_id, v_reference_id, NULL::TEXT;
  
EXCEPTION
  WHEN unique_violation THEN
    RETURN QUERY SELECT FALSE, NULL::UUID, NULL::VARCHAR, 'This slot was just booked. Please select another time.'::TEXT;
  WHEN OTHERS THEN
    RETURN QUERY SELECT FALSE, NULL::UUID, NULL::VARCHAR, SQLERRM::TEXT;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- 3. ADDITIONAL INDEXES FOR PERFORMANCE
-- =====================================================

-- Composite index for fast slot availability checks
CREATE INDEX IF NOT EXISTS idx_bookings_slot_check 
  ON bookings(court_id, booking_date, status, start_time, end_time)
  WHERE status = 'confirmed';

-- Index for customer phone lookups (tracking bookings)
CREATE INDEX IF NOT EXISTS idx_bookings_phone 
  ON bookings(customer_phone, reference_id);

-- Index for date range queries on dashboard
CREATE INDEX IF NOT EXISTS idx_bookings_date_range 
  ON bookings(institution_id, booking_date DESC, created_at DESC);

-- Index for court unavailability checks
CREATE INDEX IF NOT EXISTS idx_court_unavailability_check 
  ON court_unavailability(court_id, unavailable_date, start_time, end_time);

-- =====================================================
-- 4. ENHANCED RLS POLICIES
-- =====================================================

-- Drop existing booking policies
DROP POLICY IF EXISTS "Allow booking visibility for slot checking" ON bookings;
DROP POLICY IF EXISTS "Public can view confirmed booking slots" ON bookings;
DROP POLICY IF EXISTS "Institution admins can view their bookings" ON bookings;
DROP POLICY IF EXISTS "Anyone can create bookings" ON bookings;
DROP POLICY IF EXISTS "Institution admins can update their bookings" ON bookings;

-- Public can view confirmed bookings for availability checking (minimal data)
CREATE POLICY "Public slot availability check"
ON bookings
FOR SELECT
TO public
USING (status = 'confirmed');

-- Institution admins have full SELECT access to their bookings
CREATE POLICY "Admin full booking access"
ON bookings
FOR SELECT
TO authenticated
USING (
  institution_id IN (
    SELECT institution_id 
    FROM institution_admins 
    WHERE id = auth.uid()
  )
);

-- Anyone can create bookings (public booking form)
CREATE POLICY "Public can create bookings"
ON bookings
FOR INSERT
TO public
WITH CHECK (status = 'confirmed');

-- Only institution admins can update/cancel their bookings
CREATE POLICY "Admin can update bookings"
ON bookings
FOR UPDATE
TO authenticated
USING (
  institution_id IN (
    SELECT institution_id 
    FROM institution_admins 
    WHERE id = auth.uid()
  )
)
WITH CHECK (
  institution_id IN (
    SELECT institution_id 
    FROM institution_admins 
    WHERE id = auth.uid()
  )
);

-- =====================================================
-- 5. RATE LIMITING TABLE (Anti-abuse)
-- =====================================================

CREATE TABLE IF NOT EXISTS booking_rate_limits (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  ip_address INET,
  phone_number VARCHAR(20),
  booking_count INTEGER DEFAULT 1,
  window_start TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_rate_limit_ip ON booking_rate_limits(ip_address, window_start);
CREATE INDEX IF NOT EXISTS idx_rate_limit_phone ON booking_rate_limits(phone_number, window_start);

-- Function to check rate limits
CREATE OR REPLACE FUNCTION check_booking_rate_limit(
  p_ip_address INET,
  p_phone VARCHAR
)
RETURNS BOOLEAN AS $$
DECLARE
  v_ip_count INTEGER;
  v_phone_count INTEGER;
  v_window_start TIMESTAMP := NOW() - INTERVAL '1 hour';
BEGIN
  -- Check IP rate limit (max 10 bookings per IP per hour)
  SELECT COALESCE(SUM(booking_count), 0)
  INTO v_ip_count
  FROM booking_rate_limits
  WHERE ip_address = p_ip_address
    AND window_start > v_window_start;
  
  IF v_ip_count >= 10 THEN
    RETURN FALSE;
  END IF;

  -- Check phone rate limit (max 5 bookings per phone per hour)
  SELECT COALESCE(SUM(booking_count), 0)
  INTO v_phone_count
  FROM booking_rate_limits
  WHERE phone_number = p_phone
    AND window_start > v_window_start;
  
  IF v_phone_count >= 5 THEN
    RETURN FALSE;
  END IF;

  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- 6. CLEANUP OLD RATE LIMIT RECORDS (Scheduled Job)
-- =====================================================

-- Function to clean up old rate limit records
CREATE OR REPLACE FUNCTION cleanup_rate_limits()
RETURNS void AS $$
BEGIN
  DELETE FROM booking_rate_limits
  WHERE window_start < NOW() - INTERVAL '2 hours';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- 7. BOOKING VALIDATION FUNCTION
-- =====================================================

CREATE OR REPLACE FUNCTION validate_booking_data(
  p_customer_name VARCHAR,
  p_customer_phone VARCHAR,
  p_customer_email VARCHAR
)
RETURNS TABLE (
  is_valid BOOLEAN,
  error_message TEXT
) AS $$
BEGIN
  -- Validate name (at least 2 characters, no special chars except space)
  IF LENGTH(TRIM(p_customer_name)) < 2 THEN
    RETURN QUERY SELECT FALSE, 'Name must be at least 2 characters'::TEXT;
    RETURN;
  END IF;

  IF p_customer_name !~ '^[a-zA-Z\s\.\-'']+$' THEN
    RETURN QUERY SELECT FALSE, 'Name contains invalid characters'::TEXT;
    RETURN;
  END IF;

  -- Validate phone (Sri Lankan format: 0XX XXX XXXX or +94 XX XXX XXXX)
  IF p_customer_phone !~ '^(\+94|0)[0-9]{9,10}$' THEN
    RETURN QUERY SELECT FALSE, 'Invalid phone number format'::TEXT;
    RETURN;
  END IF;

  -- Validate email if provided
  IF p_customer_email IS NOT NULL AND LENGTH(p_customer_email) > 0 THEN
    IF p_customer_email !~ '^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$' THEN
      RETURN QUERY SELECT FALSE, 'Invalid email format'::TEXT;
      RETURN;
    END IF;
  END IF;

  RETURN QUERY SELECT TRUE, NULL::TEXT;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- =====================================================
-- 8. REAL-TIME PUBLICATION
-- =====================================================

-- Ensure bookings table is in realtime publication
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND tablename = 'bookings'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE bookings;
  END IF;
END $$;

-- Also add court_unavailability for admin blocking
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND tablename = 'court_unavailability'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE court_unavailability;
  END IF;
END $$;

-- =====================================================
-- 9. COMMENTS FOR DOCUMENTATION
-- =====================================================

COMMENT ON FUNCTION create_booking_atomic IS 'Atomic booking creation with row-level locking to prevent double bookings';
COMMENT ON FUNCTION check_no_overlapping_bookings IS 'Trigger function that prevents overlapping confirmed bookings';
COMMENT ON FUNCTION check_booking_rate_limit IS 'Rate limiting function to prevent booking abuse';
COMMENT ON FUNCTION validate_booking_data IS 'Validates customer data before booking';
COMMENT ON TABLE booking_rate_limits IS 'Tracks booking attempts for rate limiting';

-- =====================================================
-- GRANT PERMISSIONS
-- =====================================================

GRANT EXECUTE ON FUNCTION create_booking_atomic TO anon, authenticated;
GRANT EXECUTE ON FUNCTION check_booking_rate_limit TO anon, authenticated;
GRANT EXECUTE ON FUNCTION validate_booking_data TO anon, authenticated;
