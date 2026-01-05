'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

export default function BookingSteps({ court, institutionId, availableSports }) {
  const router = useRouter()
  const [currentStep, setCurrentStep] = useState(1)
  const [selectedSport, setSelectedSport] = useState(availableSports[0]?.id || null)
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0])
  const [slots, setSlots] = useState([])
  const [selectedSlots, setSelectedSlots] = useState([])
  const [loading, setLoading] = useState(false)
  const [isDragging, setIsDragging] = useState(false)
  const [dragStartSlot, setDragStartSlot] = useState(null)
  const [formData, setFormData] = useState({
    customerName: '',
    customerPhone: '',
    customerEmail: ''
  })
  const [error, setError] = useState('')

  // Auto-select sport if only one available
  useEffect(() => {
    if (availableSports.length === 1 && !selectedSport) {
      setSelectedSport(availableSports[0].id)
    }
  }, [availableSports, selectedSport])

  useEffect(() => {
    if (currentStep === 1 && selectedSport && selectedDate) {
      generateSlots()
      fetchBookings()
    }
  }, [selectedDate, court.id, selectedSport, currentStep])

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
        available: true,
        booked: false
      })
      
      currentTime += court.slot_duration_minutes
    }
    
    setSlots(slots)
  }

  const fetchBookings = async () => {
    setLoading(true)
    const supabase = createClient()
    
    console.log('Fetching bookings for:', { 
      court_id: court.id, 
      booking_date: selectedDate,
      court_name: court.name 
    })
    
    const { data: bookings, error } = await supabase
      .from('bookings')
      .select('start_time, end_time, customer_name')
      .eq('court_id', court.id)
      .eq('booking_date', selectedDate)
      .eq('status', 'confirmed')

    console.log('Fetched bookings:', bookings, 'Error:', error)

    if (bookings && bookings.length > 0) {
      console.log('Marking slots as booked...')
      setSlots(prevSlots => 
        prevSlots.map(slot => {
          const isBooked = bookings.some(booking => {
            const matches = slot.time >= booking.start_time && slot.time < booking.end_time
            if (matches) {
              console.log(`Slot ${slot.time} is booked by booking ${booking.start_time}-${booking.end_time}`)
            }
            return matches
          })
          return {
            ...slot,
            available: !isBooked,
            booked: isBooked
          }
        })
      )
    } else {
      console.log('No bookings found - all slots available')
    }
    
    setLoading(false)
  }

  const handleSlotClick = (slot) => {
    if (slot.booked) return

    const slotIndex = slots.findIndex(s => s.time === slot.time)
    const isSelected = selectedSlots.some(s => s.time === slot.time)

    if (isSelected) {
      // Deselect - only allow if it's at the start or end
      const selectedIndices = selectedSlots.map(s => slots.findIndex(sl => sl.time === s.time))
      const minIndex = Math.min(...selectedIndices)
      const maxIndex = Math.max(...selectedIndices)
      
      if (slotIndex === minIndex || slotIndex === maxIndex) {
        setSelectedSlots(selectedSlots.filter(s => s.time !== slot.time))
      }
    } else {
      // Select - check if continuous
      if (selectedSlots.length === 0) {
        setSelectedSlots([slot])
      } else {
        const selectedIndices = selectedSlots.map(s => slots.findIndex(sl => sl.time === s.time))
        const minIndex = Math.min(...selectedIndices)
        const maxIndex = Math.max(...selectedIndices)
        
        // Only allow if adjacent to current selection
        if (slotIndex === minIndex - 1 || slotIndex === maxIndex + 1) {
          // Check if all slots in between are available
          const start = Math.min(slotIndex, minIndex)
          const end = Math.max(slotIndex, maxIndex)
          const allAvailable = slots.slice(start, end + 1).every(s => !s.booked)
          
          if (allAvailable) {
            setSelectedSlots([...selectedSlots, slot].sort((a, b) => 
              a.time.localeCompare(b.time)
            ))
          }
        }
      }
    }
  }

  const handleDateChange = (days) => {
    const date = new Date(selectedDate)
    date.setDate(date.getDate() + days)
    setSelectedDate(date.toISOString().split('T')[0])
    setSelectedSlots([])
  }

  const handleMouseDown = (slot) => {
    if (slot.booked) return
    setIsDragging(true)
    setDragStartSlot(slot)
    setSelectedSlots([slot])
  }

  const handleMouseEnter = (slot) => {
    if (!isDragging || slot.booked) return
    
    if (!dragStartSlot) return
    
    const currentSlotIndex = slots.findIndex(s => s.time === slot.time)
    const startSlotIndex = slots.findIndex(s => s.time === dragStartSlot.time)
    
    const start = Math.min(currentSlotIndex, startSlotIndex)
    const end = Math.max(currentSlotIndex, startSlotIndex)
    
    // Check if all slots in the range are available
    const rangeSlots = slots.slice(start, end + 1)
    const allAvailable = rangeSlots.every(s => !s.booked)
    
    if (allAvailable) {
      setSelectedSlots(rangeSlots)
    }
  }

  const handleMouseUp = () => {
    setIsDragging(false)
    setDragStartSlot(null)
  }

  const getTotalDuration = () => {
    return selectedSlots.length * court.slot_duration_minutes
  }

  const getTotalPrice = () => {
    return selectedSlots.length * (court.price_per_slot || 0)
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

  const handleNextStep = () => {
    if (currentStep === 1 && selectedSlots.length > 0) {
      setCurrentStep(2)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const response = await fetch('/api/bookings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          courtId: court.id,
          institutionId,
          bookingDate: selectedDate,
          startTime: getStartTime(),
          endTime: getEndTime(),
          sportId: selectedSport,
          totalPrice: getTotalPrice(),
          ...formData
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create booking')
      }

      router.push(`/booking/confirmation/${data.referenceId}`)
    } catch (err) {
      setError(err.message)
      setLoading(false)
    }
  }

  const today = new Date().toISOString().split('T')[0]
  const sportName = availableSports.find(s => s.id === selectedSport)?.name

  return (
    <div className="bg-white rounded-lg shadow-sm border p-6">
      {/* Progress Steps */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div className={`flex items-center ${currentStep >= 1 ? 'text-blue-600' : 'text-gray-400'}`}>
            <div className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold ${currentStep >= 1 ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}>
              1
            </div>
            <span className="ml-2 font-medium hidden sm:inline">Select Time</span>
          </div>
          <div className="flex-1 h-1 mx-4 bg-gray-200">
            <div className={`h-full transition-all ${currentStep >= 2 ? 'bg-blue-600 w-full' : 'w-0'}`}></div>
          </div>
          <div className={`flex items-center ${currentStep >= 2 ? 'text-blue-600' : 'text-gray-400'}`}>
            <div className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold ${currentStep >= 2 ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}>
              2
            </div>
            <span className="ml-2 font-medium hidden sm:inline">Your Details</span>
          </div>
        </div>
      </div>

      {/* Step 1: Time Selection */}
      {currentStep === 1 && (
        <div className="space-y-6">
          <h2 className="text-xl font-semibold text-gray-900">Select Sport, Date & Time</h2>

          {/* Sport Selector */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select Sport *
            </label>
            <div className="flex flex-wrap gap-2">
              {availableSports.map((sport) => (
                <button
                  key={sport.id}
                  onClick={() => {
                    setSelectedSport(sport.id)
                    setSelectedSlots([])
                  }}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                    selectedSport === sport.id
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {sport.name}
                </button>
              ))}
            </div>
          </div>

          {/* Date Selector */}
          {selectedSport && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select Date *
              </label>
              <div className="flex items-center justify-between bg-gray-50 p-4 rounded-lg">
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
            </div>
          )}

          {/* Time Slots */}
          {selectedSport && selectedDate && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select Time Slots * (Click consecutive slots)
              </label>
              {loading ? (
                <div className="text-center py-8">
                  <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                </div>
              ) : (
                <>
                  <div 
                    className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-2 mb-4"
                    onMouseUp={handleMouseUp}
                    onMouseLeave={handleMouseUp}
                  >
                    {slots.map((slot) => (
                      <button
                        key={slot.time}
                        onClick={() => handleSlotClick(slot)}
                        onMouseDown={() => handleMouseDown(slot)}
                        onMouseEnter={() => handleMouseEnter(slot)}
                        disabled={slot.booked}
                        className={`p-3 text-sm font-medium rounded-lg transition-all select-none ${
                          selectedSlots.find(s => s.time === slot.time)
                            ? 'bg-blue-600 text-white ring-2 ring-blue-600 ring-offset-2'
                            : slot.booked
                            ? 'bg-red-100 text-red-600 cursor-not-allowed line-through'
                            : 'bg-green-50 text-green-700 hover:bg-green-100 border border-green-200'
                        }`}
                      >
                        {slot.displayTime}
                      </button>
                    ))}
                  </div>

                  {/* Legend */}
                  <div className="flex flex-wrap gap-4 text-sm mb-4">
                    <div className="flex items-center">
                      <div className="w-4 h-4 bg-green-50 border border-green-200 rounded mr-2"></div>
                      <span className="text-gray-600">Available</span>
                    </div>
                    <div className="flex items-center">
                      <div className="w-4 h-4 bg-blue-600 rounded mr-2"></div>
                      <span className="text-gray-600">Selected</span>
                    </div>
                    <div className="flex items-center">
                      <div className="w-4 h-4 bg-red-100 rounded mr-2"></div>
                      <span className="text-gray-600">Booked</span>
                    </div>
                  </div>
                </>
              )}
            </div>
          )}

          {/* Selection Summary - Only show when not dragging */}
          {selectedSlots.length > 0 && !isDragging && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h3 className="font-semibold text-blue-900 mb-2">Selected Time</h3>
              <div className="text-sm text-blue-800 space-y-1">
                <p><span className="font-medium">Sport:</span> {sportName}</p>
                <p><span className="font-medium">Date:</span> {new Date(selectedDate).toLocaleDateString()}</p>
                <p><span className="font-medium">Time:</span> {selectedSlots[0].displayTime} - {getEndTime().substring(0, 5)}</p>
                <p><span className="font-medium">Duration:</span> {getTotalDuration()} minutes ({selectedSlots.length} slot{selectedSlots.length > 1 ? 's' : ''})</p>
                <p className="text-lg font-bold text-green-600 pt-2">Total: LKR {getTotalPrice().toFixed(2)}</p>
              </div>
              <button
                onClick={handleNextStep}
                className="mt-4 w-full bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
              >
                Continue to Details
              </button>
            </div>
          )}
        </div>
      )}

      {/* Step 2: Customer Details */}
      {currentStep === 2 && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-gray-900">Enter Your Details</h2>
            <button
              onClick={() => setCurrentStep(1)}
              className="text-blue-600 hover:text-blue-700 text-sm font-medium"
            >
              ← Back to Time Selection
            </button>
          </div>

          {/* Booking Summary */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="font-semibold text-gray-900 mb-2">Booking Summary</h3>
            <div className="text-sm text-gray-600 space-y-1">
              <p><span className="font-medium">Court:</span> {court.name}</p>
              <p><span className="font-medium">Sport:</span> {sportName}</p>
              <p><span className="font-medium">Date:</span> {new Date(selectedDate).toLocaleDateString()}</p>
              <p><span className="font-medium">Time:</span> {selectedSlots[0].displayTime} - {getEndTime().substring(0, 5)}</p>
              <p><span className="font-medium">Duration:</span> {getTotalDuration()} minutes</p>
            </div>
            <div className="mt-3 pt-3 border-t">
              <p className="text-lg font-bold text-green-600">Total: LKR {getTotalPrice().toFixed(2)}</p>
            </div>
          </div>

          {/* Customer Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="customerName" className="block text-sm font-medium text-gray-700 mb-1">
                Full Name *
              </label>
              <input
                type="text"
                id="customerName"
                required
                value={formData.customerName}
                onChange={(e) => setFormData({ ...formData, customerName: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter your name"
              />
            </div>

            <div>
              <label htmlFor="customerPhone" className="block text-sm font-medium text-gray-700 mb-1">
                Phone Number *
              </label>
              <input
                type="tel"
                id="customerPhone"
                required
                value={formData.customerPhone}
                onChange={(e) => setFormData({ ...formData, customerPhone: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter your phone number"
              />
            </div>

            <div>
              <label htmlFor="customerEmail" className="block text-sm font-medium text-gray-700 mb-1">
                Email (Optional)
              </label>
              <input
                type="email"
                id="customerEmail"
                value={formData.customerEmail}
                onChange={(e) => setFormData({ ...formData, customerEmail: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter your email"
              />
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg text-sm">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Processing...' : 'Confirm Booking'}
            </button>
          </form>
        </div>
      )}
    </div>
  )
}
