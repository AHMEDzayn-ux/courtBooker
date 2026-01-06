'use client'

import { useState } from 'react'
import BookingSteps from './BookingSteps'

export default function CourtSelector({ courts, institutionId }) {
  const [selectedCourtId, setSelectedCourtId] = useState(courts[0]?.id || null)

  const selectedCourt = courts.find(c => c.id === selectedCourtId)

  // Extract sports for selected court
  const sports = selectedCourt?.court_sports?.map(cs => cs.sports) || []

  return (
    <div className="space-y-6">
      {/* Court Tabs */}
      <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6">
        <div className="flex items-center mb-6">
          <div className="w-1 h-6 bg-slate-600 rounded-full mr-3"></div>
          <h2 className="text-xl font-bold text-gray-900">Select Your Court</h2>
        </div>
        <div className="flex flex-wrap gap-3">
          {courts.map((court) => (
            <button
              key={court.id}
              onClick={() => setSelectedCourtId(court.id)}
              className={`px-6 py-3 rounded-xl font-semibold transition-all duration-200 ${
                selectedCourtId === court.id
                  ? 'bg-gradient-to-r from-slate-700 to-slate-600 text-white shadow-lg shadow-slate-400/50 scale-105'
                  : 'bg-slate-50 text-slate-700 hover:bg-slate-100 border border-slate-200 hover:border-slate-300'
              }`}
            >
              {court.name}
            </button>
          ))}
        </div>

        {/* Selected Court Info */}
        {selectedCourt && (
          <div className="mt-6 pt-6 border-t border-gray-200">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-gradient-to-br from-slate-50 to-slate-100 rounded-xl p-4 border border-slate-200">
                <div className="flex items-center mb-2">
                  <svg className="w-5 h-5 text-slate-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Hours</span>
                </div>
                <p className="text-lg font-bold text-gray-900">
                  {selectedCourt.opening_time} - {selectedCourt.closing_time}
                </p>
              </div>
              <div className="bg-gradient-to-br from-slate-50 to-slate-100 rounded-xl p-4 border border-slate-200">
                <div className="flex items-center mb-2">
                  <svg className="w-5 h-5 text-slate-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                  <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Duration</span>
                </div>
                <p className="text-lg font-bold text-gray-900">{selectedCourt.slot_duration_minutes} min</p>
              </div>
              <div className="bg-gradient-to-br from-emerald-50 to-teal-50 rounded-xl p-4 border border-emerald-200">
                <div className="flex items-center mb-2">
                  <svg className="w-5 h-5 text-emerald-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span className="text-xs font-medium text-emerald-600 uppercase tracking-wide">Price</span>
                </div>
                <p className="text-lg font-bold text-emerald-700">LKR {selectedCourt.price_per_slot?.toFixed(2) || '0.00'}</p>
              </div>
              <div className="bg-gradient-to-br from-slate-50 to-slate-100 rounded-xl p-4 border border-slate-200">
                <div className="flex items-center mb-2">
                  <svg className="w-5 h-5 text-slate-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 10l-2 1m0 0l-2-1m2 1v2.5M20 7l-2 1m2-1l-2-1m2 1v2.5M14 4l-2-1-2 1M4 7l2-1M4 7l2 1M4 7v2.5M12 21l-2-1m2 1l2-1m-2 1v-2.5M6 18l-2-1v-2.5M18 18l2-1v-2.5" />
                  </svg>
                  <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Sports</span>
                </div>
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {sports.map((sport) => (
                    <span
                      key={sport.id}
                      className="px-3 py-1 bg-slate-200 text-slate-800 text-xs font-semibold rounded-full"
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

      {/* Booking Steps */}
      {selectedCourt && (
        <BookingSteps 
          court={selectedCourt}
          institutionId={institutionId}
          availableSports={sports}
        />
      )}
    </div>
  )
}
