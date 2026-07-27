const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const authRoutes = require('./routes/auth');
const studentRoutes = require('./routes/students');
const roomRoutes = require('./routes/rooms');
const paymentRoutes = require('./routes/payments');
const complaintRoutes = require('./routes/complaints');
const leaveRoutes = require('./routes/leaves');
const noticeRoutes = require('./routes/notices');

const app = express();
const PORT = process.env.PORT || 5001;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Log requests
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/students', studentRoutes);
app.use('/api/rooms', roomRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/complaints', complaintRoutes);
app.use('/api/leaves', leaveRoutes);
app.use('/api/notices', noticeRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'online',
    app: 'Sakhare Plot Hostel Management System API',
    timestamp: new Date().toISOString()
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Unhandled Error:', err.stack);
  res.status(500).json({ error: 'Internal Server Error', message: err.message });
});

const server = app.listen(PORT, () => {
  console.log(`=================================================`);
  console.log(`Sakhare Plot Hostel Backend Server active on port ${PORT}`);
  console.log(`http://localhost:${PORT}/api/health`);
  console.log(`=================================================`);
});

server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    const ALT_PORT = 5002;
    console.log(`Port ${PORT} in use, retrying on port ${ALT_PORT}...`);
    app.listen(ALT_PORT, () => {
      console.log(`Sakhare Plot Hostel Backend active on fallback port ${ALT_PORT}`);
    });
  } else {
    console.error(err);
  }
});
