import Image from 'next/image'

export default function InstitutionHeader({ institution }) {
  return (
    <div className="bg-white border-b">
      <div className="container mx-auto px-4 py-6">
        {/* Image Gallery */}
        {institution.images && institution.images.length > 0 && (
          <div className="mb-6 grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-2 relative h-96 rounded-lg overflow-hidden">
              <Image
                src={institution.images[0]}
                alt={institution.name}
                fill
                className="object-cover"
                priority
              />
            </div>
            {institution.images.length > 1 && (
              <div className="grid grid-cols-2 md:grid-cols-1 gap-4">
                {institution.images.slice(1, 3).map((img, idx) => (
                  <div key={idx} className="relative h-44 rounded-lg overflow-hidden">
                    <Image
                      src={img}
                      alt={`${institution.name} ${idx + 2}`}
                      fill
                      className="object-cover"
                    />
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Institution Info */}
        <div className="space-y-4">
          <h1 className="text-3xl font-bold text-gray-900">{institution.name}</h1>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-gray-600">
            {/* District */}
            <div className="flex items-center">
              <svg className="w-5 h-5 mr-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <span className="font-medium">{institution.district}</span>
            </div>

            {/* Contact */}
            <div className="flex items-center">
              <svg className="w-5 h-5 mr-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
              </svg>
              <span>{institution.contact_number}</span>
            </div>

            {/* Email */}
            <div className="flex items-center">
              <svg className="w-5 h-5 mr-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
              <span>{institution.email}</span>
            </div>
          </div>

          {/* Address */}
          <div className="flex items-start text-gray-600">
            <svg className="w-5 h-5 mr-2 mt-0.5 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
            <span>{institution.address}</span>
          </div>
        </div>
      </div>
    </div>
  )
}
