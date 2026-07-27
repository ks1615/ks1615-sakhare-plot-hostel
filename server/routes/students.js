const express = require('express');
const router = express.Router();
const { getMemoryDB, saveMemoryDB } = require('../models/schemas');
const { authMiddleware } = require('../middleware/auth');

// Helper to compute student monthly dues ledger from joinDate to current month
function generateMonthlyLedger(student, payments) {
  const join = new Date(student.joinDate);
  const now = new Date();
  const ledger = [];

  let cur = new Date(join.getFullYear(), join.getMonth(), 1);
  const end = new Date(now.getFullYear(), now.getMonth(), 1);

  while (cur <= end) {
    const monthName = cur.toLocaleString('default', { month: 'long' });
    const year = cur.getFullYear();
    const monthKey = `${monthName} ${year}`;

    // Find payment for this month
    const studentPayments = payments.filter(
      p => p.studentId === student.id && p.month.toLowerCase() === monthKey.toLowerCase()
    );

    const confirmedPayment = studentPayments.find(p => p.status === 'confirmed');
    const pendingPayment = studentPayments.find(p => p.status === 'pending_owner');

    let status = 'unpaid';
    let amountPaid = 0;

    if (confirmedPayment) {
      status = 'paid';
      amountPaid = confirmedPayment.amount;
    } else if (pendingPayment) {
      status = 'pending_owner';
      amountPaid = pendingPayment.amount;
    } else {
      // Check if current month or past month
      if (cur < end) {
        status = 'overdue';
      } else {
        status = 'unpaid';
      }
    }

    ledger.push({
      month: monthKey,
      dueDate: `${year}-${String(cur.getMonth() + 1).padStart(2, '0')}-05`,
      rentAmount: student.monthlyRent,
      amountPaid,
      status,
      payments: studentPayments
    });

    cur.setMonth(cur.getMonth() + 1);
  }

  return ledger.reverse(); // Most recent month first
}

// GET /api/students - List all students with ledger summary
router.get('/', authMiddleware, (req, res) => {
  const db = getMemoryDB();
  const studentsWithLedger = db.students.map(s => {
    const ledger = generateMonthlyLedger(s, db.payments);
    const pendingConfirmationCount = db.payments.filter(p => p.studentId === s.id && p.status === 'pending_owner').length;
    const currentMonthStatus = ledger.length > 0 ? ledger[0].status : 'unknown';

    return {
      ...s,
      ledger,
      currentMonthStatus,
      pendingConfirmationCount
    };
  });

  return res.json({ students: studentsWithLedger });
});

// GET /api/students/:id - Get single student detail
router.get('/:id', authMiddleware, (req, res) => {
  const db = getMemoryDB();
  const student = db.students.find(s => s.id === req.params.id);
  if (!student) {
    return res.status(404).json({ error: 'Student not found' });
  }

  const ledger = generateMonthlyLedger(student, db.payments);
  const studentPayments = db.payments.filter(p => p.studentId === student.id);
  const studentGateLogs = db.gateLogs.filter(g => g.studentId === student.id);

  return res.json({
    student: {
      ...student,
      ledger,
      payments: studentPayments,
      gateLogs: studentGateLogs
    }
  });
});

// POST /api/students - Create new student
router.post('/', authMiddleware, (req, res) => {
  const db = getMemoryDB();
  const {
    name, phone, parentPhone, email, roomNo, bedNo, joinDate, monthlyRent,
    depositAmount, idType, idNumber, idDocUrl, bikeNumber, parkingSlot
  } = req.body;

  if (!name || !phone || !roomNo || !bedNo || !joinDate) {
    return res.status(400).json({ error: 'Name, phone, room number, bed number, and join date are required' });
  }

  const newStudent = {
    id: 's-' + Date.now(),
    name,
    phone,
    parentPhone: parentPhone || '',
    email: email || '',
    roomNo: String(roomNo),
    bedNo: String(bedNo),
    joinDate: joinDate || new Date().toISOString().split('T')[0],
    monthlyRent: Number(monthlyRent) || db.settings.monthlyRentDefault || 6500,
    depositAmount: Number(depositAmount) || 5000,
    idType: idType || 'Aadhaar Card',
    idNumber: idNumber || '',
    idDocUrl: idDocUrl || '',
    bikeNumber: bikeNumber || 'None',
    parkingSlot: parkingSlot || 'None',
    status: 'active',
    createdAt: new Date().toISOString()
  };

  db.students.push(newStudent);

  // If parking slot is assigned, update parking slot DB
  if (parkingSlot && parkingSlot !== 'None') {
    const slot = db.parkingSlots.find(p => p.slotNo === parkingSlot);
    if (slot) {
      slot.status = 'occupied';
      slot.studentId = newStudent.id;
      slot.studentName = newStudent.name;
      slot.vehicleNumber = newStudent.bikeNumber;
    }
  }

  saveMemoryDB(db);

  return res.status(201).json({ message: 'Student registered successfully', student: newStudent });
});

// PUT /api/students/:id - Update student details
router.put('/:id', authMiddleware, (req, res) => {
  const db = getMemoryDB();
  const idx = db.students.findIndex(s => s.id === req.params.id);
  if (idx === -1) {
    return res.status(404).json({ error: 'Student not found' });
  }

  const oldSlot = db.students[idx].parkingSlot;
  db.students[idx] = { ...db.students[idx], ...req.body };

  // Handle parking slot update
  const newSlot = db.students[idx].parkingSlot;
  if (oldSlot !== newSlot) {
    if (oldSlot && oldSlot !== 'None') {
      const slotObj = db.parkingSlots.find(p => p.slotNo === oldSlot);
      if (slotObj) {
        slotObj.status = 'vacant';
        slotObj.studentId = null;
        slotObj.studentName = null;
        slotObj.vehicleNumber = null;
      }
    }
    if (newSlot && newSlot !== 'None') {
      const slotObj = db.parkingSlots.find(p => p.slotNo === newSlot);
      if (slotObj) {
        slotObj.status = 'occupied';
        slotObj.studentId = db.students[idx].id;
        slotObj.studentName = db.students[idx].name;
        slotObj.vehicleNumber = db.students[idx].bikeNumber;
      }
    }
  }

  saveMemoryDB(db);

  return res.json({ message: 'Student details updated', student: db.students[idx] });
});

// DELETE /api/students/:id - Vacate / delete student
router.delete('/:id', authMiddleware, (req, res) => {
  const db = getMemoryDB();
  const idx = db.students.findIndex(s => s.id === req.params.id);
  if (idx === -1) {
    return res.status(404).json({ error: 'Student not found' });
  }

  const student = db.students[idx];
  // Free parking slot if any
  if (student.parkingSlot && student.parkingSlot !== 'None') {
    const slotObj = db.parkingSlots.find(p => p.slotNo === student.parkingSlot);
    if (slotObj) {
      slotObj.status = 'vacant';
      slotObj.studentId = null;
      slotObj.studentName = null;
      slotObj.vehicleNumber = null;
    }
  }

  db.students.splice(idx, 1);
  saveMemoryDB(db);

  return res.json({ message: `Student ${student.name} removed/vacated successfully` });
});

module.exports = router;
