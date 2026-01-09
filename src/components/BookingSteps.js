"use client";

import { useState, useEffect, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

export default function BookingSteps({
  court,
  institutionId,
  availableSports,
  isAdmin = false,
}) {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);

  // Default to the first sport internally
  const [selectedSport, setSelectedSport] = useState(
    availableSports[0]?.id || null
  );

  // Initialize state with today's date in YYYY-MM-DD format (Local Time)
  const [selectedDate, setSelectedDate] = useState(() => {
    const d = new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  });

  const [slots, setSlots] = useState([]);
  const [selectedSlots, setSelectedSlots] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStartSlot, setDragStartSlot] = useState(null);

  // State for Admin Views
  const [viewSlot, setViewSlot] = useState(null); // The slot data
  const [showFullDetails, setShowFullDetails] = useState(false); // Toggle for large popup
  const [copySuccess, setCopySuccess] = useState(false);

  const gridRef = useRef(null);

  useEffect(() => {
    if (currentStep === 1 && selectedDate) {
      generateSlots();
      fetchBookings();
    }
  }, [selectedDate, court.id, currentStep]);

  useEffect(() => {
    if (isAdmin) return;
    const gridElement = gridRef.current;
    if (gridElement) {
      gridElement.addEventListener("touchmove", handleTouchMove, {
        passive: false,
      });
      return () => {
        gridElement.removeEventListener("touchmove", handleTouchMove);
      };
    }
  }, [isDragging, dragStartSlot, slots, selectedSlots, isAdmin]);

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

      const endSlotTime = currentTime + court.slot_duration_minutes;
      const endHourSlot = Math.floor(endSlotTime / 60);
      const endMinSlot = endSlotTime % 60;
      const endTimeStr = `${String(endHourSlot).padStart(2, "0")}:${String(
        endMinSlot
      ).padStart(2, "0")}`;

      slots.push({
        time: timeStr,
        displayTime: `${String(hour).padStart(2, "0")}:${String(min).padStart(
          2,
          "0"
        )}`,
        displayEndTime: endTimeStr,
        displayRange: `${String(hour).padStart(2, "0")}:${String(min).padStart(
          2,
          "0"
        )} - ${endTimeStr}`,
        available: true,
        booked: false,
        unavailable: false,
        unavailableReason: null,
      });

      currentTime += court.slot_duration_minutes;
    }

    setSlots(slots);
  };

  const fetchBookings = async () => {
    setLoading(true);
    const supabase = createClient();

    const { data: bookings } = await supabase
      .from("bookings")
      .select(
        `
        id, 
        start_time, 
        end_time, 
        customer_name, 
        customer_phone, 
        customer_email, 
        total_price, 
        status, 
        reference_id, 
        booking_date,
        sports (name),
        courts (
            name,
            institutions (name)
        )
      `
      )
      .eq("court_id", court.id)
      .eq("booking_date", selectedDate)
      .eq("status", "confirmed");

    const { data: unavailableSlots } = await supabase
      .from("court_unavailability")
      .select("start_time, end_time, reason")
      .eq("court_id", court.id)
      .eq("unavailable_date", selectedDate);

    if (
      (bookings && bookings.length > 0) ||
      (unavailableSlots && unavailableSlots.length > 0)
    ) {
      setSlots((prevSlots) =>
        prevSlots.map((slot) => {
          const bookingMatch = bookings?.find(
            (booking) =>
              slot.time >= booking.start_time && slot.time < booking.end_time
          );

          const unavailableMatch = unavailableSlots?.find(
            (unavailable) =>
              slot.time >= unavailable.start_time &&
              slot.time < unavailable.end_time
          );

          // Flatten data for easier access in the UI
          let formattedBooking = null;
          if (bookingMatch) {
            formattedBooking = {
              ...bookingMatch,
              sport_name: bookingMatch.sports?.name,
              court_name: bookingMatch.courts?.name,
              institution_name: bookingMatch.courts?.institutions?.name,
            };
          }

          return {
            ...slot,
            available: !bookingMatch && !unavailableMatch,
            booked: !!bookingMatch,
            bookingDetails: formattedBooking,
            unavailable: !!unavailableMatch,
            unavailableReason: unavailableMatch?.reason || null,
          };
        })
      );
    }
    setLoading(false);
  };

  const handleSlotClick = (slot, e) => {
    if (isAdmin) {
      if (slot.booked) {
        // DIRECTLY OPEN FULL DETAILS FOR BOOKED SLOTS
        setViewSlot(slot);
        setCopySuccess(false);
        setShowFullDetails(true);
      } else if (slot.unavailable) {
        // OPEN SMALL MODAL FOR UNAVAILABLE/MAINTENANCE SLOTS
        setViewSlot(slot);
        setShowFullDetails(false);
      }
      return;
    }

    // Customer logic
    if (slot.booked) return;
    const slotIndex = slots.findIndex((s) => s.time === slot.time);
    const isSelected = selectedSlots.some((s) => s.time === slot.time);

    if (isSelected) {
      const selectedIndices = selectedSlots.map((s) =>
        slots.findIndex((sl) => sl.time === s.time)
      );
      const minIndex = Math.min(...selectedIndices);
      const maxIndex = Math.max(...selectedIndices);
      if (slotIndex === minIndex || slotIndex === maxIndex) {
        setSelectedSlots(selectedSlots.filter((s) => s.time !== slot.time));
      }
    } else {
      if (selectedSlots.length === 0) {
        setSelectedSlots([slot]);
      } else {
        const selectedIndices = selectedSlots.map((s) =>
          slots.findIndex((sl) => sl.time === s.time)
        );
        const minIndex = Math.min(...selectedIndices);
        const maxIndex = Math.max(...selectedIndices);
        if (slotIndex === minIndex - 1 || slotIndex === maxIndex + 1) {
          const start = Math.min(slotIndex, minIndex);
          const end = Math.max(slotIndex, maxIndex);
          const allAvailable = slots
            .slice(start, end + 1)
            .every((s) => !s.booked);
          if (allAvailable) {
            setSelectedSlots(
              [...selectedSlots, slot].sort((a, b) =>
                a.time.localeCompare(b.time)
              )
            );
          }
        } else {
          setSelectedSlots([slot]);
        }
      }
    }
  };

  // Drag/Touch handlers
  const handleMouseDown = (slot, e) => {
    if (isAdmin || e.pointerType === "touch" || slot.booked) return;
    setIsDragging(true);
    setDragStartSlot(slot);
    setSelectedSlots([slot]);
  };
  const handleMouseEnter = (slot) => {
    if (isAdmin || !isDragging || slot.booked || !dragStartSlot) return;
    const currentSlotIndex = slots.findIndex((s) => s.time === slot.time);
    const startSlotIndex = slots.findIndex(
      (s) => s.time === dragStartSlot.time
    );
    const start = Math.min(currentSlotIndex, startSlotIndex);
    const end = Math.max(currentSlotIndex, startSlotIndex);
    const rangeSlots = slots.slice(start, end + 1);
    if (rangeSlots.every((s) => !s.booked)) {
      setSelectedSlots(rangeSlots);
    }
  };
  const handleMouseUp = () => {
    setIsDragging(false);
    setDragStartSlot(null);
  };
  const handleTouchStart = (slot, e) => {
    if (isAdmin || slot.booked) return;
    e.preventDefault();
    setIsDragging(true);
    setDragStartSlot(slot);
    setSelectedSlots([slot]);
  };
  const handleTouchMove = (e) => {
    if (isAdmin || !isDragging || !dragStartSlot) return;
    e.preventDefault();
    const touch = e.touches[0];
    const element = document.elementFromPoint(touch.clientX, touch.clientY);
    const slotButton = element?.closest("button[data-slot-time]");
    if (slotButton && slotButton.dataset.slotTime) {
      const slotTime = slotButton.dataset.slotTime;
      const slot = slots.find((s) => s.time === slotTime);
      if (slot && !slot.booked) {
        const currentSlotIndex = slots.findIndex((s) => s.time === slot.time);
        const startSlotIndex = slots.findIndex(
          (s) => s.time === dragStartSlot.time
        );
        const start = Math.min(currentSlotIndex, startSlotIndex);
        const end = Math.max(currentSlotIndex, startSlotIndex);
        const rangeSlots = slots.slice(start, end + 1);
        if (rangeSlots.every((s) => !s.booked)) {
          setSelectedSlots(rangeSlots);
        }
      }
    }
  };
  const handleTouchEnd = () => {
    setIsDragging(false);
    setDragStartSlot(null);
  };

  const handleDateChange = (days) => {
    const date = new Date(selectedDate);
    date.setDate(date.getDate() + days);
    setSelectedDate(date.toISOString().split("T")[0]);
    setSelectedSlots([]);
  };

  const copyToClipboard = async (text) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    } catch (err) {
      console.error("Failed to copy text: ", err);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "confirmed":
        return "bg-green-100 text-green-800";
      case "cancelled":
        return "bg-red-100 text-red-800";
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getTotalPrice = () =>
    selectedSlots.length * (court.price_per_slot || 0);
  const today = new Date().toISOString().split("T")[0];
  const showTimeSlots = selectedDate;

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      {/* Steps (Hidden for Admin) */}
      {!isAdmin && (
        <div className="mb-8">
          <div className="flex items-center justify-center gap-4 mb-3">
            <div className="flex flex-col items-center">
              <div className="w-10 h-10 rounded-full bg-slate-800 text-white flex items-center justify-center font-bold">
                1
              </div>
              <span className="text-sm font-bold text-slate-800">
                Select Time
              </span>
            </div>
            <div className="w-20 h-0.5 bg-gray-200"></div>
            <div className="flex flex-col items-center opacity-50">
              <div className="w-10 h-10 rounded-full bg-gray-200 text-gray-500 flex items-center justify-center font-bold">
                2
              </div>
              <span className="text-sm font-bold text-gray-500">Details</span>
            </div>
          </div>
        </div>
      )}

      {currentStep === 1 && (
        <div className="space-y-5">
          {!isAdmin && (
            <h2 className="text-xl font-bold text-slate-800">
              Select Sport, Date & Time
            </h2>
          )}

          <div className="flex flex-col md:flex-row gap-4 justify-between">
            {/* Sport Display (Non-selectable badges) */}
            <div className="flex-1">
              <label className="block text-xs font-bold text-gray-500 uppercase mb-2">
                Available Sports
              </label>
              <div className="flex flex-wrap gap-2">
                {availableSports.map((sport) => (
                  <div
                    key={sport.id}
                    className="flex items-center gap-2 text-xs font-medium text-slate-600 select-none"
                  >
                    {/* The Bullet Dot */}
                    <span className="w-1.5 h-1.5 rounded-full bg-slate-400"></span>
                    {sport.name}
                  </div>
                ))}
              </div>
            </div>

            {/* Date Selector */}
            <div className="flex-shrink-0">
              <label className="block text-xs font-bold text-gray-500 uppercase mb-2">
                Date
              </label>
              <div className="flex items-center bg-gray-50 border border-gray-200 rounded-lg p-1">
                <button
                  onClick={() => handleDateChange(-1)}
                  disabled={!selectedDate}
                  className="p-1 hover:bg-white rounded shadow-sm disabled:opacity-30"
                >
                  <span className="text-lg">←</span>
                </button>
                <input
                  type="date"
                  value={selectedDate}
                  min={today}
                  onChange={(e) => {
                    setSelectedDate(e.target.value);
                    setSelectedSlots([]);
                  }}
                  className="bg-transparent border-none text-sm font-bold text-center w-32 focus:ring-0 cursor-pointer"
                />
                <button
                  onClick={() => handleDateChange(1)}
                  disabled={!selectedDate}
                  className="p-1 hover:bg-white rounded shadow-sm disabled:opacity-30"
                >
                  <span className="text-lg">→</span>
                </button>
              </div>
            </div>
          </div>

          {/* Time Slots */}
          {!showTimeSlots ? (
            <div className="text-center py-12 bg-gray-50 rounded-xl border border-dashed border-gray-300">
              <p className="text-gray-500">Select a date to view schedule</p>
            </div>
          ) : (
            <div>
              <div className="flex justify-between items-end mb-2">
                <label className="block text-xs font-bold text-gray-500 uppercase">
                  Slots ({court.slot_duration_minutes} min)
                </label>
                {isAdmin && (
                  <span className="text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded">
                    View Only Mode
                  </span>
                )}
              </div>

              {loading ? (
                <div className="text-center py-10">
                  <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-gray-200 border-t-slate-800"></div>
                </div>
              ) : (
                <>
                  <div
                    ref={gridRef}
                    className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 lg:grid-cols-8 gap-2 mb-3 select-none"
                    onMouseUp={handleMouseUp}
                    onMouseLeave={handleMouseUp}
                    onTouchEnd={handleTouchEnd}
                  >
                    {slots.map((slot) => {
                      const isSelected = selectedSlots.find(
                        (s) => s.time === slot.time
                      );
                      return (
                        <button
                          key={slot.time}
                          data-slot-time={slot.time}
                          onClick={(e) => handleSlotClick(slot, e)}
                          onMouseDown={(e) => handleMouseDown(slot, e)}
                          onMouseEnter={() => handleMouseEnter(slot)}
                          onTouchStart={(e) => handleTouchStart(slot, e)}
                          disabled={
                            !isAdmin && (slot.booked || slot.unavailable)
                          }
                          className={`p-2 text-xs font-bold rounded-md transition-all select-none relative
                            ${
                              isSelected
                                ? "bg-slate-800 text-white shadow-md"
                                : slot.unavailable
                                ? "bg-orange-50 text-orange-700 border border-orange-200"
                                : slot.booked
                                ? "bg-red-50 text-red-700 border border-red-200 opacity-90"
                                : isAdmin
                                ? "bg-green-50 text-green-700 border border-green-200 cursor-default"
                                : "bg-green-50 text-green-700 hover:bg-green-100 border border-green-200 cursor-pointer"
                            }
                            ${
                              isAdmin && (slot.booked || slot.unavailable)
                                ? "cursor-pointer hover:ring-2 hover:ring-blue-400"
                                : ""
                            }
                          `}
                        >
                          <div className="flex flex-col items-center">
                            <span>{slot.displayTime}</span>
                            <span className="text-[9px] opacity-70">
                              to {slot.displayEndTime}
                            </span>
                          </div>
                          {/* Icons */}
                          {slot.unavailable && (
                            <span className="absolute top-0.5 right-0.5 w-2 h-2 bg-orange-400 rounded-full"></span>
                          )}
                          {slot.booked && (
                            <span className="absolute top-0.5 right-0.5 w-2 h-2 bg-red-400 rounded-full"></span>
                          )}
                        </button>
                      );
                    })}
                  </div>

                  <div className="flex flex-wrap gap-4 text-xs border-t border-gray-100 pt-3">
                    <div className="flex items-center">
                      <div className="w-3 h-3 bg-green-100 border border-green-300 rounded mr-1.5"></div>
                      <span class="text-gray-400">Free</span>
                    </div>
                    <div className="flex items-center">
                      <div className="w-3 h-3 bg-red-100 border border-red-300 rounded mr-1.5"></div>
                      <span class="text-gray-400">Booked</span>
                    </div>
                    <div className="flex items-center">
                      <div className="w-3 h-3 bg-orange-100 border border-orange-300 rounded mr-1.5"></div>
                      <span class="text-gray-400">Unavailable</span>
                    </div>
                    {!isAdmin && (
                      <div className="flex items-center">
                        <div className="w-3 h-3 bg-slate-800 rounded mr-1.5"></div>
                        <span>Selected</span>
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>
          )}

          {!isAdmin && selectedSlots.length > 0 && (
            <div className="bg-slate-50 border border-slate-200 rounded-lg p-4">
              <h3 className="font-bold text-slate-800">Booking Summary</h3>
              <p className="text-sm">Total: LKR {getTotalPrice().toFixed(2)}</p>
              <button
                onClick={() => setCurrentStep(2)}
                className="mt-2 w-full bg-slate-800 text-white py-2 rounded-lg font-bold"
              >
                Continue
              </button>
            </div>
          )}
        </div>
      )}

      {!isAdmin && currentStep === 2 && (
        <div>
          <button onClick={() => setCurrentStep(1)}>Back</button>
          <form>{/* Existing Form Logic */}</form>
        </div>
      )}

      {/* 1. SMALL MODAL (Only for Unavailable/Maintenance slots) */}
      {isAdmin && viewSlot && !showFullDetails && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-sm animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-start mb-4">
              <h3 className="text-lg font-bold text-gray-900">Slot Status</h3>
              <button
                onClick={() => setViewSlot(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4 text-sm">
              <div className="bg-gray-50 p-3 rounded-lg border border-gray-100">
                <p className="text-gray-700 text-xs uppercase font-bold mb-1">
                  Time
                </p>
                <p className="font-medium text-gray-900">
                  {viewSlot.displayRange}
                </p>
              </div>

              {viewSlot.unavailable ? (
                <div className="bg-orange-50 p-3 rounded-lg border border-orange-100">
                  <p className="text-orange-600 text-xs uppercase font-bold mb-1">
                    Status: Unavailable
                  </p>
                  <p className="text-orange-800">
                    {viewSlot.unavailableReason || "Maintenance/Blocked"}
                  </p>
                </div>
              ) : (
                <div className="bg-red-50 p-3 rounded-lg text-red-600">
                  Error: Slot status unknown
                </div>
              )}
            </div>

            <button
              onClick={() => setViewSlot(null)}
              className="mt-6 w-full py-2 bg-gray-100 hover:bg-gray-200 text-gray-800 font-semibold rounded-lg transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* 2. LARGE BOOKING DETAILS POPUP (For Confirmed Bookings) */}
      {isAdmin && showFullDetails && viewSlot?.bookingDetails && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-100/90 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="relative w-full max-w-2xl bg-white rounded-xl shadow-2xl border border-slate-200 my-8 animate-in zoom-in-95 duration-200">
            {/* Close Button Top Right */}
            <button
              onClick={() => {
                setShowFullDetails(false);
                setViewSlot(null);
              }}
              className="absolute top-4 right-4 p-2 bg-slate-100 hover:bg-slate-200 rounded-full text-slate-600 transition-colors z-10"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </button>

            <div className="p-8">
              {/* Header */}
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h2 className="text-2xl font-bold text-slate-900">
                    Booking Details
                  </h2>
                  <p className="text-slate-500 text-sm mt-1">
                    Full information record
                  </p>
                </div>
                <span
                  className={`px-4 py-2 rounded-full text-sm font-bold shadow-sm ${getStatusColor(
                    viewSlot.bookingDetails.status
                  )}`}
                >
                  {viewSlot.bookingDetails.status.charAt(0).toUpperCase() +
                    viewSlot.bookingDetails.status.slice(1)}
                </span>
              </div>

              {/* Reference ID Banner */}
              <div className="bg-slate-50 rounded-lg p-4 border border-slate-200 mb-6 flex justify-between items-center">
                <div>
                  <p className="text-xs text-slate-500 mb-1 font-semibold uppercase">
                    Reference ID
                  </p>
                  <p className="text-2xl font-mono font-bold text-slate-900">
                    {viewSlot.bookingDetails.reference_id}
                  </p>
                </div>
                <button
                  onClick={() =>
                    copyToClipboard(viewSlot.bookingDetails.reference_id)
                  }
                  className="text-slate-400 hover:text-slate-600 p-2"
                >
                  {copySuccess ? (
                    "Copied!"
                  ) : (
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="20"
                      height="20"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <rect
                        x="9"
                        y="9"
                        width="13"
                        height="13"
                        rx="2"
                        ry="2"
                      ></rect>
                      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                    </svg>
                  )}
                </button>
              </div>

              {/* Grid Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Venue Info */}
                <div className="bg-white border border-slate-200 rounded-xl p-5 hover:shadow-md transition-shadow">
                  <h3 className="font-bold text-slate-900 mb-4 flex items-center">
                    <svg
                      className="w-5 h-5 mr-2 text-slate-700"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                      />
                    </svg>
                    Venue Information
                  </h3>
                  <div className="space-y-3 text-sm">
                    <div>
                      <p className="text-slate-500 text-xs font-semibold uppercase">
                        Institution
                      </p>
                      <p className="font-bold text-slate-900">
                        {viewSlot.bookingDetails.institution_name}
                      </p>
                    </div>
                    <div>
                      <p className="text-slate-500 text-xs font-semibold uppercase">
                        Court
                      </p>
                      <p className="font-bold text-slate-900">
                        {viewSlot.bookingDetails.court_name}
                      </p>
                    </div>
                    <div>
                      <p className="text-slate-500 text-xs font-semibold uppercase">
                        Sport
                      </p>
                      <p className="font-bold text-slate-900">
                        {viewSlot.bookingDetails.sport_name || "N/A"}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Schedule */}
                <div className="bg-white border border-slate-200 rounded-xl p-5 hover:shadow-md transition-shadow">
                  <h3 className="font-bold text-slate-900 mb-4 flex items-center">
                    <svg
                      className="w-5 h-5 mr-2 text-slate-700"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                      />
                    </svg>
                    Schedule
                  </h3>
                  <div className="space-y-3 text-sm">
                    <div>
                      <p className="text-slate-500 text-xs font-semibold uppercase">
                        Date
                      </p>
                      <p className="font-bold text-slate-900">
                        {new Date(
                          viewSlot.bookingDetails.booking_date
                        ).toLocaleDateString("en-US", {
                          weekday: "long",
                          month: "long",
                          day: "numeric",
                          year: "numeric",
                        })}
                      </p>
                    </div>
                    <div>
                      <p className="text-slate-500 text-xs font-semibold uppercase">
                        Time
                      </p>
                      <p className="font-bold text-slate-900">
                        {viewSlot.bookingDetails.start_time.substring(0, 5)} -{" "}
                        {viewSlot.bookingDetails.end_time.substring(0, 5)}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Customer Info */}
                <div className="bg-white border border-slate-200 rounded-xl p-5 hover:shadow-md transition-shadow">
                  <h3 className="font-bold text-slate-900 mb-4 flex items-center">
                    <svg
                      className="w-5 h-5 mr-2 text-slate-700"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                      />
                    </svg>
                    Customer Information
                  </h3>
                  <div className="space-y-3 text-sm">
                    <div>
                      <p className="text-slate-500 text-xs font-semibold uppercase">
                        Name
                      </p>
                      <p className="font-bold text-slate-900">
                        {viewSlot.bookingDetails.customer_name}
                      </p>
                    </div>
                    <div>
                      <p className="text-slate-500 text-xs font-semibold uppercase">
                        Phone
                      </p>
                      <p className="font-bold text-slate-900">
                        {viewSlot.bookingDetails.customer_phone}
                      </p>
                    </div>
                    {viewSlot.bookingDetails.customer_email && (
                      <div>
                        <p className="text-slate-500 text-xs font-semibold uppercase">
                          Email
                        </p>
                        <p className="font-bold text-slate-900 break-all">
                          {viewSlot.bookingDetails.customer_email}
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Price */}
                <div className="bg-slate-800 rounded-xl p-5 text-white shadow-lg flex flex-col justify-center">
                  <span className="font-bold text-sm text-slate-300 uppercase mb-1">
                    Total Amount
                  </span>
                  <span className="text-4xl font-bold">
                    LKR{" "}
                    {parseFloat(viewSlot.bookingDetails.total_price).toFixed(2)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
