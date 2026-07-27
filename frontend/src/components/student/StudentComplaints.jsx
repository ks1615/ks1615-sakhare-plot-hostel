import React, { useState, useEffect } from 'react';
import { fetchApi } from '../../services/api';
import { Wrench, Plus, MessageSquare, Clock, CheckCircle2, AlertCircle, X } from 'lucide-react';

export default function StudentComplaints() {
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);

  const [formData, setFormData] = useState({
    category: 'Wi-Fi',
    priority: 'Medium',
    title: '',
    description: ''
  });

  useEffect(() => {
    loadMyComplaints();
  }, []);

  const loadMyComplaints = async () => {
    try {
      setLoading(true);
      const res = await fetchApi('/complaints');
      setComplaints(res.complaints || []);
    } catch (err) {
      console.error('Failed loading complaints:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await fetchApi('/complaints', {
        method: 'POST',
        body: JSON.stringify(formData)
      });
      setShowModal(false);
      setFormData({ category: 'Wi-Fi', priority: 'Medium', title: '', description: '' });
      loadMyComplaints();
    } catch (err) {
      alert('Error filing complaint: ' + err.message);
    }
  };

  return (
    <div className="space-y-6">
      
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-extrabold text-white flex items-center gap-2">
            <Wrench className="w-5 h-5 text-indigo-400" /> Maintenance & Support Complaints
          </h2>
          <p className="text-xs text-slate-400 mt-1">Submit Wi-Fi, Electrical, or Plumbing issues and track repair status.</p>
        </div>

        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-lg shadow-indigo-600/20 transition-all"
        >
          <Plus className="w-4 h-4" /> Raise Maintenance Ticket
        </button>
      </div>

      {loading ? (
        <div className="p-8 text-center text-slate-500 text-xs">Loading maintenance tickets...</div>
      ) : complaints.length === 0 ? (
        <div className="p-8 text-center text-slate-500 text-xs bg-slate-900/60 rounded-2xl border border-slate-800">
          No complaints submitted yet. Click "Raise Maintenance Ticket" to file an issue.
        </div>
      ) : (
        <div className="space-y-4">
          {complaints.map((item) => (
            <div key={item.id} className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-0.5 rounded-md bg-indigo-950 text-indigo-300 font-bold text-[10px] border border-indigo-800/40">
                    {item.category}
                  </span>
                  <span className={`px-2.5 py-0.5 rounded-md font-bold text-[10px] ${
                    item.priority === 'Emergency' ? 'bg-rose-500/20 text-rose-400' : 'bg-slate-800 text-slate-300'
                  }`}>
                    Priority: {item.priority}
                  </span>
                </div>

                <span className={`px-2.5 py-0.5 rounded-full font-bold text-[10px] ${
                  item.status === 'Resolved' ? 'bg-emerald-500/20 text-emerald-400' :
                  item.status === 'In Progress' ? 'bg-sky-500/20 text-sky-400' : 'bg-amber-500/20 text-amber-400'
                }`}>
                  {item.status}
                </span>
              </div>

              <h3 className="text-base font-bold text-white">{item.title}</h3>
              <p className="text-xs text-slate-300">{item.description}</p>

              {item.admin_response && (
                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs text-indigo-200 flex items-start gap-2">
                  <MessageSquare className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold text-indigo-300">Owner Response:</p>
                    <p className="mt-0.5 text-slate-300">{item.admin_response}</p>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* New Ticket Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl space-y-4 text-xs">
            
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-base font-bold text-white">Raise Maintenance Ticket</h3>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Issue Category</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-indigo-500"
                  >
                    <option value="Electrical">Electrical (Fan/Light/Socket)</option>
                    <option value="Plumbing">Plumbing (Tap/Shower/Drainage)</option>
                    <option value="Wi-Fi">Wi-Fi & Network</option>
                    <option value="Furniture">Furniture & Bed</option>
                    <option value="Cleaning">Cleaning & Hygiene</option>
                    <option value="Other">Other Maintenance</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Priority Level</label>
                  <select
                    value={formData.priority}
                    onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                    className="w-full px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-indigo-500"
                  >
                    <option value="Low">Low Priority</option>
                    <option value="Medium">Medium Priority</option>
                    <option value="High">High Priority</option>
                    <option value="Emergency">Emergency Issue</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Brief Title</label>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="e.g. Wi-Fi connection dropping in Room 101"
                  className="w-full px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Description</label>
                <textarea
                  rows="4"
                  required
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Describe the issue in detail..."
                  className="w-full px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-indigo-500"
                ></textarea>
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
                  className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold"
                >
                  Submit Ticket
                </button>
              </div>
            </form>

          </div>
        </div>
      )}

    </div>
  );
}
