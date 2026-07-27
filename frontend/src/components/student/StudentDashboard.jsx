import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { fetchApi } from '../../services/api';
import PrintableReceiptModal from '../common/PrintableReceiptModal';
import { 
  User, 
  BedDouble, 
  IndianRupee, 
  CheckCircle, 
  AlertCircle, 
  Wrench, 
  CalendarCheck, 
  Bell, 
  Printer, 
  ArrowRight,
  ShieldCheck
} from 'lucide-react';

export default function StudentDashboard({ setActiveTab }) {
  const { user } = useAuth();
  const [studentInfo, setStudentInfo] = useState(null);
  const [payments, setPayments] = useState([]);
  const [complaints, setComplaints] = useState([]);
  const [leaves, setLeaves] = useState([]);
  const [notices, setNotices] = useState([]);
  const [loading, setLoading] = useState(true);

  // Fee Receipt Printable Modal
  const [selectedReceipt, setSelectedReceipt] = useState(null);

  useEffect(() => {
    loadStudentPortalData();
  }, []);

  const loadStudentPortalData = async () => {
    try {
      setLoading(true);
      const meRes = await fetchApi('/auth/me');
      const payRes = await fetchApi('/payments');
      const compRes = await fetchApi('/complaints');
      const leaveRes = await fetchApi('/leaves');
      const noticeRes = await fetchApi('/notices');

      setStudentInfo(meRes.user);
      setPayments(payRes.payments || []);
      setComplaints(compRes.complaints || []);
      setLeaves(leaveRes.leaves || []);
      setNotices(noticeRes.notices ? noticeRes.notices.slice(0, 3) : []);
    } catch (err) {
      console.error('Failed loading student data:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchReceiptModal = async (paymentId) => {
    try {
      const data = await fetchApi(`/payments/receipt/${paymentId}`);
      setSelectedReceipt(data);
    } catch (err) {
      alert('Failed loading receipt details: ' + err.message);
    }
  };

  if (loading) {
    return <div className="p-8 text-center text-slate-400 text-xs">Loading Personal Student Dashboard...</div>;
  }

  const latestPayment = payments.length > 0 ? payments[0] : null;
  const isPaid = latestPayment?.status === 'Paid';

  return (
    <div className="space-y-6">
      
      {/* Welcome Banner */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-emerald-950/80 via-slate-900 to-indigo-950/60 border border-emerald-800/30 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 text-[10px] font-bold border border-emerald-500/20 uppercase tracking-wider">
            Student Portal Active
          </span>
          <h2 className="text-xl font-extrabold text-white mt-1">Welcome back, {user?.name}!</h2>
          <p className="text-xs text-slate-400 mt-0.5">Sakhare Plot Hostel • Student ID: SPH-2026-0{user?.id}</p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab('complaints')}
            className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs transition-all border border-slate-700 flex items-center gap-1.5"
          >
            <Wrench className="w-3.5 h-3.5 text-amber-400" /> Raise Complaint
          </button>
          <button
            onClick={() => setActiveTab('leaves')}
            className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition-all shadow-md shadow-emerald-600/20 flex items-center gap-1.5"
          >
            <CalendarCheck className="w-3.5 h-3.5" /> Apply Outing
          </button>
        </div>
      </div>

      {/* Grid Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Card 1: My Profile & Room Specs */}
        <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <h3 className="font-bold text-white text-sm flex items-center gap-2">
              <BedDouble className="w-4 h-4 text-emerald-400" /> Room Allocation Profile
            </h3>
            <span className="px-2.5 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400 text-[10px] font-bold border border-indigo-500/20">
              Active Resident
            </span>
          </div>

          <div className="space-y-3 text-xs">
            <div className="flex justify-between items-center p-2.5 rounded-xl bg-slate-950 border border-slate-800">
              <span className="text-slate-400">Assigned Room Number:</span>
              <span className="font-extrabold text-white text-sm">Room #{studentInfo?.room_number || '101'}</span>
            </div>

            <div className="flex justify-between items-center p-2.5 rounded-xl bg-slate-950 border border-slate-800">
              <span className="text-slate-400">Bed Allocation:</span>
              <span className="font-bold text-indigo-300">Bed Slot #{studentInfo?.bed_number || 1}</span>
            </div>

            <div className="flex justify-between items-center p-2.5 rounded-xl bg-slate-950 border border-slate-800">
              <span className="text-slate-400">Room Type & AC:</span>
              <span className="font-bold text-white">{studentInfo?.room_type || 'Double Sharing'} ({studentInfo?.ac_type || 'AC'})</span>
            </div>

            <div className="flex justify-between items-center p-2.5 rounded-xl bg-slate-950 border border-slate-800">
              <span className="text-slate-400">Guardian Name:</span>
              <span className="font-semibold text-slate-200">{studentInfo?.guardian_name || 'N/A'}</span>
            </div>
          </div>
        </div>

        {/* Card 2: Fee Dues Status */}
        <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-3">
              <h3 className="font-bold text-white text-sm flex items-center gap-2">
                <IndianRupee className="w-4 h-4 text-emerald-400" /> Rent & Fee Status
              </h3>
              <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                isPaid ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-rose-500/10 text-rose-400 border-rose-500/20'
              }`}>
                {isPaid ? 'Fees Paid' : 'Due Pending'}
              </span>
            </div>

            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-center space-y-1 mb-4">
              <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Monthly Room Rent</p>
              <p className="text-3xl font-extrabold text-white">₹{studentInfo?.monthly_rent?.toLocaleString('en-IN') || '7,500'}</p>
              <p className="text-[11px] text-slate-400 mt-1">Due Date: {studentInfo?.rent_due_date || '05th of every month'}</p>
            </div>

            {latestPayment && (
              <div className="text-xs space-y-1.5 text-slate-400 p-2.5 rounded-xl bg-slate-950/60 border border-slate-800/80">
                <p className="flex justify-between"><span>Latest Billing Period:</span> <strong className="text-white">{latestPayment.month_year}</strong></p>
                <p className="flex justify-between"><span>Receipt Number:</span> <strong className="text-indigo-300 font-mono">{latestPayment.receipt_number || 'Pending'}</strong></p>
              </div>
            )}
          </div>

          <div className="pt-3 border-t border-slate-800 flex items-center justify-between">
            <button
              onClick={() => setActiveTab('payments')}
              className="text-xs text-indigo-400 font-semibold hover:underline flex items-center gap-1"
            >
              View Payment History <ArrowRight className="w-3 h-3" />
            </button>
            {latestPayment && isPaid && (
              <button
                onClick={() => fetchReceiptModal(latestPayment.id)}
                className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs flex items-center gap-1 shadow-sm"
              >
                <Printer className="w-3.5 h-3.5" /> Print Receipt
              </button>
            )}
          </div>
        </div>

        {/* Card 3: Recent Notices Widget */}
        <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-3">
              <h3 className="font-bold text-white text-sm flex items-center gap-2">
                <Bell className="w-4 h-4 text-purple-400" /> Recent Announcements
              </h3>
              <button onClick={() => setActiveTab('notices')} className="text-[11px] text-indigo-400 font-semibold hover:underline">
                View All
              </button>
            </div>

            <div className="space-y-3">
              {notices.map((n) => (
                <div key={n.id} className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 text-xs space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-white text-xs truncate">{n.title}</span>
                    <span className="text-[9px] px-1.5 py-0.5 rounded bg-indigo-950 text-indigo-300 font-bold">{n.category}</span>
                  </div>
                  <p className="text-slate-400 text-[11px] line-clamp-2">{n.content}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

      </div>

      {/* Complaints & Leave Trackers */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Active Maintenance Complaints */}
        <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-white text-sm flex items-center gap-2">
              <Wrench className="w-4 h-4 text-amber-400" /> My Maintenance Ticket Logs
            </h3>
            <button onClick={() => setActiveTab('complaints')} className="text-xs text-indigo-400 font-semibold hover:underline">
              Submit Ticket
            </button>
          </div>

          <div className="space-y-3">
            {complaints.length === 0 ? (
              <p className="text-xs text-slate-500 py-4 text-center">No maintenance complaints logged.</p>
            ) : (
              complaints.map((c) => (
                <div key={c.id} className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 text-xs flex justify-between items-center">
                  <div>
                    <span className="font-bold text-white">{c.title}</span>
                    <p className="text-slate-400 text-[11px] mt-0.5">{c.category} • Priority: {c.priority}</p>
                  </div>
                  <span className={`px-2.5 py-1 rounded-full font-bold text-[10px] ${
                    c.status === 'Resolved' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-amber-500/20 text-amber-400'
                  }`}>
                    {c.status}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Leave Requests Status */}
        <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-white text-sm flex items-center gap-2">
              <CalendarCheck className="w-4 h-4 text-emerald-400" /> My Outing & Leave Requests
            </h3>
            <button onClick={() => setActiveTab('leaves')} className="text-xs text-indigo-400 font-semibold hover:underline">
              Apply Outing
            </button>
          </div>

          <div className="space-y-3">
            {leaves.length === 0 ? (
              <p className="text-xs text-slate-500 py-4 text-center">No leave applications filed.</p>
            ) : (
              leaves.map((l) => (
                <div key={l.id} className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 text-xs flex justify-between items-center">
                  <div>
                    <span className="font-bold text-white">{l.destination}</span>
                    <p className="text-slate-400 text-[11px] mt-0.5">{l.start_date} to {l.end_date}</p>
                  </div>
                  <span className={`px-2.5 py-1 rounded-full font-bold text-[10px] ${
                    l.status === 'Approved' ? 'bg-emerald-500/20 text-emerald-400' :
                    l.status === 'Rejected' ? 'bg-rose-500/20 text-rose-400' : 'bg-amber-500/20 text-amber-400'
                  }`}>
                    {l.status}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

      </div>

      {/* Printable Receipt Modal */}
      {selectedReceipt && (
        <PrintableReceiptModal
          receiptData={selectedReceipt}
          onClose={() => setSelectedReceipt(null)}
        />
      )}

    </div>
  );
}
