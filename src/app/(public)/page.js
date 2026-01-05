import { createClient } from '@/lib/supabase/server'
import InstitutionGrid from '@/components/InstitutionGrid'
import SearchFilters from '@/components/SearchFilters'
import Link from 'next/link'

export default async function HomePage({ searchParams }) {
  const supabase = await createClient()
  
  // Get query parameters
  const params = await searchParams
  const searchQuery = params.search || ''
  const district = params.district || ''
  const sport = params.sport || ''

  // Build query for verified institutions
  let query = supabase
    .from('institutions')
    .select(`
      *,
      courts (
        id,
        court_sports (
          sport_id,
          sports (
            id,
            name
          )
        )
      )
    `)
    .eq('is_verified', true)
    .order('created_at', { ascending: false })

  // Apply search filter
  if (searchQuery) {
    query = query.ilike('name', `%${searchQuery}%`)
  }

  // Apply district filter
  if (district) {
    query = query.eq('district', district)
  }

  const { data: institutions, error } = await query

  // Filter by sport if needed (client-side since it's nested)
  let filteredInstitutions = institutions || []
  
  if (sport && filteredInstitutions.length > 0) {
    filteredInstitutions = filteredInstitutions.filter(inst => {
      return inst.courts?.some(court => 
        court.court_sports?.some(cs => 
          cs.sports?.name === sport
        )
      )
    })
  }

  // Get unique sports for filter
  const { data: sports } = await supabase
    .from('sports')
    .select('*')
    .order('name')

  // Get unique districts
  const { data: districtData } = await supabase
    .from('institutions')
    .select('district')
    .eq('is_verified', true)
  
  const uniqueDistricts = [...new Set(districtData?.map(d => d.district) || [])]

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-800 text-white">
        <div className="container mx-auto px-4 py-16">
          <div className="max-w-3xl mx-auto text-center">
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              Book Your Sports Venue
            </h1>
            <p className="text-xl mb-8 text-blue-100">
              Find and book badminton, futsal, cricket courts and more
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link 
                href="/track-booking"
                className="inline-block bg-white text-blue-600 px-6 py-3 rounded-lg font-semibold hover:bg-blue-50 transition-colors"
              >
                Track Your Booking
              </Link>
              <Link 
                href="/institution/login"
                className="inline-block bg-blue-700 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-600 transition-colors border-2 border-white"
              >
                Institution Login
              </Link>
              <Link 
                href="/institution/register"
                className="inline-block bg-transparent text-white px-6 py-3 rounded-lg font-semibold hover:bg-white hover:text-blue-600 transition-colors border-2 border-white"
              >
                Register Institution
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="container mx-auto px-4 py-8">
        <SearchFilters 
          sports={sports || []}
          districts={uniqueDistricts}
          currentSearch={searchQuery}
          currentDistrict={district}
          currentSport={sport}
        />

        {/* Results Count */}
        <div className="mt-6 mb-4">
          <p className="text-gray-600">
            Found <span className="font-semibold">{filteredInstitutions.length}</span> institution{filteredInstitutions.length !== 1 ? 's' : ''}
          </p>
        </div>

        {/* Institution Grid */}
        {error ? (
          <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded">
            Error loading institutions: {error.message}
          </div>
        ) : filteredInstitutions.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-gray-500 text-lg">No institutions found</p>
            <p className="text-gray-400 mt-2">Try adjusting your search filters</p>
          </div>
        ) : (
          <InstitutionGrid institutions={filteredInstitutions} />
        )}
      </div>
    </div>
  )
}
