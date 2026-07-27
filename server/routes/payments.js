const express = require('express');
const router = express.Router();
const { getMemoryDB, saveMemoryDB } = require('../models/schemas');
const { authMiddleware } = require('../middleware/auth');

// GET /api/payments - List payments with filters
router.get('/', authMiddleware, (req, res) => {
  const db = getMemoryDB();
  const { status, studentId, month } = req.query;

  let list = db.payments;

  if (status) {
    list = list.filter(p => p.status === status);
  }
  if (studentId) {
    list = list.filter(p => p.studentId === studentId);
  }
  if (month) {
    list = list.filter(p => p.month.toLowerCase() === month.toLowerCase());
  }

  // Calculate summary stats
  const totalCollected = db.payments
    .filter(p => p.status === 'confirmed')
    .reduce((acc, p) => acc + (p.amount || 0), 0);

  const pendingConfirmationCount = db.payments.filter(p => p.status === 'pending_owner').length;
  const pendingConfirmationAmount = db.payments
    .filter(p => p.status === 'pending_owner')
    .reduce((acc, p) => acc + (p.amount || 0), 0);

  return res.json({
    payments: list.sort((a, b) => new Date(b.date || b.createdAt) - new Date(a.date || a.createdAt)),
    stats: {
      totalCollected,
      pendingConfirmationCount,
      pendingConfirmationAmount
    }
  });
});

// GET /api/payments/qr-payload - Get dynamic UPI QR metadata
router.get('/qr-payload', authMiddleware, (req, res) => {
  const db = getMemoryDB();
  const { amount, studentName, month, note } = req.query;

  const upiId = db.settings.upiId || '9322465627@ybl';
  const hostelName = db.settings.hostelName || 'Hostel Management';
  const payAmount = amount || '6500';
  const refNote = note || `Rent for ${month || 'Current Month'} - ${studentName || 'Student'}`;

  // Standard Indian National Payments Corporation (NPCI) UPI Deep Link Spec
  const upiLink = `upi://pay?pa=${encodeURIComponent(upiId)}&pn=${encodeURIComponent(hostelName)}&am=${payAmount}&cu=INR&tn=${encodeURIComponent(refNote)}`;

  // SVG QR Code rendering helper payload
  return res.json({
    upiId,
    hostelName,
    amount: payAmount,
    note: refNote,
    upiLink,
    qrText: upiLink
  });
});

// POST /api/payments - Submit new payment log (Staff or Admin)
router.post('/', authMiddleware, (req, res) => {
  const db = getMemoryDB();
  const { studentId, month, year, amount, type, upiTransactionId, notes, paymentMethod } = req.body;

  if (!studentId || !month || !amount) {
    return res.status(400).json({ error: 'Student ID, month, and amount are required' });
  }

  const student = db.students.find(s => s.id === studentId);
  if (!student) {
    return res.status(404).json({ error: 'Student not found' });
  }

  const isOwner = req.user.role === 'admin';
  const newPayment = {
    id: 'pay-' + Date.now(),
    studentId: student.id,
    studentName: student.name,
    roomNo: student.roomNo,
    month,
    year: year || new Date().getFullYear(),
    amount: Number(amount),
    type: type || 'rent',
    status: isOwner ? 'confirmed' : 'pending_owner', // Auto-confirm if owner submits
    upiTransactionId: upiTransactionId || `UPI-${Math.floor(1000000000 + Math.random() * 9000000000)}`,
    paymentMethod: paymentMethod || 'UPI QR',
    notes: notes || 'Submitted via Hostel Portal',
    submittedBy: req.user.name,
    confirmedBy: isOwner ? req.user.name : null,
    date: new Date().toISOString().split('T')[0],
    createdAt: new Date().toISOString()
  };

  db.payments.push(newPayment);
  saveMemoryDB(db);

  return res.status(201).json({
    message: isOwner ? 'Payment logged and confirmed' : 'Payment log submitted. Pending owner confirmation.',
    payment: newPayment
  });
});

// PUT /api/payments/:id/confirm - Owner Confirmation (Approve/Reject) (Admin only)
router.put('/:id/confirm', authMiddleware, (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Only Hostel Owner (Admin) can confirm or reject payments' });
  }

  const { status, notes } = req.body; // 'confirmed' or 'rejected'
  if (!['confirmed', 'rejected'].includes(status)) {
    return res.status(400).json({ error: 'Status must be confirmed or rejected' });
  }

  const db = getMemoryDB();
  const payment = db.payments.find(p => p.id === req.params.id);
  if (!payment) {
    return res.status(404).json({ error: 'Payment record not found' });
  }

  payment.status = status;
  payment.confirmedBy = req.user.name;
  if (notes) {
    payment.notes = (payment.notes ? payment.notes + ' | ' : '') + `Owner note: ${notes}`;
  }

  saveMemoryDB(db);

  return res.json({
    message: `Payment status updated to ${status.toUpperCase()}`,
    payment
  });
});

module.exports = router;
