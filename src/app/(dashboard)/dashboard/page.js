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
      <div className="py-12 text-center text-sm text-gray-500 flex flex-col items-center">
         <div className="w-6 h-6 border-2 border-gray-300 border-t-slate-800 rounded-full animate-spin mb-2"></div>
         Loading court schedules...
      </div>
    );

  if (!courts.length)
    return (
      <div className="py-12 text-center bg-gray-50 rounded-lg border border-dashed border-gray-300">
        <p className="text-gray-500 text-sm">No courts found.</p>
        <Link href="/dashboard/courts" className="text-blue-600 font-semibold text-sm mt-1 inline-block">
            + Add your first court
        </Link>
      </div>
    );

  const selectedCourt = courts.find((c) => c.id === selectedCourtId);

  // Filter sports specific to the selected court, or fallback to all sports
  const currentCourtSports = selectedCourt?.court_sports?.map(cs => cs.sports) || sports;

  return (
    <div>
      {/* Court Selector Tabs */}
      <div className="flex flex-wrap gap-2 mb-6 border-b border-gray-100 pb-4">
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
        <div className="animate-in fade-in duration-300">
          <BookingSteps
            key={selectedCourt.id} // Key ensures component resets when changing courts
            court={selectedCourt}
            institutionId={institutionId}
            availableSports={currentCourtSports}
            isAdmin={true} // <--- ENABLES ADMIN VIEW/DETAILS
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
  const [recentBookings, setRecentBookings] = useState([]);
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
      recentResult
    ] = await Promise.all([
      supabase.from("courts").select("*", { count: "exact", head: true }).eq("institution_id", instId),
      supabase.from("bookings").select("*", { count: "exact", head: true }).eq("institution_id", instId),
      supabase.from("bookings").select("*", { count: "exact", head: true }).eq("institution_id", instId).eq("booking_date", today),
      supabase.from("bookings").select("total_price").eq("institution_id", instId).eq("status", "confirmed"),
      supabase
        .from("bookings")
        .select(`*, courts(name), sports(name)`)
        .eq("institution_id", instId)
        .order("created_at", { ascending: false })
        .limit(8)
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

    setRecentBookings(recentResult.data || []);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-gray-50">
        <div className="w-8 h-8 border-4 border-slate-800 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-6 px-4 sm:px-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
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

        {/* Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Revenue</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                <span className="text-xs text-gray-400 font-normal mr-1">LKR</span>
                {stats.revenue.toLocaleString()}
              </p>
            </div>
            <div className="text-purple-600 bg-purple-50 p-3 rounded-lg">
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>

          <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Today</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{stats.todayBookings}</p>
            </div>
            <div className="text-amber-600 bg-amber-50 p-3 rounded-lg">
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>

          <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Total Bookings</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{stats.totalBookings}</p>
            </div>
            <div className="text-emerald-600 bg-emerald-50 p-3 rounded-lg">
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
          </div>

          <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Active Courts</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{stats.totalCourts}</p>
            </div>
            <div className="text-blue-600 bg-blue-50 p-3 rounded-lg">
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            </div>
          </div>
        </div>



        {/* Recent Bookings & Quick Actions Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
                  {/* --- BOOKING SLOTS VIEW (ADMIN) --- */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 mb-8 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
            <h2 className="text-sm font-bold text-gray-600 uppercase tracking-wide">
              View Live Court Schedule
            </h2>
            <Link href="/dashboard/courts" className="text-xs font-semibold text-slate-600 hover:text-slate-800 flex items-center">
              Manage Settings &rarr;
            </Link>
          </div>
          <div className="p-6">
             {/* We pass the institutionId only if it is loaded */}
             {institutionId && <AdminBookingSlots institutionId={institutionId} />}
          </div>
        </div>


          {/* Quick Actions */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-sm font-bold text-gray-600 uppercase tracking-wide mb-5">
              Quick Actions
            </h2>
            <div className="space-y-3">
              <Link href="/dashboard/bookings" className="flex items-center p-3 border border-gray-200 rounded-lg hover:border-emerald-300 hover:bg-emerald-50/30 transition-all group">
                <div className="w-10 h-10 rounded-lg bg-emerald-100 text-emerald-600 flex items-center justify-center mr-4 group-hover:scale-105 transition-transform">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                </div>
                <div>
                  <p className="text-sm font-bold text-gray-900">All Bookings</p>
                  <p className="text-xs text-gray-500">View and manage reservations</p>
                </div>
              </Link>
              
              <Link href="/dashboard/courts" className="flex items-center p-3 border border-gray-200 rounded-lg hover:border-orange-300 hover:bg-orange-50/30 transition-all group">
                <div className="w-10 h-10 rounded-lg bg-orange-100 text-orange-600 flex items-center justify-center mr-4 group-hover:scale-105 transition-transform">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div>
                  <p className="text-sm font-bold text-gray-900">Manage Slots</p>
                  <p className="text-xs text-gray-500">Block times or update prices</p>
                </div>
              </Link>

              <Link href="/dashboard/settings" className="flex items-center p-3 border border-gray-200 rounded-lg hover:border-purple-300 hover:bg-purple-50/30 transition-all group">
                <div className="w-10 h-10 rounded-lg bg-purple-100 text-purple-600 flex items-center justify-center mr-4 group-hover:scale-105 transition-transform">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </div>
                <div>
                  <p className="text-sm font-bold text-gray-900">Settings</p>
                  <p className="text-xs text-gray-500">Profile & configurations</p>
                </div>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}