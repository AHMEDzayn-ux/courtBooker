-- Fix ambiguous reference_id in create_booking_atomic function

DROP FUNCTION IF EXISTS create_booking_atomic(UUID, UUID, DATE, TIME, TIME, UUID, NUMERIC, VARCHAR, VARCHAR, VARCHAR) CASCADE;

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
  BEGIN
    PERFORM 1
    FROM bookings
    WHERE court_id = p_court_id
      AND booking_date = p_booking_date
      AND status = 'confirmed'
    FOR UPDATE NOWAIT;
  EXCEPTION
    WHEN lock_not_available THEN
      RETURN QUERY SELECT FALSE, NULL::UUID, NULL::VARCHAR, 'Booking in progress by another user. Please try again.'::TEXT;
      RETURN;
  END;

  -- 5. Check for overlapping bookings
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

  -- 6. Generate unique reference ID with collision check (FIXED: qualified column name)
  LOOP
    v_reference_id := 'BK' || LPAD(FLOOR(RANDOM() * 100000000)::TEXT, 8, '0');
    EXIT WHEN NOT EXISTS (SELECT 1 FROM bookings WHERE bookings.reference_id = v_reference_id);
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

GRANT EXECUTE ON FUNCTION create_booking_atomic TO anon, authenticated;
