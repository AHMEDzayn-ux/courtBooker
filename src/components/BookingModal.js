"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

// Phone number formatting helper
function formatPhoneNumber(value) {
  const digits = value.replace(/\D/g, "");
  const limited = digits.slice(0, 10);
  if (limited.length >= 7) {
    return `${limited.slice(0, 3)} ${limited.slice(3, 6)} ${limited.slice(6)}`;
  } else if (limited.length >= 3) {
    return `${limited.slice(0, 3)} ${limited.slice(3)}`;
  }
  return limited;
}

export default function BookingModal({
  court,
  institutionId,
  bookingDate,
  startTime,
  endTime,
  selectedSportId,
  selectedSportName,
  totalPrice,
  onClose,
  onSuccess,
}) {
  const router = useRouter();
  const [formData, setFormData] = useState({
    customerName: "",
    customerPhone: "",
    customerEmail: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState({});

  // Client-side validation
  const validateForm = () => {
    const errors = {};

    // Name validation
    if (!formData.customerName.trim()) {
      errors.customerName = "Name is required";
    } else if (formData.customerName.trim().length < 2) {
      errors.customerName = "Name must be at least 2 characters";
    } else if (!/^[a-zA-Z\s.\-']+$/.test(formData.customerName)) {
      errors.customerName = "Name contains invalid characters";
    }

    // Phone validation (Sri Lankan format)
    const phone = formData.customerPhone.replace(/\s/g, "");
    if (!phone) {
      errors.customerPhone = "Phone number is required";
    } else if (!/^0[0-9]{9}$/.test(phone)) {
      errors.customerPhone = "Enter valid 10-digit number (e.g., 077 123 4567)";
    }

    // Email validation (optional)
    if (
      formData.customerEmail &&
      !/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(
        formData.customerEmail
      )
    ) {
      errors.customerEmail = "Enter a valid email address";
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    console.log("im booking modal");

    if (!validateForm()) {
      return;
    }

    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/bookings", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        // SAFEGUARD: Added court?.id to prevent crashes if court is undefined
        body: JSON.stringify({
          courtId: court?.id,
          institutionId,
          bookingDate,
          startTime,
          endTime,
          sportId: selectedSportId,
          totalPrice,
          customerName: formData.customerName.trim(),
          customerPhone: formData.customerPhone.replace(/\s/g, ""),
          customerEmail: formData.customerEmail.trim() || null,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        // --- RACE CONDITION HANDLING ---
        if (response.status === 409) {
          throw new Error(
            "Slots already booked! Someone just beat you to it. Please close and refresh."
          );
        } else if (response.status === 429) {
          throw new Error(
            "Too many booking attempts. Please wait a few minutes and try again."
          );
        }
        throw new Error(data.error || "Failed to create booking");
      }

      router.push(`/booking/confirmation/${data.referenceId}`);
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  };

  const handlePhoneChange = (e) => {
    const formatted = formatPhoneNumber(e.target.value);
    setFormData({ ...formData, customerPhone: formatted });
    if (fieldErrors.customerPhone) {
      setFieldErrors({ ...fieldErrors, customerPhone: "" });
    }
  };

  // --- SAFE RENDER HELPERS (Prevents 'substring' crash on Register Page) ---
  const displayDate = bookingDate ? new Date(bookingDate).toLocaleDateString() : "N/A";
  const displayStart = (startTime || "")?.substring(0, 5) || "--:--";
  const displayEnd = (endTime || "")?.substring(0, 5) || "--:--";
  const displayPrice = totalPrice ? totalPrice.toFixed(2) : "0.00";

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-md w-full p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-gray-900">Complete Booking</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {/* Booking Summary */}
        <div className="bg-gray-50 rounded-lg p-4 mb-6">
          <h3 className="font-semibold text-gray-900 mb-2">Booking Details</h3>
          <div className="space-y-1 text-sm text-gray-600">
            <p>
              {/* SAFEGUARD: court?.name */}
              <span className="font-medium">Court:</span> {court?.name || "N/A"}
            </p>
            <p>
              <span className="font-medium">Sport:</span> {selectedSportName || "N/A"}
            </p>
            <p>
              <span className="font-medium">Date:</span> {displayDate}
            </p>
            <p>
              <span className="font-medium">Time:</span>{" "}
              {displayStart} - {displayEnd}
            </p>
          </div>
          <div className="mt-3 pt-3 border-t">
            <p className="text-lg font-bold text-green-600">
              Total: LKR {displayPrice}
            </p>
          </div>
        </div>

        {/* Booking Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label
              htmlFor="customerName"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Full Name *
            </label>
            <input
              type="text"
              id="customerName"
              required
              maxLength={100}
              value={formData.customerName}
              onChange={(e) => {
                setFormData({ ...formData, customerName: e.target.value });
                if (fieldErrors.customerName)
                  setFieldErrors({ ...fieldErrors, customerName: "" });
              }}
              className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                fieldErrors.customerName
                  ? "border-red-500"
                  : "border-gray-300"
              }`}
              placeholder="Enter your name"
            />
            {fieldErrors.customerName && (
              <p className="text-red-500 text-xs mt-1">
                {fieldErrors.customerName}
              </p>
            )}
          </div>

          <div>
            <label
              htmlFor="customerPhone"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Phone Number *
            </label>
            <input
              type="tel"
              id="customerPhone"
              required
              value={formData.customerPhone}
              onChange={handlePhoneChange}
              className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                fieldErrors.customerPhone
                  ? "border-red-500"
                  : "border-gray-300"
              }`}
              placeholder="077 123 4567"
            />
            {fieldErrors.customerPhone && (
              <p className="text-red-500 text-xs mt-1">
                {fieldErrors.customerPhone}
              </p>
            )}
          </div>

          <div>
            <label
              htmlFor="customerEmail"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Email (Optional)
            </label>
            <input
              type="email"
              id="customerEmail"
              value={formData.customerEmail}
              onChange={(e) => {
                setFormData({ ...formData, customerEmail: e.target.value });
                if (fieldErrors.customerEmail)
                  setFieldErrors({ ...fieldErrors, customerEmail: "" });
              }}
              className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                fieldErrors.customerEmail
                  ? "border-red-500"
                  : "border-gray-300"
              }`}
              placeholder="Enter your email"
            />
            {fieldErrors.customerEmail && (
              <p className="text-red-500 text-xs mt-1">
                {fieldErrors.customerEmail}
              </p>
            )}
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg text-sm flex items-start gap-2">
              <svg
                className="w-5 h-5 flex-shrink-0 mt-0.5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <span className="font-semibold">{error}</span>
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg font-medium text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "Processing..." : "Confirm Booking"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}