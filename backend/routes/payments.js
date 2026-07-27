const express = require('express');
const router = express.Router();
const db = require('../db/database');
const { authenticateToken, requireRole } = require('../middleware/authMiddleware');

// GET /api/payments/qr-settings - Fetch Sandeep Sakhare UPI QR Settings (Public)
router.get('/qr-settings', async (req, res) => {
  try {
    let settings = await db.asyncGet('SELECT * FROM settings ORDER BY id DESC LIMIT 1');
    if (!settings) {
      settings = {
        owner_name: 'Sandeep Sakhare',
        upi_id: '9322465627@ybl',
        account_holder: 'Sandeep Sakhare',
        qr_code_url: '/sandeep_qr.jpg',
        hostel_name: 'Sakhare Plot Hostel',
        hostel_phone: '+91 89835 35847',
        hostel_address: 'Plot No. 14, Main Road, Block A, City Center'
      };
    }
    res.json({ settings });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/payments/qr-settings - Update Sandeep Sakhare UPI & QR Code Settings (Owner Only)
router.post('/qr-settings', authenticateToken, requireRole('owner'), async (req, res) => {
  const { upi_id, account_holder, qr_code_url, hostel_phone, hostel_address } = req.body;

  try {
    const cleanUpi = (upi_id || '9322465627@ybl').trim();
    const cleanHolder = (account_holder || 'Sandeep Sakhare').trim();
    const targetQr = (qr_code_url && qr_code_url.trim()) ? qr_code_url.trim() : '/sandeep_qr.jpg';

    const existing = await db.asyncGet('SELECT id FROM settings ORDER BY id DESC LIMIT 1');
    if (existing) {
      await db.asyncRun(
        `UPDATE settings SET owner_name = 'Sandeep Sakhare', upi_id = ?, account_holder = ?, qr_code_url = ?, hostel_phone = ?, hostel_address = ? WHERE id = ?`,
        [cleanUpi, cleanHolder, targetQr, hostel_phone || '+91 89835 35847', hostel_address || 'Sakhare Plot, Main Road', existing.id]
      );
    } else {
      await db.asyncRun(
        `INSERT INTO settings (owner_name, upi_id, account_holder, qr_code_url, hostel_phone, hostel_address)
         VALUES ('Sandeep Sakhare', ?, ?, ?, ?, ?)`,
        [cleanUpi, cleanHolder, targetQr, hostel_phone || '+91 89835 35847', hostel_address || 'Sakhare Plot, Main Road']
      );
    }

    const updatedSettings = await db.asyncGet('SELECT * FROM settings ORDER BY id DESC LIMIT 1');
    res.json({ message: 'UPI QR settings updated successfully', settings: updatedSettings });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/payments - List payments (Owner: all, Student: self)
router.get('/', authenticateToken, async (req, res) => {
  try {
    let query = `
      SELECT p.id, p.student_id, p.amount, p.month_year, p.payment_date, p.payment_method,
             p.transaction_id, p.utr_number, p.payment_app, p.proof_url, p.status, p.receipt_number,
             p.admin_note, p.created_at,
             u.name as student_name, u.email as student_email, u.phone as student_phone,
             r.room_number
      FROM payments p
      JOIN users u ON p.student_id = u.id
      LEFT JOIN rooms r ON u.room_id = r.id
    `;
    let params = [];

    if (req.user.role === 'student') {
      query += ` WHERE p.student_id = ? ORDER BY p.id DESC`;
      params.push(req.user.id);
    } else {
      query += ` ORDER BY p.id DESC`;
    }

    const payments = await db.asyncAll(query, params);
    res.json({ payments });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/payments/submit-upi - Student Submits UTR Payment Proof
router.post('/submit-upi', authenticateToken, async (req, res) => {
  const { amount, month_year, utr_number, payment_app, proof_url } = req.body;

  if (!utr_number || !month_year) {
    return res.status(400).json({ error: '12-digit UTR Number and Billing Month are required' });
  }

  const student_id = req.user.role === 'student' ? req.user.id : req.body.student_id;
  if (!student_id) {
    return res.status(400).json({ error: 'Student ID required' });
  }

  try {
    // Check if an existing record for this month exists to update, or insert new
    const existing = await db.asyncGet(
      `SELECT id FROM payments WHERE student_id = ? AND month_year = ? ORDER BY id DESC LIMIT 1`,
      [student_id, month_year]
    );

    let paymentId;
    const dateToday = new Date().toISOString().split('T')[0];

    if (existing) {
      await db.asyncRun(
        `UPDATE payments SET
          amount = COALESCE(?, amount),
          utr_number = ?,
          payment_app = COALESCE(?, payment_app),
          proof_url = COALESCE(?, proof_url),
          payment_method = 'UPI QR',
          payment_date = ?,
          status = 'Pending Verification'
         WHERE id = ?`,
        [amount, utr_number.trim(), payment_app || 'UPI App', proof_url || '', dateToday, existing.id]
      );
      paymentId = existing.id;
    } else {
      const result = await db.asyncRun(
        `INSERT INTO payments (student_id, amount, month_year, payment_date, payment_method, utr_number, payment_app, proof_url, status)
         VALUES (?, ?, ?, ?, 'UPI QR', ?, ?, ?, 'Pending Verification')`,
        [student_id, parseFloat(amount || 6500), month_year, dateToday, utr_number.trim(), payment_app || 'UPI App', proof_url || '']
      );
      paymentId = result.lastID;
    }

    const updatedPayment = await db.asyncGet(
      `SELECT p.*, u.name as student_name, r.room_number
       FROM payments p
       JOIN users u ON p.student_id = u.id
       LEFT JOIN rooms r ON u.room_id = r.id
       WHERE p.id = ?`,
      [paymentId]
    );

    res.status(201).json({
      message: 'Payment submitted successfully! Pending verification by Sandeep Sakhare.',
      payment: updatedPayment
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/payments/verify/:id - Owner (Sandeep Sakhare) Approves or Rejects Payment
router.put('/verify/:id', authenticateToken, requireRole('owner'), async (req, res) => {
  const { action, admin_note } = req.body; // action: 'Approve' | 'Reject'

  if (!action || !['Approve', 'Reject'].includes(action)) {
    return res.status(400).json({ error: 'Action must be Approve or Reject' });
  }

  try {
    const existing = await db.asyncGet('SELECT * FROM payments WHERE id = ?', [req.params.id]);
    if (!existing) {
      return res.status(404).json({ error: 'Payment record not found' });
    }

    if (action === 'Approve') {
      const receiptNumber = existing.receipt_number || `SPH-REC-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;
      const txnId = existing.transaction_id || `UPI-${existing.utr_number || Math.floor(100000000000 + Math.random() * 900000000000)}`;

      await db.asyncRun(
        `UPDATE payments SET
          status = 'Paid',
          receipt_number = ?,
          transaction_id = ?,
          admin_note = COALESCE(?, 'Verified & Approved by Sandeep Sakhare')
         WHERE id = ?`,
        [receiptNumber, txnId, admin_note, req.params.id]
      );
    } else {
      await db.asyncRun(
        `UPDATE payments SET
          status = 'Rejected',
          admin_note = COALESCE(?, 'UTR verification failed. Please check transaction ID.')
         WHERE id = ?`,
        [admin_note, req.params.id]
      );
    }

    const updated = await db.asyncGet(
      `SELECT p.*, u.name as student_name, u.email as student_email, r.room_number
       FROM payments p
       JOIN users u ON p.student_id = u.id
       LEFT JOIN rooms r ON u.room_id = r.id
       WHERE p.id = ?`,
      [req.params.id]
    );

    res.json({
      message: `Payment ${action === 'Approve' ? 'Approved & Receipt Generated' : 'Rejected'}`,
      payment: updated
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/payments - Record manual payment (Owner only)
router.post('/', authenticateToken, requireRole('owner'), async (req, res) => {
  const { student_id, amount, month_year, payment_date, payment_method, transaction_id, status } = req.body;

  if (!student_id || !amount || !month_year) {
    return res.status(400).json({ error: 'Student, Amount, and Month/Year are required' });
  }

  const paymentStatus = status || 'Paid';
  let receiptNumber = null;
  if (paymentStatus === 'Paid') {
    receiptNumber = `SPH-REC-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;
  }

  try {
    const result = await db.asyncRun(
      `INSERT INTO payments (student_id, amount, month_year, payment_date, payment_method, transaction_id, status, receipt_number, admin_note)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'Recorded by Sandeep Sakhare')`,
      [
        student_id,
        parseFloat(amount),
        month_year,
        payment_date || new Date().toISOString().split('T')[0],
        payment_method || 'UPI QR',
        transaction_id || `TXN-${Math.floor(100000 + Math.random() * 900000)}`,
        paymentStatus,
        receiptNumber
      ]
    );

    const newPayment = await db.asyncGet(
      `SELECT p.*, u.name as student_name, r.room_number
       FROM payments p
       JOIN users u ON p.student_id = u.id
       LEFT JOIN rooms r ON u.room_id = r.id
       WHERE p.id = ?`,
      [result.lastID]
    );

    res.status(201).json({ message: 'Payment recorded successfully', payment: newPayment });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/payments/:id - Update payment record (Owner only)
router.put('/:id', authenticateToken, requireRole('owner'), async (req, res) => {
  const { amount, month_year, payment_date, payment_method, transaction_id, status, admin_note } = req.body;

  try {
    const existing = await db.asyncGet('SELECT * FROM payments WHERE id = ?', [req.params.id]);
    if (!existing) {
      return res.status(404).json({ error: 'Payment record not found' });
    }

    let receiptNumber = existing.receipt_number;
    if (status === 'Paid' && !receiptNumber) {
      receiptNumber = `SPH-REC-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;
    }

    await db.asyncRun(
      `UPDATE payments SET
        amount = COALESCE(?, amount),
        month_year = COALESCE(?, month_year),
        payment_date = COALESCE(?, payment_date),
        payment_method = COALESCE(?, payment_method),
        transaction_id = COALESCE(?, transaction_id),
        status = COALESCE(?, status),
        receipt_number = ?,
        admin_note = COALESCE(?, admin_note)
       WHERE id = ?`,
      [
        amount,
        month_year,
        payment_date || new Date().toISOString().split('T')[0],
        payment_method,
        transaction_id,
        status,
        receiptNumber,
        admin_note,
        req.params.id
      ]
    );

    const updated = await db.asyncGet(
      `SELECT p.*, u.name as student_name, u.email as student_email, u.phone as student_phone, r.room_number
       FROM payments p
       JOIN users u ON p.student_id = u.id
       LEFT JOIN rooms r ON u.room_id = r.id
       WHERE p.id = ?`,
      [req.params.id]
    );

    res.json({ message: 'Payment status updated', payment: updated });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/payments/receipt/:id - Fetch printable receipt data
router.get('/receipt/:id', authenticateToken, async (req, res) => {
  try {
    const receipt = await db.asyncGet(
      `SELECT p.*, u.name as student_name, u.email as student_email, u.phone as student_phone,
              u.guardian_name, u.guardian_phone, u.address,
              r.room_number, r.floor, r.type as room_type, r.ac_type
       FROM payments p
       JOIN users u ON p.student_id = u.id
       LEFT JOIN rooms r ON u.room_id = r.id
       WHERE p.id = ?`,
      [req.params.id]
    );

    if (!receipt) {
      return res.status(404).json({ error: 'Receipt not found' });
    }

    if (req.user.role === 'student' && receipt.student_id !== req.user.id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const settings = await db.asyncGet('SELECT * FROM settings ORDER BY id DESC LIMIT 1');

    res.json({
      hostelName: settings?.hostel_name || 'Sakhare Plot Hostel Management',
      hostelAddress: settings?.hostel_address || 'Plot No. 14, Main Road, Block A, City Center',
      ownerName: settings?.owner_name || 'Sandeep Sakhare',
      contactPhone: settings?.hostel_phone || '+91 98765 43210',
      upiId: settings?.upi_id || 'sandeepsakhare@upi',
      receipt
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
