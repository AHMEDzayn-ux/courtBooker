import Link from 'next/link'
import { Home } from 'lucide-react'

export default function InstitutionLayout({ children }) {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Institution auth pages layout */}
      <nav className="fixed top-0 left-0 right-0 z-50 border-b bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link href="/" className="flex items-center gap-2 text-xl font-bold text-gray-900 hover:text-indigo-600 transition-colors">
              <Home className="w-6 h-6" />
              <span>CourtBooker</span>
            </Link>
            <h1 className="text-lg font-semibold text-gray-700">Institution Portal</h1>
          </div>
        </div>
      </nav>
      
      <div className="pt-16">
        {children}
      </div>
    </div>
  )
}
