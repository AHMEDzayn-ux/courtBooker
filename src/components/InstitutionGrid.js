import Link from 'next/link'
import Image from 'next/image'

export default function InstitutionGrid({ institutions }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {institutions.map((institution) => (
        <InstitutionCard key={institution.id} institution={institution} />
      ))}
    </div>
  )
}

function InstitutionCard({ institution }) {
  // Extract unique sports from courts
  const sports = []
  institution.courts?.forEach(court => {
    court.court_sports?.forEach(cs => {
      if (cs.sports && !sports.find(s => s.id === cs.sports.id)) {
        sports.push(cs.sports)
      }
    })
  })

  // Get first image or use placeholder
  const imageUrl = institution.images?.[0] || null

  return (
    <Link href={`/institution/${institution.id}`}>
      <div className="bg-white rounded-lg shadow-sm border hover:shadow-md transition-shadow overflow-hidden h-full flex flex-col">
        {/* Image */}
        <div className="relative h-48 bg-gray-200">
          {imageUrl ? (
            <Image
              src={imageUrl}
              alt={institution.name}
              fill
              className="object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-gray-400">
              <svg className="w-16 h-16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            </div>
          )}
        </div>

        {/* Content */}
        <div className="p-4 flex-1 flex flex-col">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            {institution.name}
          </h3>
          
          <div className="space-y-2 mb-4 flex-1">
            {/* District */}
            <div className="flex items-center text-sm text-gray-600">
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              {institution.district}
            </div>

            {/* Address */}
            <div className="flex items-start text-sm text-gray-600">
              <svg className="w-4 h-4 mr-2 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
              </svg>
              <span className="line-clamp-2">{institution.address}</span>
            </div>

            {/* Contact */}
            <div className="flex items-center text-sm text-gray-600">
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
              </svg>
              {institution.contact_number}
            </div>
          </div>

          {/* Sports Tags */}
          {sports.length > 0 && (
            <div className="flex flex-wrap gap-2 pt-3 border-t">
              {sports.map((sport) => (
                <span
                  key={sport.id}
                  className="px-2 py-1 bg-blue-50 text-blue-700 text-xs font-medium rounded"
                >
                  {sport.name}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Book Now Footer */}
        <div className="px-4 py-3 bg-gray-50 border-t">
          <div className="text-blue-600 font-medium text-sm flex items-center justify-between">
            <span>View & Book</span>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </div>
        </div>
      </div>
    </Link>
  )
}
