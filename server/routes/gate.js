const express = require('express');
const router = express.Router();
const { getMemoryDB, saveMemoryDB } = require('../models/schemas');
const { authMiddleware } = require('../middleware/auth');

// GET /api/gate - Get gate status, closing time & late logs
router.get('/', authMiddleware, (req, res) => {
  const db = getMemoryDB();
  const today = new Date().toISOString().split('T')[0];
  const todayLateCount = db.gateLogs.filter(g => g.date === today && g.status === 'late').length;

  return res.json({
    settings: {
      gateClosingTime: db.settings.gateClosingTime || '22:00',
      gateStatus: db.settings.gateStatus || 'OPEN'
    },
    gateLogs: db.gateLogs.sort((a, b) => new Date(b.date + 'T' + b.inTime) - new Date(a.date + 'T' + a.inTime)),
    todayLateCount
  });
});

// POST /api/gate/toggle-status - Toggle OPEN/CLOSED status (Staff/Admin)
router.post('/toggle-status', authMiddleware, (req, res) => {
  const db = getMemoryDB();
  const { gateStatus } = req.body;
  if (!['OPEN', 'CLOSED'].includes(gateStatus)) {
    return res.status(400).json({ error: 'Status must be OPEN or CLOSED' });
  }

  db.settings.gateStatus = gateStatus;
  saveMemoryDB(db);

  return res.json({ message: `Gate is now ${gateStatus}`, gateStatus });
});

// POST /api/gate/log - Record late entry or permission log
router.post('/log', authMiddleware, (req, res) => {
  const db = getMemoryDB();
  const { studentId, inTime, outTime, reason, status, approvedBy } = req.body;

  if (!studentId || !inTime || !reason) {
    return res.status(400).json({ error: 'Student ID, check-in time, and reason are required' });
  }

  const student = db.students.find(s => s.id === studentId);
  if (!student) {
    return res.status(404).json({ error: 'Student not found' });
  }

  const newLog = {
    id: 'gl-' + Date.now(),
    studentId: student.id,
    studentName: student.name,
    roomNo: student.roomNo,
    date: new Date().toISOString().split('T')[0],
    outTime: outTime || '19:00',
    inTime,
    expectedTime: db.settings.gateClosingTime || '22:00',
    reason,
    status: status || 'late',
    approvedBy: approvedBy || req.user.name
  };

  db.gateLogs.push(newLog);
  saveMemoryDB(db);

  return res.status(201).json({ message: 'Gate log recorded successfully', gateLog: newLog });
});

module.exports = router;
