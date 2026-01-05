'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

export default function CourtsPage() {
  const router = useRouter()
  const [courts, setCourts] = useState([])
  const [sports, setSports] = useState([])
  const [institutionId, setInstitutionId] = useState(null)
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingCourt, setEditingCourt] = useState(null)
  const [formData, setFormData] = useState({
    name: '',
    opening_time: '06:00',
    closing_time: '22:00',
    slot_duration_minutes: 60,
    price_per_slot: 0,
    is_enabled: true,
    selectedSports: []
  })

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      router.push('/institution/login')
      return
    }

    // Fetch courts via API
    const courtsResponse = await fetch('/api/courts')
    const courtsData = await courtsResponse.json()

    // Fetch sports
    const { data: sportsData } = await supabase
      .from('sports')
      .select('*')
      .order('name')

    setCourts(courtsData.courts || [])
    setSports(sportsData || [])
    
    // Get institution ID for later use
    const { data: adminData } = await supabase
      .from('institution_admins')
      .select('institution_id')
      .eq('id', user.id)
      .single()
    
    setInstitutionId(adminData?.institution_id)
    setLoading(false)
  }

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }))
  }

  const handleSportToggle = (sportId) => {
    setFormData(prev => ({
      ...prev,
      selectedSports: prev.selectedSports.includes(sportId)
        ? prev.selectedSports.filter(id => id !== sportId)
        : [...prev.selectedSports, sportId]
    }))
  }

  const openAddModal = () => {
    setEditingCourt(null)
    setFormData({
      name: '',
      opening_time: '06:00',
      closing_time: '22:00',
      slot_duration_minutes: 60,
      price_per_slot: 0,
      is_enabled: true,
      selectedSports: []
    })
    setShowModal(true)
  }

  const openEditModal = (court) => {
    setEditingCourt(court)
    setFormData({
      name: court.name,
      opening_time: court.opening_time.substring(0, 5),
      closing_time: court.closing_time.substring(0, 5),
      slot_duration_minutes: court.slot_duration_minutes,
      price_per_slot: court.price_per_slot,
      is_enabled: court.is_enabled,
      selectedSports: court.court_sports?.map(cs => cs.sport_id) || []
    })
    setShowModal(true)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    try {
      const endpoint = '/api/courts'
      const method = editingCourt ? 'PUT' : 'POST'
      
      const body = editingCourt
        ? {
            courtId: editingCourt.id,
            name: formData.name,
            opening_time: formData.opening_time,
            closing_time: formData.closing_time,
            slot_duration_minutes: formData.slot_duration_minutes,
            price_per_slot: formData.price_per_slot,
            is_enabled: formData.is_enabled,
            selectedSports: formData.selectedSports
          }
        : {
            name: formData.name,
            opening_time: formData.opening_time,
            closing_time: formData.closing_time,
            slot_duration_minutes: formData.slot_duration_minutes,
            price_per_slot: formData.price_per_slot,
            is_enabled: formData.is_enabled,
            selectedSports: formData.selectedSports
          }

      const response = await fetch(endpoint, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error)
      }

      setShowModal(false)
      fetchData()
      alert(editingCourt ? 'Court updated successfully!' : 'Court created successfully!')

    } catch (error) {
      console.error('Error:', error)
      alert('Failed to save court')
    }
  }

  const handleDelete = async (courtId) => {
    if (!confirm('Are you sure you want to delete this court? All associated bookings will remain.')) {
      return
    }

    try {
      const response = await fetch(`/api/courts?courtId=${courtId}`, {
        method: 'DELETE'
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error)
      }

      fetchData()
      alert('Court deleted successfully!')
    } catch (error) {
      console.error('Error:', error)
      alert('Failed to delete court')
    }
  }

  const toggleCourtStatus = async (court) => {
    try {
      const response = await fetch('/api/courts', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          courtId: court.id,
          name: court.name,
          opening_time: court.opening_time.substring(0, 5),
          closing_time: court.closing_time.substring(0, 5),
          slot_duration_minutes: court.slot_duration_minutes,
          price_per_slot: court.price_per_slot,
          is_enabled: !court.is_enabled,
          selectedSports: court.court_sports?.map(cs => cs.sport_id) || []
        })
      })

      if (response.ok) {
        fetchData()
      }
    } catch (error) {
      console.error('Error:', error)
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-gray-600">Loading...</div>
      </div>
    )
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Manage Courts</h1>
        <button
          onClick={openAddModal}
          className="bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700"
        >
          Add New Court
        </button>
      </div>

      {courts.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-12 text-center">
          <p className="text-gray-500 mb-4">No courts added yet. Add your first court to start receiving bookings.</p>
          <button
            onClick={openAddModal}
            className="bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700"
          >
            Add Your First Court
          </button>
        </div>
      ) : (
        <div className="grid gap-6">
          {courts.map((court) => (
            <div key={court.id} className="bg-white rounded-lg shadow p-6">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-3">
                    <h3 className="text-xl font-semibold text-gray-900">{court.name}</h3>
                    <span className={`px-3 py-1 text-sm rounded-full ${
                      court.is_enabled 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {court.is_enabled ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                  
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <p className="text-gray-500">Opening Time</p>
                      <p className="font-semibold text-gray-900">{court.opening_time.substring(0, 5)}</p>
                    </div>
                    <div>
                      <p className="text-gray-500">Closing Time</p>
                      <p className="font-semibold text-gray-900">{court.closing_time.substring(0, 5)}</p>
                    </div>
                    <div>
                      <p className="text-gray-500">Slot Duration</p>
                      <p className="font-semibold text-gray-900">{court.slot_duration_minutes} mins</p>
                    </div>
                    <div>
                      <p className="text-gray-500">Price per Slot</p>
                      <p className="font-semibold text-green-600">LKR {parseFloat(court.price_per_slot).toFixed(2)}</p>
                    </div>
                  </div>

                  <div className="mt-3">
                    <p className="text-gray-500 text-sm mb-2">Available Sports:</p>
                    <div className="flex flex-wrap gap-2">
                      {court.court_sports?.map(cs => (
                        <span key={cs.sport_id} className="px-3 py-1 bg-blue-100 text-blue-800 text-sm rounded-full">
                          {cs.sports.name}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => toggleCourtStatus(court)}
                    className={`px-4 py-2 rounded-lg font-semibold ${
                      court.is_enabled
                        ? 'bg-gray-200 text-gray-800 hover:bg-gray-300'
                        : 'bg-green-200 text-green-800 hover:bg-green-300'
                    }`}
                  >
                    {court.is_enabled ? 'Disable' : 'Enable'}
                  </button>
                  <button
                    onClick={() => openEditModal(court)}
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-blue-700"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(court.id)}
                    className="bg-red-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-red-700"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6">
            <h2 className="text-2xl font-bold mb-4">
              {editingCourt ? 'Edit Court' : 'Add New Court'}
            </h2>

            <form onSubmit={handleSubmit}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Court Name *
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="e.g., Court 1, Main Arena"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Opening Time *
                    </label>
                    <input
                      type="time"
                      name="opening_time"
                      value={formData.opening_time}
                      onChange={handleInputChange}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Closing Time *
                    </label>
                    <input
                      type="time"
                      name="closing_time"
                      value={formData.closing_time}
                      onChange={handleInputChange}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Slot Duration (minutes) *
                    </label>
                    <input
                      type="number"
                      name="slot_duration_minutes"
                      value={formData.slot_duration_minutes}
                      onChange={handleInputChange}
                      required
                      min="15"
                      step="15"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Price per Slot (LKR) *
                    </label>
                    <input
                      type="number"
                      name="price_per_slot"
                      value={formData.price_per_slot}
                      onChange={handleInputChange}
                      required
                      min="0"
                      step="0.01"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Available Sports *
                  </label>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {sports.map((sport) => (
                      <label key={sport.id} className="flex items-center space-x-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={formData.selectedSports.includes(sport.id)}
                          onChange={() => handleSportToggle(sport.id)}
                          className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                        />
                        <span className="text-sm text-gray-700">{sport.name}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="checkbox"
                      name="is_enabled"
                      checked={formData.is_enabled}
                      onChange={handleInputChange}
                      className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                    <span className="text-sm font-medium text-gray-700">Court is active and accepting bookings</span>
                  </label>
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  type="submit"
                  className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg font-semibold hover:bg-blue-700"
                >
                  {editingCourt ? 'Update Court' : 'Create Court'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 bg-gray-200 text-gray-800 py-2 px-4 rounded-lg font-semibold hover:bg-gray-300"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
