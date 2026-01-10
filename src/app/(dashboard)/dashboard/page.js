"use client";

import { useEffect, useState, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";
import BookingSteps from "@/components/BookingSteps";

// --- ADMIN BOOKING SLOTS COMPONENT ---
function AdminBookingSlots({ institutionId }) {
  const [courts, setCourts] = useState([]);
  const [sports, setSports] = useState([]);
  const [selectedCourtId, setSelectedCourtId] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!institutionId) return;

    async function fetchData() {
      setLoading(true);
      const supabase = createClient();

      // Fetch courts
      const { data: courtsData } = await supabase
        .from("courts")
        .select(`
          *,
          court_sports (
            sport_id,
            sports (id, name)
          )
        `)
        .eq("institution_id", institutionId)
        .order("name");

      setCourts(courtsData || []);
      
      // Select the first court automatically
      if (courtsData && courtsData.length > 0) {
        setSelectedCourtId(courtsData[0].id);
      }

      // Fetch all sports for the institution (for fallback)
      const { data: sportsData } = await supabase
        .from("sports")
        .select("*")
        .eq("institution_id", institutionId);
      
      setSports(sportsData || []);
      setLoading(false);
    }
    fetchData();
  }, [institutionId]);

  if (loading)
    return (
      <div className="h-full flex flex-col justify-center items-center text-sm text-gray-500">
         <div className="w-6 h-6 border-2 border-gray-300 border-t-slate-800 rounded-full animate-spin mb-2"></div>
         Loading court schedules...
      </div>
    );

  if (!courts.length)
    return (
      <div className="h-full flex flex-col justify-center items-center bg-gray-50 rounded-lg border border-dashed border-gray-300">
        <p className="text-gray-500 text-sm">No courts found.</p>
        <Link href="/dashboard/courts" className="text-blue-600 font-semibold text-sm mt-1 inline-block">
            + Add your first court
        </Link>
      </div>
    );

  const selectedCourt = courts.find((c) => c.id === selectedCourtId);
  const currentCourtSports = selectedCourt?.court_sports?.map(cs => cs.sports) || sports;

  return (
    <div className="h-full flex flex-col">
      {/* Court Selector Tabs - Sticky at top of scroll area */}
      <div className="flex-none flex flex-wrap gap-2 mb-4 pb-2 border-b border-gray-100 sticky top-0 bg-white z-10">
        {courts.map((court) => (
          <button
            key={court.id}
            onClick={() => setSelectedCourtId(court.id)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              selectedCourtId === court.id
                ? "bg-slate-800 text-white shadow-md"
                : "bg-white text-gray-600 hover:bg-gray-50 border border-gray-200"
            }`}
          >
            {court.name}
          </button>
        ))}
      </div>

      {/* The Booking Component in Admin Mode */}
      {selectedCourt && (
        <div className="flex-1 animate-in fade-in duration-300">
          <BookingSteps
            key={selectedCourt.id}
            court={selectedCourt}
            institutionId={institutionId}
            availableSports={currentCourtSports}
            isAdmin={true} 
          />
        </div>
      )}
    </div>
  );
}

// --- MAIN DASHBOARD PAGE ---
export default function DashboardPage() {
  const [stats, setStats] = useState({
    totalCourts: 0,
    totalBookings: 0,
    todayBookings: 0,
    revenue: 0,
  });
  
  const [institutionId, setInstitutionId] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchDashboardData = useCallback(async () => {
    const supabase = createClient();

    // 1. Get User
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // 2. Get Institution ID
    const { data: adminData } = await supabase
      .from("institution_admins")
      .select("institution_id")
      .eq("id", user.id)
      .single();

    if (!adminData) return;

    const instId = adminData.institution_id;
    setInstitutionId(instId);

    // 3. Parallel Fetching for Dashboard Stats
    const today = new Date().toISOString().split("T")[0];

    const [
      courtsResult,
      bookingsResult,
      todayResult,
      revenueResult,
    ] = await Promise.all([
      supabase.from("courts").select("*", { count: "exact", head: true }).eq("institution_id", instId),
      supabase.from("bookings").select("*", { count: "exact", head: true }).eq("institution_id", instId),
      supabase.from("bookings").select("*", { count: "exact", head: true }).eq("institution_id", instId).eq("booking_date", today),
      supabase.from("bookings").select("total_price").eq("institution_id", instId).eq("status", "confirmed"),
    ]);

    const totalRevenue = revenueResult.data?.reduce(
      (sum, b) => sum + parseFloat(b.total_price || 0),
      0
    ) || 0;

    setStats({
      totalCourts: courtsResult.count || 0,
      totalBookings: bookingsResult.count || 0,
      todayBookings: todayResult.count || 0,
      revenue: totalRevenue,
    });

    setLoading(false);
  }, []);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen bg-gray-50">
        <div className="w-8 h-8 border-4 border-slate-800 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    // h-screen and overflow-hidden removes the window scrollbar
    <div className="h-screen bg-gray-50 flex flex-col overflow-hidden">
      
      {/* HEADER SECTION (Fixed height) */}
      <div className="flex-none px-6 pt-6 pb-2 w-full">
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-xs font-mono text-gray-500 bg-white px-3 py-1.5 rounded-full border border-gray-200 shadow-sm">
            {new Date().toLocaleDateString("en-US", {
              weekday: "long",
              month: "short",
              day: "numeric",
              year: "numeric"
            })}
          </p>
        </div>

        {/* Stats Grid - Full Width */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-2">
          <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Revenue</p>
              <p className="text-xl font-bold text-gray-900 mt-1">
                <span className="text-[10px] text-gray-400 font-normal mr-1">LKR</span>
                {stats.revenue.toLocaleString()}
              </p>
            </div>
            <div className="text-purple-600 bg-purple-50 p-2 rounded-lg">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>

          <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Today</p>
              <p className="text-xl font-bold text-gray-900 mt-1">{stats.todayBookings}</p>
            </div>
            <div className="text-amber-600 bg-amber-50 p-2 rounded-lg">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>

          <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Total Bookings</p>
              <p className="text-xl font-bold text-gray-900 mt-1">{stats.totalBookings}</p>
            </div>
            <div className="text-emerald-600 bg-emerald-50 p-2 rounded-lg">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
          </div>

          <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Active Courts</p>
              <p className="text-xl font-bold text-gray-900 mt-1">{stats.totalCourts}</p>
            </div>
            <div className="text-blue-600 bg-blue-50 p-2 rounded-lg">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* CONTENT SECTION (Fills remaining height) */}
      <div className="flex-1 min-h-0 px-6 pb-6 w-full">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 h-full">
          
          {/* LEFT COLUMN: LIVE COURT SCHEDULE (Takes 3/4 space) */}
          <div className="lg:col-span-3 bg-white rounded-xl shadow-sm border border-gray-200 flex flex-col h-full overflow-hidden">
            <div className="flex-none px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
              <h2 className="text-sm font-bold text-gray-600 uppercase tracking-wide">
                Live Court Schedule
              </h2>
              <Link href="/dashboard/courts" className="text-xs font-semibold text-slate-600 hover:text-slate-800 flex items-center">
                Manage Settings &rarr;
              </Link>
            </div>
            {/* Scrollable Container for the Booking Slots */}
            <div className="flex-1 p-6 overflow-y-auto">
              {institutionId && <AdminBookingSlots institutionId={institutionId} />}
            </div>
          </div>

          {/* RIGHT COLUMN: QUICK ACTIONS (Takes 1/4 space) */}
          <div className="lg:col-span-1 h-full">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 h-full">
              <h2 className="text-sm font-bold text-gray-600 uppercase tracking-wide mb-5">
                Quick Actions
              </h2>
              <div className="space-y-4">
                <Link href="/dashboard/bookings" className="flex items-center p-3 border border-gray-200 rounded-lg hover:border-emerald-300 hover:bg-emerald-50/30 transition-all group">
                  <div className="w-10 h-10 rounded-lg bg-emerald-100 text-emerald-600 flex items-center justify-center mr-3 group-hover:scale-105 transition-transform flex-shrink-0">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm font-bold text-gray-900 leading-tight">All Bookings</p>
                    <p className="text-[10px] text-gray-500 mt-0.5">View reservations</p>
                  </div>
                </Link>
                
                <Link href="/dashboard/courts" className="flex items-center p-3 border border-gray-200 rounded-lg hover:border-orange-300 hover:bg-orange-50/30 transition-all group">
                  <div className="w-10 h-10 rounded-lg bg-orange-100 text-orange-600 flex items-center justify-center mr-3 group-hover:scale-105 transition-transform flex-shrink-0">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm font-bold text-gray-900 leading-tight">Manage Slots</p>
                    <p className="text-[10px] text-gray-500 mt-0.5">Block times / prices</p>
                  </div>
                </Link>

                <Link href="/dashboard/settings" className="flex items-center p-3 border border-gray-200 rounded-lg hover:border-purple-300 hover:bg-purple-50/30 transition-all group">
                  <div className="w-10 h-10 rounded-lg bg-purple-100 text-purple-600 flex items-center justify-center mr-3 group-hover:scale-105 transition-transform flex-shrink-0">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm font-bold text-gray-900 leading-tight">Settings</p>
                    <p className="text-[10px] text-gray-500 mt-0.5">Configurations</p>
                  </div>
                </Link>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}