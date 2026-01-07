"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

export default function BookingSteps({
  court,
  institutionId,
  availableSports,
}) {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);
  const [selectedSport, setSelectedSport] = useState(
    availableSports.length === 1 ? availableSports[0]?.id : null
  );
  const [selectedDate, setSelectedDate] = useState("");
  const [slots, setSlots] = useState([]);
  const [selectedSlots, setSelectedSlots] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStartSlot, setDragStartSlot] = useState(null);
  const [formData, setFormData] = useState({
    customerName: "",
    customerPhone: "",
    customerEmail: "",
  });
  const [error, setError] = useState("");

  useEffect(() => {
    if (currentStep === 1 && selectedSport && selectedDate) {
      generateSlots();
      fetchBookings();
    }
  }, [selectedDate, court.id, selectedSport, currentStep]);

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
        booked: false,
      });

      currentTime += court.slot_duration_minutes;
    }

    setSlots(slots);
  };

  const fetchBookings = async () => {
    setLoading(true);
    const supabase = createClient();

    console.log("Fetching bookings for:", {
      court_id: court.id,
      booking_date: selectedDate,
      court_name: court.name,
    });

    const { data: bookings, error } = await supabase
      .from("bookings")
      .select("start_time, end_time, customer_name")
      .eq("court_id", court.id)
      .eq("booking_date", selectedDate)
      .eq("status", "confirmed");

    console.log("Fetched bookings:", bookings, "Error:", error);

    if (bookings && bookings.length > 0) {
      console.log("Marking slots as booked...");
      setSlots((prevSlots) =>
        prevSlots.map((slot) => {
          const isBooked = bookings.some((booking) => {
            const matches =
              slot.time >= booking.start_time && slot.time < booking.end_time;
            if (matches) {
              console.log(
                `Slot ${slot.time} is booked by booking ${booking.start_time}-${booking.end_time}`
              );
            }
            return matches;
          });
          return {
            ...slot,
            available: !isBooked,
            booked: isBooked,
          };
        })
      );
    } else {
      console.log("No bookings found - all slots available");
    }

    setLoading(false);
  };

  const handleSlotClick = (slot) => {
    if (slot.booked) return;

    const slotIndex = slots.findIndex((s) => s.time === slot.time);
    const isSelected = selectedSlots.some((s) => s.time === slot.time);

    if (isSelected) {
      // Deselect - only allow if it's at the start or end
      const selectedIndices = selectedSlots.map((s) =>
        slots.findIndex((sl) => sl.time === s.time)
      );
      const minIndex = Math.min(...selectedIndices);
      const maxIndex = Math.max(...selectedIndices);

      if (slotIndex === minIndex || slotIndex === maxIndex) {
        setSelectedSlots(selectedSlots.filter((s) => s.time !== slot.time));
      }
    } else {
      // Select - check if continuous
      if (selectedSlots.length === 0) {
        setSelectedSlots([slot]);
      } else {
        const selectedIndices = selectedSlots.map((s) =>
          slots.findIndex((sl) => sl.time === s.time)
        );
        const minIndex = Math.min(...selectedIndices);
        const maxIndex = Math.max(...selectedIndices);

        // Only allow if adjacent to current selection
        if (slotIndex === minIndex - 1 || slotIndex === maxIndex + 1) {
          // Check if all slots in between are available
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
        }
      }
    }
  };

  const handleDateChange = (days) => {
    const date = new Date(selectedDate);
    date.setDate(date.getDate() + days);
    setSelectedDate(date.toISOString().split("T")[0]);
    setSelectedSlots([]);
  };

  const handleMouseDown = (slot) => {
    if (slot.booked) return;
    setIsDragging(true);
    setDragStartSlot(slot);
    setSelectedSlots([slot]);
  };

  const handleMouseEnter = (slot) => {
    if (!isDragging || slot.booked) return;

    if (!dragStartSlot) return;

    const currentSlotIndex = slots.findIndex((s) => s.time === slot.time);
    const startSlotIndex = slots.findIndex(
      (s) => s.time === dragStartSlot.time
    );

    const start = Math.min(currentSlotIndex, startSlotIndex);
    const end = Math.max(currentSlotIndex, startSlotIndex);

    // Check if all slots in the range are available
    const rangeSlots = slots.slice(start, end + 1);
    const allAvailable = rangeSlots.every((s) => !s.booked);

    if (allAvailable) {
      setSelectedSlots(rangeSlots);
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
    setDragStartSlot(null);
  };

  const getTotalDuration = () => {
    return selectedSlots.length * court.slot_duration_minutes;
  };

  const getTotalPrice = () => {
    return selectedSlots.length * (court.price_per_slot || 0);
  };

  const getStartTime = () => {
    return selectedSlots[0]?.time || "";
  };

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

  const handleNextStep = () => {
    if (currentStep === 1 && selectedSlots.length > 0) {
      setCurrentStep(2);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/bookings", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          courtId: court.id,
          institutionId,
          bookingDate: selectedDate,
          startTime: getStartTime(),
          endTime: getEndTime(),
          sportId: selectedSport,
          totalPrice: getTotalPrice(),
          ...formData,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to create booking");
      }

      router.push(`/booking/confirmation/${data.referenceId}`);
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  };

  const today = new Date().toISOString().split("T")[0];
  const sportName = availableSports.find((s) => s.id === selectedSport)?.name;
  const showTimeSlots = selectedSport && selectedDate;

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      {/* Progress Steps - Two Row Layout */}
      <div className="mb-8">
        {/* Top Row - Step Labels and Numbers */}
        <div className="flex items-center justify-center gap-4 mb-3">
          <div
            className={`flex flex-col items-center transition-all ${
              currentStep >= 1 ? "opacity-100" : "opacity-50"
            }`}
          >
            <div
              className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-base mb-2 transition-all ${
                currentStep >= 1
                  ? "bg-slate-800 text-white shadow-md"
                  : "bg-gray-200 text-gray-500"
              }`}
            >
              1
            </div>
            <span
              className={`text-sm font-semibold ${
                currentStep >= 1 ? "text-slate-800" : "text-gray-500"
              }`}
            >
              Select Time
            </span>
          </div>

          <div className="flex-1 max-w-[100px]">
            <div className="h-0.5 bg-gray-200 rounded-full overflow-hidden">
              <div
                className={`h-full bg-slate-800 transition-all duration-500 ${
                  currentStep >= 2 ? "w-full" : "w-0"
                }`}
              ></div>
            </div>
          </div>

          <div
            className={`flex flex-col items-center transition-all ${
              currentStep >= 2 ? "opacity-100" : "opacity-50"
            }`}
          >
            <div
              className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-base mb-2 transition-all ${
                currentStep >= 2
                  ? "bg-slate-800 text-white shadow-md"
                  : "bg-gray-200 text-gray-500"
              }`}
            >
              2
            </div>
            <span
              className={`text-sm font-semibold ${
                currentStep >= 2 ? "text-slate-800" : "text-gray-500"
              }`}
            >
              Your Details
            </span>
          </div>
        </div>
      </div>

      {/* Step 1: Time Selection */}
      {currentStep === 1 && (
        <div className="space-y-5">
          <h2 className="text-xl font-bold text-slate-800">
            Select Sport, Date & Time
          </h2>

          {/* Sport Selector */}
          <div>
            <label className="block text-sm font-semibold text-slate-800 mb-2">
              Select Sport <span className="text-red-500">*</span>
            </label>
            <div className="flex flex-wrap gap-2">
              {availableSports.map((sport) => (
                <button
                  key={sport.id}
                  onClick={() => {
                    setSelectedSport(sport.id);
                    setSelectedSlots([]);
                  }}
                  className={`px-4 py-2 rounded-lg font-semibold text-sm transition-all ${
                    selectedSport === sport.id
                      ? "bg-slate-800 text-white shadow-md"
                      : "bg-gray-100 text-slate-800 hover:bg-gray-200 border border-gray-300"
                  }`}
                >
                  {sport.name}
                </button>
              ))}
            </div>
          </div>

          {/* Date Selector */}
          <div>
            <label className="block text-sm font-semibold text-slate-800 mb-2">
              Select Date <span className="text-red-500">*</span>
            </label>
            <div className="flex items-center justify-between bg-white border border-gray-300 rounded-lg p-3 hover:border-gray-400 transition-colors">
              <button
                onClick={() => handleDateChange(-1)}
                disabled={!selectedDate || selectedDate <= today}
                className="p-1.5 hover:bg-gray-100 rounded-md disabled:opacity-30 disabled:cursor-not-allowed transition-all"
              >
                <svg
                  className="w-5 h-5 text-slate-800"
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

              <div className="text-center flex-1">
                <input
                  type="date"
                  value={selectedDate}
                  min={today}
                  onChange={(e) => {
                    setSelectedDate(e.target.value);
                    setSelectedSlots([]);
                  }}
                  className="text-base font-bold border-none bg-transparent cursor-pointer text-slate-800 text-center w-auto"
                />
                {selectedDate && (
                  <p className="text-xs text-gray-500 mt-0.5">
                    {new Date(selectedDate).toLocaleDateString("en-US", {
                      weekday: "short",
                      month: "short",
                      day: "numeric",
                    })}
                  </p>
                )}
              </div>

              <button
                onClick={() => handleDateChange(1)}
                disabled={!selectedDate}
                className="p-1.5 hover:bg-gray-100 rounded-md disabled:opacity-30 disabled:cursor-not-allowed transition-all"
              >
                <svg
                  className="w-5 h-5 text-slate-800"
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

          {/* Time Slots */}
          {!showTimeSlots ? (
            <div className="text-center py-10 bg-gray-50 rounded-lg border border-gray-200">
              <svg
                className="w-12 h-12 mx-auto text-gray-400 mb-3"
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
              <p className="text-gray-600 text-sm font-medium">
                Please select a sport and date to view available time slots
              </p>
            </div>
          ) : (
            <div>
              <label className="block text-sm font-semibold text-slate-800 mb-2">
                Select Time Slots <span className="text-red-500">*</span>{" "}
                <span className="text-xs text-gray-500 font-normal">
                  (Click or drag consecutive slots)
                </span>
              </label>
              {loading ? (
                <div className="text-center py-10">
                  <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-gray-200 border-t-slate-800"></div>
                  <p className="text-gray-600 text-sm mt-2">
                    Loading available slots...
                  </p>
                </div>
              ) : (
                <>
                  <div
                    className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 lg:grid-cols-8 gap-2 mb-3"
                    onMouseUp={handleMouseUp}
                    onMouseLeave={handleMouseUp}
                  >
                    {slots.map((slot) => (
                      <button
                        key={slot.time}
                        onClick={() => handleSlotClick(slot)}
                        onMouseDown={() => handleMouseDown(slot)}
                        onMouseEnter={() => handleMouseEnter(slot)}
                        disabled={slot.booked}
                        className={`p-2 text-xs font-bold rounded-md transition-all select-none ${
                          selectedSlots.find((s) => s.time === slot.time)
                            ? "bg-slate-800 text-white shadow-md"
                            : slot.booked
                            ? "bg-red-50 text-red-600 cursor-not-allowed  opacity-60 border border-red-200"
                            : "bg-green-50 text-green-700 hover:bg-green-100 border border-green-300 hover:shadow-sm"
                        }`}
                      >
                        {slot.displayTime}
                      </button>
                    ))}
                  </div>

                  {/* Legend */}
                  <div className="flex flex-wrap gap-3 text-xs mb-3">
                    <div className="flex items-center">
                      <div className="w-3 h-3 bg-green-50 border border-green-300 rounded mr-1.5"></div>
                      <span className="text-slate-800 font-medium">
                        Available
                      </span>
                    </div>
                    <div className="flex items-center">
                      <div className="w-3 h-3 bg-slate-800 rounded mr-1.5"></div>
                      <span className="text-slate-800 font-medium">
                        Selected
                      </span>
                    </div>
                    <div className="flex items-center">
                      <div className="w-3 h-3 bg-red-50 border border-red-200 rounded mr-1.5"></div>
                      <span className="text-slate-800 font-medium">Unavailable</span>
                    </div>
                  </div>
                </>
              )}
            </div>
          )}

          {/* Selection Summary - Only show when not dragging */}
          {selectedSlots.length > 0 && !isDragging && (
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 shadow-sm">
              <h3 className="font-bold text-slate-800 mb-2 text-base">
                Selected Time
              </h3>
              <div className="text-sm text-slate-800 space-y-1.5">
                <p>
                  <span className="font-semibold">Sport:</span> {sportName}
                </p>
                <p>
                  <span className="font-semibold">Date:</span>{" "}
                  {new Date(selectedDate).toLocaleDateString()}
                </p>
                <p>
                  <span className="font-semibold">Time:</span>{" "}
                  {selectedSlots[0].displayTime} -{" "}
                  {getEndTime().substring(0, 5)}
                </p>
                <p>
                  <span className="font-semibold">Duration:</span>{" "}
                  {getTotalDuration()} minutes ({selectedSlots.length} slot
                  {selectedSlots.length > 1 ? "s" : ""})
                </p>
                <p className="text-xl font-bold text-slate-800 pt-2">
                  Total: LKR {getTotalPrice().toFixed(2)}
                </p>
              </div>
              <button
                onClick={handleNextStep}
                className="mt-3 w-full bg-slate-800 text-white px-5 py-2.5 rounded-lg font-bold hover:bg-slate-900 transition-all shadow-md"
              >
                Continue to Details →
              </button>
            </div>
          )}
        </div>
      )}

      {/* Step 2: Customer Details */}
      {currentStep === 2 && (
        <div className="space-y-5">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-slate-800">
              Enter Your Details
            </h2>
            <button
              onClick={() => setCurrentStep(1)}
              className="text-slate-800 hover:text-slate-800 text-sm font-semibold flex items-center gap-1"
            >
              <svg
                className="w-4 h-4"
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
              Back to Time Selection
            </button>
          </div>

          {/* Booking Summary */}
          <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
            <h3 className="font-bold text-slate-800 mb-2 text-base">
              Booking Summary
            </h3>
            <div className="text-sm text-slate-800 space-y-1.5">
              <p>
                <span className="font-semibold">Court:</span> {court.name}
              </p>
              <p>
                <span className="font-semibold">Sport:</span> {sportName}
              </p>
              <p>
                <span className="font-semibold">Date:</span>{" "}
                {new Date(selectedDate).toLocaleDateString()}
              </p>
              <p>
                <span className="font-semibold">Time:</span>{" "}
                {selectedSlots[0].displayTime} - {getEndTime().substring(0, 5)}
              </p>
              <p>
                <span className="font-semibold">Duration:</span>{" "}
                {getTotalDuration()} minutes
              </p>
            </div>
            <div className="mt-3 pt-3 border-t border-gray-300">
              <p className="text-xl font-bold text-slate-800">
                Total: LKR {getTotalPrice().toFixed(2)}
              </p>
            </div>
          </div>

          {/* Customer Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label
                htmlFor="customerName"
                className="block text-sm font-semibold text-slate-800 mb-1.5"
              >
                Full Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="customerName"
                required
                value={formData.customerName}
                onChange={(e) =>
                  setFormData({ ...formData, customerName: e.target.value })
                }
                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-slate-800 focus:border-slate-800 transition-all text-sm"
                placeholder="Enter your name"
              />
            </div>

            <div>
              <label
                htmlFor="customerPhone"
                className="block text-sm font-semibold text-slate-800 mb-1.5"
              >
                Phone Number <span className="text-red-500">*</span>
              </label>
              <input
                type="tel"
                id="customerPhone"
                required
                value={formData.customerPhone}
                onChange={(e) =>
                  setFormData({ ...formData, customerPhone: e.target.value })
                }
                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-slate-800 focus:border-slate-800 transition-all text-sm"
                placeholder="Enter your phone number"
              />
            </div>

            <div>
              <label
                htmlFor="customerEmail"
                className="block text-sm font-semibold text-slate-800 mb-1.5"
              >
                Email (Optional)
              </label>
              <input
                type="email"
                id="customerEmail"
                value={formData.customerEmail}
                onChange={(e) =>
                  setFormData({ ...formData, customerEmail: e.target.value })
                }
                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-slate-800 focus:border-slate-800 transition-all text-sm"
                placeholder="Enter your email"
              />
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-3 py-2.5 rounded-lg text-sm font-medium">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-slate-800 text-white px-5 py-2.5 rounded-lg font-bold hover:bg-slate-900 transition-all shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "Processing..." : "Confirm Booking"}
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
