'use client'

import { useEffect, useState, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

export default function BookingsPage() {
  const router = useRouter()
  const [bookings, setBookings] = useState([])
  const [institutionId, setInstitutionId] = useState(null)
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all') // all, upcoming, past
  const [statusFilter, setStatusFilter] = useState('all') // all, confirmed, cancelled
  const [searchTerm, setSearchTerm] = useState('')
  const channelRef = useRef(null)

  useEffect(() => {
    fetchBookings()
    
    // Cleanup real-time subscription on unmount
    return () => {
      if (channelRef.current) {
        channelRef.current.unsubscribe()
      }
    }
  }, [filter, statusFilter])

  const fetchBookings = async () => {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      router.push('/institution/login')
      return
    }

    // Fetch bookings via API
    const response = await fetch(`/api/dashboard/bookings?filter=${filter}&statusFilter=${statusFilter}`)
    const data = await response.json()

    if (response.ok) {
      setBookings(data.bookings || [])
      
      // Get institution ID for later use
      const { data: adminData } = await supabase
        .from('institution_admins')
        .select('institution_id')
        .eq('id', user.id)
        .single()
      
      const instId = adminData?.institution_id
      setInstitutionId(instId)

      // Set up real-time subscription for this institution
      if (instId) {
        setupRealtimeSubscription(supabase, instId)
      }
    }

    setLoading(false)
  }

  const setupRealtimeSubscription = (supabase, instId) => {
    // Remove existing subscription if any
    if (channelRef.current) {
      channelRef.current.unsubscribe()
    }

    // Create new channel for this institution's bookings
    const channel = supabase
      .channel(`institution_bookings:${instId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'bookings',
          filter: `institution_id=eq.${instId}`
        },
        (payload) => {
          console.log('Real-time booking change:', payload)
          
          // Refresh bookings when any change occurs
          fetchBookings()
        }
      )
      .subscribe((status) => {
        console.log('Dashboard real-time subscription:', status)
      })

    channelRef.current = channel
  }

  const handleCancelBooking = async (bookingId) => {
    const reason = prompt('Please provide a reason for cancellation (will be sent via SMS to customer):')
    
    if (!reason || reason.trim() === '') {
      alert('Cancellation reason is required')
      return
    }

    if (!confirm('Are you sure you want to cancel this booking? The customer will be notified via SMS.')) {
      return
    }

    try {
      const response = await fetch('/api/dashboard/bookings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bookingId,
          status: 'cancelled',
          cancellationReason: reason.trim()
        })
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error)
      }

      alert('Booking cancelled successfully. Customer will be notified via SMS.')
      fetchBookings()
    } catch (error) {
      console.error('Error:', error)
      alert('Failed to cancel booking: ' + error.message)
    }
  }

  const filteredBookings = bookings.filter(booking => {
    if (!searchTerm) return true
    const search = searchTerm.toLowerCase()
    return (
      booking.reference_id.toLowerCase().includes(search) ||
      booking.customer_name.toLowerCase().includes(search) ||
      booking.customer_phone.includes(search)
    )
  })

  if (loading) {
    return <div className="text-center py-12">Loading...</div>
  }

  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Bookings Management</h1>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Search</label>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Reference ID, Name, Phone..."
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Date Filter</label>
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Bookings</option>
              <option value="upcoming">Upcoming</option>
              <option value="past">Past</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Statuses</option>
              <option value="confirmed">Confirmed</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
        </div>
      </div>

      {/* Bookings Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        {filteredBookings.length === 0 ? (
          <div className="p-12 text-center text-gray-500">
            No bookings found
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Reference</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Time</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Court</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Sport</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Customer</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Phone</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredBookings.map((booking) => (
                  <tr key={booking.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm font-mono text-blue-600">
                      {booking.reference_id}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {new Date(booking.booking_date).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric'
                      })}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {booking.start_time.substring(0, 5)} - {booking.end_time.substring(0, 5)}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {booking.courts.name}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {booking.sports?.name || 'N/A'}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {booking.customer_name}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {booking.customer_phone}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1 text-xs rounded-full font-medium ${
                        booking.status === 'confirmed' ? 'bg-green-100 text-green-800' :
                        booking.status === 'cancelled' ? 'bg-red-100 text-red-800' :
                        'bg-yellow-100 text-yellow-800'
                      }`}>
                        {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm font-semibold text-gray-900">
                      LKR {parseFloat(booking.total_price || 0).toFixed(2)}
                    </td>
                    <td className="px-6 py-4 text-sm">
                      {booking.status === 'confirmed' && (
                        <button
                          onClick={() => handleCancelBooking(booking.id)}
                          className="text-red-600 hover:text-red-800 font-medium"
                        >
                          Cancel
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Summary Stats */}
      <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-lg shadow p-4">
          <p className="text-gray-500 text-sm">Total Bookings</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{filteredBookings.length}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <p className="text-gray-500 text-sm">Confirmed</p>
          <p className="text-2xl font-bold text-green-600 mt-1">
            {filteredBookings.filter(b => b.status === 'confirmed').length}
          </p>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <p className="text-gray-500 text-sm">Total Revenue</p>
          <p className="text-2xl font-bold text-purple-600 mt-1">
            LKR {filteredBookings
              .filter(b => b.status === 'confirmed')
              .reduce((sum, b) => sum + parseFloat(b.total_price || 0), 0)
              .toFixed(2)}
          </p>
        </div>
      </div>
    </div>
  )
}
