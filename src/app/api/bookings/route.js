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

    // 2. Check Availability
    const { data: isAvailable } = await supabase.rpc('check_slot_available', {
      p_court_id: courtId,
      p_booking_date: bookingDate,
      p_start_time: startTime,
      p_end_time: endTime
    })

    if (!isAvailable) {
      return NextResponse.json({ error: 'Selected time slot is no longer available' }, { status: 409 })
    }

    // 3. GENERATE REFERENCE ID MANUALLY
    // This allows us to return it to the user without needing 'SELECT' permissions
    const myReferenceId = 'BK' + Math.floor(Math.random() * 100000000).toString().padStart(8, '0');

    // 4. Create Booking (NO .select())
    const { error } = await supabase
      .from('bookings')
      .insert({
        court_id: courtId,
        institution_id: institutionId,
        booking_date: bookingDate,
        start_time: startTime,
        end_time: endTime,
        sport_id: sportId, 
        total_price: totalPrice,
        customer_name: customerName,
        customer_phone: customerPhone,
        customer_email: customerEmail || null,
        status: 'confirmed',
        reference_id: myReferenceId // <--- Sending our manual ID
      })
      // ❌ REMOVED: .select().single()

    if (error) {
      console.error('Booking error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // 5. Success
    return NextResponse.json({
      success: true,
      referenceId: myReferenceId,
      // We cannot return the full 'booking' object because we didn't fetch it, 
      // but we can return the data we just sent.
      booking: { 
        reference_id: myReferenceId,
        booking_date: bookingDate,
        start_time: startTime 
      } 
    })

  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}