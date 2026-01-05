import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function POST(request) {
  try {
    const body = await request.json()
    const { 
      courtId, 
      institutionId, 
      bookingDate, 
      startTime, 
      endTime, 
      sportId,
      totalPrice,
      customerName, 
      customerPhone, 
      customerEmail 
    } = body

    // 1. Validation
    if (!courtId || !institutionId || !bookingDate || !startTime || !endTime || !customerName || !customerPhone) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const supabase = await createClient()

    // 2. Use atomic booking function for concurrent safety
    const { data, error } = await supabase.rpc('create_booking_atomic', {
      p_court_id: courtId,
      p_institution_id: institutionId,
      p_booking_date: bookingDate,
      p_start_time: startTime,
      p_end_time: endTime,
      p_sport_id: sportId,
      p_total_price: totalPrice,
      p_customer_name: customerName,
      p_customer_phone: customerPhone,
      p_customer_email: customerEmail || null
    })

    if (error) {
      console.error('Booking error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // 3. Check if booking was successful
    const result = data[0]
    if (!result.success) {
      return NextResponse.json({ 
        error: result.error_message || 'Selected time slot is no longer available' 
      }, { status: 409 })
    }

    // 4. Success
    return NextResponse.json({
      success: true,
      referenceId: result.reference_id,
      bookingId: result.booking_id,
      booking: { 
        reference_id: result.reference_id,
        booking_date: bookingDate,
        start_time: startTime 
      } 
    })

  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}