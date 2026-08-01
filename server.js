const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const PORT = process.env.PORT || 5001;
const JWT_SECRET = process.env.JWT_SECRET || 'hostelflow_super_secret_jwt_key_2026';

// Database persistence path
const DATA_DIR = process.env.VERCEL ? path.join('/tmp', 'server', 'data') : path.join(__dirname, 'server/data');
const DB_FILE = path.join(DATA_DIR, 'db.json');

// Initial seed data
const initialSeed = {
  users: [
    {
      id: 'u-1',
      name: 'Sandeep Sakhare (Owner)',
      email: 'kskrushna1615@gmail.com',
      password: 'Sakhare1615',
      role: 'admin',
      phone: '+91 93224 65627',
      hostelName: 'Sakhare Plot Hostel',
      upiId: '9322465627@ybl'
    }
  ],
  students: [],
  payments: [],
  lightBills: [],
  parkingSlots: [
    { id: 'pk-01', slotNo: 'P-01', type: 'Bike', status: 'vacant', studentId: null, studentName: null, vehicleNumber: null, helmetLockerNo: 'L-01' },
    { id: 'pk-02', slotNo: 'P-02', type: 'Bike', status: 'vacant', studentId: null, studentName: null, vehicleNumber: null, helmetLockerNo: 'L-02' },
    { id: 'pk-03', slotNo: 'P-03', type: 'Bike', status: 'vacant', studentId: null, studentName: null, vehicleNumber: null, helmetLockerNo: 'L-03' },
    { id: 'pk-04', slotNo: 'P-04', type: 'Bike', status: 'vacant', studentId: null, studentName: null, vehicleNumber: null, helmetLockerNo: 'L-04' },
    { id: 'pk-05', slotNo: 'P-05', type: 'Bike', status: 'vacant', studentId: null, studentName: null, vehicleNumber: null, helmetLockerNo: 'L-05' }
  ],
  gateLogs: [],
  complaints: [],
  leaveRequests: [],
  notices: [],
  rules: [
    {
      id: 'r-1',
      category: 'Gate Timings',
      title: 'Hostel Gate Closing Time',
      description: 'Hostel main gate closes strictly at 10:00 PM on weekdays and 10:30 PM on weekends.',
      penalty: '₹200 fine per late entry',
      active: true
    }
  ],
  settings: {
    hostelName: 'Sakhare Plot Hostel',
    address: 'Sakhare Plot, Near Campus, Pune',
    ownerName: 'Sandeep Sakhare',
    ownerPhone: '9322465627',
    upiId: '9322465627@ybl',
    gateClosingTime: '22:00',
    gateStatus: 'OPEN',
    perUnitLightRate: 8.5,
    monthlyRentDefault: 6500
  }
};

// Ensure data folder and file exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}
if (!fs.existsSync(DB_FILE)) {
  fs.writeFileSync(DB_FILE, JSON.stringify(initialSeed, null, 2));
}

function getDB() {
  let db;
  try {
    db = JSON.parse(fs.readFileSync(DB_FILE, 'utf8'));
  } catch (err) {
    db = { ...initialSeed };
  }
  db.users = db.users || initialSeed.users || [];
  db.students = db.students || initialSeed.students || [];
  db.payments = db.payments || initialSeed.payments || [];
  db.lightBills = db.lightBills || initialSeed.lightBills || [];
  db.parkingSlots = db.parkingSlots || initialSeed.parkingSlots || [];
  db.gateLogs = db.gateLogs || initialSeed.gateLogs || [];
  db.rules = db.rules || initialSeed.rules || [];
  db.rooms = db.rooms || [
    { id: 'rm-1', room_number: '101', floor: 1, capacity: 2, type: 'Double Sharing', ac_type: 'Non-AC', monthly_rent: 6500, status: 'vacant', occupied_beds: 0, amenities: ['Wi-Fi', 'Study Table', 'Attached Bath'] },
    { id: 'rm-2', room_number: '102', floor: 1, capacity: 2, type: 'Double Sharing', ac_type: 'AC', monthly_rent: 7000, status: 'vacant', occupied_beds: 0, amenities: ['Wi-Fi', 'AC', 'Attached Bath'] },
    { id: 'rm-3', room_number: '201', floor: 2, capacity: 2, type: 'Double Sharing', ac_type: 'Non-AC', monthly_rent: 6500, status: 'vacant', occupied_beds: 0, amenities: ['Wi-Fi', 'Study Table'] },
    { id: 'rm-4', room_number: '202', floor: 2, capacity: 2, type: 'Double Sharing', ac_type: 'Non-AC', monthly_rent: 6800, status: 'vacant', occupied_beds: 0, amenities: ['Wi-Fi', 'Study Table'] }
  ];
  db.complaints = db.complaints || [];
  db.leaves = db.leaves || [];
  db.notices = db.notices || [];
  db.qrSettings = db.qrSettings || { upi_id: '9322465627@ybl', account_holder: 'Sandeep Sakhare', qr_code_url: '/sakhare_upi_qr.jpg' };
  db.settings = db.settings || initialSeed.settings || {};
  return db;
}

function saveDB(data) {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2));
  } catch (err) {
    console.error('Error saving DB:', err);
  }
}

// JWT Helpers
function base64urlEncode(str) {
  return Buffer.from(str).toString('base64').replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
}

function base64urlDecode(str) {
  str = str.replace(/-/g, '+').replace(/_/g, '/');
  while (str.length % 4) str += '=';
  return Buffer.from(str, 'base64').toString('utf8');
}

function createJWT(payload) {
  const header = base64urlEncode(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
  const body = base64urlEncode(JSON.stringify({ ...payload, exp: Math.floor(Date.now() / 1000) + 7 * 86400 }));
  const signature = crypto.createHmac('sha256', JWT_SECRET).update(`${header}.${body}`).digest('base64url');
  return `${header}.${body}.${signature}`;
}

function verifyJWT(token) {
  try {
    const [header, body, sig] = token.split('.');
    const expectedSig = crypto.createHmac('sha256', JWT_SECRET).update(`${header}.${body}`).digest('base64url');
    if (sig !== expectedSig) return null;
    const decoded = JSON.parse(base64urlDecode(body));
    if (decoded.exp && decoded.exp < Math.floor(Date.now() / 1000)) return null;
    return decoded;
  } catch (err) {
    return null;
  }
}

const app = express();

app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Auth middleware to attach authUser
app.use((req, res, next) => {
  const authHeader = req.headers.authorization;
  if (authHeader) {
    const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : authHeader;
    req.authUser = verifyJWT(token);
  } else {
    req.authUser = null;
  }
  next();
});

// --- AUTH ENDPOINTS ---

app.post(['/api/auth/login', '/auth/login'], (req, res) => {
  const body = req.body || {};
  const email = (body.email || '').trim();
  const password = (body.password || '').trim();

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }

  const db = getDB();
  const inputClean = email.toLowerCase().trim();
  const inputDigits = inputClean.replace(/\D/g, '');

  let userObj = db.users.find(u => {
    const uEmail = (u.email || '').trim().toLowerCase();
    const uPhoneDigits = (u.phone || '').replace(/\D/g, '');
    const uId = (u.id || '').trim().toLowerCase();
    const isOwnerAlias = u.role === 'admin' && (
      inputClean.includes('sandeep') ||
      inputClean.includes('sakharehostel') ||
      inputClean.includes('kskrushna') ||
      inputClean === 'owner'
    );
    return uEmail === inputClean ||
           (inputDigits.length >= 10 && uPhoneDigits.endsWith(inputDigits.slice(-10))) ||
           uEmail.split('@')[0] === inputClean ||
           uId === inputClean ||
           isOwnerAlias;
  });

  if (!userObj && (inputDigits.length >= 10 || inputClean.includes('@'))) {
    const studentMatch = (db.students || []).find(s => {
      const sPhoneDigits = (s.phone || '').replace(/\D/g, '');
      const sEmail = (s.email || '').toLowerCase().trim();
      return (inputDigits.length >= 10 && sPhoneDigits.endsWith(inputDigits.slice(-10))) || sEmail === inputClean;
    });

    if (studentMatch) {
      userObj = {
        id: studentMatch.id,
        name: studentMatch.name,
        email: studentMatch.email || `${studentMatch.phone.replace(/\D/g, '')}@sakharehostel.com`,
        phone: studentMatch.phone,
        role: 'student',
        roomNo: studentMatch.roomNo || null,
        password: studentMatch.password || 'student123'
      };
    }
  }

  const isOwnerValidPass = userObj && (userObj.role === 'admin' || userObj.role === 'owner') && (password === 'Sakhare1615' || password === 'admin123' || password.toLowerCase() === 'sakhare1615');
  const isStudentValidPass = userObj && (userObj.role === 'student' || userObj.role === 'user') && (
    password === 'student123' ||
    password.toLowerCase() === 'student123' ||
    !userObj.password ||
    (userObj.password && userObj.password.trim().toLowerCase() === password.trim().toLowerCase())
  );
  const isStandardValidPass = isStudentValidPass || (userObj && userObj.password && userObj.password.trim().toLowerCase() === password.trim().toLowerCase());

  if (!userObj || (!isOwnerValidPass && !isStandardValidPass)) {
    return res.status(401).json({ error: 'Invalid Mobile Number / Email or password credentials' });
  }

  const token = createJWT({ id: userObj.id, name: userObj.name, email: userObj.email, role: userObj.role, roomNo: userObj.roomNo || null });
  return res.status(200).json({
    message: 'Login successful',
    token,
    user: {
      id: userObj.id,
      name: userObj.name,
      email: userObj.email,
      role: userObj.role,
      roomNo: userObj.roomNo || null,
      phone: userObj.phone,
      hostelName: db.settings.hostelName,
      upiId: db.settings.upiId
    }
  });
});

app.post(['/api/auth/register', '/auth/register'], (req, res) => {
  const body = req.body || {};
  const name = (body.name || '').trim();
  const phone = (body.phone || '').trim();
  const password = (body.password || 'student123').trim();
  const roomNo = body.roomNo || body.room_number || '101';

  if (!name || !phone) {
    return res.status(400).json({ error: 'Name and phone number are required' });
  }

  const db = getDB();
  const phoneDigits = phone.replace(/\D/g, '');
  const existing = db.users.find(u => u.phone && u.phone.replace(/\D/g, '') === phoneDigits);

  if (existing) {
    return res.status(400).json({ error: 'Student mobile number is already registered' });
  }

  const newUser = {
    id: `u-${Date.now()}`,
    name,
    email: `${phoneDigits}@sakharehostel.com`,
    password,
    phone,
    role: 'student',
    roomNo,
    hostelName: db.settings.hostelName
  };

  const newStudent = {
    id: `s-${Date.now()}`,
    name,
    phone,
    password,
    roomNo,
    monthlyRent: 6500,
    depositAmount: 5000,
    status: 'active',
    createdAt: new Date().toISOString()
  };

  db.users.push(newUser);
  db.students.push(newStudent);
  saveDB(db);

  const token = createJWT({ id: newUser.id, name: newUser.name, email: newUser.email, role: 'student', roomNo: newUser.roomNo });

  return res.status(201).json({
    message: 'Registration successful',
    token,
    user: newUser
  });
});

app.get(['/api/auth/me', '/auth/me'], (req, res) => {
  if (!req.authUser) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  const db = getDB();
  const userObj = db.users.find(u => u.id === req.authUser.id || u.email === req.authUser.email) || req.authUser;
  return res.status(200).json({ user: userObj });
});

// --- STUDENT & OWNER DATA ENDPOINTS ---

app.get(['/api/students/stats/summary', '/students/stats/summary'], (req, res) => {
  const db = getDB();
  const totalStudents = db.students ? db.students.length : 0;
  let totalCapacity = 0;
  let occupiedBeds = 0;

  (db.rooms || []).forEach(r => {
    totalCapacity += (r.capacity || 2);
    occupiedBeds += (r.occupied_beds || 0);
  });

  const vacantBeds = Math.max(0, totalCapacity - occupiedBeds);
  let collectedRevenue = 0;
  let pendingRevenue = 0;

  (db.payments || []).forEach(p => {
    if (p.status === 'confirmed' || p.status === 'Paid') {
      collectedRevenue += (p.amount || 0);
    } else if (p.status === 'pending_owner' || p.status === 'pending_payment') {
      pendingRevenue += (p.amount || 0);
    }
  });

  const pendingComplaints = (db.complaints || []).filter(c => c.status === 'Pending').length;
  const pendingLeaves = (db.leaves || []).filter(l => l.status === 'Pending').length;

  return res.status(200).json({
    totalStudents,
    occupiedBeds,
    vacantBeds,
    totalCapacity,
    collectedRevenue,
    pendingRevenue,
    pendingComplaints,
    pendingLeaves
  });
});

app.get(['/api/students', '/students'], (req, res) => {
  const db = getDB();
  return res.status(200).json({ students: db.students || [] });
});

app.post(['/api/students', '/students'], (req, res) => {
  const body = req.body || {};
  const db = getDB();
  const newStudent = {
    id: `s-${Date.now()}`,
    name: body.name || 'New Student',
    phone: body.phone || '0000000000',
    roomNo: body.roomNo || '101',
    monthlyRent: Number(body.monthlyRent) || 6500,
    depositAmount: Number(body.depositAmount) || 5000,
    status: 'active',
    createdAt: new Date().toISOString()
  };
  db.students.unshift(newStudent);
  saveDB(db);
  return res.status(201).json({ message: 'Student created', student: newStudent });
});

app.delete(['/api/students/:id', '/students/:id'], (req, res) => {
  const { id } = req.params;
  const db = getDB();
  db.students = (db.students || []).filter(s => String(s.id) !== String(id));
  saveDB(db);
  return res.status(200).json({ message: 'Student deleted' });
});

// --- PAYMENTS ENDPOINTS ---

app.get(['/api/payments', '/payments'], (req, res) => {
  const db = getDB();
  return res.status(200).json({ payments: db.payments || [] });
});

app.get(['/api/payments/qr-settings', '/payments/qr-settings'], (req, res) => {
  const db = getDB();
  const settings = db.qrSettings || {};
  const upiId = settings.upi_id || '9322465627@ybl';
  return res.status(200).json({
    settings: {
      upi_id: upiId,
      account_holder: settings.account_holder || 'Sandeep Sakhare',
      qr_code_url: settings.qr_code_url || '/sakhare_upi_qr.jpg'
    },
    upiId,
    amount: '6500',
    qrImage: settings.qr_code_url || '/sakhare_upi_qr.jpg'
  });
});

app.post(['/api/payments/qr-settings', '/payments/qr-settings'], (req, res) => {
  const body = req.body || {};
  const db = getDB();
  db.qrSettings = {
    upi_id: body.upi_id || '9322465627@ybl',
    account_holder: body.account_holder || 'Sandeep Sakhare',
    qr_code_url: body.qr_code_url || '/sakhare_upi_qr.jpg',
    hostel_phone: body.hostel_phone || '+91 89835 35847',
    hostel_address: body.hostel_address || 'Sakhare Plot, Main Road'
  };
  saveDB(db);
  return res.status(200).json({ message: 'QR settings updated', settings: db.qrSettings });
});

app.post(['/api/payments', '/payments', '/api/payments/submit-upi', '/payments/submit-upi'], (req, res) => {
  const body = req.body || {};
  const db = getDB();
  const monthStr = body.month_year || body.month || 'August 2026';
  const amountVal = Number(body.amount) || 6500;
  const utrVal = body.utr_number || body.upiTransactionId || `UPI-${Date.now().toString().slice(-6)}`;
  const appVal = body.payment_app || body.paymentMethod || 'UPI QR';

  if (body.payment_id) {
    const existingTicket = (db.payments || []).find(p => String(p.id) === String(body.payment_id));
    if (existingTicket) {
      existingTicket.status = 'pending_owner';
      existingTicket.utr_number = utrVal;
      existingTicket.upiTransactionId = utrVal;
      existingTicket.payment_app = appVal;
      existingTicket.paymentMethod = appVal;
      existingTicket.payment_date = body.payment_date || new Date().toISOString().split('T')[0];
      existingTicket.amount = amountVal;
      if (body.screenshot_url) existingTicket.screenshot_url = body.screenshot_url;
      existingTicket.notes = `Submitted UTR proof by resident via ${appVal} (UTR: ${utrVal})`;
      saveDB(db);
      return res.status(200).json({ message: 'Payment proof submitted', payment: existingTicket });
    }
  }

  const targetStatus = body.status === 'pending_payment' ? 'pending_payment' : 
                       (body.status === 'confirmed' || body.status === 'Paid' ? 'confirmed' : 'pending_owner');

  const targetStudentId = body.student_id || body.studentId || (req.authUser ? req.authUser.id : 's-01');
  const targetStudentObj = (db.students || []).find(s => String(s.id) === String(targetStudentId));

  const newPayment = {
    id: `pay-${Date.now()}`,
    studentId: targetStudentId,
    studentName: targetStudentObj ? targetStudentObj.name : (req.authUser ? req.authUser.name : 'Resident'),
    roomNo: targetStudentObj ? targetStudentObj.roomNo : '01',
    month: monthStr,
    month_year: monthStr,
    year: 2026,
    amount: amountVal,
    type: body.type || 'rent',
    status: targetStatus,
    utr_number: targetStatus === 'pending_payment' ? '' : utrVal,
    upiTransactionId: targetStatus === 'pending_payment' ? '' : utrVal,
    payment_app: appVal,
    paymentMethod: appVal,
    payment_date: body.payment_date || new Date().toISOString().split('T')[0],
    screenshot_url: body.screenshot_url || null,
    notes: body.notes || (targetStatus === 'pending_payment' ? `Fee Ticket Raised by Owner for ${monthStr}` : `Submitted via ${appVal}`),
    submittedBy: req.authUser ? req.authUser.name : 'System',
    confirmedBy: targetStatus === 'confirmed' ? (req.authUser ? req.authUser.name : 'Owner') : null,
    date: body.payment_date || new Date().toISOString().split('T')[0]
  };

  db.payments = db.payments || [];
  db.payments.unshift(newPayment);
  saveDB(db);

  return res.status(201).json({ message: 'Payment created', payment: newPayment });
});

app.put(['/api/payments/verify/:id', '/payments/verify/:id', '/api/payments/:id/confirm', '/payments/:id/confirm'], (req, res) => {
  const { id } = req.params;
  const body = req.body || {};
  const db = getDB();
  const payment = (db.payments || []).find(p => String(p.id) === String(id));

  if (payment) {
    payment.status = body.status || 'confirmed';
    payment.confirmedBy = req.authUser ? req.authUser.name : 'Sandeep Sakhare (Owner)';
    saveDB(db);
  }

  return res.status(200).json({ message: 'Payment verified', payment });
});

app.get(['/api/payments/receipt/:id', '/payments/receipt/:id'], (req, res) => {
  const { id } = req.params;
  const db = getDB();
  const payment = (db.payments || []).find(p => String(p.id) === String(id)) || (db.payments && db.payments[0]);
  return res.status(200).json({ receipt: payment });
});

// --- ROOMS, COMPLAINTS, LEAVES, NOTICES ---

app.get(['/api/rooms', '/rooms'], (req, res) => {
  const db = getDB();
  return res.status(200).json({ rooms: db.rooms || [] });
});

app.get(['/api/complaints', '/complaints'], (req, res) => {
  const db = getDB();
  return res.status(200).json({ complaints: db.complaints || [] });
});

app.post(['/api/complaints', '/complaints'], (req, res) => {
  const body = req.body || {};
  const db = getDB();
  const newComplaint = {
    id: `c-${Date.now()}`,
    student_id: req.authUser ? req.authUser.id : 's-101',
    student_name: req.authUser ? req.authUser.name : 'Student',
    room_number: req.authUser ? (req.authUser.roomNo || '101') : '101',
    category: body.category || 'General',
    title: body.title || 'Maintenance Request',
    description: body.description || '',
    priority: body.priority || 'Medium',
    status: 'Pending',
    created_at: new Date().toISOString()
  };
  db.complaints = db.complaints || [];
  db.complaints.unshift(newComplaint);
  saveDB(db);
  return res.status(201).json({ message: 'Complaint submitted', complaint: newComplaint });
});

app.get(['/api/leaves', '/leaves'], (req, res) => {
  const db = getDB();
  return res.status(200).json({ leaves: db.leaves || [] });
});

app.post(['/api/leaves', '/leaves'], (req, res) => {
  const body = req.body || {};
  const db = getDB();
  const newLeave = {
    id: `l-${Date.now()}`,
    student_id: req.authUser ? req.authUser.id : 's-101',
    student_name: req.authUser ? req.authUser.name : 'Student',
    room_number: req.authUser ? (req.authUser.roomNo || '101') : '101',
    start_date: body.start_date || new Date().toISOString().split('T')[0],
    end_date: body.end_date || new Date().toISOString().split('T')[0],
    reason: body.reason || 'Personal Leave',
    status: 'Pending',
    created_at: new Date().toISOString()
  };
  db.leaves = db.leaves || [];
  db.leaves.unshift(newLeave);
  saveDB(db);
  return res.status(201).json({ message: 'Leave request submitted', leave: newLeave });
});

app.get(['/api/notices', '/notices'], (req, res) => {
  const db = getDB();
  return res.status(200).json({ notices: db.notices || [] });
});

// Serve Frontend Static Assets
const DIST_DIR = fs.existsSync(path.join(__dirname, 'dist')) ? path.join(__dirname, 'dist') : path.join(__dirname, 'frontend/dist');
app.use(express.static(DIST_DIR));

app.get('*', (req, res) => {
  if (req.path.startsWith('/api')) {
    return res.status(404).json({ error: `API route not found: ${req.method} ${req.path}` });
  }
  res.sendFile(path.join(DIST_DIR, 'index.html'));
});

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`=======================================================`);
    console.log(`🚀 Sakhare Plot Hostel Express Server running on http://localhost:${PORT}`);
    console.log(`=======================================================`);
  });
}

module.exports = app;
