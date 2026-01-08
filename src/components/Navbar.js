"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Menu, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import Logo from "./Logo";

export default function Navbar() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled
          ? "bg-white/95 backdrop-blur-md shadow-lg border-b border-gray-200"
          : "bg-gradient-to-b from-black/40 to-transparent"
      }`}
    >
      <div className="px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo / Brand - Left */}
          <Link
            href="/"
            className={`flex items-center gap-2 text-lg font-bold transition-colors ${
              isScrolled ? "text-gray-900" : "text-white"
            }`}
          >
            <Logo
              className="w-7 h-7"
              color={isScrolled ? "#1e293b" : "#ffffff"}
            />
            <span
              className={`hidden sm:inline ${
                isScrolled ? "text-slate-700" : ""
              }`}
            >
              CourtBooker
            </span>
          </Link>

          {/* Desktop Navigation - Right */}
          <div className="hidden md:flex items-center gap-6">
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.1 }}
            >
              <Link
                href="/#facilities"
                onClick={(e) => {
                  if (window.location.pathname === "/") {
                    e.preventDefault();
                    document
                      .getElementById("facilities")
                      ?.scrollIntoView({ behavior: "smooth" });
                  }
                }}
                className={`text-sm font-medium transition-colors cursor-pointer hover:scale-105 inline-block ${
                  isScrolled
                    ? "text-slate-700 hover:text-slate-900"
                    : "text-white hover:text-gray-200"
                }`}
              >
                Find Courts
              </Link>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.2 }}
            >
              <Link
                href="/track-booking"
                className={`text-sm font-medium transition-colors hover:scale-105 inline-block ${
                  isScrolled
                    ? "text-slate-700 hover:text-slate-900"
                    : "text-white hover:text-gray-200"
                }`}
              >
                Track Booking
              </Link>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.3 }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Link
                href="/institution/login"
                className={`px-3 py-2 rounded-md text-sm font-medium transition-all duration-300 inline-block ${
                  isScrolled
                    ? "bg-slate-800 text-white shadow-md hover:bg-slate-900 active:bg-slate-900"
                    : "bg-white text-slate-900 border border-slate-200 hover:bg-slate-50 hover:border-slate-300 active:bg-slate-900 active:text-white"
                }`}
              >
                Institution Login
              </Link>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.4 }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Link
                href="/institution/register"
                className={`px-3 py-2 rounded-md text-sm font-medium transition-all duration-300 inline-block ${
                  isScrolled
                    ? "bg-slate-800 text-white shadow-md hover:bg-slate-900 active:bg-slate-900"
                    : "bg-white text-slate-900 border border-slate-200 hover:bg-slate-50 hover:border-slate-300 active:bg-slate-900 active:text-white"
                }`}
              >
                Register Institution
              </Link>
            </motion.div>
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className={`md:hidden p-2 rounded-lg transition-colors ${
              isScrolled
                ? "text-gray-900 hover:bg-gray-100"
                : "text-white hover:bg-white/20"
            }`}
          >
            {isMobileMenuOpen ? (
              <X className="w-5 h-5" />
            ) : (
              <Menu className="w-5 h-5" />
            )}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            className="md:hidden bg-white border-t border-gray-200 overflow-hidden"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
          >
            <div className="px-4 py-3 space-y-2">
              <motion.div
                initial={{ x: -20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 0.1 }}
              >
                <Link
                  href="/"
                  className="block py-2 text-sm text-gray-700 hover:text-slate-900 font-medium"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  Home
                </Link>
              </motion.div>
              <motion.div
                initial={{ x: -20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 0.15 }}
              >
                <Link
                  href="/#facilities"
                  className="block py-2 text-sm text-slate-700 hover:text-slate-900 font-medium"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  Find Courts
                </Link>
              </motion.div>
              <motion.div
                initial={{ x: -20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 0.2 }}
              >
                <Link
                  href="/track-booking"
                  className="block py-2 text-sm text-slate-700 hover:text-slate-900 font-medium"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  Track Booking
                </Link>
              </motion.div>
              <motion.div
                initial={{ x: -20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 0.25 }}
              >
                <Link
                  href="/institution/login"
                  className="block py-2 px-3 bg-slate-700 text-white text-sm rounded-md text-center font-medium hover:bg-slate-900 active:bg-slate-900 shadow-sm"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  Institution Login
                </Link>
              </motion.div>
              <motion.div
                initial={{ x: -20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 0.3 }}
              >
                <Link
                  href="/institution/register"
                  className="block py-2 px-3 bg-slate-900 text-white text-sm rounded-md text-center font-medium hover:bg-slate-900 active:bg-slate-900 shadow-sm"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  Register Institution
                </Link>
              </motion.div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}