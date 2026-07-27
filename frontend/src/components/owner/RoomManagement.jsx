import React, { useState, useEffect } from 'react';
import { fetchApi } from '../../services/api';
import { 
  BedDouble, 
  Plus, 
  User, 
  Check, 
  Zap, 
  ShieldCheck, 
  X, 
  Edit3, 
  Trash2,
  CheckCircle2
} from 'lucide-react';

export default function RoomManagement() {
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingRoom, setEditingRoom] = useState(null);

  const [formData, setFormData] = useState({
    room_number: '',
    floor: 1,
    capacity: 2,
    type: 'Double Sharing',
    ac_type: 'Non-AC',
    monthly_rent: 6500,
    amenities: ['Wi-Fi', 'Study Table', 'Attached Bath']
  });

  useEffect(() => {
    loadRooms();
  }, []);

  const loadRooms = async () => {
    try {
      setLoading(true);
      const res = await fetchApi('/rooms');
      setRooms(res.rooms || []);
    } catch (err) {
      console.error('Failed loading rooms:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateRoom = async (e) => {
    e.preventDefault();
    try {
      await fetchApi('/rooms', {
        method: 'POST',
        body: JSON.stringify(formData)
      });
      setShowAddModal(false);
      resetForm();
      loadRooms();
    } catch (err) {
      alert('Error creating room: ' + err.message);
    }
  };

  const handleUpdateRoom = async (e) => {
    e.preventDefault();
    if (!editingRoom) return;
    try {
      await fetchApi(`/rooms/${editingRoom.id}`, {
        method: 'PUT',
        body: JSON.stringify(formData)
      });
      setEditingRoom(null);
      resetForm();
      loadRooms();
    } catch (err) {
      alert('Error updating room: ' + err.message);
    }
  };

  const handleDeleteRoom = async (id, roomNum) => {
    if (!window.confirm(`Delete Room ${roomNum}? Any assigned students will be unassigned.`)) return;
    try {
      await fetchApi(`/rooms/${id}`, { method: 'DELETE' });
      loadRooms();
    } catch (err) {
      alert('Error deleting room: ' + err.message);
    }
  };

  const resetForm = () => {
    setFormData({
      room_number: '',
      floor: 1,
      capacity: 2,
      type: 'Double Sharing',
      ac_type: 'Non-AC',
      monthly_rent: 6500,
      amenities: ['Wi-Fi', 'Study Table', 'Attached Bath']
    });
  };

  const toggleAmenity = (item) => {
    if (formData.amenities.includes(item)) {
      setFormData({ ...formData, amenities: formData.amenities.filter((a) => a !== item) });
    } else {
      setFormData({ ...formData, amenities: [...formData.amenities, item] });
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-extrabold text-white flex items-center gap-2">
            <BedDouble className="w-5 h-5 text-indigo-400" /> Room & Bed Allocation
          </h2>
          <p className="text-xs text-slate-400 mt-1">Track room capacities, bed maps, AC features, and amenities.</p>
        </div>

        <button
          onClick={() => {
            resetForm();
            setShowAddModal(true);
          }}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-lg shadow-indigo-600/20 transition-all"
        >
          <Plus className="w-4 h-4" /> Add New Room
        </button>
      </div>

      {/* Room Cards Grid */}
      {loading ? (
        <div className="p-8 text-center text-slate-500 text-xs">Loading rooms data...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {rooms.map((room) => {
            const occupancyPct = Math.min(100, Math.round((room.occupied_beds / room.capacity) * 100));
            return (
              <div
                key={room.id}
                className="rounded-2xl bg-slate-900/80 border border-slate-800 p-5 shadow-xl flex flex-col justify-between hover:border-slate-700 transition-all"
              >
                <div>
                  {/* Room Number & AC Badge */}
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2.5">
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500/20 to-purple-500/20 text-indigo-400 font-extrabold text-sm flex items-center justify-center border border-indigo-500/20">
                        #{room.room_number}
                      </div>
                      <div>
                        <h3 className="font-bold text-white text-sm">Room {room.room_number}</h3>
                        <p className="text-[11px] text-slate-400">Floor {room.floor} • {room.type}</p>
                      </div>
                    </div>

                    <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold border ${
                      room.ac_type === 'AC' 
                        ? 'bg-sky-500/10 text-sky-400 border-sky-500/20' 
                        : 'bg-slate-800 text-slate-400 border-slate-700'
                    }`}>
                      {room.ac_type === 'AC' ? '⚡ AC Room' : 'Non-AC'}
                    </span>
                  </div>

                  {/* Monthly Rent */}
                  <p className="text-xs font-semibold text-slate-300 mb-3">
                    Rent: <span className="text-indigo-400 font-bold text-sm">₹{room.monthly_rent?.toLocaleString('en-IN')}</span> / month
                  </p>

                  {/* Occupancy Progress Bar */}
                  <div className="mb-4 space-y-1.5">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="font-semibold text-slate-400">Occupancy Capacity</span>
                      <span className="font-bold text-white">{room.occupied_beds} / {room.capacity} Beds ({occupancyPct}%)</span>
                    </div>
                    <div className="w-full h-2 rounded-full bg-slate-950 overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-300 ${
                          occupancyPct === 100 ? 'bg-rose-500' : occupancyPct > 50 ? 'bg-amber-500' : 'bg-emerald-500'
                        }`}
                        style={{ width: `${occupancyPct}%` }}
                      ></div>
                    </div>
                  </div>

                  {/* Visual Bed Allocations Map */}
                  <div className="mb-4">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-2">Bed Allocation Map</p>
                    <div className="grid grid-cols-2 gap-2">
                      {Array.from({ length: room.capacity }).map((_, index) => {
                        const bedNo = index + 1;
                        const occupant = room.occupants ? room.occupants.find((o) => o.bed_number === bedNo || room.occupants.indexOf(o) === index) : null;
                        return (
                          <div
                            key={bedNo}
                            className={`p-2 rounded-xl border text-xs flex items-center gap-2 ${
                              occupant
                                ? 'bg-indigo-950/60 border-indigo-800/60 text-indigo-200'
                                : 'bg-slate-950/40 border-slate-800 text-slate-500'
                            }`}
                          >
                            <BedDouble className={`w-3.5 h-3.5 ${occupant ? 'text-indigo-400' : 'text-slate-600'}`} />
                            <div className="overflow-hidden">
                              <p className="text-[10px] font-bold">Bed #{bedNo}</p>
                              <p className="text-[11px] font-semibold truncate text-white">
                                {occupant ? occupant.name : 'Vacant'}
                              </p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Amenities Tags */}
                  <div className="flex flex-wrap gap-1 mb-4">
                    {Array.isArray(room.amenities) && room.amenities.map((item, i) => (
                      <span key={i} className="px-2 py-0.5 rounded-md bg-slate-950 text-slate-400 text-[10px] font-medium border border-slate-800">
                        ✓ {item}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Footer Controls */}
                <div className="pt-3 border-t border-slate-800 flex items-center justify-end gap-2">
                  <button
                    onClick={() => {
                      setEditingRoom(room);
                      setFormData({
                        room_number: room.room_number,
                        floor: room.floor,
                        capacity: room.capacity,
                        type: room.type,
                        ac_type: room.ac_type,
                        monthly_rent: room.monthly_rent,
                        amenities: room.amenities || []
                      });
                    }}
                    className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors text-xs flex items-center gap-1"
                  >
                    <Edit3 className="w-3.5 h-3.5" /> Edit
                  </button>
                  <button
                    onClick={() => handleDeleteRoom(room.id, room.room_number)}
                    className="p-1.5 text-slate-400 hover:text-rose-400 rounded-lg hover:bg-slate-800 transition-colors text-xs flex items-center gap-1"
                  >
                    <Trash2 className="w-3.5 h-3.5" /> Delete
                  </button>
                </div>

              </div>
            );
          })}
        </div>
      )}

      {/* Add/Edit Room Modal */}
      {(showAddModal || editingRoom) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl space-y-4">
            
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-base font-bold text-white">
                {editingRoom ? `Edit Room ${editingRoom.room_number}` : 'Add New Room'}
              </h3>
              <button
                onClick={() => {
                  setShowAddModal(false);
                  setEditingRoom(null);
                }}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={editingRoom ? handleUpdateRoom : handleCreateRoom} className="space-y-3 text-xs">
              
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Room Number</label>
                  <input
                    type="text"
                    required
                    value={formData.room_number}
                    onChange={(e) => setFormData({ ...formData, room_number: e.target.value })}
                    placeholder="e.g. 104"
                    className="w-full px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Floor Number</label>
                  <input
                    type="number"
                    min="1"
                    max="10"
                    value={formData.floor}
                    onChange={(e) => setFormData({ ...formData, floor: parseInt(e.target.value) })}
                    className="w-full px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Bed Capacity</label>
                  <input
                    type="number"
                    min="1"
                    max="6"
                    value={formData.capacity}
                    onChange={(e) => setFormData({ ...formData, capacity: parseInt(e.target.value) })}
                    className="w-full px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Monthly Rent (₹)</label>
                  <input
                    type="number"
                    value={formData.monthly_rent}
                    onChange={(e) => setFormData({ ...formData, monthly_rent: parseFloat(e.target.value) })}
                    className="w-full px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Room Sharing Type</label>
                  <select
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                    className="w-full px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-indigo-500"
                  >
                    <option value="Single Deluxe">Single Deluxe</option>
                    <option value="Double Sharing">Double Sharing</option>
                    <option value="Triple Sharing">Triple Sharing</option>
                    <option value="Four Sharing">Four Sharing</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">AC Type</label>
                  <select
                    value={formData.ac_type}
                    onChange={(e) => setFormData({ ...formData, ac_type: e.target.value })}
                    className="w-full px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-indigo-500"
                  >
                    <option value="Non-AC">Non-AC</option>
                    <option value="AC">AC Room</option>
                  </select>
                </div>
              </div>

              {/* Amenities Toggle */}
              <div>
                <label className="block text-slate-300 font-semibold mb-1.5">Select Amenities</label>
                <div className="flex flex-wrap gap-2">
                  {['Wi-Fi', 'AC', 'Study Table', 'Attached Bath', 'Balcony', 'Fridge'].map((item) => {
                    const isSelected = formData.amenities.includes(item);
                    return (
                      <button
                        type="button"
                        key={item}
                        onClick={() => toggleAmenity(item)}
                        className={`px-3 py-1 rounded-lg font-medium text-xs transition-colors ${
                          isSelected
                            ? 'bg-indigo-600 text-white border border-indigo-500'
                            : 'bg-slate-950 text-slate-400 border border-slate-800 hover:text-white'
                        }`}
                      >
                        {isSelected ? '✓ ' : '+ '} {item}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="pt-3 flex justify-end gap-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddModal(false);
                    setEditingRoom(null);
                  }}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold"
                >
                  {editingRoom ? 'Save Room' : 'Create Room'}
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

    </div>
  );
}
