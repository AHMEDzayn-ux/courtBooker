import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const filter = searchParams.get('filter') || 'all'
    const statusFilter = searchParams.get('statusFilter') || 'all'

    // Get institution ID
    const adminClient = createAdminClient()
    const { data: adminData } = await adminClient
      .from('institution_admins')
      .select('institution_id')
      .eq('id', user.id)
      .single()

    if (!adminData) {
      return NextResponse.json({ error: 'Not an institution admin' }, { status: 403 })
    }

    // Build query - ONLY bookings for THIS institution
    let query = adminClient
      .from('bookings')
      .select(`
        *,
        courts(name),
        sports(name)
      `)
      .eq('institution_id', adminData.institution_id) // Security: Only their bookings
      .order('booking_date', { ascending: false })
      .order('start_time', { ascending: false })

    // Apply date filter
    const today = new Date().toISOString().split('T')[0]
    if (filter === 'upcoming') {
      query = query.gte('booking_date', today)
    } else if (filter === 'past') {
      query = query.lt('booking_date', today)
    }

    // Apply status filter
    if (statusFilter !== 'all') {
      query = query.eq('status', statusFilter)
    }

    const { data: bookings, error } = await query

    if (error) throw error

    return NextResponse.json({ bookings })

  } catch (error) {
    console.error('Error:', error)
    return NextResponse.json({ error: 'Failed to fetch bookings' }, { status: 500 })
  }
}

export async function PUT(request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { bookingId, status, cancellationReason } = body

    // Get institution ID
    const adminClient = createAdminClient()
    const { data: adminData } = await adminClient
      .from('institution_admins')
      .select('institution_id')
      .eq('id', user.id)
      .single()

    if (!adminData) {
      return NextResponse.json({ error: 'Not an institution admin' }, { status: 403 })
    }

    // Prepare update data
    const updateData = { status }
    if (status === 'cancelled' && cancellationReason) {
      updateData.cancellation_reason = cancellationReason
    }

    // Update booking (ensuring it belongs to this institution)
    const { error } = await adminClient
      .from('bookings')
      .update(updateData)
      .eq('id', bookingId)
      .eq('institution_id', adminData.institution_id) // Security check

    if (error) throw error

    return NextResponse.json({ success: true })

  } catch (error) {
    console.error('Error:', error)
    return NextResponse.json({ error: 'Failed to update booking' }, { status: 500 })
  }
}
