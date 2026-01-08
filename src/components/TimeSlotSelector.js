"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import BookingModal from "./BookingModal";

// Cache for bookings data with TTL
const bookingsCache = new Map();
const CACHE_TTL = 30000; // 30 seconds

function getCacheKey(courtId, date) {
  return `${courtId}:${date}`;
}

function getCachedBookings(courtId, date) {
  const key = getCacheKey(courtId, date);
  const cached = bookingsCache.get(key);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.data;
  }
  return null;
}

function setCachedBookings(courtId, date, data) {
  const key = getCacheKey(courtId, date);
  bookingsCache.set(key, { data, timestamp: Date.now() });
}

function invalidateCache(courtId, date) {
  const key = getCacheKey(courtId, date);
  bookingsCache.delete(key);
}

export default function TimeSlotSelector({
  court,
  institutionId,
  availableSports,
}) {
  const [selectedDate, setSelectedDate] = useState("");
  const [slots, setSlots] = useState([]);
  const [selectedSlots, setSelectedSlots] = useState([]);
  const [selectedSport, setSelectedSport] = useState(
    availableSports.length === 1 ? availableSports[0]?.id : null
  );
  const [loading, setLoading] = useState(false);
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [realtimeStatus, setRealtimeStatus] = useState("disconnected");
  const [debugLog, setDebugLog] = useState("No events yet...");

  // Refs for State (Critical for Event Listeners)
  const supabaseRef = useRef(null);
  const channelRef = useRef(null);
  const fetchTimeoutRef = useRef(null);
  const isMountedRef = useRef(true);

  // Dragging Refs
  const isDraggingRef = useRef(false);
  const lastTouchedSlotRef = useRef(null);
  const gridContainerRef = useRef(null);

  // Mirror state in refs for the non-passive event listener
  const slotsRef = useRef(slots);
  const selectedSlotsRef = useRef(selectedSlots);

  // Update refs whenever state changes
  useEffect(() => {
    slotsRef.current = slots;
  }, [slots]);

  useEffect(() => {
    selectedSlotsRef.current = selectedSlots;
  }, [selectedSlots]);

  // Memoized fetch function
  const fetchBookings = useCallback(
    async (forceRefresh = false) => {
      if (!selectedDate || !court.id) return;

      if (!forceRefresh) {
        const cached = getCachedBookings(court.id, selectedDate);
        if (cached) {
          updateSlotsWithBookings(cached);
          return;
        }
      }

      setLoading(true);
      const supabase = supabaseRef.current || createClient();

      try {
        const [bookingsResult, unavailabilityResult] = await Promise.all([
          supabase
            .from("bookings")
            .select("start_time, end_time, status")
            .eq("court_id", court.id)
            .eq("booking_date", selectedDate)
            .eq("status", "confirmed"),
          supabase
            .from("court_unavailability")
            .select("start_time, end_time")
            .eq("court_id", court.id)
            .eq("unavailable_date", selectedDate),
        ]);

        if (!isMountedRef.current) return;

        const bookings = bookingsResult.data || [];
        const unavailable = unavailabilityResult.data || [];

        const allBlocked = [
          ...bookings.map((b) => ({
            start_time: b.start_time,
            end_time: b.end_time,
            type: "booked",
          })),
          ...unavailable.map((u) => ({
            start_time: u.start_time,
            end_time: u.end_time,
            type: "blocked",
          })),
        ];

        setCachedBookings(court.id, selectedDate, allBlocked);
        updateSlotsWithBookings(allBlocked);
      } catch (error) {
        console.error("Error fetching bookings:", error);
      } finally {
        if (isMountedRef.current) {
          setLoading(false);
        }
      }
    },
    [selectedDate, court.id]
  );

  const updateSlotsWithBookings = useCallback((blockedSlots) => {
    setSlots((prevSlots) =>
      prevSlots.map((slot) => {
        const isBlocked = blockedSlots.some(
          (blocked) =>
            slot.time >= blocked.start_time && slot.time < blocked.end_time
        );
        return { ...slot, available: !isBlocked };
      })
    );

    setSelectedSlots((prev) =>
      prev.filter(
        (selected) =>
          !blockedSlots.some(
            (blocked) =>
              selected.time >= blocked.start_time &&
              selected.time < blocked.end_time
          )
      )
    );
  }, []);

  // --- HELPER: Process Slot Selection (Used by both Mouse and Touch) ---
  const processSlotSelection = (time) => {
    // Prevent processing the same slot multiple times in one drag event
    if (lastTouchedSlotRef.current === time) return;

    const slot = slotsRef.current.find((s) => s.time === time);
    if (slot && slot.available) {
      lastTouchedSlotRef.current = time;

      const isSelected = selectedSlotsRef.current.some((s) => s.time === time);

      if (!isSelected) {
        // Add to selection
        setSelectedSlots((prev) =>
          [...prev, slot].sort((a, b) => a.time.localeCompare(b.time))
        );
      }
    }
  };

  // onClick as ultimate fallback for touch devices
  const handleClick = (slot, e) => {
    const timestamp = new Date().toLocaleTimeString();
    const logMsg = `[${timestamp}] CLICK on ${slot.time} (type: ${e.type})`;
    setDebugLog(logMsg);

    if (!slot.available) return;

    // Toggle slot selection
    const isAlreadySelected = selectedSlots.some((s) => s.time === slot.time);

    if (isAlreadySelected) {
      console.log("[CLICK] Deselecting slot");
      setSelectedSlots(selectedSlots.filter((s) => s.time !== slot.time));
    } else {
      console.log("[CLICK] Selecting slot");
      setSelectedSlots(
        [...selectedSlots, slot].sort((a, b) => a.time.localeCompare(b.time))
      );
    }
  };

  // --- TOUCH / POINTER MOVE HANDLER (The "Paint" Logic) ---
  useEffect(() => {
    const container = gridContainerRef.current;
    if (!container) return;

    // We use native listeners with { passive: false } to reliably prevent scrolling on touch
    const handleNativeMove = (e) => {
      if (!isDraggingRef.current) return;

      // Prevent scrolling while dragging slots
      if (e.cancelable && e.type === "touchmove") {
        e.preventDefault();
      }

      // Get coordinates
      let clientX, clientY;
      if (e.type === "touchmove") {
        clientX = e.touches[0].clientX;
        clientY = e.touches[0].clientY;
      } else {
        clientX = e.clientX;
        clientY = e.clientY;
      }

      // Find element under finger/cursor
      const targetElement = document.elementFromPoint(clientX, clientY);
      const slotButton = targetElement?.closest("button[data-slot-time]");

      if (slotButton && slotButton.dataset.slotTime) {
        processSlotSelection(slotButton.dataset.slotTime);
      }
    };

    container.addEventListener("touchmove", handleNativeMove, {
      passive: false,
    });
    // We can also attach pointermove here for consistency, or rely on React's onPointerEnter for mouse
    container.addEventListener("pointermove", handleNativeMove, {
      passive: false,
    });

    return () => {
      container.removeEventListener("touchmove", handleNativeMove);
      container.removeEventListener("pointermove", handleNativeMove);
    };
  }, []); // Deps are empty because we use refs (slotsRef, selectedSlotsRef)

  // --- LIFECYCLE & SUBSCRIPTION ---
  useEffect(() => {
    isMountedRef.current = true;
    if (!supabaseRef.current) supabaseRef.current = createClient();

    if (selectedDate && selectedSport) {
      generateSlots();
      fetchBookings(true);
      setupRealtimeSubscription();
    }

    const handleGlobalEnd = (e) => {
      isDraggingRef.current = false;
      lastTouchedSlotRef.current = null;
    };

    // Attach global listeners to catch release outside container
    window.addEventListener("pointerup", handleGlobalEnd);
    window.addEventListener("pointercancel", handleGlobalEnd);
    window.addEventListener("touchend", handleGlobalEnd);

    return () => {
      isMountedRef.current = false;
      if (channelRef.current) channelRef.current.unsubscribe();
      if (fetchTimeoutRef.current) clearTimeout(fetchTimeoutRef.current);
      window.removeEventListener("pointerup", handleGlobalEnd);
      window.removeEventListener("pointercancel", handleGlobalEnd);
      window.removeEventListener("touchend", handleGlobalEnd);
    };
  }, [selectedDate, selectedSport, court.id, fetchBookings]);

  const setupRealtimeSubscription = () => {
    if (channelRef.current) channelRef.current.unsubscribe();

    const channel = supabaseRef.current
      .channel(`court_${court.id}_availability`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "bookings",
          filter: `court_id=eq.${court.id}`,
        },
        (payload) => {
          const changed = payload.new || payload.old;
          if (changed && changed.booking_date === selectedDate) {
            invalidateCache(court.id, selectedDate);
            if (fetchTimeoutRef.current) clearTimeout(fetchTimeoutRef.current);
            fetchTimeoutRef.current = setTimeout(
              () => fetchBookings(true),
              100
            );
          }
        }
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "court_unavailability",
          filter: `court_id=eq.${court.id}`,
        },
        (payload) => {
          const changed = payload.new || payload.old;
          if (changed && changed.unavailable_date === selectedDate) {
            invalidateCache(court.id, selectedDate);
            fetchBookings(true);
          }
        }
      )
      .subscribe((status) => {
        setRealtimeStatus(status === "SUBSCRIBED" ? "connected" : status);
      });

    channelRef.current = channel;
  };

  const generateSlots = () => {
    const slots = [];
    const [startHour, startMin] = court.opening_time.split(":").map(Number);
    const [endHour, endMin] = court.closing_time.split(":").map(Number);
    let currentTime = startHour * 60 + startMin;
    const endTime = endHour * 60 + endMin;

    while (currentTime < endTime) {
      const hour = Math.floor(currentTime / 60);
      const min = currentTime % 60;
      const timeStr = `${String(hour).padStart(2, "0")}:${String(min).padStart(
        2,
        "0"
      )}:00`;

      slots.push({
        time: timeStr,
        displayTime: `${String(hour).padStart(2, "0")}:${String(min).padStart(
          2,
          "0"
        )}`,
        available: true,
      });

      currentTime += court.slot_duration_minutes;
    }
    setSlots(slots);
  };

  // --- INTERACTION HANDLERS ---

  const handlePointerDown = (slot, e) => {
    if (!slot.available) {
      return;
    }

    isDraggingRef.current = true;
    lastTouchedSlotRef.current = slot.time;

    // Toggle logic for the initial click/tap
    const isAlreadySelected = selectedSlots.some((s) => s.time === slot.time);

    if (isAlreadySelected) {
      setSelectedSlots(selectedSlots.filter((s) => s.time !== slot.time));
    } else {
      setSelectedSlots(
        [...selectedSlots, slot].sort((a, b) => a.time.localeCompare(b.time))
      );
    }
  };

  // Fallback touch handler for devices where pointer events don't work
  const handleTouchStart = (slot, e) => {
    console.log("[DEBUG] handleTouchStart fired", {
      slotTime: slot.time,
      available: slot.available,
      touches: e.touches.length,
    });

    if (!slot.available) {
      console.log("[DEBUG] Slot not available, returning");
      return;
    }

    // Prevent default to avoid any browser handling that might interfere
    // But don't prevent default if it breaks the event
    // e.preventDefault();

    isDraggingRef.current = true;
    lastTouchedSlotRef.current = slot.time;

    // Toggle logic for the initial tap
    const isAlreadySelected = selectedSlots.some((s) => s.time === slot.time);
    console.log("[DEBUG] Touch - isAlreadySelected:", isAlreadySelected);

    if (isAlreadySelected) {
      console.log("[DEBUG] Touch - Deselecting slot");
      setSelectedSlots(selectedSlots.filter((s) => s.time !== slot.time));
    } else {
      console.log("[DEBUG] Touch - Selecting slot");
      setSelectedSlots(
        [...selectedSlots, slot].sort((a, b) => a.time.localeCompare(b.time))
      );
    }
  };

  // Mouse-specific helper for smoother desktop experience
  const handlePointerEnter = (slot) => {
    if (isDraggingRef.current) {
      console.log("[DEBUG] handlePointerEnter while dragging", {
        slotTime: slot.time,
      });
      processSlotSelection(slot.time);
    }
  };

  const handleDateChange = (days) => {
    const date = new Date(selectedDate);
    date.setDate(date.getDate() + days);
    setSelectedDate(date.toISOString().split("T")[0]);
    setSelectedSlots([]);
  };

  const getTotalDuration = () =>
    selectedSlots.length * court.slot_duration_minutes;
  const getTotalPrice = () =>
    selectedSlots.length * (court.price_per_slot || 0);
  const getStartTime = () => selectedSlots[0]?.time || "";

  const getEndTime = () => {
    if (selectedSlots.length === 0) return "";
    const lastSlot = selectedSlots[selectedSlots.length - 1];
    const [hour, min] = lastSlot.time.split(":").map(Number);
    const endMinutes = hour * 60 + min + court.slot_duration_minutes;
    const endHour = Math.floor(endMinutes / 60);
    const endMin = endMinutes % 60;
    return `${String(endHour).padStart(2, "0")}:${String(endMin).padStart(
      2,
      "0"
    )}:00`;
  };

  const today = new Date().toISOString().split("T")[0];
  const showTimeSlots = selectedDate && selectedSport;

  return (
    <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-gray-900">
          Select Sport, Date & Time
        </h2>
        {selectedDate && selectedSport && (
          <div className="flex items-center gap-2">
            <div
              className={`w-2 h-2 rounded-full ${
                realtimeStatus === "connected"
                  ? "bg-green-500 animate-pulse"
                  : "bg-gray-400"
              }`}
            />
            <span className="text-xs text-gray-500">
              {realtimeStatus === "connected"
                ? "Live updates"
                : "Connecting..."}
            </span>
            <button
              onClick={() => fetchBookings(true)}
              className="ml-2 p-1.5 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <svg
                className={`w-4 h-4 ${loading ? "animate-spin" : ""}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                />
              </svg>
            </button>
          </div>
        )}
      </div>

      {/* Sport Selector */}
      <div className="mb-6">
        <label className="block text-sm font-semibold text-gray-700 mb-3">
          Select Sport <span className="text-red-500">*</span>
        </label>
        <div className="flex flex-wrap gap-3">
          {availableSports.map((sport) => (
            <button
              key={sport.id}
              onClick={() => {
                setSelectedSport(sport.id);
                setSelectedSlots([]);
              }}
              className={`px-5 py-2.5 rounded-lg font-semibold transition-all ${
                selectedSport === sport.id
                  ? "bg-slate-800 text-white shadow-md ring-2 ring-slate-800 ring-offset-2"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200 hover:shadow"
              }`}
            >
              {sport.name}
            </button>
          ))}
        </div>
      </div>

      {/* Date Selector */}
      <div className="mb-6">
        <label className="block text-sm font-semibold text-gray-700 mb-3">
          Select Date <span className="text-red-500">*</span>
        </label>
        <div className="flex items-center justify-between bg-gradient-to-r from-slate-50 to-gray-50 p-4 rounded-xl border border-gray-200">
          <button
            onClick={() => handleDateChange(-1)}
            disabled={!selectedDate || selectedDate <= today}
            className="p-2 hover:bg-white rounded-lg disabled:opacity-30 disabled:cursor-not-allowed transition-all"
          >
            <svg
              className="w-5 h-5 text-gray-700"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 19l-7-7 7-7"
              />
            </svg>
          </button>
          <div className="text-center">
            <input
              type="date"
              value={selectedDate}
              min={today}
              onChange={(e) => {
                setSelectedDate(e.target.value);
                setSelectedSlots([]);
              }}
              className="text-lg font-bold border-none bg-transparent cursor-pointer text-gray-900"
            />
            {selectedDate && (
              <p className="text-sm text-gray-600 mt-1">
                {new Date(selectedDate).toLocaleDateString("en-US", {
                  weekday: "long",
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </p>
            )}
          </div>
          <button
            onClick={() => handleDateChange(1)}
            disabled={!selectedDate}
            className="p-2 hover:bg-white rounded-lg disabled:opacity-30 disabled:cursor-not-allowed transition-all"
          >
            <svg
              className="w-5 h-5 text-gray-700"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 5l7 7-7 7"
              />
            </svg>
          </button>
        </div>
      </div>

      {/* Time Slots Grid */}
      {!showTimeSlots ? (
        <div className="text-center py-12 bg-gradient-to-br from-slate-50 to-gray-50 rounded-xl border-2 border-dashed border-gray-300">
          <svg
            className="w-16 h-16 mx-auto text-gray-400 mb-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
            />
          </svg>
          <p className="text-gray-600 font-medium">
            Please select a sport and date to view available time slots
          </p>
        </div>
      ) : loading ? (
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-10 w-10 border-4 border-slate-200 border-t-slate-800"></div>
          <p className="text-gray-600 mt-3">Loading available slots...</p>
        </div>
      ) : (
        <>
          <div className="mb-6">
            <label className="block text-sm font-semibold text-gray-700 mb-3">
              Select Time Slots <span className="text-red-500">*</span>
            </label>

            {/* DEBUG BAR - Remove after fixing */}
            <div className="mb-4 p-3 bg-yellow-100 border-2 border-yellow-400 rounded-lg text-sm font-mono">
              <strong>DEBUG:</strong> {debugLog}
            </div>

            {/* Grid container */}
            <div
              ref={gridContainerRef}
              className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-2 mb-4 select-none"
            >
              {slots.map((slot) => (
                <button
                  key={slot.time}
                  data-slot-time={slot.time}
                  type="button"
                  onClick={(e) => handleClick(slot, e)}
                  disabled={!slot.available}
                  className={`p-3 text-sm font-bold rounded-lg transition-all select-none ${
                    selectedSlots.find((s) => s.time === slot.time)
                      ? "bg-slate-800 text-white ring-2 ring-slate-800 ring-offset-2 shadow-md"
                      : slot.available
                      ? "bg-green-50 text-green-700 hover:bg-green-100 border-2 border-green-300 hover:shadow active:bg-green-200"
                      : "bg-gray-100 text-gray-400 cursor-not-allowed opacity-50"
                  }`}
                >
                  {slot.displayTime}
                </button>
              ))}
            </div>

            <div className="flex flex-wrap gap-4 text-sm">
              <div className="flex items-center">
                <div className="w-4 h-4 bg-green-50 border-2 border-green-300 rounded mr-2"></div>
                <span className="text-gray-700 font-medium">Available</span>
              </div>
              <div className="flex items-center">
                <div className="w-4 h-4 bg-slate-800 rounded mr-2"></div>
                <span className="text-gray-700 font-medium">Selected</span>
              </div>
              <div className="flex items-center">
                <div className="w-4 h-4 bg-gray-100 rounded mr-2"></div>
                <span className="text-gray-700 font-medium">Booked</span>
              </div>
            </div>
          </div>

          {selectedSlots.length > 0 && (
            <div className="bg-gradient-to-r from-slate-50 to-gray-50 border-2 border-slate-200 rounded-xl p-5 shadow-sm">
              <div className="flex items-center justify-between flex-wrap gap-4">
                <div className="flex-1 min-w-[200px]">
                  <p className="text-sm text-gray-600 font-semibold mb-1">
                    Selected Time
                  </p>
                  <p className="text-xl font-bold text-gray-900">
                    {selectedSlots[0].displayTime} -{" "}
                    {getEndTime().substring(0, 5)}
                  </p>
                  <p className="text-sm text-gray-700 mt-1">
                    Duration: {getTotalDuration() / 60} minutes (
                    {selectedSlots.length} slot
                    {selectedSlots.length > 1 ? "s" : ""})
                  </p>
                  <p className="text-2xl font-bold text-green-600 mt-3">
                    Total: LKR {getTotalPrice().toFixed(2)}
                  </p>
                </div>
                <button
                  onClick={() => setShowBookingModal(true)}
                  className="bg-slate-800 text-white px-8 py-3.5 rounded-lg font-bold hover:bg-slate-900 transition-all shadow-md hover:shadow-lg"
                >
                  Book Now
                </button>
              </div>
            </div>
          )}
        </>
      )}

      {showBookingModal && (
        <BookingModal
          court={court}
          institutionId={institutionId}
          bookingDate={selectedDate}
          startTime={getStartTime()}
          endTime={getEndTime()}
          selectedSportId={selectedSport}
          selectedSportName={
            availableSports.find((s) => s.id === selectedSport)?.name
          }
          totalPrice={getTotalPrice()}
          onClose={() => setShowBookingModal(false)}
          onSuccess={() => {
            setSelectedSlots([]);
            setShowBookingModal(false);
            fetchBookings();
          }}
        />
      )}
    </div>
  );
}
