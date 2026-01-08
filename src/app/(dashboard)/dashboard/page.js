"use client";

import { useEffect, useState, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";

export default function DashboardPage() {
  const [stats, setStats] = useState({
    totalCourts: 0,
    totalBookings: 0,
    todayBookings: 0,
    revenue: 0,
  });
  const [recentBookings, setRecentBookings] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchDashboardData = useCallback(async () => {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    const { data: adminData } = await supabase
      .from("institution_admins")
      .select("institution_id")
      .eq("id", user.id)
      .single();

    if (!adminData) return;

    const institutionId = adminData.institution_id;

    // Get courts count
    const { count: courtsCount } = await supabase
      .from("courts")
      .select("*", { count: "exact", head: true })
      .eq("institution_id", institutionId);

    // Get total bookings
    const { count: bookingsCount } = await supabase
      .from("bookings")
      .select("*", { count: "exact", head: true })
      .eq("institution_id", institutionId);

    // Get today's bookings
    const today = new Date().toISOString().split("T")[0];
    const { count: todayCount } = await supabase
      .from("bookings")
      .select("*", { count: "exact", head: true })
      .eq("institution_id", institutionId)
      .eq("booking_date", today);

    // Get total revenue
    const { data: revenueData } = await supabase
      .from("bookings")
      .select("total_price")
      .eq("institution_id", institutionId)
      .eq("status", "confirmed");

    const totalRevenue =
      revenueData?.reduce(
        (sum, b) => sum + parseFloat(b.total_price || 0),
        0
      ) || 0;

    // Get recent bookings (Limit 8 to fill space nicely)
    const { data: bookings } = await supabase
      .from("bookings")
      .select(
        `
        *,
        courts(name),
        sports(name)
      `
      )
      .eq("institution_id", institutionId)
      .order("created_at", { ascending: false })
      .limit(8);

    setStats({
      totalCourts: courtsCount || 0,
      totalBookings: bookingsCount || 0,
      todayBookings: todayCount || 0,
      revenue: totalRevenue,
    });
    setRecentBookings(bookings || []);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-gray-50">
        <div className="w-8 h-8 border-4 border-gray-900 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-6 px-4 sm:px-6">
      <div className="max-w-7xl mx-auto">
        {/* Header - Compact */}
        <div className="flex justify-between items-center mb-5">
          <h1 className="text-xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-xs font-mono text-gray-400 bg-white px-3 py-1 rounded-full border border-gray-100 shadow-sm">
            {new Date().toLocaleDateString("en-US", {
              weekday: "short",
              month: "short",
              day: "numeric",
            })}
          </p>
        </div>

        {/* Ultra-Slim Stats Bar */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 mb-6">
          <div className="grid grid-cols-2 lg:grid-cols-4 divide-y lg:divide-y-0 lg:divide-x divide-gray-100">
            {/* Revenue */}
            <div className="p-4 flex items-center justify-between">
              <div>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                  Revenue
                </p>
                <p className="text-lg font-bold text-gray-900 mt-0.5">
                  <span className="text-[10px] text-gray-400 font-normal mr-1">
                    LKR
                  </span>
                  {stats.revenue.toLocaleString("en-US", {
                    maximumFractionDigits: 0,
                  })}
                </p>
              </div>
              <div className="text-purple-500 bg-purple-50 p-2 rounded-lg">
                <svg
                  className="w-5 h-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
            </div>

            {/* Today */}
            <div className="p-4 flex items-center justify-between">
              <div>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                  Today
                </p>
                <p className="text-lg font-bold text-gray-900 mt-0.5">
                  {stats.todayBookings}{" "}
                  <span className="text-xs font-normal text-gray-400">
                    Bookings
                  </span>
                </p>
              </div>
              <div className="text-amber-500 bg-amber-50 p-2 rounded-lg">
                <svg
                  className="w-5 h-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                  />
                </svg>
              </div>
            </div>

            {/* All Bookings */}
            <div className="p-4 flex items-center justify-between">
              <div>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                  Total Bookings
                </p>
                <p className="text-lg font-bold text-gray-900 mt-0.5">
                  {stats.totalBookings}
                </p>
              </div>
              <div className="text-emerald-500 bg-emerald-50 p-2 rounded-lg">
                <svg
                  className="w-5 h-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                  />
                </svg>
              </div>
            </div>

            {/* Courts */}
            <div className="p-4 flex items-center justify-between">
              <div>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                  Active Courts
                </p>
                <p className="text-lg font-bold text-gray-900 mt-0.5">
                  {stats.totalCourts}
                </p>
              </div>
              <div className="text-blue-500 bg-blue-50 p-2 rounded-lg">
                <svg
                  className="w-5 h-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                  />
                </svg>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
          {/* Recent Activity Table */}
          <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="px-5 py-3 border-b border-gray-200 flex justify-between items-center bg-gray-50/50">
              <h2 className="text-xs font-bold text-gray-500 uppercase tracking-wide">
                Recent Activity
              </h2>
              <Link
                href="/dashboard/bookings"
                className="text-xs font-semibold text-blue-600 hover:text-blue-700"
              >
                View All &rarr;
              </Link>
            </div>

            <div className="overflow-x-auto">
              <table className="min-w-full text-left text-sm whitespace-nowrap">
                <thead className="bg-white text-gray-400 border-b border-gray-100 text-[10px] font-semibold uppercase tracking-wider">
                  <tr>
                    <th className="px-5 py-3 font-medium">Ref</th>
                    <th className="px-5 py-3 font-medium">Court</th>
                    <th className="px-5 py-3 font-medium hidden sm:table-cell">
                      Date
                    </th>
                    <th className="px-5 py-3 font-medium text-center">
                      Status
                    </th>
                    <th className="px-5 py-3 font-medium text-right">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {recentBookings.length === 0 ? (
                    <tr>
                      <td
                        colSpan="5"
                        className="px-6 py-12 text-center text-gray-400 text-xs"
                      >
                        No activity recorded yet.
                      </td>
                    </tr>
                  ) : (
                    recentBookings.map((booking) => (
                      <tr
                        key={booking.id}
                        className="hover:bg-gray-50/80 transition-colors group"
                      >
                        <td className="px-5 py-3 font-mono text-xs text-blue-600 font-medium group-hover:text-blue-700">
                          {booking.reference_id}
                        </td>
                        <td className="px-5 py-3 text-gray-900 text-xs font-medium">
                          {booking.courts.name}
                          <span className="text-[10px] text-gray-400 block">
                            {booking.sports?.name}
                          </span>
                        </td>
                        <td className="px-5 py-3 text-gray-500 text-xs hidden sm:table-cell">
                          {new Date(booking.booking_date).toLocaleDateString(
                            "en-US",
                            { month: "short", day: "numeric" }
                          )}
                        </td>
                        <td className="px-5 py-3 text-center">
                          <span
                            className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide border ${
                              booking.status === "confirmed"
                                ? "bg-green-50 text-green-700 border-green-100"
                                : booking.status === "cancelled"
                                ? "bg-red-50 text-red-700 border-red-100"
                                : "bg-amber-50 text-amber-700 border-amber-100"
                            }`}
                          >
                            {booking.status}
                          </span>
                        </td>
                        <td className="px-5 py-3 text-right text-xs font-medium text-gray-900">
                          {parseFloat(booking.total_price || 0).toLocaleString(
                            "en-US",
                            { minimumFractionDigits: 2 }
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Quick Actions (Frequent Tasks) */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
            <h2 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4">
              Quick Actions
            </h2>
            <div className="space-y-3">
              <Link
                href="/dashboard/bookings"
                className="group flex items-center p-3 border border-gray-200 rounded-lg hover:border-emerald-300 hover:bg-emerald-50/30 transition-all cursor-pointer"
              >
                <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-600 flex items-center justify-center mr-3 group-hover:scale-105 transition-transform">
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                    />
                  </svg>
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-900">
                    Bookings
                  </p>
                  <p className="text-[10px] text-gray-500">View reservations</p>
                </div>
              </Link>

              <Link
                href="/dashboard/courts"
                className="group flex items-center p-3 border border-gray-200 rounded-lg hover:border-orange-300 hover:bg-orange-50/30 transition-all cursor-pointer"
              >
                <div className="w-8 h-8 rounded-lg bg-orange-100 text-orange-600 flex items-center justify-center mr-3 group-hover:scale-105 transition-transform">
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                    />
                  </svg>
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-900">
                    Manage Availability
                  </p>
                  <p className="text-[10px] text-gray-500">
                    Block or unblock slots
                  </p>
                </div>
              </Link>

              <Link
                href="/dashboard/settings"
                className="group flex items-center p-3 border border-gray-200 rounded-lg hover:border-purple-300 hover:bg-purple-50/30 transition-all cursor-pointer"
              >
                <div className="w-8 h-8 rounded-lg bg-purple-100 text-purple-600 flex items-center justify-center mr-3 group-hover:scale-105 transition-transform">
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                    />
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                    />
                  </svg>
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-900">
                    Settings
                  </p>
                  <p className="text-[10px] text-gray-500">
                    Institution profile
                  </p>
                </div>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
