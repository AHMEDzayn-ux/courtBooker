"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import DownloadReceiptButton from "@/components/DownloadReceiptButton";

export default function BookingConfirmationPage() {
  const params = useParams();
  const router = useRouter();
  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const fetchBooking = async () => {
      const supabase = createClient();

      const { data, error } = await supabase
        .from("bookings")
        .select(
          `
          *,
          sports (
            name
          ),
          courts (
            name,
            institutions (
              name,
              contact_number,
              address
            )
          )
        `
        )
        .eq("bookings.reference_id", params.referenceId)
        .single();

      if (error || !data) {
        router.push("/");
        return;
      }

      setBooking(data);
      setLoading(false);
    };

    fetchBooking();
  }, [params.referenceId, router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!booking) return null;

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-lg max-w-2xl w-full p-8">
        {/* Success Icon */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4">
            <svg
              className="w-8 h-8 text-green-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-slate-900 mb-2">
            Booking Confirmed!
          </h1>
          <p className="text-slate-600">
            You will receive a confirmation SMS shortly
          </p>
        </div>

        {/* Reference ID */}
        <div className="bg-slate-200 border-2 border-slate-300 rounded-lg p-6 mb-6">
          <p className="text-sm text-slate-700 font-medium mb-1">
            Your Booking Reference
          </p>
          <div className="flex items-center justify-between gap-4">
            <p className="text-3xl font-bold text-slate-800 tracking-wider">
              {booking.reference_id}
            </p>
            <button
              onClick={() => {
                navigator.clipboard.writeText(booking.reference_id);
                setCopied(true);
                setTimeout(() => setCopied(false), 2000);
              }}
              className="flex items-center justify-center bg-slate-700 text-white p-2.5 rounded-lg hover:bg-slate-800 transition-colors"
              title={copied ? "Copied!" : "Copy to clipboard"}
            >
              {copied ? (
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              ) : (
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                  />
                </svg>
              )}
            </button>
          </div>
          <p className="text-sm text-slate-600 mt-2">
            Save this reference ID to track your booking
          </p>
        </div>

        {/* Booking Details */}
        <div className="space-y-4 mb-6">
          <h2 className="text-lg font-semibold text-slate-900 border-b pb-2">
            Booking Details
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-slate-600">Institution</p>
              <p className="font-medium text-slate-900">
                {booking.courts.institutions.name}
              </p>
            </div>
            <div>
              <p className="text-sm text-slate-600">Court</p>
              <p className="font-medium text-slate-900">
                {booking.courts.name}
              </p>
            </div>
            <div>
              <p className="text-sm text-slate-600">Sport</p>
              <p className="font-medium text-slate-900">
                {booking.sports?.name || "N/A"}
              </p>
            </div>
            <div>
              <p className="text-sm text-slate-600">Date</p>
              <p className="font-medium text-slate-900">
                {new Date(booking.booking_date).toLocaleDateString("en-US", {
                  weekday: "long",
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </p>
            </div>
            <div>
              <p className="text-sm text-slate-600">Time</p>
              <p className="font-medium text-slate-900">
                {booking.start_time.substring(0, 5)} -{" "}
                {booking.end_time.substring(0, 5)}
              </p>
            </div>
            <div>
              <p className="text-sm text-slate-600">Total Amount</p>
              <p className="font-medium text-green-600 text-lg">
                LKR {booking.total_price?.toFixed(2) || "0.00"}
              </p>
            </div>
            <div>
              <p className="text-sm text-slate-600">Customer Name</p>
              <p className="font-medium text-slate-900">
                {booking.customer_name}
              </p>
            </div>
            <div>
              <p className="text-sm text-slate-600">Phone Number</p>
              <p className="font-medium text-slate-900">
                {booking.customer_phone}
              </p>
            </div>
          </div>
        </div>

        {/* Venue Contact */}
        <div className="bg-gray-50 rounded-lg p-4 mb-6">
          <h3 className="font-semibold text-slate-900 mb-2">Venue Contact</h3>
          <p className="text-sm text-gray-600">
            {booking.courts.institutions.address}
          </p>
          <p className="text-sm text-gray-600 mt-1">
            Phone: {booking.courts.institutions.contact_number}
          </p>
        </div>

        {/* Important Note */}
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
          <h3 className="font-semibold text-yellow-900 mb-1">Important</h3>
          <ul className="text-sm text-yellow-800 space-y-1">
            <li>• Please arrive 10 minutes before your booking time</li>
            <li>• Bring your reference ID for verification</li>
            <li>• Contact the venue if you need to cancel or reschedule</li>
          </ul>
        </div>

        {/* Actions */}
        <div className="flex flex-col gap-3 ">
          <DownloadReceiptButton booking={booking} />

          <div className="flex flex-col sm:flex-row gap-3">
            <Link
              href="/"
              className="flex-1 text-center border border-gray-300 px-6 py-3 rounded-lg font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Back to Home
            </Link>
            <Link
              href="/track-booking"
              className="flex-1 text-center border border-gray-300 px-6 py-3 rounded-lg font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Track Booking
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
