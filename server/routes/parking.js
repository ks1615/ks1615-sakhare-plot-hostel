const express = require('express');
const router = express.Router();
const { getMemoryDB, saveMemoryDB } = require('../models/schemas');
const { authMiddleware } = require('../middleware/auth');

// GET /api/parking - List all parking slots
router.get('/', authMiddleware, (req, res) => {
  const db = getMemoryDB();
  const occupiedCount = db.parkingSlots.filter(p => p.status === 'occupied').length;
  const vacantCount = db.parkingSlots.filter(p => p.status === 'vacant').length;

  return res.json({
    parkingSlots: db.parkingSlots,
    stats: {
      totalSlots: db.parkingSlots.length,
      occupiedCount,
      vacantCount
    }
  });
});

// POST /api/parking/assign - Assign or update parking slot
router.post('/assign', authMiddleware, (req, res) => {
  const db = getMemoryDB();
  const { slotNo, studentId, vehicleNumber, helmetLockerNo } = req.body;

  if (!slotNo) {
    return res.status(400).json({ error: 'Slot number is required' });
  }

  let slot = db.parkingSlots.find(p => p.slotNo === slotNo);
  if (!slot) {
    // Create slot if doesn't exist
    slot = {
      id: 'pk-' + Date.now(),
      slotNo,
      type: 'Bike',
      status: 'vacant',
      studentId: null,
      studentName: null,
      vehicleNumber: null,
      helmetLockerNo: helmetLockerNo || `L-${slotNo}`
    };
    db.parkingSlots.push(slot);
  }

  if (studentId) {
    const student = db.students.find(s => s.id === studentId);
    if (!student) {
      return res.status(404).json({ error: 'Student not found' });
    }
    slot.status = 'occupied';
    slot.studentId = student.id;
    slot.studentName = student.name;
    slot.vehicleNumber = vehicleNumber || student.bikeNumber || 'MH-12-REG';
    slot.helmetLockerNo = helmetLockerNo || slot.helmetLockerNo || `L-${slotNo}`;

    // Update student's parkingSlot property
    student.parkingSlot = slotNo;
    student.bikeNumber = slot.vehicleNumber;
  } else {
    // Unassign slot
    if (slot.studentId) {
      const existingStudent = db.students.find(s => s.id === slot.studentId);
      if (existingStudent) {
        existingStudent.parkingSlot = 'None';
      }
    }
    slot.status = 'vacant';
    slot.studentId = null;
    slot.studentName = null;
    slot.vehicleNumber = null;
  }

  saveMemoryDB(db);

  return res.json({ message: `Parking slot ${slotNo} updated successfully`, slot });
});

module.exports = router;
