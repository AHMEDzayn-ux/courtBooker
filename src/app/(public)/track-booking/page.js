"use client";



import { useState } from "react";

import { createClient } from "@/lib/supabase/client";

import { motion } from "framer-motion";

import Link from "next/link";



export default function TrackBookingPage() {

  const [referenceId, setReferenceId] = useState("");

  const [phone, setPhone] = useState("");

  const [bookings, setBookings] = useState([]);

  const [loading, setLoading] = useState(false);

  const [error, setError] = useState("");



  const handleSearch = async (e) => {

    e.preventDefault();

    setError("");

    setBookings([]);

    setLoading(true);



    try {

      const supabase = createClient();



      // Check if at least one field is provided

      if (!referenceId.trim() && !phone.trim()) {

        setError("Please provide either a Reference ID or Phone Number");

        setLoading(false);

        return;

      }



      let query = supabase

        .from("bookings")

        .select(

          `

          id,

          court_id,

          institution_id,

          booking_date,

          start_time,

          end_time,

          sport_id,

          total_price,

          customer_name,

          customer_phone,

          customer_email,

          status,

          reference_id,

          created_at,

          sports (name),

          courts (

            name,

            institutions (name)

          )

        `

        )

        .order("booking_date", { ascending: false })

        .order("start_time", { ascending: false });



      // Add filters based on what's provided

      if (referenceId.trim()) {

        query = query.eq("reference_id", referenceId.trim().toUpperCase());

      }

      if (phone.trim()) {

        query = query.eq("customer_phone", phone.trim());

      }



      const { data, error: queryError } = await query;



      if (queryError) {

        console.error("Query Error:", queryError);

        setError("Failed to fetch bookings. Please try again.");

        setLoading(false);

        return;

      }



      if (!data || data.length === 0) {

        setError("No bookings found with the provided information.");

      } else {

        // Transform data to match expected format

        const transformedData = data.map((booking) => ({

          ...booking,

          institution_name: booking.courts.institutions.name,

          court_name: booking.courts.name,

          sport_name: booking.sports?.name,

        }));

        setBookings(transformedData);

      }

    } catch (err) {

      console.error("Error:", err);

      setError("An unexpected error occurred. Please try again.");

    }



    setLoading(false);

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



  return (

    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-gray-100 pt-24 pb-12 px-4">

      <motion.div

        className="max-w-5xl mx-auto"

        initial={{ opacity: 0, y: 20 }}

        animate={{ opacity: 1, y: 0 }}

        transition={{ duration: 0.5 }}

      >

        <motion.div

          className="bg-white rounded-xl shadow-lg border border-slate-200 p-8"

          initial={{ opacity: 0, scale: 0.95 }}

          animate={{ opacity: 1, scale: 1 }}

          transition={{ duration: 0.5, delay: 0.1 }}

        >

          {/* Header */}

          <div className="text-center mb-8">

            <motion.h1

              className="text-3xl font-bold text-slate-900 mb-2"

              initial={{ opacity: 0, y: -10 }}

              animate={{ opacity: 1, y: 0 }}

              transition={{ duration: 0.5, delay: 0.2 }}

            >

              Track Your Booking

            </motion.h1>

            <motion.p

              className="text-slate-600"

              initial={{ opacity: 0 }}

              animate={{ opacity: 1 }}

              transition={{ duration: 0.5, delay: 0.3 }}

            >

              Enter your reference ID or phone number to view booking details

            </motion.p>

            <motion.div

              initial={{ opacity: 0 }}

              animate={{ opacity: 1 }}

              transition={{ duration: 0.5, delay: 0.4 }}

            >

              <Link

                href="/"

                className="inline-flex items-center gap-2 mt-4 text-slate-700 hover:text-slate-900 font-semibold transition-colors"

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

                    d="M10 19l-7-7m0 0l7-7m-7 7h18"

                  />

                </svg>

                Back to Home

              </Link>

            </motion.div>

          </div>



          {/* Search Form */}

          <motion.form

            onSubmit={handleSearch}

            className="space-y-5 mb-8"

            initial={{ opacity: 0 }}

            animate={{ opacity: 1 }}

            transition={{ duration: 0.5, delay: 0.5 }}

          >

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">

              <div>

                <label

                  htmlFor="referenceId"

                  className="block text-sm font-semibold text-slate-700 mb-2"

                >

                  Reference ID{" "}

                  <span className="text-slate-500 text-xs font-normal">

                    (Optional)

                  </span>

                </label>

                <input

                  type="text"

                  id="referenceId"

                  value={referenceId}

                  onChange={(e) => setReferenceId(e.target.value.toUpperCase())}

                  placeholder="BK12345678"

                  className="w-full px-4 py-3 border-2 border-slate-200 rounded-lg focus:ring-2 focus:ring-slate-500 focus:border-slate-500 transition-all uppercase text-slate-900"

                />

              </div>



              <div>

                <label

                  htmlFor="phone"

                  className="block text-sm font-semibold text-slate-700 mb-2"

                >

                  Phone Number{" "}

                  <span className="text-slate-500 text-xs font-normal">

                    (Optional)

                  </span>

                </label>

                <input

                  type="tel"

                  id="phone"

                  value={phone}

                  onChange={(e) => setPhone(e.target.value)}

                  placeholder="0771234567"

                  className="w-full px-4 py-3 border-2 border-slate-200 rounded-lg focus:ring-2 focus:ring-slate-500 focus:border-slate-500 transition-all text-slate-900"

                />

              </div>

            </div>



            {error && (

              <div className="bg-red-50 border-2 border-red-200 text-red-700 px-4 py-3 rounded-lg">

                {error}

              </div>

            )}



            <button

              type="submit"

              disabled={loading}

              className="w-full bg-slate-800 text-white py-3.5 rounded-lg font-bold hover:bg-slate-900 transition-all shadow-lg hover:shadow-xl disabled:bg-slate-400 disabled:cursor-not-allowed"

            >

              {loading ? (

                <span className="flex items-center justify-center">

                  <svg

                    className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"

                    xmlns="http://www.w3.org/2000/svg"

                    fill="none"

                    viewBox="0 0 24 24"

                  >

                    <circle

                      className="opacity-25"

                      cx="12"

                      cy="12"

                      r="10"

                      stroke="currentColor"

                      strokeWidth="4"

                    ></circle>

                    <path

                      className="opacity-75"

                      fill="currentColor"

                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"

                    ></path>

                  </svg>

                  Searching...

                </span>

              ) : (

                "Track Booking"

              )}

            </button>

          </motion.form>



          {/* Booking Details */}

          {bookings.length > 0 && (

            <motion.div

              className="border-t-2 border-slate-200 pt-8"

              initial={{ opacity: 0, y: 20 }}

              animate={{ opacity: 1, y: 0 }}

              transition={{ duration: 0.5 }}

            >

              {bookings.length > 1 && (

                <div className="mb-6 bg-slate-50 border-2 border-slate-200 rounded-lg p-4">

                  <p className="text-slate-800 font-bold">

                    Found {bookings.length} bookings

                  </p>

                </div>

              )}



              {bookings.map((booking, index) => (

                <motion.div

                  key={booking.id}

                  className={

                    index > 0 ? "mt-8 pt-8 border-t-2 border-slate-200" : ""

                  }

                  initial={{ opacity: 0, x: -20 }}

                  animate={{ opacity: 1, x: 0 }}

                  transition={{ duration: 0.4, delay: index * 0.1 }}

                >

                  <div className="bg-gradient-to-r from-slate-50 to-slate-100 rounded-xl p-6 mb-6 border border-slate-200">

                    <div className="flex items-center justify-between mb-4">

                      <h2 className="text-xl font-bold text-slate-900">

                        {bookings.length > 1

                          ? `Booking ${index + 1}`

                          : "Booking Details"}

                      </h2>

                      <span

                        className={`px-4 py-2 rounded-full text-sm font-bold shadow-md ${getStatusColor(

                          booking.status

                        )}`}

                      >

                        {booking.status.charAt(0).toUpperCase() +

                          booking.status.slice(1)}

                      </span>

                    </div>



                    <div className="bg-white rounded-lg p-4 border-2 border-slate-200">

                      <p className="text-xs text-slate-500 mb-1 font-semibold uppercase">

                        Reference ID

                      </p>

                      <p className="text-2xl font-mono font-bold text-slate-900">

                        {booking.reference_id}

                      </p>

                    </div>

                  </div>



                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">

                    <div className="bg-white border-2 border-slate-200 rounded-xl p-5 hover:shadow-md transition-shadow">

                      <h3 className="font-bold text-slate-900 mb-4 flex items-center text-base">

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

                            {booking.institution_name}

                          </p>

                        </div>

                        <div>

                          <p className="text-slate-500 text-xs font-semibold uppercase">

                            Court

                          </p>

                          <p className="font-bold text-slate-900">

                            {booking.court_name}

                          </p>

                        </div>

                        <div>

                          <p className="text-slate-500 text-xs font-semibold uppercase">

                            Sport

                          </p>

                          <p className="font-bold text-slate-900">

                            {booking.sport_name || "N/A"}

                          </p>

                        </div>

                      </div>

                    </div>



                    <div className="bg-white border-2 border-slate-200 rounded-xl p-5 hover:shadow-md transition-shadow">

                      <h3 className="font-bold text-slate-900 mb-4 flex items-center text-base">

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

                            {new Date(booking.booking_date).toLocaleDateString(

                              "en-US",

                              {

                                weekday: "long",

                                month: "long",

                                day: "numeric",

                                year: "numeric",

                              }

                            )}

                          </p>

                        </div>

                        <div>

                          <p className="text-slate-500 text-xs font-semibold uppercase">

                            Time

                          </p>

                          <p className="font-bold text-slate-900">

                            {booking.start_time.substring(0, 5)} -{" "}

                            {booking.end_time.substring(0, 5)}

                          </p>

                        </div>

                      </div>

                    </div>



                    <div className="bg-white border-2 border-slate-200 rounded-xl p-5 hover:shadow-md transition-shadow">

                      <h3 className="font-bold text-slate-900 mb-4 flex items-center text-base">

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

                            {booking.customer_name}

                          </p>

                        </div>

                        <div>

                          <p className="text-slate-500 text-xs font-semibold uppercase">

                            Phone

                          </p>

                          <p className="font-bold text-slate-900">

                            {booking.customer_phone}

                          </p>

                        </div>

                        {booking.customer_email && (

                          <div>

                            <p className="text-slate-500 text-xs font-semibold uppercase">

                              Email

                            </p>

                            <p className="font-bold text-slate-900 break-all">

                              {booking.customer_email}

                            </p>

                          </div>

                        )}

                      </div>

                    </div>



                    {booking.total_price && (

                      <div className="bg-gradient-to-r from-slate-700 to-slate-800 rounded-xl p-5 text-white shadow-lg">

                        <div className="flex justify-between items-center">

                          <span className="font-bold text-base">

                            Total Amount

                          </span>

                          <span className="text-3xl font-bold">

                            LKR {parseFloat(booking.total_price).toFixed(2)}

                          </span>

                        </div>

                      </div>

                    )}

                  </div>



                  <div className="text-center pt-6 border-t-2 border-slate-200 mt-6">

                    <button

                      onClick={() => {

                        setBookings([]);

                        setReferenceId("");

                        setPhone("");

                        setError("");

                      }}

                      className="text-slate-700 hover:text-slate-900 font-bold transition-colors inline-flex items-center gap-2"

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

                          d="M10 19l-7-7m0 0l7-7m-7 7h18"

                        />

                      </svg>

                      Search Another Booking

                    </button>

                  </div>

                </motion.div>

              ))}

            </motion.div>

          )}

        </motion.div>

      </motion.div>

    </div>

  );

}