'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Home, Menu, X } from 'lucide-react'

export default function Navbar() {
  const [isScrolled, setIsScrolled] = useState(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20)
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled
          ? 'bg-white/95 backdrop-blur-md shadow-lg border-b border-gray-200'
          : 'bg-gradient-to-b from-black/40 to-transparent'
      }`}
    >
      <div className="px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo / Brand - Left */}
          <Link
            href="/"
            className={`flex items-center gap-2 text-xl font-bold transition-colors ${
              isScrolled ? 'text-gray-900' : 'text-white'
            }`}
          >
            <Home className="w-6 h-6" />
            <span className="hidden sm:inline">CourtBooker</span>
          </Link>

          {/* Desktop Navigation - Right */}
          <div className="hidden md:flex items-center gap-6">

            <Link
              href="/#facilities"
              onClick={(e) => {
                if (window.location.pathname === '/') {
                  e.preventDefault()
                  document.getElementById('facilities')?.scrollIntoView({ behavior: 'smooth' })
                }
              }}
              className={`font-semibold transition-colors cursor-pointer ${
                isScrolled
                  ? 'text-gray-700 hover:text-slate-900'
                  : 'text-white hover:text-gray-200'
              }`}
            >
              Find Courts
            </Link>
            <Link
              href="/track-booking"
              className={`font-semibold transition-colors ${
                isScrolled
                  ? 'text-gray-700 hover:text-slate-900'
                  : 'text-white hover:text-gray-200'
              }`}
            >
              Track Booking
            </Link>
            <Link
              href="/institution/login"
              className={`px-4 py-2 rounded-lg font-semibold transition-all duration-300 ${
                isScrolled
                  ? 'bg-slate-900 text-white shadow-md hover:bg-black' 
  : 'bg-white text-slate-900 border border-slate-200 hover:bg-slate-50 hover:border-slate-300'
              }`}
            >
              Institution Login
            </Link>
            <Link
              href="/institution/register"
              className={`px-4 py-2 rounded-lg font-semibold transition-all duration-300 ${
                isScrolled
                  ? 'bg-slate-900 text-white shadow-md hover:bg-black' 
  : 'bg-white text-slate-900 border border-slate-200 hover:bg-slate-50 hover:border-slate-300'
              }`}
            >
              Register Institution
            </Link>
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className={`md:hidden p-2 rounded-lg transition-colors ${
              isScrolled
                ? 'text-gray-900 hover:bg-gray-100'
                : 'text-white hover:bg-white/20'
            }`}
          >
            {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <div className="md:hidden bg-white border-t border-gray-200">
          <div className="px-4 py-3 space-y-3">
            <Link
              href="/"
              className="block py-2 text-gray-700 hover:text-slate-900 font-semibold"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              Home
            </Link>
            <Link
              href="/#facilities"
              className="block py-2 text-gray-700 hover:text-slate-900 font-semibold"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              Find Courts
            </Link>
            <Link
              href="/track-booking"
              className="block py-2 text-gray-700 hover:text-slate-900 font-semibold"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              Track Booking
            </Link>
            <Link
              href="/institution/login"
              className="block py-2 px-4 bg-slate-900 text-white rounded-lg text-center font-semibold hover:bg-black shadow-md"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              Institution Login
            </Link>
            <Link
              href="/institution/register"
              className="block py-2 px-4 bg-slate-900 text-white rounded-lg text-center font-semibold hover:bg-black shadow-md"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              Register Institution
            </Link>
          </div>
        </div>
      )}
    </nav>
  )
}
