import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { type, record, old_record } = await req.json()
    
    console.log('SMS Trigger received:', { type, record })

    const booking = record
    let message = ''
    let shouldSend = false

    // Handle new booking confirmation
    if (type === 'INSERT' && booking.status === 'confirmed') {
      shouldSend = true
      
      // Fetch institution and court details for better message
      const supabase = createClient(
        Deno.env.get('SUPABASE_URL') ?? '',
        Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
      )

      const { data: bookingDetails } = await supabase
        .from('bookings')
        .select(`
          *,
          courts (
            name,
            institutions (
              name,
              contact_number
            )
          ),
          sports (
            name
          )
        `)
        .eq('id', booking.id)
        .single()

      if (bookingDetails) {
        const institutionName = bookingDetails.courts?.institutions?.name || 'Court'
        const courtName = bookingDetails.courts?.name || ''
        const sportName = bookingDetails.sports?.name || 'Sport'
        const date = new Date(bookingDetails.booking_date).toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
          year: 'numeric'
        })
        const time = `${bookingDetails.start_time.substring(0, 5)}-${bookingDetails.end_time.substring(0, 5)}`

        message = `✅ Booking Confirmed!\n\nRef: ${bookingDetails.reference_id}\n${institutionName} - ${courtName}\n${sportName}\n📅 ${date}\n⏰ ${time}\n💰 LKR ${bookingDetails.total_price}\n\nThank you for booking with us!`
      } else {
        // Fallback message if details fetch fails
        message = `✅ Booking Confirmed!\n\nRef: ${booking.reference_id}\nDate: ${booking.booking_date}\nTime: ${booking.start_time.substring(0, 5)}\nTotal: LKR ${booking.total_price}`
      }
    }
    
    // Handle booking cancellation
    else if (type === 'UPDATE' && booking.status === 'cancelled' && old_record?.status !== 'cancelled') {
      shouldSend = true
      const reason = booking.cancellation_reason || 'Request by institution'
      message = `❌ Booking Cancelled\n\nRef: ${booking.reference_id}\nReason: ${reason}\n\nFor queries, please contact the institution. Any payments will be processed according to cancellation policy.`
    }

    // Skip if no message to send
    if (!shouldSend || !message) {
      return new Response(
        JSON.stringify({ success: true, message: 'No SMS required' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Send SMS via TextBee Android SMS Gateway
    const smsGatewayBaseUrl = Deno.env.get('SMS_GATEWAY_BASE_URL') || 'https://api.textbee.dev/api/v1'
    const smsApiKey = Deno.env.get('SMS_API_KEY')
    const smsDeviceId = Deno.env.get('SMS_DEVICE_ID')

    if (!smsApiKey || !smsDeviceId) {
      console.error('SMS_API_KEY or SMS_DEVICE_ID not configured')
      return new Response(
        JSON.stringify({ error: 'SMS gateway credentials not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log('Sending SMS to:', booking.customer_phone)

    const smsGatewayUrl = `${smsGatewayBaseUrl}/gateway/devices/${smsDeviceId}/send-sms`

    const smsResponse = await fetch(smsGatewayUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': smsApiKey
      },
      body: JSON.stringify({
        recipients: [booking.customer_phone],
        message: message
      })
    })

    const smsResult = await smsResponse.json()

    if (!smsResponse.ok) {
      console.error('SMS sending failed:', smsResult)
      throw new Error(`SMS gateway error: ${smsResult.error || 'Unknown error'}`)
    }

    console.log('SMS sent successfully:', smsResult)

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'SMS sent successfully',
        smsId: smsResult.data?._id,
        status: smsResult.data?.status
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Error in send-booking-sms function:', error)
    return new Response(
      JSON.stringify({ 
        error: error.message,
        details: error.toString()
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})
