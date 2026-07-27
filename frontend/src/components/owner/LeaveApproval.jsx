import React, { useState, useEffect } from 'react';
import { fetchApi } from '../../services/api';
import { 
  CalendarCheck, 
  Check, 
  X, 
  Clock, 
  MapPin, 
  Phone, 
  FileText 
} from 'lucide-react';

export default function LeaveApproval() {
  const [leaves, setLeaves] = useState([]);
  const [filterStatus, setFilterStatus] = useState('Pending');
  const [loading, setLoading] = useState(true);

  const [selectedLeave, setSelectedLeave] = useState(null);
  const [actionStatus, setActionStatus] = useState('Approved');
  const [remark, setRemark] = useState('');

  useEffect(() => {
    loadLeaves();
  }, []);

  const loadLeaves = async () => {
    try {
      setLoading(true);
      const data = await fetchApi('/leaves');
      setLeaves(data.leaves || []);
    } catch (err) {
      console.error('Failed loading leaves:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleProcessLeave = async (e) => {
    e.preventDefault();
    if (!selectedLeave) return;
    try {
      await fetchApi(`/leaves/${selectedLeave.id}`, {
        method: 'PUT',
        body: JSON.stringify({
          status: actionStatus,
          admin_remark: remark
        })
      });
      setSelectedLeave(null);
      loadLeaves();
    } catch (err) {
      alert('Error updating leave application: ' + err.message);
    }
  };

  const openActionModal = (leaveItem, status) => {
    setSelectedLeave(leaveItem);
    setActionStatus(status);
    setRemark(leaveItem.admin_remark || (status === 'Approved' ? 'Leave Approved. Travel safely!' : 'Request cannot be approved at this time.'));
  };

  const filteredLeaves = leaves.filter(
    (l) => filterStatus === 'All' || l.status === filterStatus
  );

  return (
    <div className="space-y-6">
      
      {/* Top Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-extrabold text-white flex items-center gap-2">
            <CalendarCheck className="w-5 h-5 text-indigo-400" /> Student Leave & Outing Approvals
          </h2>
          <p className="text-xs text-slate-400 mt-1">Review leave applications, travel destinations, and issue approvals.</p>
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-1.5 p-1 bg-slate-900 border border-slate-800 rounded-xl text-xs">
          {['Pending', 'Approved', 'Rejected', 'All'].map((st) => (
            <button
              key={st}
              onClick={() => setFilterStatus(st)}
              className={`px-3 py-1.5 rounded-lg font-semibold transition-all ${
                filterStatus === st
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="bg-slate-900/70 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-950/80 uppercase font-bold text-[11px] text-slate-400 border-b border-slate-800">
              <tr>
                <th className="py-3.5 px-4">Student</th>
                <th className="py-3.5 px-4">Leave Duration</th>
                <th className="py-3.5 px-4">Reason & Destination</th>
                <th className="py-3.5 px-4">Emergency Contact</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {loading ? (
                <tr>
                  <td colSpan="6" className="py-8 text-center text-slate-500">Loading leave requests...</td>
                </tr>
              ) : filteredLeaves.length === 0 ? (
                <tr>
                  <td colSpan="6" className="py-8 text-center text-slate-500">No leave applications under "{filterStatus}".</td>
                </tr>
              ) : (
                filteredLeaves.map((l) => (
                  <tr key={l.id} className="hover:bg-slate-800/40 transition-colors">
                    
                    <td className="py-3.5 px-4 font-bold text-white">
                      {l.student_name}
                      <span className="block text-[10px] text-slate-500 font-normal">Room #{l.room_number || 'N/A'}</span>
                    </td>

                    <td className="py-3.5 px-4 font-medium text-slate-200">
                      <div>{l.start_date} <span className="text-slate-500">to</span> {l.end_date}</div>
                    </td>

                    <td className="py-3.5 px-4 max-w-xs">
                      <p className="font-semibold text-white truncate">{l.reason}</p>
                      <p className="text-[11px] text-indigo-300 flex items-center gap-1 mt-0.5">
                        <MapPin className="w-3 h-3 text-indigo-400" /> {l.destination}
                      </p>
                    </td>

                    <td className="py-3.5 px-4 text-slate-400">
                      <span className="flex items-center gap-1.5"><Phone className="w-3 h-3 text-slate-500" /> {l.emergency_contact || l.student_phone || 'N/A'}</span>
                    </td>

                    <td className="py-3.5 px-4">
                      {l.status === 'Approved' ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 text-[10px] font-bold border border-emerald-500/20">
                          <Check className="w-3 h-3" /> Approved
                        </span>
                      ) : l.status === 'Rejected' ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-rose-500/10 text-rose-400 text-[10px] font-bold border border-rose-500/20">
                          <X className="w-3 h-3" /> Rejected
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-500/10 text-amber-400 text-[10px] font-bold border border-amber-500/20">
                          <Clock className="w-3 h-3" /> Pending Review
                        </span>
                      )}
                    </td>

                    <td className="py-3.5 px-4 text-right">
                      {l.status === 'Pending' ? (
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => openActionModal(l, 'Approved')}
                            className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[11px] transition-colors shadow-sm"
                          >
                            Approve
                          </button>
                          <button
                            onClick={() => openActionModal(l, 'Rejected')}
                            className="px-2.5 py-1 rounded-lg bg-rose-600/30 hover:bg-rose-600 text-rose-300 hover:text-white font-bold text-[11px] transition-colors"
                          >
                            Reject
                          </button>
                        </div>
                      ) : (
                        <span className="text-[11px] text-slate-500 italic">
                          {l.admin_remark ? `"${l.admin_remark}"` : 'Decided'}
                        </span>
                      )}
                    </td>

                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Action Modal */}
      {selectedLeave && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl space-y-4 text-xs">
            
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-base font-bold text-white">
                {actionStatus === 'Approved' ? 'Approve Leave Request' : 'Reject Leave Request'}
              </h3>
              <button onClick={() => setSelectedLeave(null)} className="text-slate-400 hover:text-white">✕</button>
            </div>

            <div>
              <p className="font-semibold text-white">{selectedLeave.student_name} (Room #{selectedLeave.room_number})</p>
              <p className="text-[11px] text-slate-400 mt-0.5">Destination: {selectedLeave.destination} ({selectedLeave.start_date} to {selectedLeave.end_date})</p>
              <p className="text-[11px] text-slate-300 mt-1 italic font-medium">"{selectedLeave.reason}"</p>
            </div>

            <form onSubmit={handleProcessLeave} className="space-y-3">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Admin Remark / Message to Student</label>
                <textarea
                  rows="3"
                  value={remark}
                  onChange={(e) => setRemark(e.target.value)}
                  className="w-full px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-indigo-500"
                ></textarea>
              </div>

              <div className="pt-3 flex justify-end gap-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setSelectedLeave(null)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className={`px-4 py-2 rounded-xl font-bold text-white ${
                    actionStatus === 'Approved' ? 'bg-emerald-600 hover:bg-emerald-500' : 'bg-rose-600 hover:bg-rose-500'
                  }`}
                >
                  Confirm {actionStatus}
                </button>
              </div>
            </form>

          </div>
        </div>
      )}

    </div>
  );
}
