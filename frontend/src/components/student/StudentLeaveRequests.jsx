import React, { useState, useEffect } from 'react';
import { fetchApi } from '../../services/api';
import { CalendarCheck, Plus, Check, X, Clock, MapPin, Phone } from 'lucide-react';

export default function StudentLeaveRequests() {
  const [leaves, setLeaves] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);

  const [formData, setFormData] = useState({
    start_date: '',
    end_date: '',
    reason: '',
    destination: '',
    emergency_contact: ''
  });

  useEffect(() => {
    loadMyLeaves();
  }, []);

  const loadMyLeaves = async () => {
    try {
      setLoading(true);
      const res = await fetchApi('/leaves');
      setLeaves(res.leaves || []);
    } catch (err) {
      console.error('Failed loading leave applications:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await fetchApi('/leaves', {
        method: 'POST',
        body: JSON.stringify(formData)
      });
      setShowModal(false);
      setFormData({ start_date: '', end_date: '', reason: '', destination: '', emergency_contact: '' });
      loadMyLeaves();
    } catch (err) {
      alert('Error submitting leave request: ' + err.message);
    }
  };

  return (
    <div className="space-y-6">
      
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-extrabold text-white flex items-center gap-2">
            <CalendarCheck className="w-5 h-5 text-emerald-400" /> Leave & Outing Applications
          </h2>
          <p className="text-xs text-slate-400 mt-1">Apply for hostel permission before going home or on vacation.</p>
        </div>

        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-lg shadow-emerald-600/20 transition-all"
        >
          <Plus className="w-4 h-4" /> Apply For Leave
        </button>
      </div>

      {loading ? (
        <div className="p-8 text-center text-slate-500 text-xs">Loading leave requests...</div>
      ) : leaves.length === 0 ? (
        <div className="p-8 text-center text-slate-500 text-xs bg-slate-900/60 rounded-2xl border border-slate-800">
          No leave requests submitted. Click "Apply For Leave" to request outing approval.
        </div>
      ) : (
        <div className="space-y-4">
          {leaves.map((item) => (
            <div key={item.id} className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <span className="font-bold text-white text-base">{item.destination}</span>
                  <p className="text-xs text-slate-400 mt-0.5">{item.start_date} to {item.end_date}</p>
                </div>

                <span className={`px-2.5 py-1 rounded-full font-bold text-[10px] ${
                  item.status === 'Approved' ? 'bg-emerald-500/20 text-emerald-400' :
                  item.status === 'Rejected' ? 'bg-rose-500/20 text-rose-400' : 'bg-amber-500/20 text-amber-400'
                }`}>
                  {item.status}
                </span>
              </div>

              <p className="text-xs text-slate-300">Reason: {item.reason}</p>

              {item.admin_remark && (
                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs text-emerald-300">
                  <strong>Owner Remark:</strong> "{item.admin_remark}"
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* New Leave Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl space-y-4 text-xs">
            
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-base font-bold text-white">Apply for Outing / Leave</h3>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Start Date</label>
                  <input
                    type="date"
                    required
                    value={formData.start_date}
                    onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                    className="w-full px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">End Date</label>
                  <input
                    type="date"
                    required
                    value={formData.end_date}
                    onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                    className="w-full px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Destination City / Home</label>
                <input
                  type="text"
                  required
                  value={formData.destination}
                  onChange={(e) => setFormData({ ...formData, destination: e.target.value })}
                  placeholder="e.g. Pune Home / Ahmedabad"
                  className="w-full px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Reason for Leave</label>
                <textarea
                  rows="3"
                  required
                  value={formData.reason}
                  onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                  placeholder="e.g. Family function / Cousin's wedding"
                  className="w-full px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-indigo-500"
                ></textarea>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Emergency Contact Mobile</label>
                <input
                  type="text"
                  value={formData.emergency_contact}
                  onChange={(e) => setFormData({ ...formData, emergency_contact: e.target.value })}
                  placeholder="+91 98765 43210"
                  className="w-full px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="pt-3 flex justify-end gap-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold"
                >
                  Submit Application
                </button>
              </div>
            </form>

          </div>
        </div>
      )}

    </div>
  );
}
