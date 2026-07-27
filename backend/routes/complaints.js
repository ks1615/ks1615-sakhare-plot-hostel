const express = require('express');
const router = express.Router();
const db = require('../db/database');
const { authenticateToken, requireRole } = require('../middleware/authMiddleware');

// GET /api/complaints - List tickets
router.get('/', authenticateToken, async (req, res) => {
  try {
    let query = `
      SELECT c.*, u.name as student_name, u.phone as student_phone, r.room_number
      FROM complaints c
      JOIN users u ON c.student_id = u.id
      LEFT JOIN rooms r ON u.room_id = r.id
    `;
    let params = [];

    if (req.user.role === 'student') {
      query += ` WHERE c.student_id = ? ORDER BY c.id DESC`;
      params.push(req.user.id);
    } else {
      query += ` ORDER BY c.id DESC`;
    }

    const complaints = await db.asyncAll(query, params);
    res.json({ complaints });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/complaints - Submit complaint (Student)
router.post('/', authenticateToken, async (req, res) => {
  const { category, priority, title, description } = req.body;

  if (!category || !title || !description) {
    return res.status(400).json({ error: 'Category, Title, and Description are required' });
  }

  const student_id = req.user.role === 'student' ? req.user.id : req.body.student_id;
  if (!student_id) {
    return res.status(400).json({ error: 'Student ID required' });
  }

  try {
    const result = await db.asyncRun(
      `INSERT INTO complaints (student_id, category, priority, title, description, status)
       VALUES (?, ?, ?, ?, ?, 'Pending')`,
      [student_id, category, priority || 'Medium', title, description]
    );

    const newComplaint = await db.asyncGet(
      `SELECT c.*, u.name as student_name, r.room_number
       FROM complaints c
       JOIN users u ON c.student_id = u.id
       LEFT JOIN rooms r ON u.room_id = r.id
       WHERE c.id = ?`,
      [result.lastID]
    );

    res.status(201).json({ message: 'Complaint ticket created successfully', complaint: newComplaint });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/complaints/:id - Respond & Update status (Owner only)
router.put('/:id', authenticateToken, requireRole('owner'), async (req, res) => {
  const { status, admin_response } = req.body;

  if (!status) {
    return res.status(400).json({ error: 'Status is required' });
  }

  try {
    const existing = await db.asyncGet('SELECT id FROM complaints WHERE id = ?', [req.params.id]);
    if (!existing) {
      return res.status(404).json({ error: 'Complaint ticket not found' });
    }

    await db.asyncRun(
      `UPDATE complaints SET
        status = ?,
        admin_response = COALESCE(?, admin_response),
        updated_at = CURRENT_TIMESTAMP
       WHERE id = ?`,
      [status, admin_response, req.params.id]
    );

    const updated = await db.asyncGet(
      `SELECT c.*, u.name as student_name, r.room_number
       FROM complaints c
       JOIN users u ON c.student_id = u.id
       LEFT JOIN rooms r ON u.room_id = r.id
       WHERE c.id = ?`,
      [req.params.id]
    );

    res.json({ message: 'Complaint ticket updated', complaint: updated });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
