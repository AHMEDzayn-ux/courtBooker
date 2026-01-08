"use client";

import { useEffect, useState, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

export default function BookingsPage() {
  const router = useRouter();
  const [bookings, setBookings] = useState([]);
  const [courts, setCourts] = useState([]);
  const [institutionId, setInstitutionId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all"); // all, upcoming, past
  const [statusFilter, setStatusFilter] = useState("all"); // all, confirmed, cancelled
  const [courtFilter, setCourtFilter] = useState("all"); // all, or specific court ID
  const [dateFilter, setDateFilter] = useState(""); // specific date YYYY-MM-DD
  const [searchTerm, setSearchTerm] = useState("");
  const channelRef = useRef(null);

  useEffect(() => {
    fetchBookings();

    // Cleanup real-time subscription on unmount
    return () => {
      if (channelRef.current) {
        channelRef.current.unsubscribe();
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter, statusFilter]);

  const fetchBookings = async () => {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      router.push("/institution/login");
      return;
    }

    // Fetch bookings via API
    const response = await fetch(
      `/api/dashboard/bookings?filter=${filter}&statusFilter=${statusFilter}`
    );
    const data = await response.json();

    if (response.ok) {
      setBookings(data.bookings || []);

      // Get institution ID for later use
      const { data: adminData } = await supabase
        .from("institution_admins")
        .select("institution_id")
        .eq("id", user.id)
        .single();

      const instId = adminData?.institution_id;
      setInstitutionId(instId);

      // Fetch courts for filter dropdown
      if (instId) {
        const { data: courtsData } = await supabase
          .from("courts")
          .select("id, name")
          .eq("institution_id", instId)
          .order("name");

        setCourts(courtsData || []);

        // Set up real-time subscription for this institution
        setupRealtimeSubscription(supabase, instId);
      }
    }

    setLoading(false);
  };

  const setupRealtimeSubscription = (supabase, instId) => {
    // Remove existing subscription if any
    if (channelRef.current) {
      channelRef.current.unsubscribe();
    }

    // Create new channel for this institution's bookings
    const channel = supabase
      .channel(`institution_bookings:${instId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "bookings",
          filter: `institution_id=eq.${instId}`,
        },
        (payload) => {
          // Refresh bookings when any change occurs
          fetchBookings();
        }
      )
      .subscribe();

    channelRef.current = channel;
  };

  const handleCancelBooking = async (bookingId) => {
    const reason = prompt(
      "Please provide a reason for cancellation (will be sent via SMS to customer):"
    );

    if (!reason || reason.trim() === "") {
      alert("Cancellation reason is required");
      return;
    }

    if (
      !confirm(
        "Are you sure you want to cancel this booking? The customer will be notified via SMS."
      )
    ) {
      return;
    }

    try {
      const response = await fetch("/api/dashboard/bookings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bookingId,
          status: "cancelled",
          cancellationReason: reason.trim(),
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error);
      }

      alert(
        "Booking cancelled successfully. Customer will be notified via SMS."
      );
      fetchBookings();
    } catch (error) {
      console.error("Error:", error);
      alert("Failed to cancel booking: " + error.message);
    }
  };

  const filteredBookings = bookings.filter((booking) => {
    // Search filter
    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      const matchesSearch =
        booking.reference_id.toLowerCase().includes(search) ||
        booking.customer_name.toLowerCase().includes(search) ||
        booking.customer_phone.includes(search);

      if (!matchesSearch) return false;
    }

    // Court filter
    if (courtFilter !== "all" && booking.court_id !== courtFilter) {
      return false;
    }

    // Booking date filter
    if (dateFilter && booking.booking_date !== dateFilter) {
      return false;
    }

    return true;
  });

  if (loading) {
    return <div className="text-center py-12">Loading...</div>;
  }

  return (
    <div>
      <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-6 sm:mb-8">
        Bookings Management
      </h1>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
        {/* Grid Layout Strategy:
      - Mobile (default): 1 column (Stack vertically)
      - Small (sm): 2 columns (Equal 50% width)
      - Medium (md): 3 columns (Equal 33% width)
      - Large (lg): 5 columns (All items in one row, exactly 20% width each)
  */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
          {/* 1. Search */}
          <div className="w-full">
            <label className="block text-xs font-medium text-gray-600 mb-1">
              Search
            </label>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Ref, Name..."
              className="w-full px-3 py-2 text-xs border border-gray-300 rounded-lg focus:ring-1 focus:ring-neutral-900 focus:border-neutral-900 transition-shadow"
            />
          </div>

          {/* 2. Time Range */}
          <div className="w-full">
            <label className="block text-xs font-medium text-gray-600 mb-1">
              Time Range
            </label>
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="w-full px-3 py-2 text-xs border border-gray-300 rounded-lg focus:ring-1 focus:ring-neutral-900 focus:border-neutral-900 bg-white transition-shadow"
            >
              <option value="all">All Time</option>
              <option value="upcoming">Upcoming</option>
              <option value="past">Past</option>
            </select>
          </div>

          {/* 3. Status */}
          <div className="w-full">
            <label className="block text-xs font-medium text-gray-600 mb-1">
              Status
            </label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-3 py-2 text-xs border border-gray-300 rounded-lg focus:ring-1 focus:ring-neutral-900 focus:border-neutral-900 bg-white transition-shadow"
            >
              <option value="all">All Status</option>
              <option value="confirmed">Confirmed</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>

          {/* 4. Court */}
          <div className="w-full">
            <label className="block text-xs font-medium text-gray-600 mb-1">
              Court
            </label>
            <select
              value={courtFilter}
              onChange={(e) => setCourtFilter(e.target.value)}
              className="w-full px-3 py-2 text-xs border border-gray-300 rounded-lg focus:ring-1 focus:ring-neutral-900 focus:border-neutral-900 bg-white transition-shadow"
            >
              <option value="all">All Courts</option>
              {courts.map((court) => (
                <option key={court.id} value={court.id}>
                  {court.name}
                </option>
              ))}
            </select>
          </div>

          {/* 5. Date */}
          <div className="w-full">
            <label className="block text-xs font-medium text-gray-600 mb-1">
              Date
            </label>
            <input
              type="date"
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="w-full px-3 py-2 text-xs border border-gray-300 rounded-lg focus:ring-1 focus:ring-neutral-900 focus:border-neutral-900 transition-shadow"
            />
          </div>
        </div>

        {/* Clear Filters (Full width bar below) */}
        {(courtFilter !== "all" || dateFilter) && (
          <div className="mt-3 pt-3 border-t border-gray-100 flex justify-end">
            <button
              onClick={() => {
                setCourtFilter("all");
                setDateFilter("");
              }}
              className="text-xs text-red-600 hover:text-red-700 font-medium flex items-center gap-1 transition-colors"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 20 20"
                fill="currentColor"
                className="w-3 h-3"
              >
                <path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z" />
              </svg>
              Clear Filters
            </button>
          </div>
        )}
      </div>
      {/* Summary Stats */}
      <div className="mt-4 grid grid-cols-3 gap-2 sm:gap-4">
        {/* Card 1: Total */}
        <div className="bg-white rounded-lg border border-gray-200 px-3 py-3 flex flex-row items-center justify-between shadow-sm">
          <span className="text-xs text-gray-500 font-medium">Total</span>
          <span className="text-sm sm:text-lg font-bold text-gray-900">
            {filteredBookings.length}
          </span>
        </div>

        {/* Card 2: Confirmed */}
        <div className="bg-white rounded-lg border border-gray-200 px-3 py-3 flex flex-row items-center justify-between shadow-sm">
          <span className="text-xs text-gray-500 font-medium">Confirmed</span>
          <span className="text-sm sm:text-lg font-bold text-green-600">
            {filteredBookings.filter((b) => b.status === "confirmed").length}
          </span>
        </div>

        {/* Card 3: Revenue */}
        <div className="bg-white rounded-lg border border-gray-200 px-3 py-3 flex flex-row items-center justify-between shadow-sm">
          <span className="text-xs text-gray-500 font-medium">Revenue</span>
          <span className="text-sm sm:text-lg font-bold text-purple-600 whitespace-nowrap">
            <span className="text-[10px] text-gray-400 font-normal mr-1 hidden sm:inline">
              LKR
            </span>
            {filteredBookings
              .filter((b) => b.status === "confirmed")
              .reduce((sum, b) => sum + parseFloat(b.total_price || 0), 0)
              .toLocaleString("en-US", { maximumFractionDigits: 0 })}
          </span>
        </div>
      </div>
      {/* Bookings Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        {filteredBookings.length === 0 ? (
          <div className="p-12 text-center text-gray-500">
            No bookings found
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-xs sm:text-sm whitespace-nowrap">
              <thead className="bg-gray-100 border-b border-gray-200 uppercase tracking-wider font-semibold text-gray-600">
                <tr>
                  <th className="px-4 py-3 border-r border-gray-200">
                    Created At
                  </th>
                  <th className="px-4 py-3 border-r border-gray-200">
                    Reference
                  </th>
                  <th className="px-4 py-3 border-r border-gray-200">
                    Booked Date
                  </th>
                  <th className="px-4 py-3 border-r border-gray-200">Time</th>
                  <th className="px-4 py-3 border-r border-gray-200">Court</th>
                  <th className="px-4 py-3 border-r border-gray-200 hidden lg:table-cell">
                    Sport
                  </th>
                  <th className="px-4 py-3 border-r border-gray-200 hidden md:table-cell">
                    Customer
                  </th>
                  <th className="px-4 py-3 border-r border-gray-200 hidden xl:table-cell">
                    Phone
                  </th>
                  <th className="px-4 py-3 border-r border-gray-200 text-center">
                    Status
                  </th>
                  <th className="px-4 py-3 border-r border-gray-200 text-right">
                    Amount
                  </th>
                  <th className="px-4 py-3 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredBookings.map((booking) => (
                  <tr
                    key={booking.id}
                    className="hover:bg-gray-50 transition-colors"
                  >
                    {/* Created At */}
                    <td className="px-4 py-3 border-r border-gray-200">
                      <div className="flex flex-col">
                        <span className="font-medium text-gray-900">
                          {new Date(booking.created_at).toLocaleDateString(
                            "en-US",
                            {
                              month: "short",
                              day: "numeric",
                            }
                          )}
                        </span>
                        <span className="text-gray-500 text-[10px]">
                          {new Date(booking.created_at).toLocaleTimeString(
                            "en-US",
                            {
                              hour: "numeric",
                              minute: "2-digit",
                              hour12: true,
                            }
                          )}
                        </span>
                      </div>
                    </td>

                    {/* Reference */}
                    <td className="px-4 py-3 border-r border-gray-200 font-mono text-blue-600 font-medium">
                      {booking.reference_id}
                    </td>

                    {/* Booked Date */}
                    <td className="px-4 py-3 border-r border-gray-200 text-gray-900">
                      {new Date(booking.booking_date).toLocaleDateString(
                        "en-US",
                        {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        }
                      )}
                    </td>

                    {/* Time */}
                    <td className="px-4 py-3 border-r border-gray-200 text-gray-600">
                      {booking.start_time.substring(0, 5)} -{" "}
                      {booking.end_time.substring(0, 5)}
                    </td>

                    {/* Court */}
                    <td className="px-4 py-3 border-r border-gray-200 text-gray-900 font-medium">
                      {booking.courts.name}
                    </td>

                    {/* Sport (Hidden on Mobile) */}
                    <td className="px-4 py-3 border-r border-gray-200 text-gray-600 hidden lg:table-cell">
                      {booking.sports?.name || "-"}
                    </td>

                    {/* Customer (Hidden on Tablet) */}
                    <td className="px-4 py-3 border-r border-gray-200 text-gray-900 hidden md:table-cell">
                      {booking.customer_name}
                    </td>

                    {/* Phone (Hidden on Laptop) */}
                    <td className="px-4 py-3 border-r border-gray-200 text-gray-600 hidden xl:table-cell">
                      {booking.customer_phone}
                    </td>

                    {/* Status (Centered) */}
                    <td className="px-4 py-3 border-r border-gray-200 text-center">
                      <span
                        className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] sm:text-xs font-bold uppercase tracking-wide border ${
                          booking.status === "confirmed"
                            ? "bg-green-50 text-green-700 border-green-200"
                            : booking.status === "cancelled"
                            ? "bg-red-50 text-red-700 border-red-200"
                            : "bg-amber-50 text-amber-700 border-amber-200"
                        }`}
                      >
                        {booking.status}
                      </span>
                    </td>

                    {/* Amount (Right Aligned) */}
                    <td className="px-4 py-3 border-r border-gray-200 text-right font-mono text-gray-900 font-semibold">
                      {parseFloat(booking.total_price || 0).toFixed(2)}
                    </td>

                    {/* Actions (Centered) */}
                    <td className="px-4 py-3 text-center">
                      {booking.status === "confirmed" ? (
                        <button
                          onClick={() => handleCancelBooking(booking.id)}
                          className="text-red-600 hover:text-red-800 hover:bg-red-50 px-2 py-1 rounded text-xs font-medium transition-colors"
                        >
                          Cancel
                        </button>
                      ) : (
                        <span className="text-gray-300">-</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
