import React, { useState, useEffect } from 'react';
import { fetchApi } from '../../services/api';
import { 
  Wrench, 
  Search, 
  MessageSquare, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  X, 
  Send 
} from 'lucide-react';

export default function ComplaintManagement() {
  const [complaints, setComplaints] = useState([]);
  const [filterStatus, setFilterStatus] = useState('All');
  const [loading, setLoading] = useState(true);
  const [selectedTicket, setSelectedTicket] = useState(null);

  const [responseMsg, setResponseMsg] = useState('');
  const [statusVal, setStatusVal] = useState('In Progress');

  useEffect(() => {
    loadComplaints();
  }, []);

  const loadComplaints = async () => {
    try {
      setLoading(true);
      const data = await fetchApi('/complaints');
      setComplaints(data.complaints || []);
    } catch (err) {
      console.error('Failed loading complaints:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateTicket = async (e) => {
    e.preventDefault();
    if (!selectedTicket) return;
    try {
      await fetchApi(`/complaints/${selectedTicket.id}`, {
        method: 'PUT',
        body: JSON.stringify({
          status: statusVal,
          admin_response: responseMsg
        })
      });
      setSelectedTicket(null);
      loadComplaints();
    } catch (err) {
      alert('Failed updating complaint ticket: ' + err.message);
    }
  };

  const openRespondModal = (ticket) => {
    setSelectedTicket(ticket);
    setResponseMsg(ticket.admin_response || '');
    setStatusVal(ticket.status || 'In Progress');
  };

  const filteredComplaints = complaints.filter(
    (c) => filterStatus === 'All' || c.status === filterStatus
  );

  return (
    <div className="space-y-6">
      
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-extrabold text-white flex items-center gap-2">
            <Wrench className="w-5 h-5 text-indigo-400" /> Maintenance Complaints & Support Tickets
          </h2>
          <p className="text-xs text-slate-400 mt-1">Review student issues (Wi-Fi, Electrical, Plumbing) and log responses.</p>
        </div>

        {/* Status Filter Tabs */}
        <div className="flex items-center gap-1.5 p-1 bg-slate-900 border border-slate-800 rounded-xl text-xs">
          {['All', 'Pending', 'In Progress', 'Resolved'].map((st) => (
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

      {/* Complaint List Grid */}
      {loading ? (
        <div className="p-8 text-center text-slate-500 text-xs">Loading complaint tickets...</div>
      ) : filteredComplaints.length === 0 ? (
        <div className="p-8 text-center text-slate-500 text-xs bg-slate-900/60 rounded-2xl border border-slate-800">
          No complaints found under filter "{filterStatus}".
        </div>
      ) : (
        <div className="space-y-4">
          {filteredComplaints.map((ticket) => (
            <div
              key={ticket.id}
              className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:border-slate-700 transition-all shadow-lg"
            >
              <div className="space-y-1.5 max-w-2xl">
                
                {/* Category & Priority Badges */}
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-0.5 rounded-md bg-indigo-950 text-indigo-300 font-bold text-[10px] border border-indigo-800/40">
                    Category: {ticket.category}
                  </span>

                  <span className={`px-2.5 py-0.5 rounded-md font-bold text-[10px] ${
                    ticket.priority === 'Emergency' ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30' :
                    ticket.priority === 'High' ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' :
                    'bg-slate-800 text-slate-400'
                  }`}>
                    Priority: {ticket.priority}
                  </span>

                  <span className={`px-2.5 py-0.5 rounded-full font-bold text-[10px] ${
                    ticket.status === 'Resolved' ? 'bg-emerald-500/20 text-emerald-400' :
                    ticket.status === 'In Progress' ? 'bg-sky-500/20 text-sky-400' :
                    'bg-amber-500/20 text-amber-400'
                  }`}>
                    Status: {ticket.status}
                  </span>
                </div>

                {/* Title & Details */}
                <h3 className="text-base font-bold text-white">{ticket.title}</h3>
                <p className="text-xs text-slate-300">{ticket.description}</p>

                {/* Student Info */}
                <p className="text-[11px] text-slate-500 pt-1">
                  Submitted by: <strong className="text-slate-300">{ticket.student_name}</strong> (Room #{ticket.room_number || 'N/A'}) • {ticket.created_at}
                </p>

                {/* Admin Response Log */}
                {ticket.admin_response && (
                  <div className="mt-3 p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs text-indigo-200 flex items-start gap-2">
                    <MessageSquare className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-semibold text-indigo-300">Owner Remark / Status Note:</p>
                      <p className="mt-0.5 text-slate-300">{ticket.admin_response}</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Action Button */}
              <div className="shrink-0 flex items-center gap-2">
                <button
                  onClick={() => openRespondModal(ticket)}
                  className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-md shadow-indigo-600/20 transition-all flex items-center gap-1.5"
                >
                  <MessageSquare className="w-4 h-4" /> Reply & Update Status
                </button>
              </div>

            </div>
          ))}
        </div>
      )}

      {/* Response Modal */}
      {selectedTicket && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl space-y-4 text-xs">
            
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-base font-bold text-white">Update Ticket #{selectedTicket.id}</h3>
              <button onClick={() => setSelectedTicket(null)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div>
              <p className="font-semibold text-slate-300">Ticket: {selectedTicket.title}</p>
              <p className="text-[11px] text-slate-500">Student: {selectedTicket.student_name} (Room #{selectedTicket.room_number})</p>
            </div>

            <form onSubmit={handleUpdateTicket} className="space-y-3">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Ticket Status</label>
                <select
                  value={statusVal}
                  onChange={(e) => setStatusVal(e.target.value)}
                  className="w-full px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-indigo-500"
                >
                  <option value="Pending">Pending</option>
                  <option value="In Progress">In Progress (Tech Assigned)</option>
                  <option value="Resolved">Resolved (Completed)</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Owner Response / Resolution Note</label>
                <textarea
                  rows="4"
                  required
                  value={responseMsg}
                  onChange={(e) => setResponseMsg(e.target.value)}
                  placeholder="e.g. Electrician scheduled today at 4 PM to replace the faucet..."
                  className="w-full px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-indigo-500"
                ></textarea>
              </div>

              <div className="pt-3 flex justify-end gap-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setSelectedTicket(null)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold flex items-center gap-1.5"
                >
                  <Send className="w-3.5 h-3.5" /> Submit Response
                </button>
              </div>
            </form>

          </div>
        </div>
      )}

    </div>
  );
}
