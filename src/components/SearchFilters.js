'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { useState, useEffect } from 'react'

export default function SearchFilters({ sports, districts, currentSearch, currentDistrict, currentSport }) {
  const router = useRouter()
  const searchParams = useSearchParams()
  
  const [search, setSearch] = useState(currentSearch)
  const [district, setDistrict] = useState(currentDistrict)
  const [sport, setSport] = useState(currentSport)

  const handleSearch = (e) => {
    e.preventDefault()
    updateFilters()
  }

  const updateFilters = () => {
    const params = new URLSearchParams()
    
    if (search) params.set('search', search)
    if (district) params.set('district', district)
    if (sport) params.set('sport', sport)

    router.push(`/?${params.toString()}`)
  }

  const clearFilters = () => {
    setSearch('')
    setDistrict('')
    setSport('')
    router.push('/')
  }

  const hasActiveFilters = search || district || sport

  return (
    <div className="bg-black rounded-lg shadow-sm border p-6">
      <form onSubmit={handleSearch} className="space-y-4">
        {/* Search Input */}
        <div>
          <label htmlFor="search" className="block text-sm font-medium text-gray-700 mb-2">
            Search by name
          </label>
          <input
            type="text"
            id="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Enter institution name..."
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        {/* Filters Row */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* District Filter */}
          <div>
            <label htmlFor="district" className="block text-sm font-medium text-gray-700 mb-2">
              District
            </label>
            <select
              id="district"
              value={district}
              onChange={(e) => {
                setDistrict(e.target.value)
              }}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">All Districts</option>
              {districts.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
          </div>

          {/* Sport Filter */}
          <div>
            <label htmlFor="sport" className="block text-sm font-medium text-gray-700 mb-2">
              Sport Type
            </label>
            <select
              id="sport"
              value={sport}
              onChange={(e) => {
                setSport(e.target.value)
              }}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">All Sports</option>
              {sports.map((s) => (
                <option key={s.id} value={s.name}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3">
          <button
            type="submit"
            className="flex-1 bg-blue-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors"
          >
            Search
          </button>
          {hasActiveFilters && (
            <button
              type="button"
              onClick={clearFilters}
              className="px-6 py-2 border border-gray-300 rounded-lg font-medium text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Clear
            </button>
          )}
        </div>
      </form>
    </div>
  )
}
