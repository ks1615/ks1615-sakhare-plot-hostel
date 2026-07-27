import React, { useState, useEffect } from 'react';
import { fetchApi } from '../../services/api';
import PrintableReceiptModal from '../common/PrintableReceiptModal';
import { 
  CreditCard, 
  Printer, 
  CheckCircle, 
  Clock, 
  AlertCircle, 
  QrCode, 
  X, 
  Send, 
  Copy, 
  Check 
} from 'lucide-react';

export default function StudentFeeHistory() {
  const [payments, setPayments] = useState([]);
  const [qrSettings, setQrSettings] = useState(null);
  const [loading, setLoading] = useState(true);

  // Modals
  const [showPayModal, setShowPayModal] = useState(false);
  const [selectedReceipt, setSelectedReceipt] = useState(null);

  // Payment Form
  const [copiedUpi, setCopiedUpi] = useState(false);
  const [utrForm, setUtrForm] = useState({
    month_year: 'August 2026',
    amount: 6500,
    utr_number: '',
    payment_app: 'Google Pay'
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const payRes = await fetchApi('/payments');
      const qrRes = await fetchApi('/payments/qr-settings');
      setPayments(payRes.payments || []);
      if (qrRes.settings) {
        setQrSettings(qrRes.settings);
      }
    } catch (err) {
      console.error('Failed loading fee data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitUtr = async (e) => {
    e.preventDefault();
    if (!utrForm.utr_number || utrForm.utr_number.trim().length < 6) {
      alert('Please enter a valid 12-digit UTR transaction ID.');
      return;
    }
    try {
      await fetchApi('/payments/submit-upi', {
        method: 'POST',
        body: JSON.stringify(utrForm)
      });
      setShowPayModal(false);
      setUtrForm({ month_year: 'August 2026', amount: 6500, utr_number: '', payment_app: 'Google Pay' });
      loadData();
    } catch (err) {
      alert('Error submitting payment proof: ' + err.message);
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

  const copyUpiId = () => {
    const upi = qrSettings?.upi_id || '9322465627@ybl';
    navigator.clipboard.writeText(upi);
    setCopiedUpi(true);
    setTimeout(() => setCopiedUpi(false), 2000);
  };

  return (
    <div className="space-y-6">
      
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-extrabold text-white flex items-center gap-2">
            <CreditCard className="w-5 h-5 text-indigo-400" /> Fee Payment & QR Code Center
          </h2>
          <p className="text-xs text-slate-400 mt-1">Scan Sandeep Sakhare's UPI QR Code to pay rent and submit UTR proof.</p>
        </div>

        <button
          onClick={() => setShowPayModal(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs shadow-lg shadow-emerald-600/20 transition-all"
        >
          <QrCode className="w-4 h-4" /> Pay Rent via UPI QR Code
        </button>
      </div>

      {/* History Table */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-950/80 uppercase font-bold text-[11px] text-slate-400 border-b border-slate-800">
              <tr>
                <th className="py-3.5 px-4">Billing Period</th>
                <th className="py-3.5 px-4">Amount</th>
                <th className="py-3.5 px-4">UTR Number & App</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4">Receipt Number</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {loading ? (
                <tr>
                  <td colSpan="6" className="py-8 text-center text-slate-500">Loading fee records...</td>
                </tr>
              ) : payments.length === 0 ? (
                <tr>
                  <td colSpan="6" className="py-8 text-center text-slate-500">No payment records found.</td>
                </tr>
              ) : (
                payments.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-800/40 transition-colors">
                    
                    <td className="py-3.5 px-4 font-bold text-white">{p.month_year}</td>

                    <td className="py-3.5 px-4 font-bold text-white">₹{p.amount?.toLocaleString('en-IN')}</td>

                    <td className="py-3.5 px-4 font-mono text-[11px] text-indigo-300">
                      {p.utr_number || p.transaction_id || '—'}
                      {p.payment_app && <span className="block text-[10px] text-slate-500 font-sans">{p.payment_app}</span>}
                    </td>

                    <td className="py-3.5 px-4">
                      {p.status === 'Paid' ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 text-[10px] font-bold border border-emerald-500/20">
                          <CheckCircle className="w-3 h-3" /> Paid & Verified
                        </span>
                      ) : p.status === 'Pending Verification' ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-500/10 text-amber-300 text-[10px] font-bold border border-amber-500/20 animate-pulse">
                          <Clock className="w-3 h-3 text-amber-400" /> Pending Owner Verification
                        </span>
                      ) : p.status === 'Overdue' ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-rose-500/10 text-rose-400 text-[10px] font-bold border border-rose-500/20">
                          <AlertCircle className="w-3 h-3" /> Overdue
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-500/10 text-amber-400 text-[10px] font-bold border border-amber-500/20">
                          <Clock className="w-3 h-3" /> Pending Payment
                        </span>
                      )}
                    </td>

                    <td className="py-3.5 px-4 font-mono text-[11px] text-slate-400">
                      {p.receipt_number || '—'}
                    </td>

                    <td className="py-3.5 px-4 text-right">
                      {p.status === 'Paid' ? (
                        <button
                          onClick={() => fetchReceiptModal(p.id)}
                          className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-sm transition-all ml-auto"
                        >
                          <Printer className="w-3.5 h-3.5" /> Print Receipt
                        </button>
                      ) : (
                        <button
                          onClick={() => {
                            setUtrForm({
                              ...utrForm,
                              month_year: p.month_year,
                              amount: p.amount
                            });
                            setShowPayModal(true);
                          }}
                          className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-sm transition-all ml-auto"
                        >
                          Pay Now
                        </button>
                      )}
                    </td>

                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pay via UPI QR Code Modal */}
      {showPayModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl space-y-4 text-xs">
            
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <QrCode className="w-5 h-5 text-emerald-400" /> UPI QR Code Payment
              </h3>
              <button onClick={() => setShowPayModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* QR Code Card */}
            <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 text-center space-y-3">
              <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Hostel Owner UPI Payment</p>

              <div className="w-48 h-48 mx-auto bg-white p-2.5 rounded-2xl shadow-xl flex items-center justify-center">
                <img
                  src={qrSettings?.qr_code_url || '/sandeep_qr.jpg'}
                  alt="Sandeep Sakhare UPI QR Code"
                  className="w-full h-full object-contain"
                />
              </div>

              <div>
                <p className="font-bold text-white text-sm">{qrSettings?.account_holder || 'Sandeep Sakhare'}</p>
                <div className="inline-flex items-center gap-2 px-3 py-1 mt-1 rounded-xl bg-slate-900 border border-slate-800 text-xs">
                  <span className="font-mono text-emerald-400 font-bold">{qrSettings?.upi_id || '9322465627@ybl'}</span>
                  <button onClick={copyUpiId} className="text-slate-400 hover:text-white">
                    {copiedUpi ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              <p className="text-[11px] text-slate-400">Scan with GPay, PhonePe, Paytm, or BHIM to pay rent.</p>
            </div>

            {/* UTR Submission Form */}
            <form onSubmit={handleSubmitUtr} className="space-y-3">
              
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Billing Month</label>
                  <input
                    type="text"
                    required
                    value={utrForm.month_year}
                    onChange={(e) => setUtrForm({ ...utrForm, month_year: e.target.value })}
                    className="w-full px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Amount (₹)</label>
                  <input
                    type="number"
                    required
                    value={utrForm.amount}
                    onChange={(e) => setUtrForm({ ...utrForm, amount: parseFloat(e.target.value) })}
                    className="w-full px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Payment App Used</label>
                <select
                  value={utrForm.payment_app}
                  onChange={(e) => setUtrForm({ ...utrForm, payment_app: e.target.value })}
                  className="w-full px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-indigo-500"
                >
                  <option value="Google Pay">Google Pay (GPay)</option>
                  <option value="PhonePe">PhonePe</option>
                  <option value="Paytm">Paytm</option>
                  <option value="BHIM UPI">BHIM UPI</option>
                  <option value="Bank NetBanking">Bank NetBanking</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">12-Digit UTR / Transaction Ref ID</label>
                <input
                  type="text"
                  required
                  value={utrForm.utr_number}
                  onChange={(e) => setUtrForm({ ...utrForm, utr_number: e.target.value })}
                  placeholder="e.g. 202607289812"
                  className="w-full px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white font-mono placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="pt-3 flex justify-end gap-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowPayModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold shadow-md shadow-emerald-600/20 transition-all flex items-center gap-1.5"
                >
                  <Send className="w-3.5 h-3.5" /> Submit Payment Proof
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

      {selectedReceipt && (
        <PrintableReceiptModal
          receiptData={selectedReceipt}
          onClose={() => setSelectedReceipt(null)}
        />
      )}

    </div>
  );
}
