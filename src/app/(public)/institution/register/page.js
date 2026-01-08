"use client";

import { useState, useEffect, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Upload,
  X,
  Check,
  ChevronRight,
  ChevronLeft,
  Building2,
  UserCircle,
  ArrowRight,
  MapPin,
  Mail,
  Phone,
  Zap,
  Calendar,
  BarChart3,
  Clock,
  Bell,
  Smartphone,
  Users,
  Star,
  PlayCircle,
} from "lucide-react";

export default function InstitutionRegisterPage() {
  const router = useRouter();
  const [sports, setSports] = useState([]);
  const [showRegistration, setShowRegistration] = useState(false);

  // Refs for scroll animation
  const featuresRef = useRef(null);

  const [districts] = useState([
    "Colombo",
    "Gampaha",
    "Kalutara",
    "Kandy",
    "Matale",
    "Nuwara Eliya",
    "Galle",
    "Matara",
    "Hambantota",
    "Jaffna",
    "Kilinochchi",
    "Mannar",
    "Vavuniya",
    "Mullaitivu",
    "Batticaloa",
    "Ampara",
    "Trincomalee",
    "Kurunegala",
    "Puttalam",
    "Anuradhapura",
    "Polonnaruwa",
    "Badulla",
    "Monaragala",
    "Ratnapura",
    "Kegalle",
  ]);

  const [formData, setFormData] = useState({
    name: "",
    district: "",
    address: "",
    google_maps_link: "",
    contact_number: "",
    email: "",
    selectedSports: [],
    images: [],
    adminEmail: "",
    adminPassword: "",
    adminName: "",
  });

  const [imageFiles, setImageFiles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [step, setStep] = useState(1);

  // Carousel State
  const [currentSlide, setCurrentSlide] = useState(0);
  const demoSlides = [
    { title: "Simple Booking Process", color: "bg-blue-500" },
    { title: "Admin Dashboard", color: "bg-emerald-500" },
    { title: "Revenue Analytics", color: "bg-purple-500" },
  ];

  // Feature Data for cleaner mapping & animation
  const featuresList = [
    {
      icon: Calendar,
      color: "blue",
      title: "Easy Booking",
      desc: "Accept bookings 24/7 through an easy-to-use online platform. No more phone calls.",
    },    {
      icon: Bell,
      color: "orange",
      title: "Instant SMS Alerts",
      desc: "Automatic SMS confirmations and reminders keep your customers informed.",
    },
    {
      icon: BarChart3,
      color: "emerald",
      title: "Revenue Analytics",
      desc: "Track your earnings, popular time slots, and booking trends with clean charts.",
    },
    {
      icon: Clock,
      color: "purple",
      title: "Smart Scheduling",
      desc: "Flexible time slots, block unavailable times, and manage multiple courts easily.",
    },

    {
      icon: Smartphone,
      color: "cyan",
      title: "Manage on Mobile",
      desc: "Manage your facility from anywhere. Our design works perfectly on all devices.",
    },
    {
      icon: Users,
      color: "pink",
      title: "Customer CRM",
      desc: "Build relationships with automatic profiles, booking history, and contact management.",
    },
  ];

  useEffect(() => {
    fetchSports();

    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % demoSlides.length);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  // Scroll Animation Observer
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("animate-fadeInUp");
            entry.target.classList.remove("opacity-0", "translate-y-10");
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.1 }
    );

    const elements = document.querySelectorAll(".reveal-on-scroll");
    elements.forEach((el) => observer.observe(el));

    return () => observer.disconnect();
  }, [showRegistration]); // Re-run when view changes

  const fetchSports = async () => {
    const supabase = createClient();
    const { data } = await supabase.from("sports").select("*").order("name");
    if (data) setSports(data);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSportToggle = (sportId) => {
    setFormData((prev) => ({
      ...prev,
      selectedSports: prev.selectedSports.includes(sportId)
        ? prev.selectedSports.filter((id) => id !== sportId)
        : [...prev.selectedSports, sportId],
    }));
  };

  const handleImageChange = (e) => {
    const files = Array.from(e.target.files);
    if (files.length + imageFiles.length > 5) {
      setError("Maximum 5 images allowed");
      return;
    }
    setImageFiles((prev) => [...prev, ...files]);
  };

  const removeImage = (index) => {
    setImageFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleNextStep = () => {
    if (
      !formData.name ||
      !formData.district ||
      !formData.address ||
      !formData.contact_number ||
      !formData.email ||
      formData.selectedSports.length === 0
    ) {
      setError(
        "Please fill in all required fields and select at least one sport"
      );
      return;
    }
    if (imageFiles.length === 0) {
      setError("Please upload at least one image");
      return;
    }
    setError("");
    setStep(2);
    window.scrollTo(0, 0);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const apiFormData = new FormData();
      Object.keys(formData).forEach((key) => {
        if (key === "selectedSports") {
          apiFormData.append(key, JSON.stringify(formData[key]));
        } else if (key !== "images") {
          apiFormData.append(key, formData[key]);
        }
      });

      imageFiles.forEach((file) => {
        apiFormData.append("images", file);
      });

      const response = await fetch("/api/institutions/register", {
        method: "POST",
        body: apiFormData,
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to register");
      }

      alert("Registration successful! Pending approval.");
      router.push("/");
    } catch (err) {
      console.error("Error:", err);
      setError(err.message || "An unexpected error occurred.");
    }
    setLoading(false);
  };

  // --- LANDING PAGE VIEW ---
  if (!showRegistration) {
    return (
      <div className="min-h-screen bg-white text-slate-900">
        {/* HERO SECTION WITH BACKGROUND PHOTO & CAROUSEL */}
        <div className="relative overflow-hidden bg-slate-900">
          {/* Background Image Layer */}
          <div className="absolute inset-0 z-0">
            <img
              src="https://images.unsplash.com/photo-1587384474964-3a06ce1ce699?w=1920&q=80
              "
              alt="Sports Facility"
              className="w-full h-full object-cover opacity-40 blur-[2px]"
            />

          </div>

          <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-32">
            <Link
              href="/"
              className="inline-flex items-center text-sm font-medium text-slate-300 hover:text-white transition-colors mb-10 bg-black/30 px-3 py-1.5 rounded-full backdrop-blur-sm border border-white/10"
            >
              <ChevronLeft className="w-4 h-4 mr-1" />
              Back to Home
            </Link>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
              {/* Left Column: Content */}
              <div className="text-left">
                <div className="inline-flex items-center gap-2 px-3 py-1 bg-slate-700/50 text-slate-200 rounded-full border border-slate-600 mb-6 animate-fadeIn backdrop-blur-sm">
                  <Zap className="w-4 h-4 fill-slate-400 text-slate-400" />
                  <span className="text-xs font-bold uppercase tracking-wide">
                    Automate Your Venue
                  </span>
                </div>

                <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-white mb-6 animate-slideUp tracking-tight shadow-black drop-shadow-lg">
                  Still Managing Bookings Manually? <br />
                  {/* UPDATED: Slate Theme Gradient */}
<span className="text-transparent bg-clip-text bg-gradient-to-r from-slate-400 via-white to-slate-400 pb-1">
  It’s Time to Upgrade.
</span>
                </h1>

                <p
                  className="text-lg text-slate-300 mb-8 animate-slideUp leading-relaxed max-w-lg shadow-black drop-shadow-md"
                  style={{ animationDelay: "0.1s" }}
                >
                  Transform your sports institution with our powerful booking
                  management system. Automate bookings, track revenue, and
                  delight your customers.
                </p>

                <div
                  className="flex flex-col sm:flex-row gap-4 animate-slideUp"
                  style={{ animationDelay: "0.1s" }}
                >
                  <button
                    onClick={() => setShowRegistration(true)}
                    className="group inline-flex items-center justify-center gap-2 px-8 py-4 bg-white text-slate-900 font-bold rounded-xl shadow-lg hover:shadow-xl hover:scale-[1.02] transition-all duration-300"
                  >
                    Get Started Free
                    <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                  </button>
                </div>
              </div>

              {/* Right Column: Demo Carousel */}
              <div
                className="hidden lg:block animate-slideUp"
                style={{ animationDelay: "0.2s" }}
              >
                <div className="relative bg-slate-800/50 backdrop-blur-md border border-slate-700 rounded-2xl p-2 shadow-2xl transform rotate-1 hover:rotate-0 transition-transform duration-500">
                  {/* Browser/Window Bar */}
                  <div className="flex items-center gap-2 px-4 py-3 border-b border-slate-700/50 bg-slate-900/50 rounded-t-xl">
                    <div className="w-3 h-3 rounded-full bg-red-500"></div>
                    <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                    <div className="w-3 h-3 rounded-full bg-green-500"></div>
                    <div className="ml-4 w-full max-w-[200px] h-4 bg-slate-700/50 rounded-full"></div>
                  </div>

                  {/* Carousel Content Area */}
                  <div className="relative aspect-video bg-slate-900 rounded-b-xl overflow-hidden group cursor-pointer">
                    <div
                      className={`w-full h-full flex flex-col items-center justify-center text-white transition-colors duration-500 ${demoSlides[currentSlide].color}`}
                    >
                      <PlayCircle className="w-16 h-16 mb-4 opacity-80" />
                      <h3 className="text-2xl font-bold">
                        {demoSlides[currentSlide].title}
                      </h3>
                      <p className="text-white/80 mt-2 text-sm">
                        (Insert your GIFs here)
                      </p>
                    </div>

                    <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-2">
                      {demoSlides.map((_, idx) => (
                        <div
                          key={idx}
                          className={`w-2 h-2 rounded-full transition-all ${
                            currentSlide === idx
                              ? "bg-white w-6"
                              : "bg-white/40"
                          }`}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Features Grid - UPDATED with Scroll Animation */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
          <div className="text-center mb-16 reveal-on-scroll opacity-0 translate-y-10 transition-all duration-700">
            <h2 className="text-3xl font-bold text-slate-900 mb-4">
              Everything You Need
            </h2>
            <p className="text-lg text-slate-500 max-w-2xl mx-auto">
              Powerful features packaged in a clean, intuitive interface.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {featuresList.map((feature, index) => {
              const Icon = feature.icon;
              // Dynamic colors based on the object
              const bgColors = {
                blue: "bg-blue-50 group-hover:bg-blue-100",
                emerald: "bg-emerald-50 group-hover:bg-emerald-100",
                purple: "bg-purple-50 group-hover:bg-purple-100",
                orange: "bg-orange-50 group-hover:bg-orange-100",
                cyan: "bg-cyan-50 group-hover:bg-cyan-100",
                pink: "bg-pink-50 group-hover:bg-pink-100",
              };
              const textColors = {
                blue: "text-blue-600",
                emerald: "text-emerald-600",
                purple: "text-purple-600",
                orange: "text-orange-600",
                cyan: "text-cyan-600",
                pink: "text-pink-600",
              };

              return (
                <div
                  key={index}
                  // Added reveal-on-scroll class and dynamic inline delay
                  className="reveal-on-scroll opacity-0 translate-y-10 group bg-white border border-slate-200 rounded-2xl p-8 shadow-sm hover:shadow-xl hover:border-slate-300 transition-all duration-500 hover:-translate-y-2"
                  style={{ transitionDelay: `${index * 100}ms` }}
                >
                  <div
                    className={`w-12 h-12 rounded-xl flex items-center justify-center mb-6 transition-colors ${
                      bgColors[feature.color] || "bg-slate-100"
                    }`}
                  >
                    <Icon
                      className={`w-6 h-6 ${
                        textColors[feature.color] || "text-slate-600"
                      }`}
                    />
                  </div>
                  <h3 className="text-xl font-bold text-slate-900 mb-3">
                    {feature.title}
                  </h3>
                  <p className="text-slate-500 leading-relaxed">
                    {feature.desc}
                  </p>
                </div>
              );
            })}
          </div>
        </div>

        {/* CTA Section - Slate Theme */}
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pb-24">
          <div className="relative bg-slate-900 rounded-3xl p-12 text-center overflow-hidden shadow-2xl reveal-on-scroll opacity-0 translate-y-10 transition-all duration-700">
            {/* Dark Grid Background */}
            <div className="absolute inset-0 bg-grid-white/5 bg-[size:30px_30px]"></div>

            <div className="relative z-10">
              <Star className="w-12 h-12 text-yellow-400 mx-auto mb-6 fill-yellow-400" />
              <h2 className="text-3xl sm:text-4xl font-bold text-white mb-6">
                Ready to Transform Your Business?
              </h2>
              <p className="text-lg text-slate-300 mb-8 max-w-2xl mx-auto">
                Join successful sports facilities already using CourtBooker. No
                complex setup required.
              </p>
              <button
                onClick={() => setShowRegistration(true)}
                className="group inline-flex items-center gap-2 px-8 py-4 bg-white text-slate-900 font-bold rounded-xl shadow-xl hover:shadow-2xl hover:scale-[1.02] transition-all duration-300"
              >
                Start Your Free Registration
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </button>
            </div>
          </div>
        </div>

        <style jsx>{`
          .animate-slideUp {
            animation: slideUp 0.8s ease-out both;
          }
          .animate-fadeIn {
            animation: fadeIn 0.2s ease-out;
          }
          .animate-fadeInUp {
            animation: fadeInUp 0.8s ease-out both;
          }

          @keyframes slideUp {
            from {
              opacity: 0;
              transform: translateY(30px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }
          @keyframes fadeIn {
            from {
              opacity: 0;
            }
            to {
              opacity: 1;
            }
          }
          @keyframes fadeInUp {
            from {
              opacity: 0;
              transform: translateY(40px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }
          .bg-grid-white\\/5 {
            background-image: linear-gradient(
                rgba(255, 255, 255, 0.05) 1px,
                transparent 1px
              ),
              linear-gradient(
                90deg,
                rgba(255, 255, 255, 0.05) 1px,
                transparent 1px
              );
          }
        `}</style>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header - Clean White */}
      <div className="bg-slate-800 border-b border-slate-200 pt-10 pb-24 animate-slideDown">
        <div
          className="relative max-w-4xl mx-auto px-4 sm:px-6 text-center animate-fadeIn"
          style={{ animationDelay: "0.1s" }}
        >
          <button
            onClick={() => setShowRegistration(false)}
            className="inline-flex items-center text-sm font-medium text-slate-500 hover:text-slate-900 transition-colors mb-6 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-100"
          >
            <ChevronLeft className="w-4 h-4 mr-1" />
            Back to Features
          </button>
          <h1
            className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight mb-3 animate-slideUp"
            style={{ animationDelay: "0.2s" }}
          >
            Create Your Profile
          </h1>
          <p
            className="text-slate-300 max-w-lg mx-auto text-lg animate-fadeIn"
            style={{ animationDelay: "0.1s" }}
          >
            Let's get your sports facility set up in minutes.
          </p>
        </div>
      </div>

      {/* Main Form Card (Floating) */}
      <div
        className="relative -mt-16 max-w-3xl mx-auto px-4 sm:px-6 pb-12 animate-scaleIn"
        style={{ animationDelay: "0.3s" }}
      >
        <div className="bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden">
          {/* Progress Stepper */}
          <div className="bg-slate-50 border-b border-slate-200 p-6">
            <div className="flex items-center justify-center">
              <div className="flex items-center w-full max-w-sm relative">
                {/* Step 1 Circle */}
                <div
                  className={`relative z-10 flex items-center justify-center w-10 h-10 rounded-full font-bold text-sm transition-all duration-300 ${
                    step >= 1
                      ? "bg-slate-900 text-white shadow-md"
                      : "bg-white text-gray-400 border border-slate-300"
                  }`}
                >
                  {step > 1 ? <Check className="w-5 h-5" /> : "1"}
                </div>

                {/* Connector Line */}
                <div className="flex-1 h-1 bg-slate-200 mx-2 rounded-full overflow-hidden">
                  <div
                    className={`h-full bg-slate-900 transition-all duration-500 ${
                      step === 2 ? "w-full" : "w-0"
                    }`}
                  ></div>
                </div>

                {/* Step 2 Circle */}
                <div
                  className={`relative z-10 flex items-center justify-center w-10 h-10 rounded-full font-bold text-sm transition-all duration-300 ${
                    step >= 2
                      ? "bg-slate-900 text-white shadow-md"
                      : "bg-white text-gray-400 border border-slate-300"
                  }`}
                >
                  2
                </div>
              </div>
            </div>
            <div className="flex justify-between max-w-sm mx-auto mt-2 text-xs font-bold text-slate-500 uppercase tracking-wider">
              <span className={step === 1 ? "text-slate-900" : ""}>
                Institution Details
              </span>
              <span className={step === 2 ? "text-slate-900" : ""}>
                Admin Access
              </span>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="p-6 sm:p-10">
            {/* Step 1: Institution Info */}
            {step === 1 && (
              <div className="space-y-8 animate-fadeIn">
                {/* Section: Basic Info */}
                <div className="space-y-6">
                  <div className="flex items-center gap-2 text-slate-900 border-b border-slate-100 pb-3 animate-slideLeft">
                    <Building2 className="w-5 h-5 text-slate-700" />
                    <h2 className="text-lg font-bold">Venue Information</h2>
                  </div>

                  <div
                    className="animate-slideUp"
                    style={{ animationDelay: "0.1s" }}
                  >
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                      Institution Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      required
                      className="w-full px-4 py-3 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-900 focus:border-transparent outline-none transition-all text-slate-900 placeholder:text-slate-400 hover:border-slate-400"
                      placeholder="e.g. Royal Sports Complex"
                    />
                  </div>

                  <div
                    className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-slideUp"
                    style={{ animationDelay: "0.1s" }}
                  >
                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                        District <span className="text-red-500">*</span>
                      </label>
                      <div className="relative">
                        <select
                          name="district"
                          value={formData.district}
                          onChange={handleInputChange}
                          required
                          className="w-full px-4 py-3 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-900 focus:border-transparent outline-none appearance-none text-slate-900 cursor-pointer"
                        >
                          <option value="">Select District</option>
                          {districts.map((d) => (
                            <option key={d} value={d}>
                              {d}
                            </option>
                          ))}
                        </select>
                        <ChevronRight className="w-4 h-4 text-slate-400 absolute right-4 top-1/2 -translate-y-1/2 rotate-90 pointer-events-none" />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                        Contact Number <span className="text-red-500">*</span>
                      </label>
                      <div className="relative">
                        <Phone className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
                        <input
                          type="tel"
                          name="contact_number"
                          value={formData.contact_number}
                          onChange={handleInputChange}
                          required
                          className="w-full pl-10 pr-4 py-3 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-900 focus:border-transparent outline-none transition-all text-slate-900 placeholder:text-slate-400"
                          placeholder="077 123 4567"
                        />
                      </div>
                    </div>
                  </div>

                  <div
                    className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-slideUp"
                    style={{ animationDelay: "0.2s" }}
                  >
                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                        Email Address <span className="text-red-500">*</span>
                      </label>
                      <div className="relative">
                        <Mail className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
                        <input
                          type="email"
                          name="email"
                          value={formData.email}
                          onChange={handleInputChange}
                          required
                          className="w-full pl-10 pr-4 py-3 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-900 focus:border-transparent outline-none transition-all text-slate-900 placeholder:text-slate-400"
                          placeholder="info@venue.com"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                        Google Maps Link <span className="text-red-500">*</span>
                      </label>
                      <div className="relative">
                        <MapPin className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
                        <input
                          type="url"
                          name="google_maps_link"
                          value={formData.google_maps_link}
                          onChange={handleInputChange}
                          required
                          className="w-full pl-10 pr-4 py-3 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-900 focus:border-transparent outline-none transition-all text-slate-900 placeholder:text-slate-400"
                          placeholder="http://googleusercontent.com/..."
                        />
                      </div>
                    </div>
                  </div>

                  <div
                    className="animate-slideUp"
                    style={{ animationDelay: "0.1s" }}
                  >
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                      Physical Address <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      name="address"
                      value={formData.address}
                      onChange={handleInputChange}
                      required
                      rows="2"
                      className="w-full px-4 py-3 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-900 focus:border-transparent outline-none transition-all text-slate-900 resize-none placeholder:text-slate-400"
                      placeholder="No 123, Main Street..."
                    />
                  </div>
                </div>

                {/* Section: Sports */}
                <div
                  className="animate-slideUp"
                  style={{ animationDelay: "0.2s" }}
                >
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-4 animate-slideLeft">
                    Available Sports <span className="text-red-500">*</span>
                  </label>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {sports.map((sport) => {
                      const isSelected = formData.selectedSports.includes(
                        sport.id
                      );
                      return (
                        <div
                          key={sport.id}
                          onClick={() => handleSportToggle(sport.id)}
                          className={`cursor-pointer px-4 py-3 rounded-lg border text-sm font-semibold transition-all duration-200 text-center select-none ${
                            isSelected
                              ? "bg-slate-900 border-slate-900 text-white shadow-md transform scale-[1.02]"
                              : "bg-white border-slate-200 text-slate-600 hover:border-slate-400 hover:bg-slate-50"
                          }`}
                        >
                          {sport.name}
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Section: Images */}
                <div
                  className="animate-slideUp"
                  style={{ animationDelay: "0.2s" }}
                >
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-4 animate-slideLeft">
                    Gallery Images{" "}
                    <span className="text-slate-400 font-normal ml-1">
                      (Max 5)
                    </span>
                  </label>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {/* Upload Button */}
                    {imageFiles.length < 5 && (
                      <label className="col-span-2 h-36 border-2 border-dashed border-slate-300 rounded-xl flex flex-col items-center justify-center cursor-pointer hover:bg-slate-50 hover:border-slate-400 transition-all group">
                        <input
                          type="file"
                          accept="image/*"
                          multiple
                          onChange={handleImageChange}
                          className="hidden"
                        />
                        <div className="bg-slate-100 p-3 rounded-full mb-3 group-hover:bg-white group-hover:shadow-sm transition-all">
                          <Upload className="w-6 h-6 text-slate-500 group-hover:text-slate-900" />
                        </div>
                        <span className="text-sm font-semibold text-slate-600 group-hover:text-slate-900">
                          Click to upload
                        </span>
                        <span className="text-xs text-slate-400 mt-1">
                          JPG, PNG
                        </span>
                      </label>
                    )}

                    {/* Image Previews */}
                    {imageFiles.map((file, index) => (
                      <div
                        key={index}
                        className="relative group h-36 bg-slate-100 rounded-xl overflow-hidden border border-slate-200 shadow-sm"
                      >
                        <img
                          src={URL.createObjectURL(file)}
                          alt="Preview"
                          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                        />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                          <button
                            type="button"
                            onClick={() => removeImage(index)}
                            className="bg-white text-red-600 p-2 rounded-full shadow-lg hover:bg-red-50 hover:scale-110 transition-all"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {error && (
                  <div className="bg-red-50 border border-red-100 text-red-600 px-4 py-3 rounded-lg text-sm flex items-center gap-2">
                    <span className="block w-1.5 h-1.5 bg-red-600 rounded-full flex-shrink-0" />
                    {error}
                  </div>
                )}

                <div
                  className="pt-2 animate-scaleIn"
                  style={{ animationDelay: "0.1s" }}
                >
                  <button
                    type="button"
                    onClick={handleNextStep}
                    className="w-full bg-gradient-to-r from-slate-900 to-slate-800 text-white py-4 rounded-xl font-bold hover:shadow-lg hover:scale-[1.01] transition-all flex items-center justify-center gap-2 group"
                  >
                    Next Step
                    <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                  </button>
                </div>
              </div>
            )}

            {/* Step 2: Admin Info */}
            {step === 2 && (
              <div className="space-y-8 animate-fadeIn">
                <div className="flex items-center gap-2 text-slate-900 border-b border-slate-100 pb-3 animate-slideLeft">
                  <UserCircle className="w-5 h-5 text-slate-700" />
                  <h2 className="text-lg font-bold">Admin Account</h2>
                </div>

                <div className="space-y-6">
                  <div
                    className="animate-slideUp"
                    style={{ animationDelay: "0.1s" }}
                  >
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                      Full Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="adminName"
                      value={formData.adminName}
                      onChange={handleInputChange}
                      required
                      className="w-full px-4 py-3 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-900 focus:border-transparent outline-none transition-all text-slate-900"
                      placeholder="Your Name"
                    />
                  </div>

                  <div
                    className="animate-slideUp"
                    style={{ animationDelay: "0.1s" }}
                  >
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                      Admin Email <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="email"
                      name="adminEmail"
                      value={formData.adminEmail}
                      onChange={handleInputChange}
                      required
                      className="w-full px-4 py-3 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-900 focus:border-transparent outline-none transition-all text-slate-900"
                      placeholder="admin@institution.com"
                    />
                  </div>

                  <div
                    className="animate-slideUp"
                    style={{ animationDelay: "0.1s" }}
                  >
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                      Password <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="password"
                      name="adminPassword"
                      value={formData.adminPassword}
                      onChange={handleInputChange}
                      required
                      minLength="6"
                      className="w-full px-4 py-3 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-900 focus:border-transparent outline-none transition-all text-slate-900"
                      placeholder="••••••••"
                    />
                  </div>
                </div>

                {error && (
                  <div className="bg-red-50 border border-red-100 text-red-600 px-4 py-3 rounded-lg text-sm">
                    {error}
                  </div>
                )}

                <div
                  className="bg-amber-50 border border-amber-100 rounded-lg p-5 animate-fadeIn"
                  style={{ animationDelay: "0.2s" }}
                >
                  <h3 className="font-bold text-amber-900 mb-2 flex items-center gap-2">
                    <span className="w-2 h-2 bg-amber-500 rounded-full animate-pulse" />
                    Important Information
                  </h3>
                  <ul className="text-sm text-amber-800 space-y-1.5 list-disc pl-4">
                    <li>
                      Your institution requires manual verification by our team.
                    </li>
                    <li>
                      You will receive an email confirmation once verified.
                    </li>
                    <li>
                      After verification, you can log in to manage courts and
                      bookings.
                    </li>
                  </ul>
                </div>

                <div
                  className="flex gap-4 pt-4 animate-scaleIn"
                  style={{ animationDelay: "0.2s" }}
                >
                  <button
                    type="button"
                    onClick={() => setStep(1)}
                    className="flex-1 border border-slate-300 text-slate-700 py-3.5 rounded-xl font-bold hover:bg-slate-50 transition-colors"
                  >
                    Back
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex-[2] bg-gradient-to-r from-slate-900 to-slate-800 text-white py-3.5 rounded-xl font-bold hover:shadow-lg hover:scale-[1.01] transition-all disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {loading ? (
                      <>
                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        Processing...
                      </>
                    ) : (
                      "Complete Registration"
                    )}
                  </button>
                </div>
              </div>
            )}
          </form>
        </div>
      </div>

      {/* Animation Styles */}
      <style jsx>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }

        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes slideDown {
          from {
            opacity: 0;
            transform: translateY(-20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes slideLeft {
          from {
            opacity: 0;
            transform: translateX(-20px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }

        @keyframes slideRight {
          from {
            opacity: 0;
            transform: translateX(20px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }

        @keyframes scaleIn {
          from {
            opacity: 0;
            transform: scale(0.95);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }

        .animate-fadeIn {
          animation: fadeIn 0.2s ease-out both;
        }

        .animate-slideUp {
          animation: slideUp 0.3s ease-out both;
        }

        .animate-slideDown {
          animation: slideDown 0.2s ease-out both;
        }

        .animate-slideLeft {
          animation: slideLeft 0.2s ease-out both;
        }

        .animate-slideRight {
          animation: slideRight 0.2s ease-out both;
        }

        .animate-scaleIn {
          animation: scaleIn 0.8s ease-out both;
        }
      `}</style>
    </div>
  );
}
