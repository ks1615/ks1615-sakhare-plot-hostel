const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const db = require('../db/database');
const { authenticateToken, requireRole } = require('../middleware/authMiddleware');

// GET /api/students - List all students (Owner only)
router.get('/', authenticateToken, requireRole('owner'), async (req, res) => {
  try {
    const students = await db.asyncAll(
      `SELECT u.id, u.name, u.email, u.phone, u.room_id, u.bed_number, u.monthly_rent, u.rent_due_date,
              u.guardian_name, u.guardian_phone, u.address, u.status, u.created_at,
              r.room_number, r.type as room_type, r.ac_type,
              (SELECT status FROM payments WHERE student_id = u.id ORDER BY id DESC LIMIT 1) as latest_payment_status,
              (SELECT month_year FROM payments WHERE student_id = u.id ORDER BY id DESC LIMIT 1) as latest_payment_month
       FROM users u
       LEFT JOIN rooms r ON u.room_id = r.id
       WHERE u.role = 'student'
       ORDER BY u.id DESC`
    );
    res.json({ students });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/students/stats/summary - Owner Dashboard KPI Summary
router.get('/stats/summary', authenticateToken, requireRole('owner'), async (req, res) => {
  try {
    const totalStudentsRow = await db.asyncGet(`SELECT COUNT(*) as count FROM users WHERE role = 'student' AND status = 'active'`);
    const totalCapacityRow = await db.asyncGet(`SELECT SUM(capacity) as total FROM rooms`);
    const occupiedBedsRow = await db.asyncGet(`SELECT COUNT(*) as occupied FROM users WHERE role = 'student' AND room_id IS NOT NULL AND status = 'active'`);
    const pendingComplaintsRow = await db.asyncGet(`SELECT COUNT(*) as count FROM complaints WHERE status != 'Resolved'`);
    const pendingLeavesRow = await db.asyncGet(`SELECT COUNT(*) as count FROM leave_requests WHERE status = 'Pending'`);
    
    // Payments Summary for Current Month (e.g. July 2026)
    const paidSumRow = await db.asyncGet(`SELECT SUM(amount) as total FROM payments WHERE status = 'Paid'`);
    const pendingSumRow = await db.asyncGet(`SELECT SUM(amount) as total FROM payments WHERE status IN ('Pending', 'Overdue')`);

    const totalStudents = totalStudentsRow ? totalStudentsRow.count : 0;
    const totalCapacity = totalCapacityRow ? (totalCapacityRow.total || 0) : 0;
    const occupiedBeds = occupiedBedsRow ? occupiedBedsRow.occupied : 0;
    const vacantBeds = Math.max(0, totalCapacity - occupiedBeds);
    const pendingComplaints = pendingComplaintsRow ? pendingComplaintsRow.count : 0;
    const pendingLeaves = pendingLeavesRow ? pendingLeavesRow.count : 0;
    const collectedRevenue = paidSumRow ? (paidSumRow.total || 0) : 0;
    const pendingRevenue = pendingSumRow ? (pendingSumRow.total || 0) : 0;

    res.json({
      totalStudents,
      totalCapacity,
      occupiedBeds,
      vacantBeds,
      pendingComplaints,
      pendingLeaves,
      collectedRevenue,
      pendingRevenue
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/students/:id - Get specific student details
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    // If student role, enforce matching own ID
    if (req.user.role === 'student' && req.user.id !== parseInt(req.params.id)) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const student = await db.asyncGet(
      `SELECT u.id, u.name, u.email, u.phone, u.room_id, u.bed_number, u.monthly_rent, u.rent_due_date,
              u.guardian_name, u.guardian_phone, u.address, u.status, u.created_at,
              r.room_number, r.floor, r.type as room_type, r.ac_type
       FROM users u
       LEFT JOIN rooms r ON u.room_id = r.id
       WHERE u.id = ? AND u.role = 'student'`,
      [req.params.id]
    );

    if (!student) {
      return res.status(404).json({ error: 'Student not found' });
    }

    res.json({ student });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/students - Add a new student (Owner only)
router.post('/', authenticateToken, requireRole('owner'), async (req, res) => {
  const { name, email, password, phone, room_id, bed_number, monthly_rent, guardian_name, guardian_phone, address } = req.body;

  if (!name || !email) {
    return res.status(400).json({ error: 'Student Name and Email are required' });
  }

  try {
    const existing = await db.asyncGet('SELECT id FROM users WHERE email = ?', [email.toLowerCase().trim()]);
    if (existing) {
      return res.status(400).json({ error: 'Email already exists' });
    }

    const hashedPassword = await bcrypt.hash(password || 'student123', 10);
    const rent = monthly_rent ? parseFloat(monthly_rent) : 6500;

    const result = await db.asyncRun(
      `INSERT INTO users (name, email, password, role, phone, room_id, bed_number, monthly_rent, guardian_name, guardian_phone, address, status)
       VALUES (?, ?, ?, 'student', ?, ?, ?, ?, ?, ?, ?, 'active')`,
      [
        name,
        email.toLowerCase().trim(),
        hashedPassword,
        phone || '',
        room_id || null,
        bed_number || null,
        rent,
        guardian_name || '',
        guardian_phone || '',
        address || ''
      ]
    );

    // Automatically create first month pending payment record
    await db.asyncRun(
      `INSERT INTO payments (student_id, amount, month_year, status) VALUES (?, ?, 'August 2026', 'Pending')`,
      [result.lastID, rent]
    );

    const newStudent = await db.asyncGet('SELECT * FROM users WHERE id = ?', [result.lastID]);
    res.status(201).json({ message: 'Student added successfully', student: newStudent });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/students/:id - Update student / Reassign Room (Owner only)
router.put('/:id', authenticateToken, requireRole('owner'), async (req, res) => {
  const { name, email, phone, room_id, bed_number, monthly_rent, guardian_name, guardian_phone, address, status } = req.body;

  try {
    const student = await db.asyncGet('SELECT id FROM users WHERE id = ? AND role = "student"', [req.params.id]);
    if (!student) {
      return res.status(404).json({ error: 'Student not found' });
    }

    await db.asyncRun(
      `UPDATE users SET
        name = COALESCE(?, name),
        email = COALESCE(?, email),
        phone = COALESCE(?, phone),
        room_id = ?,
        bed_number = ?,
        monthly_rent = COALESCE(?, monthly_rent),
        guardian_name = COALESCE(?, guardian_name),
        guardian_phone = COALESCE(?, guardian_phone),
        address = COALESCE(?, address),
        status = COALESCE(?, status)
       WHERE id = ?`,
      [
        name,
        email ? email.toLowerCase().trim() : undefined,
        phone,
        room_id !== undefined ? room_id : null,
        bed_number !== undefined ? bed_number : null,
        monthly_rent,
        guardian_name,
        guardian_phone,
        address,
        status,
        req.params.id
      ]
    );

    const updated = await db.asyncGet(
      `SELECT u.*, r.room_number FROM users u LEFT JOIN rooms r ON u.room_id = r.id WHERE u.id = ?`,
      [req.params.id]
    );

    res.json({ message: 'Student profile updated successfully', student: updated });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/students/:id - Remove student (Owner only)
router.delete('/:id', authenticateToken, requireRole('owner'), async (req, res) => {
  try {
    const result = await db.asyncRun('DELETE FROM users WHERE id = ? AND role = "student"', [req.params.id]);
    if (result.changes === 0) {
      return res.status(404).json({ error: 'Student not found' });
    }
    res.json({ message: 'Student removed successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
