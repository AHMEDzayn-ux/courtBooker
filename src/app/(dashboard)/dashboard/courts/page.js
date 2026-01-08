"use client";

import { useEffect, useState, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import BlockSlotsModal from "@/components/BlockSlotsModal";

export default function CourtsPage() {
  const router = useRouter();
  const [courts, setCourts] = useState([]);
  const [sports, setSports] = useState([]);
  const [institutionId, setInstitutionId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingCourt, setEditingCourt] = useState(null);
  const [showBlockSlotsModal, setShowBlockSlotsModal] = useState(false);
  const [selectedCourtForBlocking, setSelectedCourtForBlocking] =
    useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [courtToDelete, setCourtToDelete] = useState(null);
  const [deletePassword, setDeletePassword] = useState("");
  const [formData, setFormData] = useState({
    name: "",
    opening_time: "06:00",
    closing_time: "22:00",
    slot_duration_minutes: 60,
    price_per_slot: 0,
    is_enabled: true,
    selectedSports: [],
  });

  const fetchData = useCallback(async () => {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      router.push("/institution/login");
      return;
    }

    // Fetch courts via API
    const courtsResponse = await fetch("/api/courts");
    const courtsData = await courtsResponse.json();

    // Fetch sports
    const { data: sportsData } = await supabase
      .from("sports")
      .select("*")
      .order("name");

    setCourts(courtsData.courts || []);
    setSports(sportsData || []);

    const { data: adminData } = await supabase
      .from("institution_admins")
      .select("institution_id")
      .eq("id", user.id)
      .single();

    setInstitutionId(adminData?.institution_id);
    setLoading(false);
  }, [router]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleSportToggle = (sportId) => {
    setFormData((prev) => ({
      ...prev,
      selectedSports: prev.selectedSports.includes(sportId)
        ? prev.selectedSports.filter((id) => id !== sportId)
        : [...prev.selectedSports, sportId],
    }));
  };

  const openAddModal = () => {
    setEditingCourt(null);
    setFormData({
      name: "",
      opening_time: "06:00",
      closing_time: "22:00",
      slot_duration_minutes: 60,
      price_per_slot: 0,
      is_enabled: true,
      selectedSports: [],
    });
    setShowModal(true);
  };

  const openEditModal = (court) => {
    setEditingCourt(court);
    setFormData({
      name: court.name,
      opening_time: court.opening_time.substring(0, 5),
      closing_time: court.closing_time.substring(0, 5),
      slot_duration_minutes: court.slot_duration_minutes,
      price_per_slot: court.price_per_slot,
      is_enabled: court.is_enabled,
      selectedSports: court.court_sports?.map((cs) => cs.sport_id) || [],
    });
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const endpoint = "/api/courts";
      const method = editingCourt ? "PUT" : "POST";

      const body = {
        courtId: editingCourt?.id,
        ...formData,
      };

      const response = await fetch(endpoint, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error);
      }

      setShowModal(false);
      fetchData();
      alert(
        editingCourt
          ? "Court updated successfully!"
          : "Court created successfully!"
      );
    } catch (error) {
      console.error("Error:", error);
      alert("Failed to save court");
    }
  };

  const handleDelete = async (courtId) => {
    if (!deletePassword) {
      alert("Please enter your password to confirm deletion");
      return;
    }

    try {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: user.email,
        password: deletePassword,
      });

      if (signInError) {
        alert("Incorrect password. Deletion cancelled.");
        setShowDeleteModal(false);
        setDeletePassword("");
        setCourtToDelete(null);
        return;
      }

      const response = await fetch(`/api/courts?courtId=${courtId}`, {
        method: "DELETE",
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error);
      }

      setShowDeleteModal(false);
      setDeletePassword("");
      setCourtToDelete(null);
      fetchData();
      alert("Court deleted successfully!");
    } catch (error) {
      console.error("Error:", error);
      alert("Failed to delete court");
      setShowDeleteModal(false);
      setDeletePassword("");
      setCourtToDelete(null);
    }
  };

  const toggleCourtStatus = async (court) => {
    try {
      const response = await fetch("/api/courts", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          courtId: court.id,
          name: court.name,
          opening_time: court.opening_time.substring(0, 5),
          closing_time: court.closing_time.substring(0, 5),
          slot_duration_minutes: court.slot_duration_minutes,
          price_per_slot: court.price_per_slot,
          is_enabled: !court.is_enabled,
          selectedSports: court.court_sports?.map((cs) => cs.sport_id) || [],
        }),
      });

      if (response.ok) {
        fetchData();
      }
    } catch (error) {
      console.error("Error:", error);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-gray-50">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Manage Courts</h1>
            <p className="text-sm text-gray-500 mt-1">
              View and manage your facility's courts and configurations
            </p>
          </div>
          <button
            onClick={openAddModal}
            className="inline-flex items-center justify-center bg-gray-900 text-white px-5 py-2.5 rounded-lg font-medium hover:bg-gray-800 transition-colors shadow-sm text-sm"
          >
            + Add New Court
          </button>
        </div>

        {courts.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
            <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl">🏟️</span>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              No courts found
            </h3>
            <p className="text-gray-500 mb-6 max-w-sm mx-auto">
              Get started by adding your first court to accept bookings.
            </p>
            <button
              onClick={openAddModal}
              className="text-blue-600 font-semibold hover:text-blue-700 text-sm"
            >
              Create a Court &rarr;
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6">
            {courts.map((court) => (
              <div
                key={court.id}
                className="bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow duration-200 overflow-hidden group"
              >
                {/* Main Content Area */}
                <div className="p-5 sm:p-6">
                  <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                    {/* Left: Info */}
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-bold text-gray-900">
                          {court.name}
                        </h3>
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${
                            court.is_enabled
                              ? "bg-green-50 text-green-700 border-green-200"
                              : "bg-gray-50 text-gray-600 border-gray-200"
                          }`}
                        >
                          {court.is_enabled ? "Active" : "Disabled"}
                        </span>
                      </div>

                      {/* Sports Tags */}
                      <div className="flex flex-wrap gap-2 mb-4">
                        {court.court_sports?.map((cs) => (
                          <span
                            key={cs.sport_id}
                            className="inline-flex items-center px-2 py-1 bg-gray-50 text-gray-600 text-xs rounded border border-gray-200"
                          >
                            {cs.sports.name}
                          </span>
                        ))}
                      </div>

                      {/* Stats Grid */}
                      <div className="flex flex-wrap items-center gap-x-8 gap-y-2 text-sm text-gray-600">
                        <div className="flex items-center gap-2">
                          <span className="text-gray-400">🕒</span>
                          <span className="font-medium text-gray-900">
                            {court.opening_time.substring(0, 5)} -{" "}
                            {court.closing_time.substring(0, 5)}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-gray-400">⏱️</span>
                          <span>{court.slot_duration_minutes} min slots</span>
                        </div>
                      </div>
                    </div>

                    {/* Right: Price */}
                    <div className="flex-shrink-0 md:text-right mt-2 md:mt-0">
                      <p className="text-xs text-gray-500 uppercase tracking-wide font-medium mb-1">
                        Price Per Slot
                      </p>
                      <p className="text-xl font-bold text-gray-900">
                        <span className="text-sm font-normal text-gray-500 mr-1">
                          LKR
                        </span>
                        {parseFloat(court.price_per_slot).toFixed(2)}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Footer / Actions Toolbar */}
                <div className="bg-gray-50 border-t border-gray-100 px-5 py-3 flex flex-wrap items-center justify-between gap-3">
                  <button
                    onClick={() => {
                      setSelectedCourtForBlocking(court);
                      setShowBlockSlotsModal(true);
                    }}
                    className="text-sm font-medium text-gray-700 hover:text-gray-900 hover:bg-white px-3 py-1.5 rounded-md transition-colors border border-transparent hover:border-gray-200 hover:shadow-sm"
                  >
                    📅 Manage Slots
                  </button>

                  <div className="flex items-center gap-2 ml-auto">
                    <button
                      onClick={() => toggleCourtStatus(court)}
                      className={`text-sm font-medium px-3 py-1.5 rounded-md transition-colors ${
                        court.is_enabled
                          ? "text-amber-600 hover:text-amber-700 hover:bg-amber-50"
                          : "text-green-600 hover:text-green-700 hover:bg-green-50"
                      }`}
                    >
                      {court.is_enabled ? "Disable" : "Enable"}
                    </button>

                    <div className="w-px h-4 bg-gray-300 mx-1"></div>

                    <button
                      onClick={() => openEditModal(court)}
                      className="text-sm font-medium text-blue-600 hover:text-blue-700 px-3 py-1.5 rounded-md hover:bg-blue-50 transition-colors"
                    >
                      Edit
                    </button>

                    <button
                      onClick={() => {
                        setCourtToDelete(court.id);
                        setShowDeleteModal(true);
                      }}
                      className="text-sm font-medium text-red-600 hover:text-red-700 px-3 py-1.5 rounded-md hover:bg-red-50 transition-colors"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* --- Modals Section --- */}

        {/* Edit/Add Modal */}
        {showModal && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6 border-b border-gray-100">
                <h2 className="text-xl font-bold text-gray-900">
                  {editingCourt ? "Edit Court Details" : "Add New Court"}
                </h2>
              </div>

              <div className="p-6">
                <form onSubmit={handleSubmit}>
                  <div className="space-y-6">
                    {/* Name Section */}
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                        Court Name
                      </label>
                      <input
                        type="text"
                        name="name"
                        value={formData.name}
                        onChange={handleInputChange}
                        required
                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent transition-all outline-none"
                        placeholder="e.g. Badminton Court 1"
                      />
                    </div>

                    {/* Timing Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="bg-gray-50 p-4 rounded-lg border border-gray-100">
                        <h3 className="text-xs font-bold text-gray-500 uppercase mb-3">
                          Schedule
                        </h3>
                        <div className="space-y-3">
                          <div>
                            <label className="block text-xs font-medium text-gray-600 mb-1">
                              Opening Time
                            </label>
                            <input
                              type="time"
                              name="opening_time"
                              value={formData.opening_time}
                              onChange={handleInputChange}
                              required
                              className="w-full px-3 py-2 bg-white border border-gray-300 rounded-md text-sm"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-gray-600 mb-1">
                              Closing Time
                            </label>
                            <input
                              type="time"
                              name="closing_time"
                              value={formData.closing_time}
                              onChange={handleInputChange}
                              required
                              className="w-full px-3 py-2 bg-white border border-gray-300 rounded-md text-sm"
                            />
                          </div>
                        </div>
                      </div>

                      <div className="bg-gray-50 p-4 rounded-lg border border-gray-100">
                        <h3 className="text-xs font-bold text-gray-500 uppercase mb-3">
                          Booking Rules
                        </h3>
                        <div className="space-y-3">
                          <div>
                            <label className="block text-xs font-medium text-gray-600 mb-1">
                              Slot Duration (min)
                            </label>
                            <input
                              type="number"
                              name="slot_duration_minutes"
                              value={formData.slot_duration_minutes}
                              onChange={handleInputChange}
                              required
                              min="15"
                              step="15"
                              className="w-full px-3 py-2 bg-white border border-gray-300 rounded-md text-sm"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-gray-600 mb-1">
                              Price per Slot (LKR)
                            </label>
                            <input
                              type="number"
                              name="price_per_slot"
                              value={formData.price_per_slot}
                              onChange={handleInputChange}
                              required
                              min="0"
                              step="0.01"
                              className="w-full px-3 py-2 bg-white border border-gray-300 rounded-md text-sm"
                            />
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Sports Selection */}
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-3">
                        Supported Sports
                      </label>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                        {sports.map((sport) => (
                          <label
                            key={sport.id}
                            className={`flex items-center p-3 rounded-lg border cursor-pointer transition-all ${
                              formData.selectedSports.includes(sport.id)
                                ? "bg-blue-50 border-blue-200 text-blue-800"
                                : "bg-white border-gray-200 hover:bg-gray-50"
                            }`}
                          >
                            <input
                              type="checkbox"
                              checked={formData.selectedSports.includes(
                                sport.id
                              )}
                              onChange={() => handleSportToggle(sport.id)}
                              className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                            />
                            <span className="ml-2 text-sm font-medium">
                              {sport.name}
                            </span>
                          </label>
                        ))}
                      </div>
                    </div>

                    {/* Status Checkbox */}
                    <div className="pt-2">
                      <label className="flex items-center space-x-3 cursor-pointer group">
                        <input
                          type="checkbox"
                          name="is_enabled"
                          checked={formData.is_enabled}
                          onChange={handleInputChange}
                          className="w-5 h-5 text-gray-900 border-gray-300 rounded focus:ring-gray-900"
                        />
                        <span className="text-sm text-gray-700 group-hover:text-gray-900">
                          Make this court active immediately
                        </span>
                      </label>
                    </div>
                  </div>

                  <div className="flex gap-3 mt-8 pt-4 border-t border-gray-100">
                    <button
                      type="button"
                      onClick={() => setShowModal(false)}
                      className="flex-1 bg-white text-gray-700 border border-gray-300 py-2.5 px-4 rounded-lg font-semibold hover:bg-gray-50 transition-colors text-sm"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="flex-1 bg-gray-900 text-white py-2.5 px-4 rounded-lg font-semibold hover:bg-gray-800 transition-colors shadow-sm text-sm"
                    >
                      {editingCourt ? "Save Changes" : "Create Court"}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}

        {/* Block Slots Modal */}
        {showBlockSlotsModal && selectedCourtForBlocking && (
          <BlockSlotsModal
            court={selectedCourtForBlocking}
            onClose={() => {
              setShowBlockSlotsModal(false);
              setSelectedCourtForBlocking(null);
            }}
            onSuccess={() => {
              setShowBlockSlotsModal(false);
              setSelectedCourtForBlocking(null);
            }}
          />
        )}

        {/* Delete Confirmation Modal */}
        {showDeleteModal && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-2xl max-w-md w-full overflow-hidden">
              <div className="p-6">
                <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mb-4">
                  <span className="text-xl">⚠️</span>
                </div>
                <h2 className="text-xl font-bold text-gray-900 mb-2">
                  Delete Court?
                </h2>
                <p className="text-gray-600 text-sm mb-6">
                  This action is permanent. All upcoming bookings associated
                  with this court might be affected. Please enter your password
                  to confirm.
                </p>

                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">
                      Password Required
                    </label>
                    <input
                      type="password"
                      value={deletePassword}
                      onChange={(e) => setDeletePassword(e.target.value)}
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent outline-none"
                      placeholder="Enter your login password"
                      autoFocus
                    />
                  </div>

                  <div className="flex gap-3">
                    <button
                      onClick={() => {
                        setShowDeleteModal(false);
                        setDeletePassword("");
                        setCourtToDelete(null);
                      }}
                      className="flex-1 bg-white text-gray-700 border border-gray-300 py-2.5 px-4 rounded-lg font-semibold hover:bg-gray-50 transition-colors text-sm"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={() => handleDelete(courtToDelete)}
                      className="flex-1 bg-red-600 text-white py-2.5 px-4 rounded-lg font-semibold hover:bg-red-700 shadow-sm transition-colors text-sm"
                    >
                      Delete Court
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
