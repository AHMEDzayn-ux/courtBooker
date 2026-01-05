import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function PUT(request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get institution ID for this admin
    const adminClient = createAdminClient()
    const { data: adminData } = await adminClient
      .from('institution_admins')
      .select('institution_id')
      .eq('id', user.id)
      .single()

    if (!adminData) {
      return NextResponse.json({ error: 'Not an institution admin' }, { status: 403 })
    }

    const formData = await request.formData()
    
    // Extract form fields
    const name = formData.get('name')
    const district = formData.get('district')
    const address = formData.get('address')
    const latitude = parseFloat(formData.get('latitude'))
    const longitude = parseFloat(formData.get('longitude'))
    const contact_number = formData.get('contact_number')
    const email = formData.get('email')
    
    // Get new image files if any
    const newImageFiles = formData.getAll('newImages')
    const existingImages = JSON.parse(formData.get('existingImages') || '[]')

    let imageUrls = [...existingImages]

    // Upload new images if provided
    if (newImageFiles.length > 0 && newImageFiles[0].size > 0) {
      for (let i = 0; i < newImageFiles.length; i++) {
        const file = newImageFiles[i]
        const fileExt = file.name.split('.').pop()
        const fileName = `${Date.now()}_${i}.${fileExt}`
        const filePath = `${user.id}/${fileName}`

        // Convert File to Buffer for Node.js environment
        const buffer = Buffer.from(await file.arrayBuffer())

        const { error: uploadError } = await adminClient.storage
          .from('institution-images')
          .upload(filePath, buffer, {
            contentType: file.type,
            upsert: false
          })

        if (uploadError) {
          console.error('Upload error:', uploadError)
          continue
        }

        const { data: { publicUrl } } = adminClient.storage
          .from('institution-images')
          .getPublicUrl(filePath)

        imageUrls.push(publicUrl)
      }
    }

    // Update institution
    const { error: updateError } = await adminClient
      .from('institutions')
      .update({
        name,
        district,
        address,
        latitude,
        longitude,
        contact_number,
        email,
        images: imageUrls
      })
      .eq('id', adminData.institution_id)

    if (updateError) {
      console.error('Update error:', updateError)
      return NextResponse.json(
        { error: `Failed to update institution: ${updateError.message}` },
        { status: 400 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Institution updated successfully!'
    })

  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    )
  }
}

export async function GET(request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get institution ID for this admin
    const adminClient = createAdminClient()
    const { data: adminData } = await adminClient
      .from('institution_admins')
      .select('institution_id')
      .eq('id', user.id)
      .single()

    if (!adminData) {
      return NextResponse.json({ error: 'Not an institution admin' }, { status: 403 })
    }

    // Fetch institution details
    const { data: institution, error } = await adminClient
      .from('institutions')
      .select('*')
      .eq('id', adminData.institution_id)
      .single()

    if (error) throw error

    return NextResponse.json({ institution })

  } catch (error) {
    console.error('Error:', error)
    return NextResponse.json({ error: 'Failed to fetch institution' }, { status: 500 })
  }
}
