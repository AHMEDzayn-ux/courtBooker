"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { motion } from "framer-motion";
import Link from "next/link";

export default function TrackBookingPage() {
  const [referenceId, setReferenceId] = useState("");
  const [phone, setPhone] = useState("");
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSearch = async (e) => {
    e.preventDefault();
    setError("");
    setBookings([]);
    setLoading(true);

    try {
      const supabase = createClient();

      // Check if at least one field is provided
      if (!referenceId.trim() && !phone.trim()) {
        setError("Please provide either a Reference ID or Phone Number");
        setLoading(false);
        return;
      }

      let query = supabase
        .from("bookings")
        .select(
          `
          id,
          court_id,
          institution_id,
          booking_date,
          start_time,
          end_time,
          sport_id,
          total_price,
          customer_name,
          customer_phone,
          customer_email,
          status,
          reference_id,
          created_at,
          sports (name),
          courts (
            name,
            institutions (name)
          )
        `
        )
        // Ensure latest bookings appear first
        .order("booking_date", { ascending: false })
        .order("start_time", { ascending: false });

      // Add filters based on what's provided
      if (referenceId.trim()) {
        query = query.eq("reference_id", referenceId.trim().toUpperCase());
      }
      if (phone.trim()) {
        query = query.eq("customer_phone", phone.trim());
      }

      const { data, error: queryError } = await query;

      if (queryError) {
        console.error("Query Error:", queryError);
        setError("Failed to fetch bookings. Please try again.");
        setLoading(false);
        return;
      }

      if (!data || data.length === 0) {
        setError("No bookings found with the provided information.");
      } else {
        // Transform data to match expected format
        const transformedData = data.map((booking) => ({
          ...booking,
          institution_name: booking.courts.institutions.name,
          court_name: booking.courts.name,
          sport_name: booking.sports?.name,
        }));
        setBookings(transformedData);
      }
    } catch (err) {
      console.error("Error:", err);
      setError("An unexpected error occurred. Please try again.");
    }

    setLoading(false);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "confirmed":
        return "bg-green-100 text-green-800 border-green-200";
      case "cancelled":
        return "bg-red-100 text-red-800 border-red-200";
      case "pending":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  return (
    // 1. Viewport Container: Fits screen exactly, centers content, no outer scroll
    <div className="h-[100dvh] w-full bg-slate-50 flex items-center justify-center p-4 overflow-hidden">
      
      <motion.div
        className="w-full max-w-4xl bg-white rounded-2xl shadow-xl flex flex-col max-h-[90dvh] overflow-hidden border border-slate-200"
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4 }}
      >
        {/* 2. Fixed Header Section: Always visible */}
        <div className="p-6 border-b border-slate-100 flex-shrink-0 bg-white z-10">
          <div className="flex justify-between items-start mb-4">
            <div>
              <h1 className="text-2xl font-bold text-slate-900">
                Track Booking
              </h1>
              <p className="text-sm text-slate-500 mt-1">
                Enter details to find your booking
              </p>
            </div>
            <Link
              href="/"
              className="text-xs font-semibold text-slate-500 hover:text-slate-800 flex items-center gap-1 transition-colors"
            >
              <svg
                className="w-3 h-3"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M10 19l-7-7m0 0l7-7m-7 7h18"
                />
              </svg>
              Home
            </Link>
          </div>

          <form onSubmit={handleSearch} className="flex flex-col md:flex-row gap-3">
            <input
              type="text"
              value={referenceId}
              onChange={(e) => setReferenceId(e.target.value.toUpperCase())}
              placeholder="Ref ID (e.g., BK123)"
              className="flex-1 px-4 py-2.5 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-slate-800 focus:border-transparent outline-none uppercase transition-all"
            />
            <div className="hidden md:block text-slate-300 py-2">or</div>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="Phone Number"
              className="flex-1 px-4 py-2.5 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-slate-800 focus:border-transparent outline-none transition-all"
            />
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2.5 bg-slate-800 text-white text-sm font-bold rounded-lg hover:bg-slate-900 transition-all disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
            >
              {loading ? "Searching..." : "Track"}
            </button>
          </form>

          {error && (
            <motion.div 
              initial={{ opacity: 0, height: 0 }} 
              animate={{ opacity: 1, height: 'auto' }}
              className="mt-3 text-xs text-red-600 bg-red-50 p-2 rounded border border-red-100"
            >
              {error}
            </motion.div>
          )}
        </div>

        {/* 3. Scrollable Results Section: Only this part scrolls */}
        <div className="flex-1 overflow-y-auto bg-slate-50/50 p-4 md:p-6 space-y-4">
          {bookings.length === 0 && !loading && !error && (
            <div className="h-full flex flex-col items-center justify-center text-slate-400 py-10">
              <svg className="w-12 h-12 mb-2 opacity-20" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
              <p className="text-sm">Search results will appear here</p>
            </div>
          )}

          {bookings.length > 0 && (
            <div className="flex items-center justify-between mb-2 px-1">
               <span className="text-xs font-bold text-slate-500 uppercase tracking-wide">Found {bookings.length} Booking{bookings.length > 1 ? 's' : ''}</span>
            </div>
          )}

          {bookings.map((booking, index) => (
            <motion.div
              key={booking.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow"
            >
              {/* Card Header: Ref ID & Status */}
              <div className="flex justify-between items-start mb-4 pb-4 border-b border-slate-100">
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Reference ID</p>
                  <p className="text-xl font-mono font-bold text-slate-900">{booking.reference_id}</p>
                </div>
                <span className={`px-3 py-1 rounded-full text-xs font-bold border ${getStatusColor(booking.status)}`}>
                  {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
                </span>
              </div>

              {/* Card Body: Grid Layout for Tight Spacing */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                
                {/* Left Col: Venue & Date */}
                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                     <div className="p-2 bg-slate-50 rounded text-slate-500"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg></div>
                     <div>
                        <p className="font-bold text-slate-800">{booking.institution_name}</p>
                        <p className="text-slate-600 text-xs">{booking.court_name} • {booking.sport_name || "N/A"}</p>
                     </div>
                  </div>

                  <div className="flex items-start gap-3">
                     <div className="p-2 bg-slate-50 rounded text-slate-500"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg></div>
                     <div>
                        <p className="font-bold text-slate-800">
                           {new Date(booking.booking_date).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric", year: "numeric" })}
                        </p>
                        <p className="text-slate-600 text-xs">
                          {booking.start_time.substring(0, 5)} - {booking.end_time.substring(0, 5)}
                        </p>
                     </div>
                  </div>
                </div>

                {/* Right Col: Customer & Price */}
                <div className="space-y-3 md:pl-4 md:border-l md:border-slate-100">
                   <div className="flex items-start gap-3">
                     <div className="p-2 bg-slate-50 rounded text-slate-500"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg></div>
                     <div>
                        <p className="font-bold text-slate-800">{booking.customer_name}</p>
                        <p className="text-slate-600 text-xs">{booking.customer_phone}</p>
                        {booking.customer_email && <p className="text-slate-400 text-[10px] break-all">{booking.customer_email}</p>}
                     </div>
                  </div>

                  {booking.total_price && (
                    <div className="flex items-center justify-between bg-slate-800 text-white rounded-lg px-4 py-2 mt-2">
                       <span className="text-xs opacity-80 uppercase font-bold">Total</span>
                       <span className="text-lg font-bold">LKR {parseFloat(booking.total_price).toFixed(2)}</span>
                    </div>
                  )}
                </div>

              </div>
            </motion.div>
          ))}
          
          {bookings.length > 0 && (
             <div className="text-center pt-4">
                <button 
                  onClick={() => { setBookings([]); setReferenceId(""); setPhone(""); }}
                  className="text-xs font-bold text-slate-400 hover:text-slate-600 transition-colors"
                >
                   Clear Search
                </button>
             </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}