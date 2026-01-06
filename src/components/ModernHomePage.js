"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  Search,
  CalendarCheck,
  Zap,
  MapPin,
  Clock,
  Users,
  ArrowRight,
} from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { createClient } from "@/lib/supabase/client";

const steps = [
  {
    icon: Search,
    title: "Search Facility",
    description:
      "Browse through our extensive list of indoor sports facilities across Sri Lanka",
  },
  {
    icon: CalendarCheck,
    title: "Choose Time Slot",
    description:
      "Select your preferred date and time with our interactive slot booking system",
  },
  {
    icon: Zap,
    title: "Book Instantly",
    description:
      "Confirm your booking in seconds and receive instant confirmation",
  },
];

export default function ModernHomePage() {
  const [institutions, setInstitutions] = useState([]);
  const [allInstitutions, setAllInstitutions] = useState([]);
  const [sports, setSports] = useState([]);
  const [districts, setDistricts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  // Filter states
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDistrict, setSelectedDistrict] = useState("");
  const [selectedSport, setSelectedSport] = useState("");

  const heroImages = [
    "https://images.unsplash.com/photo-1461896836934-ffe607ba8211?w=1920&q=80",
    "https://images.unsplash.com/photo-1554068865-24cecd4e34b8?w=1920&q=80",
    "https://images.unsplash.com/photo-1587384474964-3a06ce1ce699?w=1920&q=80",
    "https://images.unsplash.com/photo-1571902943202-507ec2618e8f?w=1920&q=80",
  ];

  const fetchData = async () => {
    const supabase = createClient();

    // Fetch institutions
    const { data: institutionsData } = await supabase
      .from("institutions")
      .select(
        `
        *,
        courts (
          id,
          court_sports (
            sport_id,
            sports (
              id,
              name
            )
          )
        )
      `
      )
      .eq("is_verified", true)
      .order("created_at", { ascending: false });

    setAllInstitutions(institutionsData || []);
    setInstitutions(institutionsData || []);

    // Fetch sports
    const { data: sportsData } = await supabase
      .from("sports")
      .select("*")
      .order("name");

    setSports(sportsData || []);

    // Get unique districts
    const uniqueDistricts = [
      ...new Set(institutionsData?.map((d) => d.district) || []),
    ];
    setDistricts(uniqueDistricts.sort());

    setLoading(false);
  };

  const applyFilters = () => {
    let filtered = [...allInstitutions];

    // Filter by search query
    if (searchQuery.trim()) {
      filtered = filtered.filter((inst) =>
        inst.name.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Filter by district
    if (selectedDistrict) {
      filtered = filtered.filter((inst) => inst.district === selectedDistrict);
    }

    // Filter by sport
    if (selectedSport) {
      filtered = filtered.filter((inst) =>
        inst.courts?.some((court) =>
          court.court_sports?.some((cs) => cs.sports?.name === selectedSport)
        )
      );
    }

    setInstitutions(filtered);
  };

  const clearFilters = () => {
    setSearchQuery("");
    setSelectedDistrict("");
    setSelectedSport("");
  };

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentImageIndex((prev) => (prev + 1) % heroImages.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [heroImages.length]);

  useEffect(() => {
    applyFilters();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchQuery, selectedDistrict, selectedSport, allInstitutions]);

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden pt-16 pb-20 md:pb-8">
        {/* Background Image with Overlay - Slideshow */}
        <div className="absolute inset-0">
          {heroImages.map((image, index) => (
            <motion.img
              key={image}
              src={image}
              alt="Sports arena"
              className="absolute w-full h-full object-cover"
              initial={{ x: "100%" }}
              animate={{
                x: index === currentImageIndex ? "0%" : "-100%",
                opacity: index === currentImageIndex ? 1 : 0,
              }}
              transition={{ duration: 1, ease: "easeInOut" }}
            />
          ))}
          <div className="absolute inset-0 bg-gradient-to-b from-neutral-900/90 via-neutral-900/80 to-black/80" />
        </div>

        {/* Content - Centered */}
        <div className="relative z-10 w-full px-4 sm:px-6 lg:px-12 xl:px-20">
          <div className="max-w-6xl mx-auto text-center">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
            >
              {/* Headline */}
              <motion.h1
                className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold text-white mb-6 leading-tight"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2, duration: 0.8 }}
              >
                Book Indoor Sports Courts
                <br />
                Instantly
              </motion.h1>

              {/* Supporting Paragraph */}
              <motion.p
                className="text-lg sm:text-xl md:text-2xl text-gray-200 mb-8 leading-relaxed max-w-3xl mx-auto"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4, duration: 0.8 }}
              >
                Reserve courts for badminton, futsal, cricket, tennis and more.
                Find the perfect venue, choose your time, and play today.
              </motion.p>

              {/* Stats Row - Above Button */}
              <motion.div
                className="flex flex-wrap justify-center gap-6 sm:gap-12 mb-10 text-white"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.6, duration: 0.8 }}
              >
                <div className="flex items-center gap-2">
                  <MapPin className="w-6 h-6" />
                  <span className="text-base sm:text-lg font-medium">
                    {allInstitutions.length}+ Venues
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="w-6 h-6" />
                  <span className="text-base sm:text-lg font-medium">
                    24/7 Booking
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Zap className="w-6 h-6" />
                  <span className="text-base sm:text-lg font-medium">
                    Instant Confirmation
                  </span>
                </div>
              </motion.div>

              {/* Primary CTA Button - Centered */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.8, duration: 0.8 }}
              >
                <a
                  href="#facilities"
                  className="inline-flex items-center justify-center px-12 py-5 text-xl font-bold text-gray-900 bg-gradient-to-r from-yellow-400 via-yellow-500 to-orange-500 rounded-full shadow-2xl hover:shadow-yellow-500/50 transition-all duration-300 hover:scale-105"
                >
                  Find Courts
                </a>
              </motion.div>
            </motion.div>
          </div>
        </div>

        {/* Scroll Indicator */}
        <motion.div
          className="absolute bottom-8 left-1/2 transform -translate-x-1/2"
          animate={{ y: [0, 10, 0] }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          <div className="w-6 h-10 border-2 border-white rounded-full flex justify-center pt-2">
            <div className="w-1 h-3 bg-white rounded-full" />
          </div>
        </motion.div>
      </section>

      {/* Search and Filters Section */}
      <section className="py-7 bg-gradient-to-br from-indigo-50 via-purple-50 to-blue-50">
        <div className="px-4 sm:px-6 lg:px-12 xl:px-20">
          <div className="max-w-7xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
            >
              <div className="text-center mb-6">
                <h3 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">
                  Find Your Perfect Court
                </h3>
                <p className="text-sm text-gray-600">
                  Search by name, location, or sport type
                </p>
              </div>

              <div className="bg-white rounded-2xl shadow-xl p-6 md:p-8 border border-gray-100">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                  {/* Search by Name */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-800 mb-2">
                      🔍 Search by Name
                    </label>
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Enter facility name..."
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all text-gray-900 placeholder:text-gray-400"
                    />
                  </div>

                  {/* Filter by District */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-800 mb-2">
                      📍 Filter by District
                    </label>
                    <select
                      value={selectedDistrict}
                      onChange={(e) => setSelectedDistrict(e.target.value)}
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all bg-white text-gray-900"
                    >
                      <option value="">All Districts</option>
                      {districts.map((district) => (
                        <option key={district} value={district}>
                          {district}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Filter by Sport */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-800 mb-2">
                      🏀 Filter by Sport
                    </label>
                    <select
                      value={selectedSport}
                      onChange={(e) => setSelectedSport(e.target.value)}
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all bg-white text-gray-900"
                    >
                      <option value="">All Sports</option>
                      {sports.map((sport) => (
                        <option key={sport.id} value={sport.name}>
                          {sport.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Results and Clear Filters */}
                <div className="flex items-center justify-between gap-4 pt-4 border-t border-gray-200">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-indigo-600 rounded-full animate-pulse"></div>
                    <p className="text-gray-700 font-medium">
                      Found{" "}
                      <span className="text-2xl font-bold text-indigo-600 mx-1">
                        {institutions.length}
                      </span>{" "}
                      {institutions.length === 1 ? "facility" : "facilities"}
                    </p>
                  </div>
                  {(searchQuery || selectedDistrict || selectedSport) && (
                    <button
                      onClick={clearFilters}
                      className="px-5 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-semibold rounded-lg hover:shadow-lg hover:scale-105 transition-all duration-300 flex items-center gap-2 whitespace-nowrap"
                    >
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
                          d="M6 18L18 6M6 6l12 12"
                        />
                      </svg>
                      Clear Filters
                    </button>
                  )}
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Featured Facilities Carousel */}
      <section
        id="facilities"
        className="py-7 bg-gradient-to-b from-gray-50 to-white"
      >
        <div className="px-4 sm:px-6 lg:px-12 xl:px-20">
          <div className="max-w-7xl mx-auto">
            {(searchQuery || selectedDistrict || selectedSport) && (
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.8 }}
                className="text-center mb-6"
              >
                <div className="inline-flex items-center gap-3 px-6 py-3 bg-indigo-100 rounded-full">
                  <div className="w-2 h-2 bg-indigo-600 rounded-full animate-pulse"></div>
                  <h2 className="text-xl md:text-xl font-bold text-indigo-900">
                    Your Search Results
                  </h2>
                </div>
              </motion.div>
            )}

            {loading ? (
              <div className="text-center py-12">
                <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
              </div>
            ) : institutions.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {institutions.map((facility, index) => (
                  <motion.div
                    key={facility.id}
                    initial={{ opacity: 0, y: 50, filter: "blur(10px)" }}
                    whileInView={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                    viewport={{ once: true, margin: "-20px" }}
                    transition={{
                      duration: 0.4,
                      delay: index * 0.05,
                      ease: "easeOut",
                    }}
                  >
                    <Link href={`/institution/${facility.id}`}>
                      <motion.div
                        className="bg-gradient-to-br from-white to-gray-50 rounded-2xl border border-gray-200 shadow-lg overflow-hidden group cursor-pointer h-full"
                        whileHover={{
                          y: -8,
                          scale: 1.02,
                          boxShadow: "0 20px 40px rgba(0,0,0,0.15)",
                        }}
                        transition={{ duration: 0.25, ease: "easeOut" }}
                      >
                        <div className="relative h-64 overflow-hidden">
                          <Image
                            src={
                              facility.images?.[0] ||
                              "https://images.unsplash.com/photo-1546519638-68e109498ffc?w=800"
                            }
                            alt={facility.name}
                            fill
                            className="object-cover group-hover:scale-110 transition-transform duration-700 ease-out"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent group-hover:from-black/80 transition-all duration-300" />
                          <div className="absolute bottom-4 left-4 right-4">
                            <h3 className="text-2xl font-bold text-white mb-1">
                              {facility.name}
                            </h3>
                            <p className="text-blue-200 flex items-center gap-1">
                              <MapPin className="w-4 h-4" />
                              {facility.district}
                            </p>
                          </div>
                        </div>
                        <div className="p-6">
                          <p className="text-gray-600 mb-4 line-clamp-2">
                            {facility.address}
                          </p>
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-gray-500">
                              {facility.contact_number}
                            </span>
                            <span className="text-slate-900 font-semibold flex items-center gap-1 group-hover:text-indigo-600 transition-colors">
                              View Details
                              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                            </span>
                          </div>
                        </div>
                      </motion.div>
                    </Link>
                  </motion.div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 text-gray-500">
                No facilities available yet
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-slate-200">
        <div className="px-4 sm:px-6 lg:px-12 xl:px-20 py-8">
          <div className="max-w-7xl mx-auto">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-6">
              {/* About Section */}
              <div className="col-span-2 md:col-span-1">
                <h3 className="text-white text-base font-bold mb-3">
                  CourtBooker
                </h3>
                <p className="text-xs leading-relaxed">
                  Your one-stop platform for booking indoor sports courts across
                  Sri Lanka.
                </p>
              </div>

              {/* Quick Links */}
              <div>
                <h3 className="text-white text-base font-bold mb-3">
                  Quick Links
                </h3>
                <ul className="space-y-1.5 text-xs">
                  <li>
                    <Link
                      href="/"
                      className="hover:text-white transition-colors"
                    >
                      Home
                    </Link>
                  </li>
                  <li>
                    <Link
                      href="/#facilities"
                      className="hover:text-white transition-colors"
                    >
                      Find Courts
                    </Link>
                  </li>
                  <li>
                    <Link
                      href="/track-booking"
                      className="hover:text-white transition-colors"
                    >
                      Track Booking
                    </Link>
                  </li>
                  <li>
                    <Link
                      href="/institution/register"
                      className="hover:text-white transition-colors"
                    >
                      Register Institution
                    </Link>
                  </li>
                </ul>
              </div>

              {/* Contact */}
              <div>
                <h3 className="text-white text-base font-bold mb-3">Contact</h3>
                <ul className="space-y-1.5 text-xs">
                  <li className="flex items-center gap-2">
                    <MapPin className="w-3 h-3" />
                    <span>Sri Lanka</span>
                  </li>
                  <li>
                    <a
                      href="mailto:contact@courtbooker.lk"
                      className="hover:text-white transition-colors flex items-center gap-2"
                    >
                      <svg
                        className="w-3 h-3"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                        />
                      </svg>
                      contact@courtbooker.lk
                    </a>
                  </li>
                </ul>
              </div>

              {/* Developer Credit */}
              <div>
                <h3 className="text-white text-base font-bold mb-3">
                  Developer
                </h3>
                <p className="text-xs">
                  <span className="text-white font-semibold">
                    Ruzayn Ahmedh
                  </span>
                </p>
              </div>
            </div>

            {/* Bottom Bar */}
            <div className="border-t border-gray-700 pt-4 text-center">
              <p className="text-xs">
                © {new Date().getFullYear()} CourtBooker. All rights reserved.
              </p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
