import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET(request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get institution ID for this admin
    const adminClient = createAdminClient();
    const { data: adminData } = await adminClient
      .from("institution_admins")
      .select("institution_id")
      .eq("id", user.id)
      .single();

    if (!adminData) {
      return NextResponse.json(
        { error: "Not an institution admin" },
        { status: 403 }
      );
    }

    // Fetch courts for this institution
    const { data: courts, error } = await adminClient
      .from("courts")
      .select(
        `
        *,
        court_sports(
          sport_id,
          sports(id, name)
        )
      `
      )
      .eq("institution_id", adminData.institution_id)
      .order("created_at", { ascending: false });

    if (error) throw error;

    return NextResponse.json({ courts });
  } catch (error) {
    console.error("Error:", error);
    return NextResponse.json(
      { error: "Failed to fetch courts" },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const {
      name,
      opening_time,
      closing_time,
      slot_duration_minutes,
      price_per_slot,
      is_enabled,
      selectedSports,
    } = body;

    // Get institution ID
    const adminClient = createAdminClient();
    const { data: adminData } = await adminClient
      .from("institution_admins")
      .select("institution_id")
      .eq("id", user.id)
      .single();

    if (!adminData) {
      return NextResponse.json(
        { error: "Not an institution admin" },
        { status: 403 }
      );
    }

    // Create court
    const { data: court, error: courtError } = await adminClient
      .from("courts")
      .insert({
        institution_id: adminData.institution_id,
        name,
        opening_time: opening_time + ":00",
        closing_time: closing_time + ":00",
        slot_duration_minutes: parseInt(slot_duration_minutes),
        price_per_slot: parseFloat(price_per_slot),
        is_enabled,
      })
      .select()
      .single();

    if (courtError) throw courtError;

    // Create court_sports entries
    if (selectedSports && selectedSports.length > 0) {
      const courtSports = selectedSports.map((sportId) => ({
        court_id: court.id,
        sport_id: sportId,
      }));

      await adminClient.from("court_sports").insert(courtSports);
    }

    return NextResponse.json({ success: true, court });
  } catch (error) {
    console.error("Error:", error);
    return NextResponse.json(
      { error: "Failed to create court" },
      { status: 500 }
    );
  }
}

export async function PUT(request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const {
      courtId,
      name,
      opening_time,
      closing_time,
      slot_duration_minutes,
      price_per_slot,
      is_enabled,
      selectedSports,
    } = body;

    // Validate courtId is a UUID
    const uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!courtId || !uuidRegex.test(courtId)) {
      return NextResponse.json({ error: "Invalid court ID" }, { status: 400 });
    }

    // Validate required fields
    if (!name || name.trim().length < 1 || name.length > 100) {
      return NextResponse.json(
        { error: "Invalid court name" },
        { status: 400 }
      );
    }

    // Validate times
    const timeRegex = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/;
    if (!timeRegex.test(opening_time) || !timeRegex.test(closing_time)) {
      return NextResponse.json(
        { error: "Invalid time format" },
        { status: 400 }
      );
    }

    // Validate slot duration
    const validDurations = [15, 30, 45, 60, 90, 120];
    if (!validDurations.includes(parseInt(slot_duration_minutes))) {
      return NextResponse.json(
        { error: "Invalid slot duration" },
        { status: 400 }
      );
    }

    // Validate price
    if (isNaN(parseFloat(price_per_slot)) || parseFloat(price_per_slot) < 0) {
      return NextResponse.json({ error: "Invalid price" }, { status: 400 });
    }

    // Get institution ID
    const adminClient = createAdminClient();
    const { data: adminData } = await adminClient
      .from("institution_admins")
      .select("institution_id")
      .eq("id", user.id)
      .single();

    if (!adminData) {
      return NextResponse.json(
        { error: "Not an institution admin" },
        { status: 403 }
      );
    }

    // Update court (ensuring it belongs to this institution)
    const { error: courtError } = await adminClient
      .from("courts")
      .update({
        name,
        opening_time: opening_time + ":00",
        closing_time: closing_time + ":00",
        slot_duration_minutes: parseInt(slot_duration_minutes),
        price_per_slot: parseFloat(price_per_slot),
        is_enabled,
      })
      .eq("id", courtId)
      .eq("institution_id", adminData.institution_id); // Security check

    if (courtError) throw courtError;

    // Update court_sports
    await adminClient.from("court_sports").delete().eq("court_id", courtId);

    if (selectedSports && selectedSports.length > 0) {
      const courtSports = selectedSports.map((sportId) => ({
        court_id: courtId,
        sport_id: sportId,
      }));

      await adminClient.from("court_sports").insert(courtSports);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error:", error);
    return NextResponse.json(
      { error: "Failed to update court" },
      { status: 500 }
    );
  }
}

export async function DELETE(request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const courtId = searchParams.get("courtId");

    // Validate courtId is a UUID
    const uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!courtId || !uuidRegex.test(courtId)) {
      return NextResponse.json({ error: "Invalid court ID" }, { status: 400 });
    }

    // Get institution ID
    const adminClient = createAdminClient();
    const { data: adminData } = await adminClient
      .from("institution_admins")
      .select("institution_id")
      .eq("id", user.id)
      .single();

    if (!adminData) {
      return NextResponse.json(
        { error: "Not an institution admin" },
        { status: 403 }
      );
    }

    // Delete court_sports first
    await adminClient.from("court_sports").delete().eq("court_id", courtId);

    // Delete court (ensuring it belongs to this institution)
    const { error } = await adminClient
      .from("courts")
      .delete()
      .eq("id", courtId)
      .eq("institution_id", adminData.institution_id); // Security check

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error:", error);
    return NextResponse.json(
      { error: "Failed to delete court" },
      { status: 500 }
    );
  }
}
