const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../db/database');
const { JWT_SECRET, authenticateToken } = require('../middleware/authMiddleware');

// POST /api/auth/login
router.post('/login', async (req, res) => {
  const { email, password, role } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }

  try {
    const user = await db.asyncGet('SELECT * FROM users WHERE email = ?', [email.toLowerCase().trim()]);
    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    if (role && user.role !== role) {
      return res.status(403).json({ error: `Account is registered as a ${user.role}, not ${role}` });
    }

    const match = await bcrypt.compare(password, user.password);
    if (!match) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role, name: user.name },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    const { password: _, ...userWithoutPassword } = user;

    res.json({
      message: 'Login successful',
      token,
      user: userWithoutPassword
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/auth/quick-login (For rapid demo switching)
router.post('/quick-login', async (req, res) => {
  const { role, email } = req.body;
  try {
    let query = 'SELECT * FROM users WHERE role = ? LIMIT 1';
    let params = [role || 'owner'];
    if (email) {
      query = 'SELECT * FROM users WHERE email = ?';
      params = [email];
    } else if (role === 'owner') {
      query = 'SELECT * FROM users WHERE role = "owner" LIMIT 1';
      params = [];
    }

    const user = await db.asyncGet(query, params);
    if (!user) {
      return res.status(404).json({ error: 'Demo user account not found' });
    }

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role, name: user.name },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    const { password: _, ...userWithoutPassword } = user;
    res.json({
      message: 'Quick demo login successful',
      token,
      user: userWithoutPassword
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/auth/register
router.post('/register', async (req, res) => {
  const { name, email, password, role, phone, guardian_name, guardian_phone, address } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({ error: 'Name, email, and password are required' });
  }

  const assignedRole = role === 'owner' ? 'owner' : 'student';

  try {
    const existing = await db.asyncGet('SELECT id FROM users WHERE email = ?', [email.toLowerCase().trim()]);
    if (existing) {
      return res.status(400).json({ error: 'Email already registered' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const result = await db.asyncRun(
      `INSERT INTO users (name, email, password, role, phone, guardian_name, guardian_phone, address)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [name, email.toLowerCase().trim(), hashedPassword, assignedRole, phone || '', guardian_name || '', guardian_phone || '', address || '']
    );

    const newUser = await db.asyncGet('SELECT * FROM users WHERE id = ?', [result.lastID]);

    const token = jwt.sign(
      { id: newUser.id, email: newUser.email, role: newUser.role, name: newUser.name },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    const { password: _, ...userWithoutPassword } = newUser;

    res.status(201).json({
      message: 'Registration successful',
      token,
      user: userWithoutPassword
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/auth/me
router.get('/me', authenticateToken, async (req, res) => {
  try {
    const user = await db.asyncGet(
      `SELECT u.id, u.name, u.email, u.role, u.phone, u.room_id, u.bed_number, u.monthly_rent, u.rent_due_date,
              u.guardian_name, u.guardian_phone, u.address, u.status, u.created_at,
              r.room_number, r.floor, r.type as room_type, r.ac_type
       FROM users u
       LEFT JOIN rooms r ON u.room_id = r.id
       WHERE u.id = ?`,
      [req.user.id]
    );

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({ user });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
