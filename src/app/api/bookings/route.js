import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { NextResponse } from "next/server";
import { headers } from "next/headers";

// Input sanitization helper
function sanitizeInput(str) {
  if (!str) return str;
  return str.trim().replace(/[<>]/g, "");
}

// Phone number normalization
function normalizePhone(phone) {
  if (!phone) return phone;
  // Remove spaces and dashes
  let cleaned = phone.replace(/[\s\-]/g, "");
  // Convert +94 to 0 format
  if (cleaned.startsWith("+94")) {
    cleaned = "0" + cleaned.slice(3);
  }
  return cleaned;
}

// Validate booking date is not in the past
function isValidBookingDate(dateStr) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const bookingDate = new Date(dateStr);
  return bookingDate >= today;
}

export async function POST(request) {
  const startTime_perf = Date.now();

  try {
    // Get client IP for rate limiting
    const headersList = await headers();
    const forwardedFor = headersList.get("x-forwarded-for");
    const clientIp = forwardedFor
      ? forwardedFor.split(",")[0].trim()
      : "127.0.0.1";

    const body = await request.json();
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
      customerEmail,
    } = body;

    // 1. Enhanced Validation
    if (
      !courtId ||
      !institutionId ||
      !bookingDate ||
      !startTime ||
      !endTime ||
      !customerName ||
      !customerPhone
    ) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Sanitize inputs
    const sanitizedName = sanitizeInput(customerName);
    const sanitizedPhone = normalizePhone(sanitizeInput(customerPhone));
    const sanitizedEmail = customerEmail ? sanitizeInput(customerEmail) : null;

    // Validate name length
    if (sanitizedName.length < 2 || sanitizedName.length > 100) {
      return NextResponse.json(
        { error: "Name must be between 2 and 100 characters" },
        { status: 400 }
      );
    }

    // Validate phone format (Sri Lankan)
    const phoneRegex = /^0[0-9]{9}$/;
    if (!phoneRegex.test(sanitizedPhone)) {
      return NextResponse.json(
        { error: "Invalid phone number format. Use 0XX XXX XXXX" },
        { status: 400 }
      );
    }

    // Validate email if provided
    if (sanitizedEmail) {
      const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
      if (!emailRegex.test(sanitizedEmail)) {
        return NextResponse.json(
          { error: "Invalid email format" },
          { status: 400 }
        );
      }
    }

    // Validate booking date
    if (!isValidBookingDate(bookingDate)) {
      return NextResponse.json(
        { error: "Cannot book dates in the past" },
        { status: 400 }
      );
    }

    // Validate time format
    const timeRegex = /^([01]?[0-9]|2[0-3]):[0-5][0-9](:00)?$/;
    if (!timeRegex.test(startTime) || !timeRegex.test(endTime)) {
      return NextResponse.json(
        { error: "Invalid time format" },
        { status: 400 }
      );
    }

    // Validate total price is positive
    if (typeof totalPrice !== "number" || totalPrice < 0) {
      return NextResponse.json({ error: "Invalid price" }, { status: 400 });
    }

    const supabase = await createClient();
    const adminClient = createAdminClient();

    // 2. Check rate limiting (optional - if function exists)
    try {
      const { data: rateLimitOk } = await adminClient.rpc(
        "check_booking_rate_limit",
        {
          p_ip_address: clientIp,
          p_phone: sanitizedPhone,
        }
      );

      if (rateLimitOk === false) {
        return NextResponse.json(
          {
            error: "Too many booking attempts. Please try again later.",
          },
          { status: 429 }
        );
      }
    } catch (e) {
      // Rate limiting function might not exist - continue without it
    }

    // 3. Verify court exists and is enabled (prevent tampering)
    const { data: court, error: courtError } = await adminClient
      .from("courts")
      .select("id, institution_id, is_enabled")
      .eq("id", courtId)
      .eq("institution_id", institutionId)
      .eq("is_enabled", true)
      .single();

    if (courtError || !court) {
      return NextResponse.json(
        { error: "Invalid or unavailable court" },
        { status: 400 }
      );
    }

    // 4. Check for court unavailability blocks
    const { data: unavailable } = await adminClient
      .from("court_unavailability")
      .select("id")
      .eq("court_id", courtId)
      .eq("unavailable_date", bookingDate)
      .or(
        `and(start_time.lte.${startTime},end_time.gt.${startTime}),and(start_time.lt.${endTime},end_time.gte.${endTime}),and(start_time.gte.${startTime},end_time.lte.${endTime})`
      )
      .limit(1);

    if (unavailable && unavailable.length > 0) {
      return NextResponse.json(
        {
          error: "This time slot is blocked by the venue",
        },
        { status: 409 }
      );
    }

    // 5. Use atomic booking function for concurrent safety
    const { data, error } = await supabase.rpc("create_booking_atomic", {
      p_court_id: courtId,
      p_institution_id: institutionId,
      p_booking_date: bookingDate,
      p_start_time: startTime,
      p_end_time: endTime,
      p_sport_id: sportId,
      p_total_price: totalPrice,
      p_customer_name: sanitizedName,
      p_customer_phone: sanitizedPhone,
      p_customer_email: sanitizedEmail,
    });

    if (error) {
      console.error("Booking error:", error);

      // Check for specific error types
      if (error.message.includes("DOUBLE_BOOKING") || error.code === "23505") {
        return NextResponse.json(
          {
            error:
              "This time slot was just booked by another user. Please select a different time.",
          },
          { status: 409 }
        );
      }

      return NextResponse.json(
        { error: "Failed to create booking. Please try again." },
        { status: 500 }
      );
    }

    // 6. Check if booking was successful
    const result = data[0];
    if (!result.success) {
      return NextResponse.json(
        {
          error:
            result.error_message || "Selected time slot is no longer available",
        },
        { status: 409 }
      );
    }

    // 7. Record rate limit (fire and forget)
    adminClient
      .from("booking_rate_limits")
      .insert({
        ip_address: clientIp,
        phone_number: sanitizedPhone,
      })
      .then(() => {})
      .catch(() => {});

    // Log performance
    const duration = Date.now() - startTime_perf;
    if (duration > 1000) {
      console.warn(`Slow booking creation: ${duration}ms`);
    }

    // 8. Success
    return NextResponse.json({
      success: true,
      referenceId: result.reference_id,
      bookingId: result.booking_id,
      booking: {
        reference_id: result.reference_id,
        booking_date: bookingDate,
        start_time: startTime,
      },
    });
  } catch (error) {
    console.error("API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
