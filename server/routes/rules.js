const express = require('express');
const router = express.Router();
const { getMemoryDB, saveMemoryDB } = require('../models/schemas');
const { authMiddleware } = require('../middleware/auth');

// GET /api/rules - List all hostel rules & regulations
router.get('/', (req, res) => {
  const db = getMemoryDB();
  return res.json({
    rules: db.rules,
    hostelName: db.settings.hostelName,
    ownerName: db.settings.ownerName,
    ownerPhone: db.settings.ownerPhone
  });
});

// POST /api/rules - Add new hostel rule (Admin only)
router.post('/', authMiddleware, (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Only Hostel Owner (Admin) can modify hostel rules' });
  }

  const db = getMemoryDB();
  const { category, title, description, penalty } = req.body;

  if (!category || !title || !description) {
    return res.status(400).json({ error: 'Category, title, and description are required' });
  }

  const newRule = {
    id: 'r-' + Date.now(),
    category,
    title,
    description,
    penalty: penalty || 'Warning / Fine as per management discretion',
    active: true
  };

  db.rules.push(newRule);
  saveMemoryDB(db);

  return res.status(201).json({ message: 'Rule added successfully', rule: newRule });
});

// DELETE /api/rules/:id - Delete rule (Admin only)
router.delete('/:id', authMiddleware, (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Only Hostel Owner (Admin) can delete hostel rules' });
  }

  const db = getMemoryDB();
  const idx = db.rules.findIndex(r => r.id === req.params.id);
  if (idx === -1) {
    return res.status(404).json({ error: 'Rule not found' });
  }

  db.rules.splice(idx, 1);
  saveMemoryDB(db);

  return res.json({ message: 'Rule deleted successfully' });
});

module.exports = router;
