'use client'

import { useState } from 'react'
import TimeSlotSelector from './TimeSlotSelector'

export default function CourtSelector({ courts, institutionId }) {
  const [selectedCourtId, setSelectedCourtId] = useState(courts[0]?.id || null)

  const selectedCourt = courts.find(c => c.id === selectedCourtId)

  // Extract sports for selected court
  const sports = selectedCourt?.court_sports?.map(cs => cs.sports) || []

  return (
    <div className="space-y-6">
      {/* Court Tabs */}
      <div className="bg-white rounded-lg shadow-sm border p-4">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Select Court</h2>
        <div className="flex flex-wrap gap-2">
          {courts.map((court) => (
            <button
              key={court.id}
              onClick={() => setSelectedCourtId(court.id)}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                selectedCourtId === court.id
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {court.name}
            </button>
          ))}
        </div>

        {/* Selected Court Info */}
        {selectedCourt && (
          <div className="mt-4 pt-4 border-t">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div>
                <span className="text-gray-500">Opening Hours:</span>
                <p className="font-medium">
                  {selectedCourt.opening_time} - {selectedCourt.closing_time}
                </p>
              </div>
              <div>
                <span className="text-gray-500">Slot Duration:</span>
                <p className="font-medium">{selectedCourt.slot_duration_minutes} minutes</p>
              </div>
              <div>
                <span className="text-gray-500">Sports Available:</span>
                <div className="flex flex-wrap gap-1 mt-1">
                  {sports.map((sport) => (
                    <span
                      key={sport.id}
                      className="px-2 py-1 bg-blue-50 text-blue-700 text-xs font-medium rounded"
                    >
                      {sport.name}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Time Slot Selector */}
      {selectedCourt && (
        <TimeSlotSelector 
          court={selectedCourt}
          institutionId={institutionId}
        />
      )}
    </div>
  )
}
