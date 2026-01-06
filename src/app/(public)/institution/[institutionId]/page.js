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
        price_per_slot,
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
    <div className="min-h-screen bg-white">
      <InstitutionHeader institution={institution} />
      
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {enabledCourts.length === 0 ? (
          <div className="bg-gradient-to-r from-amber-50 to-orange-50 border-l-4 border-amber-400 text-amber-800 px-6 py-4 rounded-lg shadow-sm">
            <div className="flex items-center">
              <svg className="w-6 h-6 mr-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <span className="font-medium">No courts available for booking at this institution.</span>
            </div>
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
