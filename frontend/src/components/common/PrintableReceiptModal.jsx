import React from 'react';
import { Printer, X, Download, ShieldCheck, CheckCircle } from 'lucide-react';

export default function PrintableReceiptModal({ receiptData, onClose }) {
  if (!receiptData) return null;

  const { hostelName, hostelAddress, ownerName, contactPhone, receipt } = receiptData;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
      <div className="relative w-full max-w-2xl bg-white text-slate-900 rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
        
        {/* Modal Control Bar */}
        <div className="no-print flex items-center justify-between px-6 py-4 bg-slate-900 text-slate-100 border-b border-slate-800">
          <div className="flex items-center gap-2 font-semibold">
            <ShieldCheck className="w-5 h-5 text-emerald-400" />
            <span>Official Fee Receipt • Verified by Sandeep Sakhare</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg transition-colors shadow-sm"
            >
              <Printer className="w-4 h-4" />
              <span>Print / Save PDF</span>
            </button>
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Area */}
        <div className="printable-receipt-area p-8 bg-white font-sans">
          
          {/* Header Branding */}
          <div className="flex justify-between items-start border-b-2 border-emerald-600 pb-6 mb-6">
            <div>
              <h1 className="text-2xl font-bold text-slate-900 tracking-tight">{hostelName || 'Sakhare Plot Hostel'}</h1>
              <p className="text-xs font-semibold text-emerald-700 mt-0.5">Hostel Owner & Management: {ownerName || 'Sandeep Sakhare'}</p>
              <p className="text-xs text-slate-600 mt-1">{hostelAddress || 'Plot No. 14, Main Road, Block A, City Center'}</p>
              <p className="text-xs text-slate-500">Phone: {contactPhone || '+91 98765 43210'}</p>
            </div>
            <div className="text-right">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-100 text-emerald-800 text-xs font-bold rounded-full border border-emerald-300">
                <CheckCircle className="w-4 h-4" />
                <span>PAYMENT APPROVED</span>
              </div>
              <p className="text-xs text-slate-500 mt-2 font-mono">Receipt No: <strong className="text-slate-900">{receipt?.receipt_number || 'SPH-REC-2026'}</strong></p>
              <p className="text-xs text-slate-500 font-mono">Date: {receipt?.payment_date || new Date().toISOString().split('T')[0]}</p>
            </div>
          </div>

          {/* Student & Room Details */}
          <div className="grid grid-cols-2 gap-4 p-4 bg-slate-50 rounded-xl border border-slate-200 mb-6 text-sm">
            <div>
              <p className="text-xs font-semibold uppercase text-slate-400 tracking-wider">Student Profile</p>
              <p className="font-bold text-slate-900 text-base">{receipt?.student_name}</p>
              <p className="text-xs text-slate-600 mt-1">Email: {receipt?.student_email}</p>
              <p className="text-xs text-slate-600">Mobile: {receipt?.student_phone || 'N/A'}</p>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase text-slate-400 tracking-wider">Accommodation Info</p>
              <p className="font-bold text-slate-900 text-base">Room #{receipt?.room_number || 'Unassigned'}</p>
              <p className="text-xs text-slate-600 mt-1">Type: {receipt?.room_type || 'Double Sharing'} ({receipt?.ac_type || 'AC'})</p>
              <p className="text-xs text-slate-600">Billing Period: <strong>{receipt?.month_year}</strong></p>
            </div>
          </div>

          {/* Fee Table */}
          <div className="mb-6">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-300 bg-slate-100 text-xs font-bold uppercase text-slate-600">
                  <th className="py-2.5 px-4">Item Description</th>
                  <th className="py-2.5 px-4">Period</th>
                  <th className="py-2.5 px-4 text-right">Amount (₹)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 text-sm">
                <tr>
                  <td className="py-3 px-4 font-medium text-slate-900">Monthly Room Rent & Hostel Facilities</td>
                  <td className="py-3 px-4 text-slate-600">{receipt?.month_year}</td>
                  <td className="py-3 px-4 text-right font-semibold text-slate-900">₹{receipt?.amount?.toLocaleString('en-IN')}</td>
                </tr>
                <tr>
                  <td className="py-3 px-4 font-medium text-slate-900">Wi-Fi, Water & Security Services</td>
                  <td className="py-3 px-4 text-slate-600">{receipt?.month_year}</td>
                  <td className="py-3 px-4 text-right text-emerald-600 font-semibold">Included</td>
                </tr>
              </tbody>
              <tfoot>
                <tr className="border-t-2 border-slate-900 text-base font-bold">
                  <td colSpan="2" className="py-3 px-4 text-right">Total Amount Received:</td>
                  <td className="py-3 px-4 text-right text-emerald-700 text-lg">₹{receipt?.amount?.toLocaleString('en-IN')}</td>
                </tr>
              </tfoot>
            </table>
          </div>

          {/* Payment Method & Signatures */}
          <div className="grid grid-cols-2 gap-4 border-t border-slate-200 pt-4 text-xs text-slate-600">
            <div>
              <p className="font-semibold text-slate-900">Transaction Verification Details:</p>
              <p className="mt-1">Payment Mode: <strong className="text-slate-800">{receipt?.payment_method || 'UPI QR Code'}</strong></p>
              {receipt?.utr_number && (
                <p>12-Digit UTR Number: <strong className="font-mono text-slate-900">{receipt.utr_number}</strong></p>
              )}
              {receipt?.payment_app && (
                <p>Payment App: <strong className="text-slate-800">{receipt.payment_app}</strong></p>
              )}
              <p className="mt-2 text-slate-400 italic">Digitally verified & logged in Sakhare Plot System.</p>
            </div>
            <div className="text-right flex flex-col justify-end items-end">
              <div className="w-36 border-b border-slate-400 mb-1"></div>
              <p className="font-bold text-slate-900">{ownerName || 'Sandeep Sakhare'}</p>
              <p className="text-slate-500">Hostel Owner & Authorized Manager</p>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}
