const express = require('express');
const router = express.Router();
const db = require('../db/database');
const { authenticateToken, requireRole } = require('../middleware/authMiddleware');

// GET /api/notices - List all notices (Pinned first)
router.get('/', authenticateToken, async (req, res) => {
  try {
    const notices = await db.asyncAll(
      `SELECT * FROM notices ORDER BY is_pinned DESC, id DESC`
    );
    res.json({ notices });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/notices - Create notice (Owner only)
router.post('/', authenticateToken, requireRole('owner'), async (req, res) => {
  const { title, content, category, is_pinned } = req.body;

  if (!title || !content) {
    return res.status(400).json({ error: 'Title and Content are required' });
  }

  try {
    const result = await db.asyncRun(
      `INSERT INTO notices (title, content, category, is_pinned, created_by)
       VALUES (?, ?, ?, ?, ?)`,
      [
        title,
        content,
        category || 'General',
        is_pinned ? 1 : 0,
        req.user.name || 'Owner Admin'
      ]
    );

    const newNotice = await db.asyncGet('SELECT * FROM notices WHERE id = ?', [result.lastID]);
    res.status(201).json({ message: 'Notice posted successfully', notice: newNotice });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/notices/:id - Update notice (Owner only)
router.put('/:id', authenticateToken, requireRole('owner'), async (req, res) => {
  const { title, content, category, is_pinned } = req.body;

  try {
    const existing = await db.asyncGet('SELECT id FROM notices WHERE id = ?', [req.params.id]);
    if (!existing) {
      return res.status(404).json({ error: 'Notice not found' });
    }

    await db.asyncRun(
      `UPDATE notices SET
        title = COALESCE(?, title),
        content = COALESCE(?, content),
        category = COALESCE(?, category),
        is_pinned = COALESCE(?, is_pinned)
       WHERE id = ?`,
      [title, content, category, is_pinned !== undefined ? (is_pinned ? 1 : 0) : undefined, req.params.id]
    );

    const updated = await db.asyncGet('SELECT * FROM notices WHERE id = ?', [req.params.id]);
    res.json({ message: 'Notice updated successfully', notice: updated });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/notices/:id - Delete notice (Owner only)
router.delete('/:id', authenticateToken, requireRole('owner'), async (req, res) => {
  try {
    const result = await db.asyncRun('DELETE FROM notices WHERE id = ?', [req.params.id]);
    if (result.changes === 0) {
      return res.status(404).json({ error: 'Notice not found' });
    }
    res.json({ message: 'Notice deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
