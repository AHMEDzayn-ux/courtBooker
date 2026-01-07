"use client";

import { useState } from "react";
import BookingSteps from "./BookingSteps";

export default function CourtSelector({ courts, institutionId }) {
  const [selectedCourtId, setSelectedCourtId] = useState(courts[0]?.id || null);

  const selectedCourt = courts.find((c) => c.id === selectedCourtId);

  // Extract sports for selected court
  const sports = selectedCourt?.court_sports?.map((cs) => cs.sports) || [];

  return (
    <div className="space-y-6">
      {/* Court Tabs */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
        <div className="flex items-center mb-5">
          {/* Accent Bar */}
          <div className="w-1 h-6 bg-slate-900 rounded-full mr-3"></div>
          <h2 className="text-xl font-bold text-slate-800">
            Select Your Court
          </h2>
        </div>
        
        {/* Court Buttons */}
        <div className="flex flex-wrap gap-3">
          {courts.map((court) => (
            <button
              key={court.id}
              onClick={() => setSelectedCourtId(court.id)}
              className={`px-5 py-2.5 rounded-lg font-semibold transition-all duration-200 border ${
                selectedCourtId === court.id
                  ? "bg-slate-900 text-white border-slate-900 shadow-md shadow-slate-200"
                  : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50 hover:border-slate-300"
              }`}
            >
              {court.name}
            </button>
          ))}
        </div>

        {/* Selected Court Info */}
        {selectedCourt && (
          <div className="mt-5 pt-5 border-t border-slate-100">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              
              {/* Hours Card */}
              <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 hover:border-slate-300 transition-colors">
                <div className="flex items-center gap-2 mb-1">
                  <svg
                    className="w-4 h-4 text-slate-500"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  <span className="text-xs font-medium text-slate-500 uppercase">
                    Hours
                  </span>
                </div>
                <p className="text-sm font-bold text-slate-900">
                  {selectedCourt.opening_time} - {selectedCourt.closing_time}
                </p>
              </div>

              {/* Duration Card */}
              <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 hover:border-slate-300 transition-colors">
                <div className="flex items-center gap-2 mb-1">
                  <svg
                    className="w-4 h-4 text-slate-500"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M13 10V3L4 14h7v7l9-11h-7z"
                    />
                  </svg>
                  <span className="text-xs font-medium text-slate-500 uppercase">
                    Duration
                  </span>
                </div>
                <p className="text-sm font-bold text-slate-900">
                  {selectedCourt.slot_duration_minutes} min
                </p>
              </div>

              {/* Price Card */}
              <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 hover:border-slate-300 transition-colors">
                <div className="flex items-center gap-2 mb-1">
                  <svg
                    className="w-4 h-4 text-slate-500"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  <span className="text-xs font-medium text-slate-500 uppercase">
                    Price
                  </span>
                </div>
                <p className="text-sm font-bold text-slate-900">
                  LKR {selectedCourt.price_per_slot?.toFixed(2) || "0.00"}
                </p>
              </div>

              {/* Sports Card */}
              <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 hover:border-slate-300 transition-colors">
                <div className="flex items-center gap-2 mb-1">
                  <svg
                    className="w-4 h-4 text-slate-500"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M14 10l-2 1m0 0l-2-1m2 1v2.5M20 7l-2 1m2-1l-2-1m2 1v2.5M14 4l-2-1-2 1M4 7l2-1M4 7l2 1M4 7v2.5M12 21l-2-1m2 1l2-1m-2 1v-2.5M6 18l-2-1v-2.5M18 18l2-1v-2.5"
                    />
                  </svg>
                  <span className="text-xs font-medium text-slate-500 uppercase">
                    Sports
                  </span>
                </div>
                <div className="flex flex-wrap gap-1 mt-1">
                  {sports.map((sport) => (
                    <span
                      key={sport.id}
                      className="px-2 py-0.5 bg-white border border-slate-200 text-slate-700 text-xs font-medium rounded shadow-sm"
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
  );
}