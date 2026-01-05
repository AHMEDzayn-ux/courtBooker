import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import CourtSelector from '@/components/CourtSelector'
import InstitutionHeader from '@/components/InstitutionHeader'

export default async function InstitutionPage({ params }) {
  const supabase = await createClient()
  const { institutionId } = await params

  // Fetch institution details
  const { data: institution, error } = await supabase
    .from('institutions')
    .select(`
      *,
      courts (
        id,
        name,
        is_enabled,
        opening_time,
        closing_time,
        slot_duration_minutes,
        court_sports (
          sports (
            id,
            name
          )
        )
      )
    `)
    .eq('id', institutionId)
    .eq('is_verified', true)
    .single()

  if (error || !institution) {
    notFound()
  }

  // Filter only enabled courts
  const enabledCourts = institution.courts?.filter(court => court.is_enabled) || []

  return (
    <div className="min-h-screen bg-gray-50">
      <InstitutionHeader institution={institution} />
      
      <div className="container mx-auto px-4 py-8">
        {enabledCourts.length === 0 ? (
          <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 px-4 py-3 rounded">
            No courts available for booking at this institution.
          </div>
        ) : (
          <CourtSelector 
            courts={enabledCourts} 
            institutionId={institution.id}
          />
        )}
      </div>
    </div>
  )
}
