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
  Check, 
  Upload, 
  Image as ImageIcon, 
  Calendar, 
  Smartphone, 
  DollarSign, 
  Bell, 
  Ticket 
} from 'lucide-react';

export default function StudentFeeHistory() {
  const [payments, setPayments] = useState([]);
  const [qrSettings, setQrSettings] = useState(null);
  const [loading, setLoading] = useState(true);

  // Modals
  const [showPayModal, setShowPayModal] = useState(false);
  const [selectedReceipt, setSelectedReceipt] = useState(null);

  // Payment Form State (Tied directly to an owner-issued ticket)
  const [copiedUpi, setCopiedUpi] = useState(false);
  const [utrForm, setUtrForm] = useState({
    payment_id: null,
    month_year: '',
    amount: 0,
    payment_date: new Date().toISOString().split('T')[0],
    payment_app: 'Google Pay',
    utr_number: '',
    screenshot_url: ''
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const payRes = await fetchApi('/payments');
      if (payRes && payRes.payments) {
        setPayments(payRes.payments);
      }
      try {
        const qrRes = await fetchApi('/payments/qr-settings');
        if (qrRes && qrRes.settings) {
          setQrSettings(qrRes.settings);
        }
      } catch (qrErr) {
        console.warn('QR Settings load notice:', qrErr.message);
      }
    } catch (err) {
      console.error('Failed loading fee data:', err);
    } finally {
      setLoading(false);
    }
  };

  const openPayModalForTicket = (ticket) => {
    setUtrForm({
      payment_id: ticket.id,
      month_year: ticket.month_year || ticket.month,
      amount: ticket.amount,
      payment_date: new Date().toISOString().split('T')[0],
      payment_app: 'Google Pay',
      utr_number: '',
      screenshot_url: ''
    });
    setShowPayModal(true);
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        alert('File size exceeds 5MB limit. Please upload a smaller image.');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setUtrForm(prev => ({ ...prev, screenshot_url: reader.result }));
      };
      reader.readAsDataURL(file);
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

  // Find active pending ticket raised by owner
  const activePendingTicket = payments.find(p => p.status === 'pending_payment');

  return (
    <div className="space-y-6">
      
      {/* Header Bar */}
      <div>
        <h2 className="text-xl font-extrabold text-white flex items-center gap-2">
          <CreditCard className="w-5 h-5 text-indigo-400" /> Fee Payment & Payment Proof Center
        </h2>
        <p className="text-xs text-slate-400 mt-1">Pay rent invoices issued by Owner Sandeep Sakhare via UPI QR and upload payment screenshot proof.</p>
      </div>

      {/* Ticket Notification Alert (If Owner Raised a Ticket) */}
      {activePendingTicket ? (
        <div className="p-4 rounded-2xl bg-gradient-to-r from-indigo-950/80 via-slate-900 to-emerald-950/40 border border-emerald-500/40 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs shadow-xl">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold shrink-0">
              <Bell className="w-5 h-5 animate-pulse text-emerald-400" />
            </div>
            <div>
              <p className="font-extrabold text-white text-sm">
                📢 Rent Payment Ticket Raised by Owner!
              </p>
              <p className="text-slate-300 mt-0.5">
                Owner Sandeep Sakhare issued a ticket for <strong>{activePendingTicket.month_year || activePendingTicket.month}</strong> of <strong className="text-emerald-400 text-sm">₹{activePendingTicket.amount?.toLocaleString('en-IN')}</strong>.
              </p>
            </div>
          </div>
          <button
            onClick={() => openPayModalForTicket(activePendingTicket)}
            className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-extrabold text-xs transition-all shrink-0 shadow-lg shadow-emerald-600/20 flex items-center gap-1.5 animate-bounce"
          >
            <QrCode className="w-4 h-4" /> Pay Now & Upload Proof
          </button>
        </div>
      ) : (
        <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 flex items-center gap-3 text-xs text-slate-400">
          <CheckCircle className="w-5 h-5 text-emerald-400 shrink-0" />
          <p>
            No pending fee tickets raised by the owner right now. You can pay once owner Sandeep Sakhare issues a rent ticket to your account.
          </p>
        </div>
      )}

      {/* Fee History & Tickets Table */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl overflow-hidden shadow-xl text-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-slate-300">
            <thead className="bg-slate-950/80 uppercase font-bold text-[11px] text-slate-400 border-b border-slate-800">
              <tr>
                <th className="py-3.5 px-4">Billing Period</th>
                <th className="py-3.5 px-4">Amount</th>
                <th className="py-3.5 px-4">Date & App Used</th>
                <th className="py-3.5 px-4">12-Digit UTR ID</th>
                <th className="py-3.5 px-4">Proof Screenshot</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {loading ? (
                <tr>
                  <td colSpan="7" className="py-8 text-center text-slate-500">Loading fee records...</td>
                </tr>
              ) : payments.length === 0 ? (
                <tr>
                  <td colSpan="7" className="py-12 text-center text-slate-400">
                    <CheckCircle className="w-10 h-10 text-emerald-400 mx-auto mb-2" />
                    <p className="font-bold text-sm text-white">No Payment Records Found</p>
                    <p className="text-xs text-slate-400 max-w-sm mx-auto mt-1">
                      You will see your fee tickets here as soon as the hostel owner issues a ticket for rent or electricity.
                    </p>
                  </td>
                </tr>
              ) : (
                payments.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-800/40 transition-colors">
                    
                    <td className="py-3.5 px-4 font-bold text-white">
                      {p.month_year || p.month}
                      <span className="block text-[10px] text-slate-400 font-normal">{p.notes || 'Hostel Rent Ticket'}</span>
                    </td>

                    <td className="py-3.5 px-4 font-extrabold text-white">₹{p.amount?.toLocaleString('en-IN')}</td>

                    <td className="py-3.5 px-4 text-slate-300">
                      <span>{p.payment_date || p.date || '—'}</span>
                      {(p.payment_app || p.paymentMethod) && (
                        <span className="block text-[10px] text-indigo-400 font-semibold">{p.payment_app || p.paymentMethod}</span>
                      )}
                    </td>

                    <td className="py-3.5 px-4 font-mono text-[11px] text-indigo-300">
                      {p.utr_number || p.upiTransactionId || '—'}
                    </td>

                    <td className="py-3.5 px-4">
                      {p.screenshot_url ? (
                        <a href={p.screenshot_url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-[11px] text-emerald-400 hover:underline font-semibold">
                          <ImageIcon className="w-3.5 h-3.5" /> View Proof
                        </a>
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
                          <Ticket className="w-3 h-3" /> Pending Payment (Bill Issued)
                        </span>
                      )}
                    </td>

                    <td className="py-3.5 px-4 text-right">
                      {p.status === 'pending_payment' ? (
                        <button
                          onClick={() => openPayModalForTicket(p)}
                          className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-extrabold text-xs shadow-md shadow-emerald-600/20 transition-all ml-auto flex items-center gap-1.5"
                        >
                          <QrCode className="w-3.5 h-3.5" /> Pay Now
                        </button>
                      ) : p.status === 'confirmed' || p.status === 'Paid' ? (
                        <button
                          onClick={() => fetchReceiptModal(p.id)}
                          className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-emerald-600/20 hover:bg-emerald-600 text-emerald-300 hover:text-white font-bold text-xs border border-emerald-500/30 transition-all ml-auto"
                        >
                          <Printer className="w-3.5 h-3.5" /> Print Receipt
                        </button>
                      ) : (
                        <span className="text-[11px] text-amber-400 font-semibold italic">Awaiting Owner Approval</span>
                      )}
                    </td>

                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pay via UPI QR & Payment Proof Form Modal */}
      {showPayModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm overflow-y-auto">
          <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl space-y-4 text-xs max-h-[90vh] overflow-y-auto">
            
            <div className="flex items-center justify-between pb-3 border-b border-slate-800 sticky top-0 bg-slate-900 z-10">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <QrCode className="w-5 h-5 text-emerald-400" /> UPI QR Payment & Proof Submission
              </h3>
              <button onClick={() => setShowPayModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Step 1: Scan UPI QR Code */}
            <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 text-center space-y-3">
              <div className="flex items-center justify-between">
                <span className="px-2.5 py-1 rounded-lg bg-emerald-950 text-emerald-400 text-[10px] font-extrabold border border-emerald-800/40">
                  Step 1: Scan & Pay ₹{utrForm.amount}
                </span>
                <span className="font-bold text-slate-300">Sandeep Sakhare (Owner)</span>
              </div>
              
              <div className="w-44 h-44 mx-auto bg-white p-2.5 rounded-2xl shadow-inner flex items-center justify-center">
                <img
                  src={qrSettings?.qr_code_url || `https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=upi://pay?pa=${encodeURIComponent(qrSettings?.upi_id || '9322465627@ybl')}%26pn=${encodeURIComponent('Sakhare Plot Hostel')}%26am=${utrForm.amount}%26cu=INR`}
                  alt="Sakhare Hostel UPI QR Code"
                  className="w-full h-full object-contain"
                />
              </div>

              <div className="flex items-center justify-center gap-2 text-xs">
                <span className="font-mono font-bold text-emerald-400 bg-emerald-950/60 px-3 py-1 rounded-lg border border-emerald-800/40">
                  {qrSettings?.upi_id || '9322465627@ybl'}
                </span>
                <button
                  type="button"
                  onClick={copyUpiId}
                  className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
                  title="Copy UPI ID"
                >
                  {copiedUpi ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                </button>
              </div>
              <p className="text-[11px] text-slate-400">Scan with GPay, PhonePe, Paytm, or BHIM to pay rent.</p>
            </div>

            {/* Step 2: Submit Payment Proof Form */}
            <div className="pt-2 border-t border-slate-800">
              <span className="inline-block mb-3 px-2.5 py-1 rounded-lg bg-indigo-950 text-indigo-300 text-[10px] font-extrabold border border-indigo-800/40">
                Step 2: Fill Form & Upload Screenshot Proof
              </span>

              <form onSubmit={handleSubmitUtr} className="space-y-3">
                
                {/* Row 1: Period & Amount */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-400 mb-1 font-semibold">Billing Period</label>
                    <input
                      type="text"
                      disabled
                      value={utrForm.month_year}
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-200 font-bold"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-400 mb-1 font-semibold flex items-center gap-1">
                      <DollarSign className="w-3.5 h-3.5 text-emerald-400" /> Ticket Amount (₹)
                    </label>
                    <input
                      type="number"
                      disabled
                      value={utrForm.amount}
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-emerald-400 font-bold"
                    />
                  </div>
                </div>

                {/* Row 2: Payment Date & UPI App Used */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-300 font-semibold mb-1 flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5 text-indigo-400" /> Payment Date
                    </label>
                    <input
                      type="date"
                      required
                      value={utrForm.payment_date}
                      onChange={(e) => setUtrForm({ ...utrForm, payment_date: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-300 font-semibold mb-1 flex items-center gap-1">
                      <Smartphone className="w-3.5 h-3.5 text-indigo-400" /> UPI App Used
                    </label>
                    <select
                      value={utrForm.payment_app}
                      onChange={(e) => setUtrForm({ ...utrForm, payment_app: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-emerald-500"
                    >
                      <option value="Google Pay">Google Pay (GPay)</option>
                      <option value="PhonePe">PhonePe</option>
                      <option value="Paytm">Paytm</option>
                      <option value="BHIM UPI">BHIM UPI</option>
                      <option value="Amazon Pay">Amazon Pay</option>
                      <option value="Other Bank App">Other Bank App</option>
                    </select>
                  </div>
                </div>

                {/* Row 3: 12-Digit UTR ID */}
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">
                    12-Digit UTR / Transaction Reference ID
                  </label>
                  <input
                    type="text"
                    required
                    value={utrForm.utr_number}
                    onChange={(e) => setUtrForm({ ...utrForm, utr_number: e.target.value })}
                    placeholder="e.g. 324156789012"
                    className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white font-mono placeholder-slate-600 focus:outline-none focus:border-emerald-500 text-xs"
                  />
                </div>

                {/* Row 4: Upload Payment Screenshot Proof */}
                <div>
                  <label className="block text-slate-300 font-semibold mb-1 flex items-center gap-1">
                    <Upload className="w-3.5 h-3.5 text-emerald-400" /> Upload Payment Screenshot / Receipt Proof
                  </label>
                  
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="w-full text-xs text-slate-400 file:mr-3 file:py-2 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-emerald-500/20 file:text-emerald-400 hover:file:bg-emerald-500/30 cursor-pointer bg-slate-950 border border-slate-800 rounded-xl p-1"
                  />

                  {utrForm.screenshot_url && (
                    <div className="mt-2.5 p-2 rounded-xl bg-slate-950 border border-slate-800 flex items-center gap-3">
                      <img
                        src={utrForm.screenshot_url}
                        alt="Proof Preview"
                        className="w-14 h-14 object-cover rounded-lg border border-slate-700"
                      />
                      <div>
                        <p className="text-emerald-400 font-bold text-xs flex items-center gap-1">
                          <Check className="w-3.5 h-3.5" /> Screenshot Attached
                        </p>
                        <p className="text-[10px] text-slate-400">Ready to send to Sandeep Sakhare for verification.</p>
                      </div>
                    </div>
                  )}
                </div>

                <div className="pt-2 flex gap-2">
                  <button
                    type="button"
                    onClick={() => setShowPayModal(false)}
                    className="flex-1 py-2.5 rounded-xl bg-slate-800 text-slate-300 font-bold hover:bg-slate-700 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold shadow-lg shadow-emerald-600/20 transition-all flex items-center justify-center gap-1.5"
                  >
                    <Send className="w-3.5 h-3.5" /> Submit Payment Proof
                  </button>
                </div>
              </form>
            </div>

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
