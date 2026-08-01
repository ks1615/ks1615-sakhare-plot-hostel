import React, { useState, useEffect } from 'react';
import { fetchApi } from '../../services/api';
import PrintableReceiptModal from '../common/PrintableReceiptModal';
import { 
  CreditCard, 
  Plus, 
  Search, 
  Printer, 
  CheckCircle, 
  Clock, 
  AlertCircle, 
  Filter, 
  QrCode, 
  Check, 
  X, 
  ShieldCheck, 
  Settings, 
  ExternalLink,
  Send,
  Ticket,
  Bell
} from 'lucide-react';

export default function FeeTracking() {
  const [payments, setPayments] = useState([]);
  const [students, setStudents] = useState([]);
  const [qrSettings, setQrSettings] = useState(null);
  const [filterStatus, setFilterStatus] = useState('All');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  // Modals
  const [showRecordModal, setShowRecordModal] = useState(false);
  const [showQrModal, setShowQrModal] = useState(false);
  const [verifyingPayment, setVerifyingPayment] = useState(null);
  const [selectedReceipt, setSelectedReceipt] = useState(null);

  // QR Settings Form
  const [qrForm, setQrForm] = useState({
    upi_id: '9322465627@ybl',
    account_holder: 'Sandeep Sakhare',
    qr_code_url: '',
    hostel_phone: '+91 89835 35847',
    hostel_address: 'Plot No. 14, Main Road, Block A'
  });

  // Verify Form
  const [verifyNote, setVerifyNote] = useState('');

  // Record / Issue Ticket Form
  const [formData, setFormData] = useState({
    student_id: '',
    amount: 6500,
    month_year: 'August 2026',
    fee_type: 'rent',
    status: 'pending_payment', // 'pending_payment' (Issue Ticket to Student) | 'confirmed' (Manual Cash Payment)
    notes: 'Monthly Rent Payment Ticket'
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const payRes = await fetchApi('/payments');
      const studRes = await fetchApi('/students');
      const qrRes = await fetchApi('/payments/qr-settings');

      setPayments(payRes.payments || []);
      setStudents(studRes.students || []);
      if (qrRes.settings) {
        setQrSettings(qrRes.settings);
        setQrForm({
          upi_id: qrRes.settings.upi_id || '9322465627@ybl',
          account_holder: qrRes.settings.account_holder || 'Sandeep Sakhare',
          qr_code_url: qrRes.settings.qr_code_url || '',
          hostel_phone: qrRes.settings.hostel_phone || '+91 89835 35847',
          hostel_address: qrRes.settings.hostel_address || 'Plot No. 14, Main Road, Block A'
        });
      }
    } catch (err) {
      console.error('Failed loading fee tracking:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveQrSettings = async (e) => {
    e.preventDefault();
    try {
      await fetchApi('/payments/qr-settings', {
        method: 'POST',
        body: JSON.stringify(qrForm)
      });
      setShowQrModal(false);
      loadData();
    } catch (err) {
      alert('Error updating UPI QR settings: ' + err.message);
    }
  };

  const handleVerifyPayment = async (action) => {
    if (!verifyingPayment) return;
    try {
      await fetchApi(`/payments/verify/${verifyingPayment.id}`, {
        method: 'PUT',
        body: JSON.stringify({ 
          status: action === 'Approve' ? 'confirmed' : 'rejected',
          admin_note: verifyNote 
        })
      });
      setVerifyingPayment(null);
      setVerifyNote('');
      loadData();
    } catch (err) {
      alert(`Error verifying payment: ${err.message}`);
    }
  };

  const handleIssueTicket = async (e) => {
    e.preventDefault();
    if (!formData.student_id) {
      alert('Please select a student.');
      return;
    }
    try {
      const selectedStudentObj = students.find(s => String(s.id) === String(formData.student_id));
      await fetchApi('/payments', {
        method: 'POST',
        body: JSON.stringify({
          ...formData,
          studentName: selectedStudentObj ? selectedStudentObj.name : 'Resident',
          roomNo: selectedStudentObj ? selectedStudentObj.roomNo : '01',
          payment_date: new Date().toISOString().split('T')[0]
        })
      });
      setShowRecordModal(false);
      resetRecordForm();
      loadData();
    } catch (err) {
      alert('Error issuing fee ticket: ' + err.message);
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

  const resetRecordForm = () => {
    setFormData({
      student_id: students.length > 0 ? students[0].id : '',
      amount: 6500,
      month_year: 'August 2026',
      fee_type: 'rent',
      status: 'pending_payment',
      notes: 'Monthly Rent Payment Ticket'
    });
  };

  const pendingVerifications = payments.filter((p) => p.status === 'pending_owner' || p.status === 'Pending Verification');

  const filteredPayments = payments.filter((p) => {
    const matchesStatus = filterStatus === 'All' || 
      (filterStatus === 'Pending Verification' && (p.status === 'pending_owner' || p.status === 'Pending Verification')) ||
      (filterStatus === 'Pending Payment' && p.status === 'pending_payment') ||
      (filterStatus === 'Paid' && (p.status === 'confirmed' || p.status === 'Paid'));
      
    const q = search.toLowerCase();
    const matchesSearch =
      (p.studentName && p.studentName.toLowerCase().includes(q)) ||
      (p.student_name && p.student_name.toLowerCase().includes(q)) ||
      (p.month && p.month.toLowerCase().includes(q)) ||
      (p.month_year && p.month_year.toLowerCase().includes(q)) ||
      (p.utr_number && p.utr_number.toLowerCase().includes(q)) ||
      (p.upiTransactionId && p.upiTransactionId.toLowerCase().includes(q));
    return matchesStatus && matchesSearch;
  });

  return (
    <div className="space-y-6">
      
      {/* Top Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-extrabold text-white flex items-center gap-2">
            <CreditCard className="w-5 h-5 text-amber-400" /> Payment & Rent Verification Center
          </h2>
          <p className="text-xs text-slate-400 mt-1">Managed by Owner Sandeep Sakhare • Issue rent tickets, verify student UTR & screenshot proofs.</p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowQrModal(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-semibold text-xs transition-all"
          >
            <QrCode className="w-4 h-4 text-emerald-400" /> UPI QR Settings
          </button>
          <button
            onClick={() => {
              resetRecordForm();
              setShowRecordModal(true);
            }}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 via-orange-600 to-indigo-600 hover:from-amber-400 hover:to-indigo-500 text-white font-bold text-xs shadow-lg shadow-orange-500/20 transition-all scale-[1.02]"
          >
            <Plus className="w-4 h-4" /> Raise Rent / Fee Ticket
          </button>
        </div>
      </div>

      {/* Verification Alert Banner if Pending Submissions exist */}
      {pendingVerifications.length > 0 && (
        <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold shrink-0">
              <Bell className="w-5 h-5 animate-pulse text-amber-400" />
            </div>
            <div>
              <p className="font-extrabold text-amber-300 text-sm">
                {pendingVerifications.length} Student Payment Proof(s) Awaiting Owner Verification
              </p>
              <p className="text-slate-300 mt-0.5">Students have submitted UTR transaction numbers & screenshot proofs for rent approval.</p>
            </div>
          </div>
          <button
            onClick={() => setFilterStatus('Pending Verification')}
            className="px-4 py-2 rounded-xl bg-amber-500 text-slate-950 font-bold text-xs hover:bg-amber-400 transition-all shrink-0 shadow-md shadow-amber-500/20"
          >
            Review Queue ({pendingVerifications.length})
          </button>
        </div>
      )}

      {/* Filter and Search Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-2xl bg-slate-900/80 border border-slate-800 text-xs">
        <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
          <Filter className="w-4 h-4 text-slate-400 shrink-0" />
          {['All', 'Pending Verification', 'Pending Payment', 'Paid'].map((st) => (
            <button
              key={st}
              onClick={() => setFilterStatus(st)}
              className={`px-3 py-1.5 rounded-xl font-bold transition-all ${
                filterStatus === st
                  ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                  : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
              }`}
            >
              {st === 'Pending Verification' ? `Pending Verification (${pendingVerifications.length})` : st}
            </button>
          ))}
        </div>

        <div className="relative w-full sm:w-64">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search student, UTR, month..."
            className="w-full pl-9 pr-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 text-xs"
          />
        </div>
      </div>

      {/* Payment Records Table */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl overflow-hidden shadow-xl text-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-slate-300">
            <thead className="bg-slate-950/80 uppercase font-bold text-[11px] text-slate-400 border-b border-slate-800">
              <tr>
                <th className="py-3.5 px-4">Student & Room</th>
                <th className="py-3.5 px-4">Billing Period</th>
                <th className="py-3.5 px-4">Amount</th>
                <th className="py-3.5 px-4">12-Digit UTR ID</th>
                <th className="py-3.5 px-4">Payment Proof</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {loading ? (
                <tr>
                  <td colSpan="7" className="py-8 text-center text-slate-500">Loading payment tracking data...</td>
                </tr>
              ) : filteredPayments.length === 0 ? (
                <tr>
                  <td colSpan="7" className="py-8 text-center text-slate-500">No payment records found.</td>
                </tr>
              ) : (
                filteredPayments.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-800/40 transition-colors">
                    
                    <td className="py-3.5 px-4">
                      <p className="font-extrabold text-white">{p.studentName || p.student_name}</p>
                      <p className="text-[11px] text-slate-400">Room #{p.roomNo || p.room_number || '01'}</p>
                    </td>

                    <td className="py-3.5 px-4 font-bold text-white">
                      {p.month || p.month_year}
                      <span className="block text-[10px] text-slate-500 font-normal">{p.notes || 'Hostel Rent Ticket'}</span>
                    </td>

                    <td className="py-3.5 px-4 font-extrabold text-white">₹{p.amount?.toLocaleString('en-IN')}</td>

                    <td className="py-3.5 px-4 font-mono text-[11px] text-indigo-300">
                      {p.utr_number || p.upiTransactionId || '—'}
                      {(p.payment_app || p.paymentMethod) && (
                        <span className="block text-[10px] text-slate-500 font-sans">{p.payment_app || p.paymentMethod}</span>
                      )}
                    </td>

                    <td className="py-3.5 px-4">
                      {p.screenshot_url ? (
                        <button
                          onClick={() => setVerifyingPayment(p)}
                          className="inline-flex items-center gap-1 text-[11px] text-emerald-400 hover:underline font-semibold"
                        >
                          📷 View Proof
                        </button>
                      ) : (
                        <span className="text-[10px] text-slate-500 italic">No image uploaded</span>
                      )}
                    </td>

                    <td className="py-3.5 px-4">
                      {p.status === 'confirmed' || p.status === 'Paid' ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 text-[10px] font-bold border border-emerald-500/20">
                          <CheckCircle className="w-3 h-3" /> Paid & Verified
                        </span>
                      ) : p.status === 'pending_owner' || p.status === 'Pending Verification' ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-500/10 text-amber-300 text-[10px] font-bold border border-amber-500/20 animate-pulse">
                          <Clock className="w-3 h-3 text-amber-400" /> Pending Owner Review
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-indigo-500/10 text-indigo-400 text-[10px] font-bold border border-indigo-500/20">
                          <Ticket className="w-3 h-3" /> Ticket Issued to Student
                        </span>
                      )}
                    </td>

                    <td className="py-3.5 px-4 text-right">
                      {p.status === 'pending_owner' || p.status === 'Pending Verification' ? (
                        <button
                          onClick={() => setVerifyingPayment(p)}
                          className="px-3.5 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shadow-md shadow-amber-500/20 transition-all ml-auto flex items-center gap-1"
                        >
                          <ShieldCheck className="w-3.5 h-3.5" /> Review & Approve
                        </button>
                      ) : p.status === 'confirmed' || p.status === 'Paid' ? (
                        <button
                          onClick={() => fetchReceiptModal(p.id)}
                          className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-emerald-600/20 hover:bg-emerald-600 text-emerald-300 hover:text-white font-bold text-xs border border-emerald-500/30 transition-all ml-auto"
                        >
                          <Printer className="w-3.5 h-3.5" /> Print Receipt
                        </button>
                      ) : (
                        <span className="text-[11px] text-slate-500 italic">Waiting Student Payment</span>
                      )}
                    </td>

                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Owner Verification Modal with Screenshot Proof Preview */}
      {verifyingPayment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm overflow-y-auto">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl space-y-4 text-xs max-h-[90vh] overflow-y-auto">
            
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-amber-400" /> Verify Student Payment Proof
              </h3>
              <button onClick={() => setVerifyingPayment(null)} className="text-slate-400 hover:text-white">✕</button>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
              <div className="flex items-center justify-between">
                <p className="font-extrabold text-white text-sm">{verifyingPayment.studentName || verifyingPayment.student_name} (Room #{verifyingPayment.roomNo || verifyingPayment.room_number})</p>
                <span className="text-[10px] px-2 py-0.5 rounded bg-indigo-950 text-indigo-300 font-bold border border-indigo-800/40">
                  {verifyingPayment.payment_date || verifyingPayment.date || 'Today'}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2 text-[11px] pt-1">
                <div>
                  <span className="text-slate-400 block">Billing Period:</span>
                  <strong className="text-white">{verifyingPayment.month || verifyingPayment.month_year}</strong>
                </div>
                <div>
                  <span className="text-slate-400 block">Amount Paid:</span>
                  <strong className="text-emerald-400 text-sm">₹{verifyingPayment.amount?.toLocaleString('en-IN')}</strong>
                </div>
                <div>
                  <span className="text-slate-400 block">UPI App Used:</span>
                  <strong className="text-indigo-300">{verifyingPayment.payment_app || verifyingPayment.paymentMethod || 'UPI App'}</strong>
                </div>
                <div>
                  <span className="text-slate-400 block">12-Digit UTR ID:</span>
                  <strong className="font-mono text-amber-300 text-xs">{verifyingPayment.utr_number || verifyingPayment.upiTransactionId || 'N/A'}</strong>
                </div>
              </div>

              {/* Uploaded Screenshot Proof Preview */}
              {verifyingPayment.screenshot_url ? (
                <div className="pt-2 border-t border-slate-800 space-y-1">
                  <p className="font-bold text-slate-300 text-[11px]">Uploaded Payment Proof Screenshot:</p>
                  <a href={verifyingPayment.screenshot_url} target="_blank" rel="noreferrer" className="block relative group">
                    <img
                      src={verifyingPayment.screenshot_url}
                      alt="Student Payment Screenshot Proof"
                      className="w-full max-h-48 object-contain rounded-xl border border-slate-800 bg-slate-900 p-1 group-hover:opacity-90 transition-opacity"
                    />
                    <span className="absolute bottom-2 right-2 px-2 py-1 bg-slate-900/90 text-emerald-300 rounded text-[10px] font-bold border border-emerald-500/30">
                      🔍 Click to Open Full Image
                    </span>
                  </a>
                </div>
              ) : (
                <div className="pt-2 border-t border-slate-800 text-[11px] text-slate-500 italic">
                  No payment screenshot uploaded by student.
                </div>
              )}
            </div>

            <div>
              <label className="block text-slate-300 font-semibold mb-1">Verification Remark / Note (Sandeep Sakhare)</label>
              <textarea
                rows="2"
                value={verifyNote}
                onChange={(e) => setVerifyNote(e.target.value)}
                placeholder="e.g. UTR matched with bank statement."
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-amber-500"
              ></textarea>
            </div>

            <div className="pt-3 flex justify-between gap-2 border-t border-slate-800">
              <button
                type="button"
                onClick={() => handleVerifyPayment('Reject')}
                className="px-4 py-2 rounded-xl bg-rose-600/30 hover:bg-rose-600 text-rose-300 hover:text-white font-bold transition-colors"
              >
                Reject Transaction
              </button>
              <button
                type="button"
                onClick={() => handleVerifyPayment('Approve')}
                className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold shadow-md shadow-emerald-600/20 transition-all flex items-center gap-1.5"
              >
                <Check className="w-4 h-4" /> Approve & Issue Receipt
              </button>
            </div>

          </div>
        </div>
      )}

      {/* UPI QR Code & Settings Modal */}
      {showQrModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl space-y-4 text-xs">
            
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <QrCode className="w-5 h-5 text-emerald-400" /> UPI QR Code Settings (Owner: Sandeep Sakhare)
              </h3>
              <button onClick={() => setShowQrModal(false)} className="text-slate-400 hover:text-white">✕</button>
            </div>

            <form onSubmit={handleSaveQrSettings} className="space-y-3">
              
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Owner UPI ID</label>
                  <input
                    type="text"
                    required
                    value={qrForm.upi_id}
                    onChange={(e) => setQrForm({ ...qrForm, upi_id: e.target.value })}
                    placeholder="e.g. 9322465627@ybl"
                    className="w-full px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-amber-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Account Holder Name</label>
                  <input
                    type="text"
                    required
                    value={qrForm.account_holder}
                    onChange={(e) => setQrForm({ ...qrForm, account_holder: e.target.value })}
                    placeholder="e.g. Sandeep Sakhare"
                    className="w-full px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Custom QR Code Image Link (Optional)</label>
                <input
                  type="text"
                  value={qrForm.qr_code_url}
                  onChange={(e) => setQrForm({ ...qrForm, qr_code_url: e.target.value })}
                  placeholder="Leave empty to auto-generate UPI QR code..."
                  className="w-full px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 flex items-center justify-between">
                <div>
                  <p className="font-bold text-white text-xs">Live QR Code Preview</p>
                  <p className="text-[11px] text-slate-400">UPI ID: {qrForm.upi_id}</p>
                </div>
                <img
                  src={qrForm.qr_code_url || `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=upi://pay?pa=${encodeURIComponent(qrForm.upi_id)}`}
                  alt="UPI QR Code Preview"
                  className="w-16 h-16 rounded-lg border border-white p-1 bg-white"
                />
              </div>

              <div className="pt-3 flex justify-end gap-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowQrModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold"
                >
                  Save QR Settings
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

      {/* Raise Rent / Fee Ticket Modal (Owner Only) */}
      {showRecordModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl space-y-4 text-xs">
            
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Ticket className="w-5 h-5 text-amber-400" /> Raise Rent / Fee Ticket to Student
              </h3>
              <button onClick={() => setShowRecordModal(false)} className="text-slate-400 hover:text-white">✕</button>
            </div>

            <form onSubmit={handleIssueTicket} className="space-y-3">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Target Student</label>
                <select
                  required
                  value={formData.student_id}
                  onChange={(e) => {
                    const st = students.find((s) => String(s.id) === String(e.target.value));
                    setFormData({
                      ...formData,
                      student_id: e.target.value,
                      amount: st ? (st.monthlyRent || st.monthly_rent || 6500) : 6500
                    });
                  }}
                  className="w-full px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-amber-500"
                >
                  <option value="">-- Choose Student --</option>
                  {students.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} (Room #{s.roomNo || s.room_number || '01'})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Billing Period</label>
                  <input
                    type="text"
                    required
                    value={formData.month_year}
                    onChange={(e) => setFormData({ ...formData, month_year: e.target.value })}
                    placeholder="e.g. August 2026"
                    className="w-full px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-amber-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Rent / Fee Amount (₹)</label>
                  <input
                    type="number"
                    required
                    value={formData.amount}
                    onChange={(e) => setFormData({ ...formData, amount: parseFloat(e.target.value) })}
                    className="w-full px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Ticket Mode / Status</label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  className="w-full px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-amber-500 font-bold"
                >
                  <option value="pending_payment">🎫 Issue Ticket to Student (Student Pays via App & Uploads Proof)</option>
                  <option value="confirmed">💵 Direct Manual Paid (Cash / Bank Transfer)</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Reminder Note / Description</label>
                <input
                  type="text"
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="e.g. August Rent Payment Ticket due by 5th"
                  className="w-full px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="pt-3 flex justify-end gap-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowRecordModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-slate-950 font-bold shadow-lg shadow-amber-500/20 transition-all flex items-center gap-1.5"
                >
                  <Send className="w-3.5 h-3.5" /> Issue Ticket to Student
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* Printable Receipt Modal */}
      {selectedReceipt && (
        <PrintableReceiptModal
          payment={selectedReceipt.receipt || selectedReceipt}
          onClose={() => setSelectedReceipt(null)}
        />
      )}

    </div>
  );
}
