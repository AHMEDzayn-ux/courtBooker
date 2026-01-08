"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";

export default function BlockSlotsModal({ court, onClose, onSuccess }) {
  const [mode, setMode] = useState("block"); // "block" or "unblock"
  const [selectedDate, setSelectedDate] = useState("");
  const [slots, setSlots] = useState([]);
  const [selectedSlots, setSelectedSlots] = useState([]);
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStartSlot, setDragStartSlot] = useState(null);
  const [fetchingSlots, setFetchingSlots] = useState(false);

  useEffect(() => {
    if (selectedDate && court) {
      generateSlots();
      fetchExistingBlocksAndBookings();
    }
  }, [selectedDate, court]);

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
        blocked: false,
        blockId: null,
        blockReason: null,
      });

      currentTime += court.slot_duration_minutes;
    }

    setSlots(slots);
  };

  const fetchExistingBlocksAndBookings = async () => {
    setFetchingSlots(true);
    const supabase = createClient();

    const { data: bookings } = await supabase
      .from("bookings")
      .select("start_time, end_time")
      .eq("court_id", court.id)
      .eq("booking_date", selectedDate)
      .eq("status", "confirmed");

    const { data: blocks } = await supabase
      .from("court_unavailability")
      .select("id, start_time, end_time, reason")
      .eq("court_id", court.id)
      .eq("unavailable_date", selectedDate);

    setSlots((prevSlots) =>
      prevSlots.map((slot) => {
        const isBooked = bookings?.some(
          (booking) =>
            slot.time >= booking.start_time && slot.time < booking.end_time
        );
        const blockMatch = blocks?.find(
          (block) => slot.time >= block.start_time && slot.time < block.end_time
        );
        return {
          ...slot,
          available: !isBooked && !blockMatch,
          booked: isBooked,
          blocked: !!blockMatch,
          blockId: blockMatch?.id || null,
          blockReason: blockMatch?.reason || null,
        };
      })
    );
    setFetchingSlots(false);
  };

  const handleSlotClick = (slot) => {
    if (mode === "block" && (slot.booked || slot.blocked)) return;
    if (mode === "unblock" && !slot.blocked) return;

    if (mode === "unblock") {
      const blockId = slot.blockId;
      const allSlotsInBlock = slots.filter((s) => s.blockId === blockId);
      const isBlockSelected = allSlotsInBlock.every((s) =>
        selectedSlots.some((sel) => sel.time === s.time)
      );

      if (isBlockSelected) {
        setSelectedSlots(selectedSlots.filter((s) => s.blockId !== blockId));
      } else {
        const newSelection = [...selectedSlots];
        allSlotsInBlock.forEach((s) => {
          if (!newSelection.some((sel) => sel.time === s.time)) {
            newSelection.push(s);
          }
        });
        setSelectedSlots(
          newSelection.sort((a, b) => a.time.localeCompare(b.time))
        );
      }
      return;
    }

    // Block logic
    const slotIndex = slots.findIndex((s) => s.time === slot.time);
    const isSelected = selectedSlots.some((s) => s.time === slot.time);

    if (isSelected) {
      // Logic to deselect ends
      const selectedIndices = selectedSlots.map((s) =>
        slots.findIndex((sl) => sl.time === s.time)
      );
      const minIndex = Math.min(...selectedIndices);
      const maxIndex = Math.max(...selectedIndices);
      if (slotIndex === minIndex || slotIndex === maxIndex) {
        setSelectedSlots(selectedSlots.filter((s) => s.time !== slot.time));
      }
    } else {
      // Logic to select contiguous
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
            .every((s) => !s.booked && !s.blocked);
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

  const handleMouseDown = (slot) => {
    if (mode === "block" && (slot.booked || slot.blocked)) return;
    if (mode === "unblock" && !slot.blocked) return;
    if (mode === "unblock") {
      handleSlotClick(slot);
      return;
    }
    setIsDragging(true);
    setDragStartSlot(slot);
    setSelectedSlots([slot]);
  };

  const handleMouseEnter = (slot) => {
    if (!isDragging) return;
    if (mode === "unblock") return;
    if (mode === "block" && (slot.booked || slot.blocked)) return;
    if (!dragStartSlot) return;

    const currentSlotIndex = slots.findIndex((s) => s.time === slot.time);
    const startSlotIndex = slots.findIndex(
      (s) => s.time === dragStartSlot.time
    );

    const start = Math.min(currentSlotIndex, startSlotIndex);
    const end = Math.max(currentSlotIndex, startSlotIndex);

    const rangeSlots = slots.slice(start, end + 1);
    const allAvailable = rangeSlots.every((s) => !s.booked && !s.blocked);

    if (allAvailable) {
      setSelectedSlots(rangeSlots);
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
    setDragStartSlot(null);
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

  const handleBlockSlots = async () => {
    if (selectedSlots.length === 0 || !reason.trim()) {
      alert("Please select time slots and provide a reason");
      return;
    }
    setLoading(true);
    const supabase = createClient();
    const startTime = selectedSlots[0].time;
    const endTime = getEndTime();
    const { error } = await supabase.from("court_unavailability").insert({
      court_id: court.id,
      unavailable_date: selectedDate,
      start_time: startTime,
      end_time: endTime,
      reason: reason.trim(),
    });
    setLoading(false);
    if (error) {
      alert("Failed: " + error.message);
    } else {
      onSuccess?.();
    }
  };

  const handleUnblockSlots = async () => {
    if (selectedSlots.length === 0) {
      alert("Select slots to unblock");
      return;
    }
    setLoading(true);
    const supabase = createClient();
    const blockIds = [
      ...new Set(selectedSlots.map((s) => s.blockId).filter(Boolean)),
    ];
    const { error } = await supabase
      .from("court_unavailability")
      .delete()
      .in("id", blockIds);
    setLoading(false);
    if (error) {
      alert("Failed: " + error.message);
    } else {
      onSuccess?.();
    }
  };

  const today = new Date().toISOString().split("T")[0];

  // Theme Constants
  const isBlockMode = mode === "block";
  const activeThemeClass = isBlockMode
    ? "bg-amber-600 hover:bg-amber-700 text-white"
    : "bg-emerald-600 hover:bg-emerald-700 text-white";
  
  const accentTextClass = isBlockMode ? "text-amber-700" : "text-emerald-700";
  const accentBgClass = isBlockMode ? "bg-amber-50" : "bg-emerald-50";

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto shadow-2xl flex flex-col">
        
        {/* Compact Header */}
        <div className="flex-shrink-0 border-b border-gray-100 p-5 bg-white sticky top-0 z-20">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h2 className="text-lg font-bold text-gray-900">Manage Availability</h2>
              <p className="text-xs text-gray-500">{court.name}</p>
            </div>
            
            {/* Mode Switcher */}
            <div className="bg-gray-100 p-1 rounded-lg flex text-xs font-medium">
              <button
                onClick={() => {
                  setMode("block");
                  setSelectedSlots([]);
                  setReason("");
                }}
                className={`px-4 py-1.5 rounded-md transition-all ${
                  isBlockMode
                    ? "bg-white text-amber-700 shadow-sm font-semibold"
                    : "text-gray-500 hover:text-gray-900"
                }`}
              >
                Block
              </button>
              <button
                onClick={() => {
                  setMode("unblock");
                  setSelectedSlots([]);
                  setReason("");
                }}
                className={`px-4 py-1.5 rounded-md transition-all ${
                  !isBlockMode
                    ? "bg-white text-emerald-700 shadow-sm font-semibold"
                    : "text-gray-500 hover:text-gray-900"
                }`}
              >
                Unblock
              </button>
            </div>
            
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 p-1.5 hover:bg-gray-50 rounded-lg ml-2"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Ultra Compact Info Strip */}
          <div className={`px-3 py-2 rounded-md text-xs font-medium flex items-center gap-2 ${accentBgClass} ${accentTextClass}`}>
             <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
             </svg>
             <span>
               {isBlockMode 
                 ? "Select consecutive time slots below to restrict access." 
                 : "Select previously blocked slots to restore availability."}
             </span>
          </div>
        </div>

        {/* Content */}
        <div className="p-5 space-y-5 flex-1 overflow-y-auto">
          {/* Date Picker */}
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
              Target Date
            </label>
            <input
              type="date"
              value={selectedDate}
              min={today}
              onChange={(e) => {
                setSelectedDate(e.target.value);
                setSelectedSlots([]);
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-gray-900 focus:border-transparent outline-none transition-all"
            />
          </div>

          {/* Slots Grid */}
          {selectedDate && (
            <div className="space-y-2">
              <div className="flex justify-between items-end mb-2">
                 <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider">
                    Time Slots
                </label>
                {selectedSlots.length > 0 && (
                    <span className={`text-xs font-semibold ${accentTextClass}`}>
                        {selectedSlots.length} slot{selectedSlots.length > 1 ? 's' : ''} selected
                    </span>
                )}
              </div>
              
              {fetchingSlots ? (
                <div className="flex justify-center items-center py-10 bg-gray-50 rounded-lg border border-dashed border-gray-200">
                  <div className="w-5 h-5 border-2 border-gray-900 border-t-transparent rounded-full animate-spin"></div>
                </div>
              ) : (
                <div
                  className="grid grid-cols-4 sm:grid-cols-6 gap-2 select-none"
                  onMouseUp={handleMouseUp}
                  onMouseLeave={handleMouseUp}
                >
                  {slots.map((slot) => {
                    const isSelected = selectedSlots.find((s) => s.time === slot.time);
                    
                    let baseStyles = "py-2 text-xs font-medium rounded border transition-all text-center cursor-pointer ";
                    
                    if (isBlockMode) {
                        // BLOCK MODE STYLES (Amber/Orange Theme)
                        if (isSelected) {
                            baseStyles += "bg-amber-600 text-white border-amber-600 shadow-sm ";
                        } else if (slot.booked) {
                            baseStyles += "bg-gray-50 text-gray-300 border-gray-100 cursor-not-allowed line-through decoration-gray-300 ";
                        } else if (slot.blocked) {
                            baseStyles += "bg-amber-50 text-amber-400 border-amber-100 cursor-not-allowed ";
                        } else {
                            // Available to block
                            baseStyles += "bg-white text-gray-700 border-gray-200 hover:border-amber-400 hover:text-amber-700 ";
                        }
                    } else {
                        // UNBLOCK MODE STYLES (Green/Emerald Theme)
                        if (isSelected) {
                            baseStyles += "bg-emerald-600 text-white border-emerald-600 shadow-sm ";
                        } else if (slot.blocked) {
                            // Target for unblocking
                            baseStyles += "bg-amber-50 text-amber-700 border-amber-200 hover:bg-emerald-50 hover:border-emerald-300 hover:text-emerald-700 ";
                        } else {
                            // Irrelevant slots
                            baseStyles += "bg-gray-50 text-gray-300 border-gray-100 cursor-not-allowed opacity-50 ";
                        }
                    }

                    return (
                      <div
                        key={slot.time}
                        onMouseDown={() => handleMouseDown(slot)}
                        onMouseEnter={() => handleMouseEnter(slot)}
                        onClick={() => handleSlotClick(slot)}
                        className={baseStyles}
                      >
                        {slot.displayTime}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* Reason Input (Block Mode Only) */}
          {isBlockMode && selectedSlots.length > 0 && (
            <div className="animate-fadeIn">
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
                Reason for Blocking
              </label>
              <textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="e.g. Maintenance, Private Event..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-amber-500 focus:border-transparent outline-none resize-none"
                rows="2"
              />
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="border-t border-gray-100 p-5 bg-gray-50 flex gap-3 rounded-b-xl">
           <button
            onClick={onClose}
            className="flex-1 px-4 py-2.5 bg-white border border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-50 transition-colors text-sm"
          >
            Cancel
          </button>
          <button
            onClick={isBlockMode ? handleBlockSlots : handleUnblockSlots}
            disabled={loading || selectedSlots.length === 0 || (isBlockMode && !reason.trim())}
            className={`flex-1 px-4 py-2.5 font-semibold rounded-lg transition-colors text-sm disabled:opacity-50 disabled:cursor-not-allowed shadow-sm ${activeThemeClass}`}
          >
            {loading ? "Processing..." : isBlockMode ? "Confirm Block" : "Confirm Unblock"}
          </button>
        </div>
      </div>
    </div>
  );
}