'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'

export default function TrackBookingPage() {
  const [referenceId, setReferenceId] = useState('')
  const [phone, setPhone] = useState('')
  const [bookings, setBookings] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSearch = async (e) => {
    e.preventDefault()
    setError('')
    setBookings([])
    setLoading(true)

    try {
      const supabase = createClient()
      
      // Check if at least one field is provided
      if (!referenceId.trim() && !phone.trim()) {
        setError('Please provide either a Reference ID or Phone Number')
        setLoading(false)
        return
      }

      let query = supabase
        .from('bookings')
        .select(`
          *,
          sports (name),
          courts (
            name,
            institutions (name)
          )
        `)
        .order('booking_date', { ascending: false })
        .order('start_time', { ascending: false })

      // Add filters based on what's provided
      if (referenceId.trim()) {
        query = query.eq('reference_id', referenceId.trim().toUpperCase())
      }
      if (phone.trim()) {
        query = query.eq('customer_phone', phone.trim())
      }

      const { data, error: queryError } = await query

      if (queryError) {
        console.error('Query Error:', queryError)
        setError('Failed to fetch bookings. Please try again.')
        setLoading(false)
        return
      }

      if (!data || data.length === 0) {
        setError('No bookings found with the provided information.')
      } else {
        // Transform data to match expected format
        const transformedData = data.map(booking => ({
          ...booking,
          institution_name: booking.courts.institutions.name,
          court_name: booking.courts.name,
          sport_name: booking.sports?.name
        }))
        setBookings(transformedData)
      }
    } catch (err) {
      console.error('Error:', err)
      setError('An unexpected error occurred. Please try again.')
    }

    setLoading(false)
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'confirmed':
        return 'bg-green-100 text-green-800'
      case 'cancelled':
        return 'bg-red-100 text-red-800'
      case 'pending':
        return 'bg-yellow-100 text-yellow-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-12 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-2xl shadow-xl p-8">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Track Your Booking</h1>
            <p className="text-gray-600">Enter your reference ID or phone number to view booking details</p>
            <Link 
              href="/"
              className="inline-block mt-4 text-blue-600 hover:text-blue-700 font-medium"
            >
              ← Back to Home
            </Link>
          </div>

          {/* Search Form */}
          <form onSubmit={handleSearch} className="space-y-6 mb-8">
            <div>
              <label htmlFor="referenceId" className="block text-sm font-medium text-gray-700 mb-2">
                Booking Reference ID <span className="text-gray-500 text-xs">(Optional if phone provided)</span>
              </label>
              <input
                type="text"
                id="referenceId"
                value={referenceId}
                onChange={(e) => setReferenceId(e.target.value.toUpperCase())}
                placeholder="BK12345678"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent uppercase"
              />
            </div>

            <div>
              <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-2">
                Phone Number <span className="text-gray-500 text-xs">(Optional if reference ID provided)</span>
              </label>
              <input
                type="tel"
                id="phone"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="0771234567"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              {loading ? (
                <span className="flex items-center justify-center">
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Searching...
                </span>
              ) : (
                'Track Booking'
              )}
            </button>
          </form>

          {/* Booking Details */}
          {bookings.length > 0 && (
            <div className="border-t pt-8">
              {bookings.length > 1 && (
                <div className="mb-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <p className="text-blue-800 font-medium">Found {bookings.length} bookings</p>
                </div>
              )}
              
              {bookings.map((booking, index) => (
                <div key={booking.id} className={index > 0 ? 'mt-8 pt-8 border-t' : ''}>
                  <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-6 mb-6">
                    <div className="flex items-center justify-between mb-4">
                      <h2 className="text-2xl font-bold text-gray-900">
                        {bookings.length > 1 ? `Booking ${index + 1}` : 'Booking Details'}
                      </h2>
                      <span className={`px-4 py-2 rounded-full text-sm font-semibold ${getStatusColor(booking.status)}`}>
                        {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
                      </span>
                    </div>
                
                <div className="bg-white rounded-lg p-4 mb-4">
                  <p className="text-xs text-gray-500 mb-1">Reference ID</p>
                  <p className="text-xl font-mono font-bold text-blue-600">{booking.reference_id}</p>
                </div>
              </div>

              <div className="space-y-4">
                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="font-semibold text-gray-900 mb-3 flex items-center">
                    <svg className="w-5 h-5 mr-2 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                    </svg>
                    Venue Information
                  </h3>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <p className="text-gray-600">Institution</p>
                      <p className="font-semibold text-gray-900">{booking.institution_name}</p>
                    </div>
                    <div>
                      <p className="text-gray-600">Court</p>
                      <p className="font-semibold text-gray-900">{booking.court_name}</p>
                    </div>
                    <div className="col-span-2">
                      <p className="text-gray-600">Sport</p>
                      <p className="font-semibold text-gray-900">{booking.sport_name || 'N/A'}</p>
                    </div>
                  </div>
                </div>

                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="font-semibold text-gray-900 mb-3 flex items-center">
                    <svg className="w-5 h-5 mr-2 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    Schedule
                  </h3>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <p className="text-gray-600">Date</p>
                      <p className="font-semibold text-gray-900">
                        {new Date(booking.booking_date).toLocaleDateString('en-US', {
                          weekday: 'long',
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        })}
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-600">Time</p>
                      <p className="font-semibold text-gray-900">
                        {booking.start_time.substring(0, 5)} - {booking.end_time.substring(0, 5)}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="font-semibold text-gray-900 mb-3 flex items-center">
                    <svg className="w-5 h-5 mr-2 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                    Customer Information
                  </h3>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <p className="text-gray-600">Name</p>
                      <p className="font-semibold text-gray-900">{booking.customer_name}</p>
                    </div>
                    <div>
                      <p className="text-gray-600">Phone</p>
                      <p className="font-semibold text-gray-900">{booking.customer_phone}</p>
                    </div>
                    {booking.customer_email && (
                      <div className="col-span-2">
                        <p className="text-gray-600">Email</p>
                        <p className="font-semibold text-gray-900">{booking.customer_email}</p>
                      </div>
                    )}
                  </div>
                </div>

                {booking.total_price && (
                  <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg p-4 border-2 border-green-200">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-700 font-medium">Total Amount</span>
                      <span className="text-2xl font-bold text-green-600">
                        LKR {parseFloat(booking.total_price).toFixed(2)}
                      </span>
                    </div>
                  </div>
                )}

                  <div className="text-center pt-4">
                    <button
                      onClick={() => {
                        setBookings([])
                        setReferenceId('')
                        setPhone('')
                        setError('')
                      }}
                      className="text-blue-600 hover:text-blue-700 font-medium"
                    >
                      Search Another Booking
                    </button>
                  </div>
                </div>
              </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
