'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import BookingModal from './BookingModal'

export default function TimeSlotSelector({ court, institutionId }) {
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0])
  const [slots, setSlots] = useState([])
  const [selectedSlots, setSelectedSlots] = useState([])
  const [loading, setLoading] = useState(false)
  const [showBookingModal, setShowBookingModal] = useState(false)

  useEffect(() => {
    generateSlots()
    fetchBookings()
  }, [selectedDate, court.id])

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

  return (
    <div className="bg-white rounded-lg shadow-sm border p-6">
      <h2 className="text-lg font-semibold text-gray-900 mb-4">Select Date & Time</h2>

      {/* Date Selector */}
      <div className="flex items-center justify-between mb-6 bg-gray-50 p-4 rounded-lg">
        <button
          onClick={() => handleDateChange(-1)}
          disabled={selectedDate <= today}
          className="p-2 hover:bg-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
            className="text-lg font-semibold border-none bg-transparent cursor-pointer"
          />
          <p className="text-sm text-gray-500">
            {new Date(selectedDate).toLocaleDateString('en-US', { 
              weekday: 'long', 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric' 
            })}
          </p>
        </div>
        
        <button
          onClick={() => handleDateChange(1)}
          className="p-2 hover:bg-white rounded-lg transition-colors"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>

      {/* Time Slots Grid */}
      {loading ? (
        <div className="text-center py-8">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-2 mb-6">
            {slots.map((slot) => (
              <button
                key={slot.time}
                onClick={() => handleSlotClick(slot)}
                disabled={!slot.available}
                className={`p-3 text-sm font-medium rounded-lg transition-all ${
                  selectedSlots.find(s => s.time === slot.time)
                    ? 'bg-blue-600 text-white ring-2 ring-blue-600 ring-offset-2'
                    : slot.available
                    ? 'bg-green-50 text-green-700 hover:bg-green-100 border border-green-200'
                    : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                }`}
              >
                {slot.displayTime}
              </button>
            ))}
          </div>

          {/* Legend */}
          <div className="flex flex-wrap gap-4 text-sm mb-6">
            <div className="flex items-center">
              <div className="w-4 h-4 bg-green-50 border border-green-200 rounded mr-2"></div>
              <span className="text-gray-600">Available</span>
            </div>
            <div className="flex items-center">
              <div className="w-4 h-4 bg-blue-600 rounded mr-2"></div>
              <span className="text-gray-600">Selected</span>
            </div>
            <div className="flex items-center">
              <div className="w-4 h-4 bg-gray-100 rounded mr-2"></div>
              <span className="text-gray-600">Booked</span>
            </div>
          </div>

          {/* Booking Summary */}
          {selectedSlots.length > 0 && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-blue-600 font-medium mb-1">Selected Time</p>
                  <p className="text-lg font-semibold text-blue-900">
                    {selectedSlots[0].displayTime} - {getEndTime().substring(0, 5)}
                  </p>
                  <p className="text-sm text-blue-700">
                    Duration: {getTotalDuration()} minutes ({selectedSlots.length} slot{selectedSlots.length > 1 ? 's' : ''})
                  </p>
                </div>
                <button
                  onClick={() => setShowBookingModal(true)}
                  className="bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
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
