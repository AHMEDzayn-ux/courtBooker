import { createAdminClient } from "@/lib/supabase/admin";
import { NextResponse } from "next/server";

export async function POST(request) {
  try {
    const formData = await request.formData();

    // Extract form fields
    const name = formData.get("name");
    const district = formData.get("district");
    const address = formData.get("address");
    const google_maps_link = formData.get("google_maps_link");
    const contact_number = formData.get("contact_number");
    const email = formData.get("email");
    const selectedSports = JSON.parse(formData.get("selectedSports") || "[]");
    const adminEmail = formData.get("adminEmail");
    const adminPassword = formData.get("adminPassword");
    const adminName = formData.get("adminName");

    // Get image files
    const imageFiles = formData.getAll("images");

    // Create admin client with service role
    const supabase = createAdminClient();

    // Step 1: Create admin user
    const { data: authData, error: authError } =
      await supabase.auth.admin.createUser({
        email: adminEmail,
        password: adminPassword,
        email_confirm: true, // Auto-confirm email
        user_metadata: {
          full_name: adminName,
        },
      });

    if (authError) {
      console.error("Auth error:", authError);
      return NextResponse.json(
        { error: `Failed to create admin account: ${authError.message}` },
        { status: 400 }
      );
    }

    const userId = authData.user.id;

    // Step 2: Upload images to Supabase Storage
    const imageUrls = [];
    for (let i = 0; i < imageFiles.length; i++) {
      const file = imageFiles[i];
      const fileExt = file.name.split(".").pop();
      const fileName = `${Date.now()}_${i}.${fileExt}`;
      const filePath = `${userId}/${fileName}`;

      // Convert File to Buffer for Node.js environment
      const buffer = Buffer.from(await file.arrayBuffer());

      const { error: uploadError } = await supabase.storage
        .from("institution-images")
        .upload(filePath, buffer, {
          contentType: file.type,
          upsert: false,
        });

      if (uploadError) {
        console.error("Upload error:", uploadError);
        continue;
      }

      const {
        data: { publicUrl },
      } = supabase.storage.from("institution-images").getPublicUrl(filePath);

      imageUrls.push(publicUrl);
    }

    if (imageUrls.length === 0) {
      return NextResponse.json(
        { error: "Failed to upload images" },
        { status: 400 }
      );
    }

    // Step 3: Create institution (service role bypasses RLS)
    const { data: institution, error: institutionError } = await supabase
      .from("institutions")
      .insert({
        name,
        district,
        address,
        google_maps_link,
        contact_number,
        email,
        images: imageUrls,
        is_verified: false,
      })
      .select()
      .single();

    if (institutionError) {
      console.error("Institution error:", institutionError);
      return NextResponse.json(
        { error: `Failed to create institution: ${institutionError.message}` },
        { status: 400 }
      );
    }

    // Step 4: Link admin to institution
    const { error: adminLinkError } = await supabase
      .from("institution_admins")
      .insert({
        institution_id: institution.id,
        id: userId,
        email: adminEmail,
      });

    if (adminLinkError) {
      console.error("Admin link error:", adminLinkError);
      return NextResponse.json(
        { error: `Failed to link admin: ${adminLinkError.message}` },
        { status: 400 }
      );
    }

    // Success!
    return NextResponse.json({
      success: true,
      message: "Institution registered successfully!",
      institutionId: institution.id,
    });
  } catch (error) {
    console.error("Unexpected error:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred" },
      { status: 500 }
    );
  }
}
