import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function POST(request) {
  try {
    const body = await request.json()
    const { courtId, institutionId, bookingDate, startTime, endTime, customerName, customerPhone, customerEmail } = body

    // Validate required fields
    if (!courtId || !institutionId || !bookingDate || !startTime || !endTime || !customerName || !customerPhone) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    const supabase = await createClient()

    // Check if slot is available
    const { data: isAvailable } = await supabase
      .rpc('check_slot_available', {
        p_court_id: courtId,
        p_booking_date: bookingDate,
        p_start_time: startTime,
        p_end_time: endTime
      })

    if (!isAvailable) {
      return NextResponse.json(
        { error: 'Selected time slot is no longer available' },
        { status: 409 }
      )
    }

    // Create booking
    const { data: booking, error } = await supabase
      .from('bookings')
      .insert({
        court_id: courtId,
        institution_id: institutionId,
        booking_date: bookingDate,
        start_time: startTime,
        end_time: endTime,
        customer_name: customerName,
        customer_phone: customerPhone,
        customer_email: customerEmail || null,
        status: 'confirmed'
      })
      .select()
      .single()

    if (error) {
      console.error('Booking error:', error)
      return NextResponse.json(
        { error: 'Failed to create booking' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      referenceId: booking.reference_id,
      booking
    })

  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
