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
  ExternalLink 
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

  // Record Payment Form
  const [formData, setFormData] = useState({
    student_id: '',
    amount: 6500,
    month_year: 'August 2026',
    payment_method: 'UPI QR',
    transaction_id: '',
    status: 'Paid'
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
          upi_id: qrRes.settings.upi_id || 'sandeepsakhare@upi',
          account_holder: qrRes.settings.account_holder || 'Sandeep Sakhare',
          qr_code_url: qrRes.settings.qr_code_url || '',
          hostel_phone: qrRes.settings.hostel_phone || '+91 98765 43210',
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
        body: JSON.stringify({ action, admin_note: verifyNote })
      });
      setVerifyingPayment(null);
      setVerifyNote('');
      loadData();
    } catch (err) {
      alert(`Error verifying payment: ${err.message}`);
    }
  };

  const handleRecordPayment = async (e) => {
    e.preventDefault();
    try {
      await fetchApi('/payments', {
        method: 'POST',
        body: JSON.stringify({
          ...formData,
          payment_date: new Date().toISOString().split('T')[0]
        })
      });
      setShowRecordModal(false);
      resetRecordForm();
      loadData();
    } catch (err) {
      alert('Error recording payment: ' + err.message);
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
      student_id: '',
      amount: 6500,
      month_year: 'August 2026',
      payment_method: 'UPI QR',
      transaction_id: '',
      status: 'Paid'
    });
  };

  const pendingVerifications = payments.filter((p) => p.status === 'Pending Verification');

  const filteredPayments = payments.filter((p) => {
    const matchesStatus = filterStatus === 'All' || p.status === filterStatus;
    const q = search.toLowerCase();
    const matchesSearch =
      (p.student_name && p.student_name.toLowerCase().includes(q)) ||
      (p.month_year && p.month_year.toLowerCase().includes(q)) ||
      (p.utr_number && p.utr_number.toLowerCase().includes(q)) ||
      (p.receipt_number && p.receipt_number.toLowerCase().includes(q));
    return matchesStatus && matchesSearch;
  });

  return (
    <div className="space-y-6">
      
      {/* Top Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-extrabold text-white flex items-center gap-2">
            <CreditCard className="w-5 h-5 text-indigo-400" /> Payment & Rent Verification Center
          </h2>
          <p className="text-xs text-slate-400 mt-1">Managed by Sandeep Sakhare • Verify student UTR payments & manage UPI QR Code.</p>
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
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-lg shadow-indigo-600/20 transition-all"
          >
            <Plus className="w-4 h-4" /> Record Payment
          </button>
        </div>
      </div>

      {/* Verification Alert Banner if Pending Submissions exist */}
      {pendingVerifications.length > 0 && (
        <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold">
              !
            </div>
            <div>
              <p className="font-bold text-amber-300">
                {pendingVerifications.length} Student Payment(s) Awaiting Verification
              </p>
              <p className="text-slate-400 mt-0.5">Students have submitted UTR transaction numbers for rent approval.</p>
            </div>
          </div>
          <button
            onClick={() => setFilterStatus('Pending Verification')}
            className="px-3 py-1.5 rounded-xl bg-amber-500 text-slate-950 font-bold text-xs hover:bg-amber-400 transition-all"
          >
            Review Queue
          </button>
        </div>
      )}

      {/* Filters & Search */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-3.5" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search student, UTR number, or receipt..."
            className="w-full pl-10 pr-4 py-2.5 bg-slate-900/80 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
          />
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-1.5 p-1 bg-slate-900 border border-slate-800 rounded-xl text-xs overflow-x-auto">
          {['All', 'Pending Verification', 'Paid', 'Pending', 'Overdue', 'Rejected'].map((st) => (
            <button
              key={st}
              onClick={() => setFilterStatus(st)}
              className={`px-3 py-1.5 rounded-lg font-semibold whitespace-nowrap transition-all ${
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

      {/* Payments Table */}
      <div className="bg-slate-900/70 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-950/80 uppercase font-bold text-[11px] text-slate-400 border-b border-slate-800">
              <tr>
                <th className="py-3.5 px-4">Student</th>
                <th className="py-3.5 px-4">Period & Amount</th>
                <th className="py-3.5 px-4">UTR Number & App</th>
                <th className="py-3.5 px-4">Verification Status</th>
                <th className="py-3.5 px-4">Receipt Number</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {loading ? (
                <tr>
                  <td colSpan="6" className="py-8 text-center text-slate-500">Loading fee records...</td>
                </tr>
              ) : filteredPayments.length === 0 ? (
                <tr>
                  <td colSpan="6" className="py-8 text-center text-slate-500">No payment records under "{filterStatus}".</td>
                </tr>
              ) : (
                filteredPayments.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-800/40 transition-colors">
                    
                    {/* Student Info */}
                    <td className="py-3.5 px-4 font-bold text-white">
                      {p.student_name}
                      <span className="block text-[10px] text-slate-500 font-normal">Room #{p.room_number || 'N/A'}</span>
                    </td>

                    {/* Amount */}
                    <td className="py-3.5 px-4 font-bold text-white">
                      ₹{p.amount?.toLocaleString('en-IN')}
                      <span className="block text-[10px] text-slate-400 font-normal">{p.month_year}</span>
                    </td>

                    {/* UTR & Payment App */}
                    <td className="py-3.5 px-4">
                      {p.utr_number ? (
                        <div>
                          <span className="font-mono text-indigo-300 font-bold">{p.utr_number}</span>
                          <span className="block text-[10px] text-slate-400">{p.payment_app || 'UPI App'}</span>
                        </div>
                      ) : (
                        <span className="text-slate-500 italic text-[11px]">No UTR Submitted</span>
                      )}
                    </td>

                    {/* Status Badge */}
                    <td className="py-3.5 px-4">
                      {p.status === 'Paid' ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 text-[10px] font-bold border border-emerald-500/20">
                          <CheckCircle className="w-3 h-3" /> Paid (Verified)
                        </span>
                      ) : p.status === 'Pending Verification' ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-500/10 text-amber-300 text-[10px] font-bold border border-amber-500/20 animate-pulse">
                          <Clock className="w-3 h-3 text-amber-400" /> Pending Verification
                        </span>
                      ) : p.status === 'Rejected' ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-rose-500/10 text-rose-400 text-[10px] font-bold border border-rose-500/20">
                          <X className="w-3 h-3" /> Rejected
                        </span>
                      ) : p.status === 'Overdue' ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-rose-500/10 text-rose-400 text-[10px] font-bold border border-rose-500/20">
                          <AlertCircle className="w-3 h-3" /> Overdue
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-slate-800 text-slate-400 text-[10px] font-bold">
                          Unpaid
                        </span>
                      )}
                    </td>

                    {/* Receipt Number */}
                    <td className="py-3.5 px-4 font-mono text-[11px] text-slate-400">
                      {p.receipt_number || '—'}
                    </td>

                    {/* Actions */}
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {p.status === 'Pending Verification' ? (
                          <button
                            onClick={() => {
                              setVerifyingPayment(p);
                              setVerifyNote('Verified & Approved by Sandeep Sakhare');
                            }}
                            className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-[11px] shadow-sm transition-all"
                          >
                            <ShieldCheck className="w-3.5 h-3.5" /> Verify UTR
                          </button>
                        ) : p.status === 'Paid' ? (
                          <button
                            onClick={() => fetchReceiptModal(p.id)}
                            className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-indigo-950 hover:bg-indigo-900 border border-indigo-800 text-indigo-300 font-semibold text-[11px]"
                          >
                            <Printer className="w-3.5 h-3.5" /> Receipt
                          </button>
                        ) : (
                          <button
                            onClick={() => {
                              setVerifyingPayment(p);
                              setVerifyNote('Manual Payment Verification by Sandeep Sakhare');
                            }}
                            className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-[11px]"
                          >
                            Verify
                          </button>
                        )}
                      </div>
                    </td>

                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Verify UTR Submission Modal */}
      {verifyingPayment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl space-y-4 text-xs">
            
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-amber-400" /> Verify UTR Transaction
              </h3>
              <button onClick={() => setVerifyingPayment(null)} className="text-slate-400 hover:text-white">✕</button>
            </div>

            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-1.5">
              <p className="font-bold text-white text-sm">{verifyingPayment.student_name} (Room #{verifyingPayment.room_number})</p>
              <p className="text-slate-300">Billing Month: <strong>{verifyingPayment.month_year}</strong></p>
              <p className="text-slate-300">Amount Paid: <strong className="text-emerald-400 text-sm">₹{verifyingPayment.amount?.toLocaleString('en-IN')}</strong></p>
              <p className="text-slate-300">12-Digit UTR Number: <strong className="font-mono text-indigo-300 text-sm">{verifyingPayment.utr_number || 'N/A'}</strong></p>
              <p className="text-slate-400">Payment App: <strong>{verifyingPayment.payment_app || 'UPI App'}</strong></p>
            </div>

            <div>
              <label className="block text-slate-300 font-semibold mb-1">Verification Remark / Note (Sandeep Sakhare)</label>
              <textarea
                rows="2"
                value={verifyNote}
                onChange={(e) => setVerifyNote(e.target.value)}
                placeholder="e.g. UTR matched with bank statement."
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-indigo-500"
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
                    placeholder="e.g. sandeepsakhare@upi"
                    className="w-full px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-indigo-500"
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
                    className="w-full px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-indigo-500"
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
                  className="w-full px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-indigo-500"
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
                  className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold"
                >
                  Save QR Settings
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

      {/* Record Payment Modal */}
      {showRecordModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl space-y-4 text-xs">
            
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-base font-bold text-white">Record Manual Fee Transaction</h3>
              <button onClick={() => setShowRecordModal(false)} className="text-slate-400 hover:text-white">✕</button>
            </div>

            <form onSubmit={handleRecordPayment} className="space-y-3">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Select Student</label>
                <select
                  required
                  value={formData.student_id}
                  onChange={(e) => {
                    const st = students.find((s) => s.id === parseInt(e.target.value));
                    setFormData({
                      ...formData,
                      student_id: e.target.value,
                      amount: st ? st.monthly_rent : 6500
                    });
                  }}
                  className="w-full px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-indigo-500"
                >
                  <option value="">-- Choose Student --</option>
                  {students.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} ({s.email})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Billing Month</label>
                  <input
                    type="text"
                    required
                    value={formData.month_year}
                    onChange={(e) => setFormData({ ...formData, month_year: e.target.value })}
                    placeholder="e.g. August 2026"
                    className="w-full px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Amount (₹)</label>
                  <input
                    type="number"
                    required
                    value={formData.amount}
                    onChange={(e) => setFormData({ ...formData, amount: parseFloat(e.target.value) })}
                    className="w-full px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
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
                  className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold"
                >
                  Save & Generate Receipt
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

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
