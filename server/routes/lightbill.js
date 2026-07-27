const express = require('express');
const router = express.Router();
const { getMemoryDB, saveMemoryDB } = require('../models/schemas');
const { authMiddleware } = require('../middleware/auth');

// GET /api/lightbill - List electricity logs
router.get('/', authMiddleware, (req, res) => {
  const db = getMemoryDB();
  return res.json({
    lightBills: db.lightBills,
    perUnitRate: db.settings.perUnitLightRate || 8.5
  });
});

// POST /api/lightbill - Add room meter reading & calculate split
router.post('/', authMiddleware, (req, res) => {
  const db = getMemoryDB();
  const { roomNo, month, year, previousReading, currentReading, ratePerUnit } = req.body;

  if (!roomNo || !month || previousReading === undefined || currentReading === undefined) {
    return res.status(400).json({ error: 'Room number, month, previous reading, and current reading are required' });
  }

  const prev = Number(previousReading);
  const curr = Number(currentReading);
  if (curr < prev) {
    return res.status(400).json({ error: 'Current reading cannot be lower than previous meter reading' });
  }

  const totalUnits = curr - prev;
  const rate = Number(ratePerUnit) || db.settings.perUnitLightRate || 8.5;
  const totalAmount = Math.round(totalUnits * rate);

  // Find students in this room
  const roomStudents = db.students.filter(s => s.roomNo === String(roomNo) && s.status === 'active');
  const studentCount = roomStudents.length > 0 ? roomStudents.length : 1;
  const perStudentAmount = Math.round(totalAmount / studentCount);

  const newBill = {
    id: 'lb-' + Date.now(),
    month,
    year: year || new Date().getFullYear(),
    roomNo: String(roomNo),
    previousReading: prev,
    currentReading: curr,
    ratePerUnit: rate,
    totalUnits,
    totalAmount,
    studentCount,
    perStudentAmount,
    status: 'unpaid',
    dateAdded: new Date().toISOString().split('T')[0]
  };

  db.lightBills.push(newBill);

  // Generate pending light bill payments for each student in room
  roomStudents.forEach(student => {
    db.payments.push({
      id: 'pay-lb-' + Date.now() + '-' + student.id,
      studentId: student.id,
      studentName: student.name,
      roomNo: student.roomNo,
      month: `${month} Light Bill`,
      year: newBill.year,
      amount: perStudentAmount,
      type: 'light_bill',
      status: 'pending_owner',
      upiTransactionId: 'PENDING_METER_SPLIT',
      paymentMethod: 'Light Bill Split',
      notes: `Electricity split for Room ${roomNo}: ${totalUnits} total units consumed @ ₹${rate}/unit`,
      submittedBy: req.user.name,
      confirmedBy: null,
      date: new Date().toISOString().split('T')[0],
      createdAt: new Date().toISOString()
    });
  });

  saveMemoryDB(db);

  return res.status(201).json({
    message: `Light bill calculated for Room ${roomNo}: ${totalUnits} units (₹${totalAmount} total, ₹${perStudentAmount}/student)`,
    lightBill: newBill
  });
});

module.exports = router;
