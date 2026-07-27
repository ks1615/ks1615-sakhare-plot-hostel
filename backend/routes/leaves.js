const express = require('express');
const router = express.Router();
const db = require('../db/database');
const { authenticateToken, requireRole } = require('../middleware/authMiddleware');

// GET /api/leaves - List leave requests
router.get('/', authenticateToken, async (req, res) => {
  try {
    let query = `
      SELECT l.*, u.name as student_name, u.phone as student_phone, r.room_number
      FROM leave_requests l
      JOIN users u ON l.student_id = u.id
      LEFT JOIN rooms r ON u.room_id = r.id
    `;
    let params = [];

    if (req.user.role === 'student') {
      query += ` WHERE l.student_id = ? ORDER BY l.id DESC`;
      params.push(req.user.id);
    } else {
      query += ` ORDER BY l.id DESC`;
    }

    const leaves = await db.asyncAll(query, params);
    res.json({ leaves });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/leaves - Submit leave application (Student)
router.post('/', authenticateToken, async (req, res) => {
  const { start_date, end_date, reason, destination, emergency_contact } = req.body;

  if (!start_date || !end_date || !reason || !destination) {
    return res.status(400).json({ error: 'Start date, End date, Reason, and Destination are required' });
  }

  const student_id = req.user.role === 'student' ? req.user.id : req.body.student_id;
  if (!student_id) {
    return res.status(400).json({ error: 'Student ID required' });
  }

  try {
    const result = await db.asyncRun(
      `INSERT INTO leave_requests (student_id, start_date, end_date, reason, destination, emergency_contact, status)
       VALUES (?, ?, ?, ?, ?, ?, 'Pending')`,
      [student_id, start_date, end_date, reason, destination, emergency_contact || '']
    );

    const newLeave = await db.asyncGet(
      `SELECT l.*, u.name as student_name, r.room_number
       FROM leave_requests l
       JOIN users u ON l.student_id = u.id
       LEFT JOIN rooms r ON u.room_id = r.id
       WHERE l.id = ?`,
      [result.lastID]
    );

    res.status(201).json({ message: 'Leave request submitted successfully', leave: newLeave });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/leaves/:id - Approve or Reject request (Owner only)
router.put('/:id', authenticateToken, requireRole('owner'), async (req, res) => {
  const { status, admin_remark } = req.body;

  if (!status || !['Approved', 'Rejected', 'Pending'].includes(status)) {
    return res.status(400).json({ error: 'Valid status (Approved/Rejected/Pending) is required' });
  }

  try {
    const existing = await db.asyncGet('SELECT id FROM leave_requests WHERE id = ?', [req.params.id]);
    if (!existing) {
      return res.status(404).json({ error: 'Leave request not found' });
    }

    await db.asyncRun(
      `UPDATE leave_requests SET
        status = ?,
        admin_remark = COALESCE(?, admin_remark)
       WHERE id = ?`,
      [status, admin_remark, req.params.id]
    );

    const updated = await db.asyncGet(
      `SELECT l.*, u.name as student_name, r.room_number
       FROM leave_requests l
       JOIN users u ON l.student_id = u.id
       LEFT JOIN rooms r ON u.room_id = r.id
       WHERE l.id = ?`,
      [req.params.id]
    );

    res.json({ message: `Leave request ${status.toLowerCase()}`, leave: updated });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
