"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Home,
  Menu,
  X,
  LayoutDashboard,
  Building2,
  Calendar,
  Settings,
  LogOut,
} from "lucide-react";

export default function DashboardLayout({ children }) {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [institution, setInstitution] = useState(null);
  const [loading, setLoading] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const supabase = createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      router.push("/institution/login");
      return;
    }

    // Get institution admin data
    const { data: adminData } = await supabase
      .from("institution_admins")
      .select("institution_id, institutions(id, name, is_verified)")
      .eq("id", user.id)
      .single();

    if (!adminData) {
      router.push("/institution/login");
      return;
    }

    setUser(user);
    setInstitution(adminData.institutions);
    setLoading(false);
  };

  const handleSignOut = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/institution/login");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top Navigation */}
      <nav className="bg-white border-b border-gray-200 fixed top-0 left-0 right-0 z-50">
        <div className="max-w-full px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Left: Logo/Brand */}
            <div className="flex items-center gap-3 min-w-0">
              <Link
                href="/dashboard"
                className="flex items-center gap-2 text-blue-600 hover:text-blue-700 transition-colors shrink-0"
                title="Dashboard Home"
              >
                <Home className="w-5 h-5" />
              </Link>
              <div className="border-l border-gray-300 h-6 shrink-0"></div>
              <div className="flex items-center gap-2 min-w-0">
                <h1 className="text-base sm:text-lg font-bold text-gray-900 truncate">
                  {institution?.name}
                </h1>
                {!institution?.is_verified && (
                  <span className="hidden sm:inline-flex px-2 py-1 text-xs bg-yellow-100 text-yellow-800 rounded-full whitespace-nowrap">
                    Pending
                  </span>
                )}
              </div>
            </div>

            {/* Center: Desktop Navigation */}
            <div className="hidden lg:flex items-center gap-1">
              <Link
                href="/dashboard"
                className="flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-600 rounded-lg font-medium transition-colors"
              >
                <LayoutDashboard className="w-4 h-4" />
                Dashboard
              </Link>
              <Link
                href="/dashboard/courts"
                className="flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-600 rounded-lg font-medium transition-colors"
              >
                <Building2 className="w-4 h-4" />
                Courts
              </Link>
              <Link
                href="/dashboard/bookings"
                className="flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-600 rounded-lg font-medium transition-colors"
              >
                <Calendar className="w-4 h-4" />
                Bookings
              </Link>
              <Link
                href="/dashboard/settings"
                className="flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-600 rounded-lg font-medium transition-colors"
              >
                <Settings className="w-4 h-4" />
                Settings
              </Link>
            </div>

            {/* Right: Desktop Menu */}
            <div className="hidden lg:flex items-center gap-3">
              <Link
                href="/"
                className="text-sm text-gray-600 hover:text-gray-900 font-medium whitespace-nowrap"
              >
                View Site
              </Link>
              <button
                onClick={handleSignOut}
                className="flex items-center gap-2 text-sm text-red-600 hover:text-red-700 font-medium"
              >
                <LogOut className="w-4 h-4" />
                Sign Out
              </button>
            </div>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg"
            >
              {mobileMenuOpen ? (
                <X className="w-6 h-6" />
              ) : (
                <Menu className="w-6 h-6" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="lg:hidden bg-white border-t border-gray-200">
            <div className="px-4 py-3 space-y-2">
              <Link
                href="/dashboard"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-3 px-4 py-3 text-gray-700 hover:bg-blue-50 hover:text-blue-600 rounded-lg font-medium"
              >
                <LayoutDashboard className="w-5 h-5" />
                Dashboard
              </Link>
              <Link
                href="/dashboard/courts"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-3 px-4 py-3 text-gray-700 hover:bg-blue-50 hover:text-blue-600 rounded-lg font-medium"
              >
                <Building2 className="w-5 h-5" />
                Courts
              </Link>
              <Link
                href="/dashboard/bookings"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-3 px-4 py-3 text-gray-700 hover:bg-blue-50 hover:text-blue-600 rounded-lg font-medium"
              >
                <Calendar className="w-5 h-5" />
                Bookings
              </Link>
              <Link
                href="/dashboard/settings"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-3 px-4 py-3 text-gray-700 hover:bg-blue-50 hover:text-blue-600 rounded-lg font-medium"
              >
                <Settings className="w-5 h-5" />
                Settings
              </Link>
              <div className="border-t border-gray-200 my-2"></div>
              <Link
                href="/"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-3 px-4 py-3 text-gray-600 hover:bg-gray-50 rounded-lg font-medium"
              >
                View Site
              </Link>
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  handleSignOut();
                }}
                className="w-full flex items-center gap-3 px-4 py-3 text-red-600 hover:bg-red-50 rounded-lg font-medium"
              >
                <LogOut className="w-5 h-5" />
                Sign Out
              </button>
            </div>
          </div>
        )}
      </nav>

      {/* Main Content */}
      <main className="pt-16 px-4 sm:px-6 lg:px-8 py-6 max-w-7xl mx-auto">
        {children}
      </main>
    </div>
  );
}
