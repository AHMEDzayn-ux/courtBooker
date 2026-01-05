'use client'

import { useState, useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import BookingModal from './BookingModal'

export default function TimeSlotSelector({ court, institutionId, availableSports }) {
  const [selectedDate, setSelectedDate] = useState('')
  const [slots, setSlots] = useState([])
  const [selectedSlots, setSelectedSlots] = useState([])
  const [selectedSport, setSelectedSport] = useState(availableSports.length === 1 ? availableSports[0]?.id : null)
  const [loading, setLoading] = useState(false)
  const [showBookingModal, setShowBookingModal] = useState(false)
  const supabaseRef = useRef(null)
  const channelRef = useRef(null)

  useEffect(() => {
    // Initialize Supabase client
    if (!supabaseRef.current) {
      supabaseRef.current = createClient()
    }
    
    // Only fetch when both date and sport are selected
    if (selectedDate && selectedSport) {
      generateSlots()
      fetchBookings()

      // Set up real-time subscription for booking changes
      setupRealtimeSubscription()
    }

    // Cleanup function
    return () => {
      if (channelRef.current) {
        channelRef.current.unsubscribe()
      }
    }
  }, [selectedDate, selectedSport, court.id])

  const setupRealtimeSubscription = () => {
    // Remove existing subscription if any
    if (channelRef.current) {
      channelRef.current.unsubscribe()
    }

    // Create new channel for this court and date
    const channel = supabaseRef.current
      .channel(`bookings:court_${court.id}:date_${selectedDate}`)
      .on(
        'postgres_changes',
        {
          event: '*', // Listen to INSERT, UPDATE, DELETE
          schema: 'public',
          table: 'bookings',
          filter: `court_id=eq.${court.id}`
        },
        (payload) => {
          console.log('Real-time booking change detected:', payload)
          
          // Check if the change affects the currently selected date
          const changedBooking = payload.new || payload.old
          if (changedBooking && changedBooking.booking_date === selectedDate) {
            // Refresh bookings to show updated availability
            fetchBookings()
          }
        }
      )
      .subscribe((status) => {
        console.log('Real-time subscription status:', status)
      })

    channelRef.current = channel
  }

  const generateSlots = () => {
    const slots = []
    const [startHour, startMin] = court.opening_time.split(':').map(Number)
    const [endHour, endMin] = court.closing_time.split(':').map(Number)
    
    let currentTime = startHour * 60 + startMin
    const endTime = endHour * 60 + endMin
    
    while (currentTime < endTime) {
      const hour = Math.floor(currentTime / 60)
      const min = currentTime % 60
      const timeStr = `${String(hour).padStart(2, '0')}:${String(min).padStart(2, '0')}:00`
      
      slots.push({
        time: timeStr,
        displayTime: `${String(hour).padStart(2, '0')}:${String(min).padStart(2, '0')}`,
        available: true
      })
      
      currentTime += court.slot_duration_minutes
    }
    
    setSlots(slots)
  }

  const fetchBookings = async () => {
    setLoading(true)
    const supabase = createClient()
    
    const { data: bookings } = await supabase
      .from('bookings')
      .select('start_time, end_time')
      .eq('court_id', court.id)
      .eq('booking_date', selectedDate)
      .eq('status', 'confirmed')

    if (bookings) {
      setSlots(prevSlots => 
        prevSlots.map(slot => ({
          ...slot,
          available: !bookings.some(booking => 
            slot.time >= booking.start_time && slot.time < booking.end_time
          )
        }))
      )
    }
    
    setLoading(false)
  }

  const handleSlotClick = (slot) => {
    if (!slot.available) return

    const index = selectedSlots.findIndex(s => s.time === slot.time)
    
    if (index > -1) {
      // Deselect slot
      setSelectedSlots(selectedSlots.filter(s => s.time !== slot.time))
    } else {
      // Select slot (add to end for continuous selection)
      setSelectedSlots([...selectedSlots, slot].sort((a, b) => 
        a.time.localeCompare(b.time)
      ))
    }
  }

  const handleDateChange = (days) => {
    const date = new Date(selectedDate)
    date.setDate(date.getDate() + days)
    setSelectedDate(date.toISOString().split('T')[0])
    setSelectedSlots([])
  }

  const getTotalDuration = () => {
    return selectedSlots.length * court.slot_duration_minutes
  }

  const getTotalPrice = () => {
    const pricePerSlot = court.price_per_slot || 0
    return selectedSlots.length * pricePerSlot
  }

  const getStartTime = () => {
    return selectedSlots[0]?.time || ''
  }

  const getEndTime = () => {
    if (selectedSlots.length === 0) return ''
    const lastSlot = selectedSlots[selectedSlots.length - 1]
    const [hour, min] = lastSlot.time.split(':').map(Number)
    const endMinutes = hour * 60 + min + court.slot_duration_minutes
    const endHour = Math.floor(endMinutes / 60)
    const endMin = endMinutes % 60
    return `${String(endHour).padStart(2, '0')}:${String(endMin).padStart(2, '0')}:00`
  }

  const today = new Date().toISOString().split('T')[0]

  const today = new Date().toISOString().split('T')[0]
  const showTimeSlots = selectedDate && selectedSport

  return (
    <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6">
      <h2 className="text-xl font-bold text-gray-900 mb-6">Select Sport, Date & Time</h2>

      {/* Sport Selector */}
      <div className="mb-6">
        <label className="block text-sm font-semibold text-gray-700 mb-3">
          Select Sport <span className="text-red-500">*</span>
        </label>
        <div className="flex flex-wrap gap-3">
          {availableSports.map((sport) => (
            <button
              key={sport.id}
              onClick={() => {
                setSelectedSport(sport.id)
                setSelectedSlots([])
              }}
              className={`px-5 py-2.5 rounded-lg font-semibold transition-all ${
                selectedSport === sport.id
                  ? 'bg-slate-800 text-white shadow-md ring-2 ring-slate-800 ring-offset-2'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200 hover:shadow'
              }`}
            >
              {sport.name}
            </button>
          ))}
        </div>
      </div>

      {/* Date Selector */}
      <div className="mb-6">
        <label className="block text-sm font-semibold text-gray-700 mb-3">
          Select Date <span className="text-red-500">*</span>
        </label>
        <div className="flex items-center justify-between bg-gradient-to-r from-slate-50 to-gray-50 p-4 rounded-xl border border-gray-200">
          <button
            onClick={() => handleDateChange(-1)}
            disabled={!selectedDate || selectedDate <= today}
            className="p-2 hover:bg-white rounded-lg disabled:opacity-30 disabled:cursor-not-allowed transition-all"
          >
            <svg className="w-5 h-5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          
          <div className="text-center">
            <input
              type="date"
              value={selectedDate}
              min={today}
              onChange={(e) => {
                setSelectedDate(e.target.value)
                setSelectedSlots([])
              }}
              className="text-lg font-bold border-none bg-transparent cursor-pointer text-gray-900"
            />
            {selectedDate && (
              <p className="text-sm text-gray-600 mt-1">
                {new Date(selectedDate).toLocaleDateString('en-US', { 
                  weekday: 'long', 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric' 
                })}
              </p>
            )}
          </div>
          
          <button
            onClick={() => handleDateChange(1)}
            disabled={!selectedDate}
            className="p-2 hover:bg-white rounded-lg disabled:opacity-30 disabled:cursor-not-allowed transition-all"
          >
            <svg className="w-5 h-5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      </div>

      {/* Time Slots Grid - Only show when both date and sport are selected */}
      {!showTimeSlots ? (
        <div className="text-center py-12 bg-gradient-to-br from-slate-50 to-gray-50 rounded-xl border-2 border-dashed border-gray-300">
          <svg className="w-16 h-16 mx-auto text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          <p className="text-gray-600 font-medium">Please select a sport and date to view available time slots</p>
        </div>
      ) : loading ? (
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-10 w-10 border-4 border-slate-200 border-t-slate-800"></div>
          <p className="text-gray-600 mt-3">Loading available slots...</p>
        </div>
      ) : (
        <>
          <div className="mb-6">
            <label className="block text-sm font-semibold text-gray-700 mb-3">
              Select Time Slots <span className="text-red-500">*</span>
            </label>
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-2 mb-4">
              {slots.map((slot) => (
                <button
                  key={slot.time}
                  onClick={() => handleSlotClick(slot)}
                  disabled={!slot.available}
                  className={`p-3 text-sm font-bold rounded-lg transition-all ${
                    selectedSlots.find(s => s.time === slot.time)
                      ? 'bg-slate-800 text-white ring-2 ring-slate-800 ring-offset-2 shadow-md'
                      : slot.available
                      ? 'bg-green-50 text-green-700 hover:bg-green-100 border-2 border-green-300 hover:shadow'
                      : 'bg-gray-100 text-gray-400 cursor-not-allowed opacity-50'
                  }`}
                >
                  {slot.displayTime}
                </button>
              ))}
            </div>

            {/* Legend */}
            <div className="flex flex-wrap gap-4 text-sm">
              <div className="flex items-center">
                <div className="w-4 h-4 bg-green-50 border-2 border-green-300 rounded mr-2"></div>
                <span className="text-gray-700 font-medium">Available</span>
              </div>
              <div className="flex items-center">
                <div className="w-4 h-4 bg-slate-800 rounded mr-2"></div>
                <span className="text-gray-700 font-medium">Selected</span>
              </div>
              <div className="flex items-center">
                <div className="w-4 h-4 bg-gray-100 rounded mr-2"></div>
                <span className="text-gray-700 font-medium">Booked</span>
              </div>
            </div>
          </div>

          {/* Booking Summary */}
          {selectedSlots.length > 0 && (
            <div className="bg-gradient-to-r from-slate-50 to-gray-50 border-2 border-slate-200 rounded-xl p-5 shadow-sm">
              <div className="flex items-center justify-between flex-wrap gap-4">
                <div className="flex-1 min-w-[200px]">
                  <p className="text-sm text-gray-600 font-semibold mb-1">Selected Time</p>
                  <p className="text-xl font-bold text-gray-900">
                    {selectedSlots[0].displayTime} - {getEndTime().substring(0, 5)}
                  </p>
                  <p className="text-sm text-gray-700 mt-1">
                    Duration: {getTotalDuration()} minutes ({selectedSlots.length} slot{selectedSlots.length > 1 ? 's' : ''})
                  </p>
                  <p className="text-2xl font-bold text-green-600 mt-3">
                    Total: LKR {getTotalPrice().toFixed(2)}
                  </p>
                </div>
                <button
                  onClick={() => setShowBookingModal(true)}
                  className="bg-slate-800 text-white px-8 py-3.5 rounded-lg font-bold hover:bg-slate-900 transition-all shadow-md hover:shadow-lg"
                >
                  Book Now
                </button>
              </div>
            </div>
          )}
        </>
      )}

      {/* Booking Modal */}
      {showBookingModal && (
        <BookingModal
          court={court}
          institutionId={institutionId}
          bookingDate={selectedDate}
          startTime={getStartTime()}
          endTime={getEndTime()}
          selectedSportId={selectedSport}
          selectedSportName={availableSports.find(s => s.id === selectedSport)?.name}
          totalPrice={getTotalPrice()}
          onClose={() => setShowBookingModal(false)}
          onSuccess={() => {
            setSelectedSlots([])
            setShowBookingModal(false)
            fetchBookings()
          }}
        />
      )}
    </div>
  )
}
