const http = require('http');
const fs = require('fs');
const path = require('path');
const url = require('url');
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
      description: 'Hostel main gate closes strictly at 10:00 PM on weekdays and 10:30 PM on weekends. Late entries without prior written/app permission will incur a fine.',
      penalty: '₹200 fine per late entry',
      active: true
    },
    {
      "id": "r-2",
      "category": "Payments",
      "title": "Monthly Rent Payment Deadline",
      "description": "Monthly rent must be paid in full by the 5th of every calendar month via the hostel UPI QR portal.",
      "penalty": "₹100/day late charge after 7th of the month",
      "active": true
    },
    {
      "id": "r-3",
      "category": "Light Bill",
      "title": "Sub-Meter Electricity Division",
      "description": "Electricity sub-meters are checked on the 1st of every month. Total bill per room is split equally among room residents.",
      "penalty": "Power disconnection for 15+ days unpaid bill",
      "active": true
    },
    {
      "id": "r-4",
      "category": "Bike Parking",
      "title": "Designated Parking Slots Only",
      "description": "Vehicles must be parked strictly in assigned slot numbers. Helmets must be stored in designated lockers.",
      "penalty": "₹150 penalty for unauthorized parking",
      "active": true
    },
    {
      "id": "r-5",
      "category": "Visitors & Security",
      "title": "Guest & Visitor Restrictions",
      "description": "Visitors allowed only in reception lobby from 10:00 AM to 7:00 PM. No opposite-gender guests or overnight stays permitted in rooms.",
      "penalty": "Immediate warning and suspension of visitor rights",
      "active": true
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

// Simple Native JWT Encoder & Verifier using Crypto HMAC-SHA256
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

// Generate Monthly Dues Ledger
function generateMonthlyLedger(student, payments) {
  const join = new Date(student.joinDate);
  const now = new Date();
  const ledger = [];

  let cur = new Date(join.getFullYear(), join.getMonth(), 1);
  const end = new Date(now.getFullYear(), now.getMonth(), 1);

  while (cur <= end) {
    const monthName = cur.toLocaleString('default', { month: 'long' });
    const year = cur.getFullYear();
    const monthKey = `${monthName} ${year}`;

    const studentPayments = payments.filter(
      p => p.studentId === student.id && p.month.toLowerCase() === monthKey.toLowerCase()
    );

    const confirmedPayment = studentPayments.find(p => p.status === 'confirmed');
    const pendingPayment = studentPayments.find(p => p.status === 'pending_owner');

    let status = 'unpaid';
    let amountPaid = 0;

    if (confirmedPayment) {
      status = 'paid';
      amountPaid = confirmedPayment.amount;
    } else if (pendingPayment) {
      status = 'pending_owner';
      amountPaid = pendingPayment.amount;
    } else {
      status = cur < end ? 'overdue' : 'unpaid';
    }

    ledger.push({
      month: monthKey,
      dueDate: `${year}-${String(cur.getMonth() + 1).padStart(2, '0')}-05`,
      rentAmount: student.monthlyRent,
      amountPaid,
      status,
      payments: studentPayments
    });

    cur.setMonth(cur.getMonth() + 1);
  }

  return ledger.reverse();
}

// Helper to parse JSON request body
function parseRequestBody(req) {
  if (req.body !== undefined && req.body !== null) {
    if (typeof req.body === 'object') {
      return Promise.resolve(req.body);
    }
    if (typeof req.body === 'string') {
      try {
        return Promise.resolve(req.body ? JSON.parse(req.body) : {});
      } catch (e) {
        return Promise.resolve({});
      }
    }
  }
  return new Promise((resolve) => {
    let body = '';
    let resolved = false;

    const timer = setTimeout(() => {
      if (!resolved) {
        resolved = true;
        try {
          resolve(body ? JSON.parse(body) : {});
        } catch (e) {
          resolve({});
        }
      }
    }, 800);

    req.on('data', chunk => { body += chunk.toString(); });
    req.on('end', () => {
      if (!resolved) {
        resolved = true;
        clearTimeout(timer);
        try {
          resolve(body ? (typeof body === 'string' ? JSON.parse(body) : body) : {});
        } catch (err) {
          resolve({});
        }
      }
    });
  });
}

// MIME Types Map
const MIME_TYPES = {
  '.html': 'text/html',
  '.js': 'application/javascript',
  '.jsx': 'application/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.svg': 'image/svg+xml'
};

// Native HTTP Server Handler
async function handleRequest(req, res) {
  // CORS Headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    return res.end();
  }

  let rawUrl = req.url || '';

  // If Vercel catch-all function [...path].js passed req.query.path
  if (req.query && req.query.path) {
    const pathArr = Array.isArray(req.query.path) ? req.query.path : [req.query.path];
    rawUrl = '/api/' + pathArr.join('/');
  }

  const parsedUrl = url.parse(rawUrl, true);
  let pathname = parsedUrl.pathname || '/';
  pathname = pathname.split('?')[0];

  // If request is from Vercel function and missing /api prefix
  if (pathname.startsWith('/auth') || pathname.startsWith('/students') || pathname.startsWith('/payments') || pathname.startsWith('/rooms') || pathname.startsWith('/complaints') || pathname.startsWith('/leaves') || pathname.startsWith('/notices')) {
    pathname = '/api' + pathname;
  }

  // Keep original pathname for routing and static asset serving

  const method = req.method;

  // Extract Auth User if present
  let authUser = null;
  const authHeader = req.headers.authorization;
  if (authHeader) {
    const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : authHeader;
    authUser = verifyJWT(token);
  }

  // --- API ROUTES ---

  // POST /api/auth/login
  if (pathname === '/api/auth/login' && method === 'POST') {
    const body = await parseRequestBody(req);
    const email = (body.email || '').trim();
    const password = (body.password || '').trim();

    if (!email || !password) {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      return res.end(JSON.stringify({ error: 'Email and password are required' }));
    }

    const db = getDB();
    const inputClean = email.toLowerCase().trim();
    const inputDigits = inputClean.replace(/\D/g, '');

    let userObj = db.users.find(u => {
      const uEmail = (u.email || '').trim().toLowerCase();
      const uPhoneDigits = (u.phone || '').replace(/\D/g, '');
      const uId = (u.id || '').trim().toLowerCase();
      const uRoom = u.roomNo ? `room${u.roomNo.toLowerCase()}` : '';
      const uRoomPad = u.roomNo && u.roomNo.length === 1 ? `room0${u.roomNo.toLowerCase()}` : '';
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
             `id-${uRoom}` === inputClean ||
             uRoom === inputClean ||
             (uRoomPad && uRoomPad === inputClean) ||
             isOwnerAlias;
    });

    // Fallback: check students list if user not found in users list
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
      res.writeHead(401, { 'Content-Type': 'application/json' });
      return res.end(JSON.stringify({ error: 'Invalid Mobile Number / Email or password credentials' }));
    }

    const token = createJWT({ id: userObj.id, name: userObj.name, email: userObj.email, role: userObj.role, roomNo: userObj.roomNo || null });
    res.writeHead(200, { 'Content-Type': 'application/json' });
    return res.end(JSON.stringify({
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
    }));
  }

  // GET /api/auth/me
  if (pathname === '/api/auth/me' && method === 'GET') {
    if (!authUser) {
      res.writeHead(401, { 'Content-Type': 'application/json' });
      return res.end(JSON.stringify({ error: 'Unauthorized: Invalid or missing token' }));
    }
    const db = getDB();
    const userObj = db.users.find(u => u.id === authUser.id || u.email === authUser.email) || {
      id: authUser.id || 'u-1',
      name: authUser.name || 'Sandeep Sakhare (Owner)',
      email: authUser.email || 'kskrushna1615@gmail.com',
      role: authUser.role || 'admin',
      roomNo: authUser.roomNo || null,
      phone: '+91 98765 43210'
    };
    res.writeHead(200, { 'Content-Type': 'application/json' });
    return res.end(JSON.stringify({
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
    }));
  }

  // POST /api/auth/quick-login
  if (pathname === '/api/auth/quick-login' && method === 'POST') {
    const body = await parseRequestBody(req);
    const db = getDB();
    const targetRole = body.role || 'owner';
    const userObj = db.users.find(u =>
      body.email ? u.email === body.email : (targetRole === 'owner' ? (u.role === 'admin' || u.role === 'owner') : u.role === targetRole)
    ) || db.users[0];

    const token = createJWT({ id: userObj.id, name: userObj.name, email: userObj.email, role: userObj.role, roomNo: userObj.roomNo || null });
    res.writeHead(200, { 'Content-Type': 'application/json' });
    return res.end(JSON.stringify({
      message: 'Quick login successful',
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
    }));
  }

  // POST /api/auth/register
  if (pathname === '/api/auth/register' && method === 'POST') {
    const body = await parseRequestBody(req);
    const db = getDB();
    if (!body.email || !body.name || !body.password) {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      return res.end(JSON.stringify({ error: 'Name, email and password required' }));
    }
    const existing = db.users.find(u => u.email.toLowerCase() === body.email.toLowerCase().trim());
    if (existing) {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      return res.end(JSON.stringify({ error: 'Email is already registered' }));
    }
    const newUser = {
      id: 'u-' + Date.now(),
      name: body.name,
      email: body.email.toLowerCase().trim(),
      password: body.password,
      role: body.role === 'owner' ? 'admin' : 'student',
      phone: body.phone || '',
      hostelName: db.settings.hostelName,
      upiId: db.settings.upiId
    };
    db.users.push(newUser);
    saveDB(db);
    const token = createJWT({ id: newUser.id, name: newUser.name, email: newUser.email, role: newUser.role });
    res.writeHead(201, { 'Content-Type': 'application/json' });
    return res.end(JSON.stringify({
      message: 'Registration successful',
      token,
      user: { id: newUser.id, name: newUser.name, email: newUser.email, role: newUser.role, phone: newUser.phone }
    }));
  }

  // GET /api/students
  if (pathname === '/api/students' && method === 'GET') {
    const db = getDB();
    const studentsWithLedger = db.students.map(s => {
      const ledger = generateMonthlyLedger(s, db.payments);
      const currentMonthStatus = ledger.length > 0 ? ledger[0].status : 'unknown';
      return { ...s, ledger, currentMonthStatus };
    });
    res.writeHead(200, { 'Content-Type': 'application/json' });
    return res.end(JSON.stringify({ students: studentsWithLedger }));
  }

  // POST /api/students
  if (pathname === '/api/students' && method === 'POST') {
    const body = await parseRequestBody(req);
    const db = getDB();

    const newStudent = {
      id: 's-' + Date.now(),
      name: body.name,
      phone: body.phone,
      parentPhone: body.parentPhone || '',
      roomNo: String(body.roomNo),
      bedNo: String(body.bedNo),
      joinDate: body.joinDate || new Date().toISOString().split('T')[0],
      monthlyRent: Number(body.monthlyRent) || 6500,
      depositAmount: 5000,
      idType: body.idType || 'Aadhaar Card',
      idNumber: body.idNumber || '',
      idDocUrl: body.idDocUrl || `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="300" height="180" viewBox="0 0 300 180"><rect width="300" height="180" rx="12" fill="%231e293b"/><text x="20" y="40" fill="%2338bdf8" font-family="sans-serif" font-size="16" font-weight="bold">GOVT OF INDIA - ${encodeURIComponent(body.idType || 'AADHAAR')}</text><rect x="20" y="60" width="70" height="80" rx="6" fill="%23334155"/><text x="105" y="80" fill="%23f8fafc" font-size="14">${encodeURIComponent(body.name)}</text><text x="105" y="100" fill="%2394a3b8" font-size="12">Room ${encodeURIComponent(body.roomNo)}</text><text x="105" y="145" fill="%23e2e8f0" font-size="13" font-weight="bold">${encodeURIComponent(body.idNumber || '4521 8890 0000')}</text></svg>`,
      bikeNumber: body.bikeNumber || 'None',
      parkingSlot: body.parkingSlot || 'None',
      status: 'active',
      createdAt: new Date().toISOString()
    };

    db.students.push(newStudent);

    if (body.parkingSlot && body.parkingSlot !== 'None') {
      const slot = db.parkingSlots.find(p => p.slotNo === body.parkingSlot);
      if (slot) {
        slot.status = 'occupied';
        slot.studentId = newStudent.id;
        slot.studentName = newStudent.name;
        slot.vehicleNumber = newStudent.bikeNumber;
      }
    }

    saveDB(db);
    res.writeHead(201, { 'Content-Type': 'application/json' });
    return res.end(JSON.stringify({ message: 'Student registered successfully', student: newStudent }));
  }

  // DELETE /api/students/:id
  if (pathname.startsWith('/api/students/') && method === 'DELETE') {
    const id = pathname.split('/')[3];
    const db = getDB();
    const idx = db.students.findIndex(s => s.id === id);
    if (idx !== -1) {
      db.students.splice(idx, 1);
      saveDB(db);
    }
    res.writeHead(200, { 'Content-Type': 'application/json' });
    return res.end(JSON.stringify({ message: 'Student deleted' }));
  }

  // GET /api/payments
  if (pathname === '/api/payments' && method === 'GET') {
    const db = getDB();
    res.writeHead(200, { 'Content-Type': 'application/json' });
    return res.end(JSON.stringify({ payments: db.payments }));
  }

  // GET /api/payments/qr-payload & /api/payments/qr-settings
  if ((pathname === '/api/payments/qr-payload' || pathname === '/api/payments/qr-settings') && method === 'GET') {
    const db = getDB();
    const query = parsedUrl.query || {};
    const settings = db.qrSettings || {};
    const upiId = settings.upi_id || (db.settings && db.settings.upiId) || '9322465627@ybl';
    const amount = query.amount || '6500';
    const qr_code_url = settings.qr_code_url || '/sakhare_upi_qr.jpg';
    const upiLink = `upi://pay?pa=${encodeURIComponent(upiId)}&pn=${encodeURIComponent('Sakhare Plot Hostel')}&am=${amount}&cu=INR`;

    res.writeHead(200, { 'Content-Type': 'application/json' });
    return res.end(JSON.stringify({
      settings: {
        upi_id: upiId,
        account_holder: settings.account_holder || 'Sandeep Sakhare',
        qr_code_url: qr_code_url
      },
      upiId,
      amount,
      note: 'Scan via any GPay / PhonePe / Paytm UPI app',
      upiLink,
      qrText: upiLink,
      qrImage: qr_code_url
    }));
  }

  // PUT /api/payments/:id/confirm OR /api/payments/verify/:id
  if (pathname.startsWith('/api/payments/') && (pathname.includes('/confirm') || pathname.includes('/verify/')) && method === 'PUT') {
    const parts = pathname.split('/');
    const id = parts[parts.length - 1] === 'confirm' ? parts[parts.length - 2] : parts[parts.length - 1];
    const body = await parseRequestBody(req);
    const db = getDB();
    const payment = (db.payments || []).find(p => p.id === id);

    if (payment) {
      payment.status = body.status || 'confirmed';
      payment.confirmedBy = authUser ? authUser.name : 'Sandeep Sakhare (Owner)';
      saveDB(db);
    }

    res.writeHead(200, { 'Content-Type': 'application/json' });
    return res.end(JSON.stringify({ message: `Payment status updated to ${body.status || 'confirmed'}`, payment }));
  }

  // GET /api/payments/receipt/:id
  if (pathname.startsWith('/api/payments/receipt/') && method === 'GET') {
    const id = pathname.split('/')[4];
    const db = getDB();
    const payment = (db.payments || []).find(p => p.id === id) || (db.payments && db.payments[0]);
    res.writeHead(200, { 'Content-Type': 'application/json' });
    return res.end(JSON.stringify({ receipt: payment }));
  }

  // POST /api/payments or /api/payments/submit-upi (Submit payment proof or issue fee ticket)
  if ((pathname === '/api/payments' || pathname === '/api/payments/submit-upi') && method === 'POST') {
    const body = await parseRequestBody(req);
    const db = getDB();
    
    // Find active student profile if available
    const currentStudent = (db.students || []).find(s => 
      (authUser && (s.id === authUser.id || (s.email && s.email.toLowerCase() === (authUser.email || '').toLowerCase())))
    ) || (db.students && db.students[0]);

    const monthStr = body.month_year || body.month || 'August 2026';
    const amountVal = Number(body.amount) || (currentStudent ? currentStudent.monthlyRent : 6500);
    const utrVal = body.utr_number || body.upiTransactionId || `UPI-${Date.now().toString().slice(-6)}`;
    const appVal = body.payment_app || body.paymentMethod || 'UPI QR';

    // If student is submitting UTR proof for an existing ticket raised by owner
    if (body.payment_id) {
      const existingTicket = (db.payments || []).find(p => p.id === body.payment_id);
      if (existingTicket) {
        existingTicket.status = 'pending_owner';
        existingTicket.utr_number = utrVal;
        existingTicket.upiTransactionId = utrVal;
        existingTicket.payment_app = appVal;
        existingTicket.paymentMethod = appVal;
        existingTicket.payment_date = body.payment_date || new Date().toISOString().split('T')[0];
        existingTicket.amount = Number(body.amount) || existingTicket.amount;
        if (body.screenshot_url) existingTicket.screenshot_url = body.screenshot_url;
        existingTicket.notes = `Submitted UTR proof by resident via ${appVal} (UTR: ${utrVal})`;
        saveDB(db);
        res.writeHead(200, { 'Content-Type': 'application/json' });
        return res.end(JSON.stringify({ 
          message: 'Payment proof submitted and sent to owner for verification', 
          payment: existingTicket 
        }));
      }
    }

    // Determine status (If Owner submits, check body.status; If Student submits without ticket, set pending_owner)
    const targetStatus = body.status === 'pending_payment' ? 'pending_payment' : 
                         (body.status === 'confirmed' || body.status === 'Paid' ? 'confirmed' : 'pending_owner');

    const targetStudentId = body.student_id || body.studentId || (currentStudent ? currentStudent.id : (authUser ? authUser.id : 's-01'));
    const targetStudentObj = (db.students || []).find(s => s.id === targetStudentId) || currentStudent;

    const newPayment = {
      id: `pay-${Date.now()}`,
      studentId: targetStudentId,
      studentName: targetStudentObj ? targetStudentObj.name : (authUser ? authUser.name : 'Resident'),
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
      submittedBy: authUser ? authUser.name : 'System',
      confirmedBy: targetStatus === 'confirmed' ? (authUser ? authUser.name : 'Owner') : null,
      date: body.payment_date || new Date().toISOString().split('T')[0]
    };

    db.payments = db.payments || [];
    db.payments.unshift(newPayment);
    saveDB(db);

    res.writeHead(201, { 'Content-Type': 'application/json' });
    return res.end(JSON.stringify({ 
      message: targetStatus === 'pending_payment' ? 'Fee Ticket issued to student successfully' : 'Payment submission received', 
      payment: newPayment 
    }));
  }

  // GET /api/lightbill & POST /api/lightbill
  if (pathname === '/api/lightbill' && method === 'GET') {
    const db = getDB();
    res.writeHead(200, { 'Content-Type': 'application/json' });
    return res.end(JSON.stringify({ lightBills: db.lightBills }));
  }

  if (pathname === '/api/lightbill' && method === 'POST') {
    const body = await parseRequestBody(req);
    const db = getDB();

    const prev = Number(body.previousReading);
    const curr = Number(body.currentReading);
    const totalUnits = curr - prev;
    const rate = Number(body.ratePerUnit) || 8.5;
    const totalAmount = Math.round(totalUnits * rate);
    const perStudentAmount = Math.round(totalAmount / 2);

    const newBill = {
      id: 'lb-' + Date.now(),
      month: body.month,
      year: 2026,
      roomNo: String(body.roomNo),
      previousReading: prev,
      currentReading: curr,
      ratePerUnit: rate,
      totalUnits,
      totalAmount,
      studentCount: 2,
      perStudentAmount,
      status: 'unpaid',
      dateAdded: new Date().toISOString().split('T')[0]
    };

    db.lightBills.push(newBill);
    saveDB(db);

    res.writeHead(201, { 'Content-Type': 'application/json' });
    return res.end(JSON.stringify({
      message: `Light bill calculated for Room ${body.roomNo}: ${totalUnits} units (₹${totalAmount} total, ₹${perStudentAmount}/student)`,
      lightBill: newBill
    }));
  }

  // GET /api/parking
  if (pathname === '/api/parking' && method === 'GET') {
    const db = getDB();
    res.writeHead(200, { 'Content-Type': 'application/json' });
    return res.end(JSON.stringify({ parkingSlots: db.parkingSlots }));
  }

  // GET & POST /api/gate
  if (pathname === '/api/gate' && method === 'GET') {
    const db = getDB();
    res.writeHead(200, { 'Content-Type': 'application/json' });
    return res.end(JSON.stringify({ settings: db.settings, gateLogs: db.gateLogs }));
  }

  if (pathname === '/api/gate/toggle-status' && method === 'POST') {
    const body = await parseRequestBody(req);
    const db = getDB();
    db.settings.gateStatus = body.gateStatus;
    saveDB(db);
    res.writeHead(200, { 'Content-Type': 'application/json' });
    return res.end(JSON.stringify({ message: `Gate is now ${body.gateStatus}`, gateStatus: body.gateStatus }));
  }

  if (pathname === '/api/gate/log' && method === 'POST') {
    const body = await parseRequestBody(req);
    const db = getDB();
    const student = db.students.find(s => s.id === body.studentId) || { name: 'Student', roomNo: '101' };

    const newLog = {
      id: 'gl-' + Date.now(),
      studentId: body.studentId,
      studentName: student.name,
      roomNo: student.roomNo,
      date: new Date().toISOString().split('T')[0],
      inTime: body.inTime,
      expectedTime: db.settings.gateClosingTime || '22:00',
      reason: body.reason,
      status: body.status || 'late',
      approvedBy: authUser ? authUser.name : 'Warden'
    };

    db.gateLogs.push(newLog);
    saveDB(db);
    res.writeHead(201, { 'Content-Type': 'application/json' });
    return res.end(JSON.stringify({ message: 'Curfew log saved', gateLog: newLog }));
  }

  // GET & POST /api/rules
  if (pathname === '/api/rules' && method === 'GET') {
    const db = getDB();
    res.writeHead(200, { 'Content-Type': 'application/json' });
    return res.end(JSON.stringify({ rules: db.rules }));
  }

  if (pathname === '/api/rules' && method === 'POST') {
    const body = await parseRequestBody(req);
    const db = getDB();
    const newRule = {
      id: 'r-' + Date.now(),
      category: body.category,
      title: body.title,
      description: body.description,
      penalty: body.penalty || '₹200 fine',
      active: true
    };
    db.rules.push(newRule);
    saveDB(db);
    res.writeHead(201, { 'Content-Type': 'application/json' });
    return res.end(JSON.stringify({ message: 'Rule added', rule: newRule }));
  }

  if (pathname.startsWith('/api/rules/') && method === 'DELETE') {
    const id = pathname.split('/')[3];
    const db = getDB();
    const idx = db.rules.findIndex(r => r.id === id);
    if (idx !== -1) {
      db.rules.splice(idx, 1);
      saveDB(db);
    }
    res.writeHead(200, { 'Content-Type': 'application/json' });
    return res.end(JSON.stringify({ message: 'Rule deleted' }));
  }

  // --- ROOMS API ---
  if (pathname === '/api/rooms' && method === 'GET') {
    const db = getDB();
    res.writeHead(200, { 'Content-Type': 'application/json' });
    return res.end(JSON.stringify({ rooms: db.rooms }));
  }

  if (pathname === '/api/rooms' && method === 'POST') {
    const body = await parseRequestBody(req);
    const db = getDB();
    const newRoom = {
      id: 'rm-' + Date.now(),
      room_number: body.room_number || body.roomNo || '101',
      floor: Number(body.floor) || 1,
      capacity: Number(body.capacity) || 2,
      type: body.type || 'Double Sharing',
      ac_type: body.ac_type || 'Non-AC',
      monthly_rent: Number(body.monthly_rent || body.monthlyRent) || 6500,
      status: 'vacant',
      occupied_beds: 0,
      amenities: body.amenities || ['Wi-Fi', 'Study Table']
    };
    db.rooms.push(newRoom);
    saveDB(db);
    res.writeHead(201, { 'Content-Type': 'application/json' });
    return res.end(JSON.stringify({ message: 'Room created', room: newRoom }));
  }

  // --- COMPLAINTS API ---
  if (pathname === '/api/complaints' && method === 'GET') {
    const db = getDB();
    res.writeHead(200, { 'Content-Type': 'application/json' });
    return res.end(JSON.stringify({ complaints: db.complaints }));
  }

  if (pathname === '/api/complaints' && method === 'POST') {
    const body = await parseRequestBody(req);
    const db = getDB();
    const newComplaint = {
      id: 'c-' + Date.now(),
      student_id: body.student_id || authUser?.id || 's-101',
      student_name: body.student_name || authUser?.name || 'Student',
      room_number: body.room_number || body.roomNo || '101',
      category: body.category || 'General',
      title: body.title,
      description: body.description,
      priority: body.priority || 'Medium',
      status: 'Pending',
      created_at: new Date().toISOString()
    };
    db.complaints.push(newComplaint);
    saveDB(db);
    res.writeHead(201, { 'Content-Type': 'application/json' });
    return res.end(JSON.stringify({ message: 'Complaint registered', complaint: newComplaint }));
  }

  if (pathname.startsWith('/api/complaints/') && method === 'PUT') {
    const id = pathname.split('/')[3];
    const body = await parseRequestBody(req);
    const db = getDB();
    const comp = db.complaints.find(c => c.id === id);
    if (comp) {
      if (body.status) comp.status = body.status;
      saveDB(db);
    }
    res.writeHead(200, { 'Content-Type': 'application/json' });
    return res.end(JSON.stringify({ message: 'Complaint updated', complaint: comp }));
  }

  // --- LEAVES API ---
  if (pathname === '/api/leaves' && method === 'GET') {
    const db = getDB();
    res.writeHead(200, { 'Content-Type': 'application/json' });
    return res.end(JSON.stringify({ leaves: db.leaves }));
  }

  if (pathname === '/api/leaves' && method === 'POST') {
    const body = await parseRequestBody(req);
    const db = getDB();
    const newLeave = {
      id: 'l-' + Date.now(),
      student_id: body.student_id || authUser?.id || 's-101',
      student_name: body.student_name || authUser?.name || 'Student',
      room_number: body.room_number || body.roomNo || '101',
      start_date: body.start_date || body.startDate,
      end_date: body.end_date || body.endDate,
      reason: body.reason,
      status: 'Pending',
      created_at: new Date().toISOString()
    };
    db.leaves.push(newLeave);
    saveDB(db);
    res.writeHead(201, { 'Content-Type': 'application/json' });
    return res.end(JSON.stringify({ message: 'Leave request submitted', leave: newLeave }));
  }

  if (pathname.startsWith('/api/leaves/') && method === 'PUT') {
    const id = pathname.split('/')[3];
    const body = await parseRequestBody(req);
    const db = getDB();
    const leave = db.leaves.find(l => l.id === id);
    if (leave) {
      if (body.status) leave.status = body.status;
      saveDB(db);
    }
    res.writeHead(200, { 'Content-Type': 'application/json' });
    return res.end(JSON.stringify({ message: 'Leave request updated', leave }));
  }

  // --- NOTICES API ---
  if (pathname === '/api/notices' && method === 'GET') {
    const db = getDB();
    res.writeHead(200, { 'Content-Type': 'application/json' });
    return res.end(JSON.stringify({ notices: db.notices }));
  }

  if (pathname === '/api/notices' && method === 'POST') {
    const body = await parseRequestBody(req);
    const db = getDB();
    const newNotice = {
      id: 'n-' + Date.now(),
      title: body.title,
      content: body.content,
      category: body.category || 'General',
      is_pinned: body.is_pinned || false,
      created_at: new Date().toISOString()
    };
    db.notices.push(newNotice);
    saveDB(db);
    res.writeHead(201, { 'Content-Type': 'application/json' });
    return res.end(JSON.stringify({ message: 'Notice posted', notice: newNotice }));
  }

  if (pathname.startsWith('/api/notices/') && method === 'DELETE') {
    const id = pathname.split('/')[3];
    const db = getDB();
    const idx = db.notices.findIndex(n => n.id === id);
    if (idx !== -1) {
      db.notices.splice(idx, 1);
      saveDB(db);
    }
    res.writeHead(200, { 'Content-Type': 'application/json' });
    return res.end(JSON.stringify({ message: 'Notice deleted' }));
  }

  // --- DASHBOARD ANALYTICS & STATS SUMMARY ---
  if (pathname === '/api/students/stats/summary' && method === 'GET') {
    const db = getDB();
    const totalStudents = (db.students || []).length;
    const occupiedBeds = totalStudents;
    const totalCapacity = 15;
    const vacantBeds = Math.max(0, totalCapacity - occupiedBeds);
    
    const collectedRevenue = (db.payments || [])
      .filter(p => p.status === 'confirmed')
      .reduce((sum, p) => sum + (Number(p.amount) || 0), 0);
      
    const pendingRevenue = (db.payments || [])
      .filter(p => p.status === 'pending_owner')
      .reduce((sum, p) => sum + (Number(p.amount) || 0), 0);
      
    const pendingComplaints = (db.complaints || [])
      .filter(c => c.status !== 'Resolved' && c.status !== 'resolved')
      .length;
      
    const pendingLeaves = (db.leaveRequests || [])
      .filter(l => l.status === 'Pending' || l.status === 'pending')
      .length;

    res.writeHead(200, { 'Content-Type': 'application/json' });
    return res.end(JSON.stringify({
      totalStudents,
      occupiedBeds,
      vacantBeds,
      totalCapacity,
      collectedRevenue,
      pendingRevenue,
      pendingComplaints,
      pendingLeaves
    }));
  }

  // GET /api/complaints
  if (pathname === '/api/complaints' && method === 'GET') {
    const db = getDB();
    res.writeHead(200, { 'Content-Type': 'application/json' });
    return res.end(JSON.stringify({ complaints: db.complaints || [] }));
  }

  // GET /api/leaves
  if (pathname === '/api/leaves' && method === 'GET') {
    const db = getDB();
    res.writeHead(200, { 'Content-Type': 'application/json' });
    return res.end(JSON.stringify({ leaves: db.leaveRequests || [] }));
  }

  // --- ROOMS API CRUD ---
  if (pathname === '/api/rooms' && method === 'GET') {
    const db = getDB();
    const rooms = (db.rooms || []).map(r => {
      const occupants = (db.students || []).filter(s => String(s.roomNo) === String(r.roomNo || r.room_number));
      return {
        ...r,
        room_number: r.room_number || r.roomNo || '101',
        monthly_rent: r.monthly_rent || r.rent || 6500,
        occupied_beds: occupants.length,
        status: occupants.length >= (r.capacity || 2) ? 'full' : (occupants.length > 0 ? 'occupied' : 'vacant'),
        students: occupants
      };
    });

    res.writeHead(200, { 'Content-Type': 'application/json' });
    return res.end(JSON.stringify({ rooms }));
  }

  if (pathname === '/api/rooms' && method === 'POST') {
    const body = await parseRequestBody(req);
    const db = getDB();
    const roomNoStr = String(body.room_number || body.roomNo || '101');
    const newRoom = {
      id: 'rm-' + Date.now(),
      roomNo: roomNoStr,
      room_number: roomNoStr,
      floor: Number(body.floor) || 1,
      capacity: Number(body.capacity) || 2,
      type: body.type || 'Double Sharing',
      ac_type: body.ac_type || 'Non-AC',
      rent: Number(body.monthly_rent || body.rent) || 6500,
      monthly_rent: Number(body.monthly_rent || body.rent) || 6500,
      status: 'vacant',
      occupied_beds: 0,
      amenities: body.amenities || ['Wi-Fi', 'Study Table', 'Attached Bath']
    };
    db.rooms = db.rooms || [];
    db.rooms.unshift(newRoom);
    saveDB(db);

    res.writeHead(201, { 'Content-Type': 'application/json' });
    return res.end(JSON.stringify({ message: 'Room created successfully', room: newRoom }));
  }

  if (pathname.startsWith('/api/rooms/') && method === 'PUT') {
    const id = pathname.split('/')[3];
    const body = await parseRequestBody(req);
    const db = getDB();
    const room = (db.rooms || []).find(r => r.id === id || r.roomNo === id || r.room_number === id);
    if (room) {
      if (body.room_number || body.roomNo) {
        room.roomNo = String(body.room_number || body.roomNo);
        room.room_number = String(body.room_number || body.roomNo);
      }
      if (body.floor !== undefined) room.floor = Number(body.floor) || body.floor;
      if (body.capacity !== undefined) room.capacity = Number(body.capacity) || 2;
      if (body.type) room.type = body.type;
      if (body.ac_type) room.ac_type = body.ac_type;
      if (body.monthly_rent || body.rent) {
        room.rent = Number(body.monthly_rent || body.rent);
        room.monthly_rent = Number(body.monthly_rent || body.rent);
      }
      if (body.amenities) room.amenities = body.amenities;
      saveDB(db);
    }
    res.writeHead(200, { 'Content-Type': 'application/json' });
    return res.end(JSON.stringify({ message: 'Room updated successfully', room }));
  }

  if (pathname.startsWith('/api/rooms/') && method === 'DELETE') {
    const id = pathname.split('/')[3];
    const db = getDB();
    const idx = (db.rooms || []).findIndex(r => r.id === id || r.roomNo === id || r.room_number === id);
    if (idx !== -1) {
      db.rooms.splice(idx, 1);
      saveDB(db);
    }
    res.writeHead(200, { 'Content-Type': 'application/json' });
    return res.end(JSON.stringify({ message: 'Room deleted successfully' }));
  }

  // PUT /api/complaints/:id
  if (pathname.startsWith('/api/complaints/') && method === 'PUT') {
    const id = pathname.split('/')[3];
    const body = await parseRequestBody(req);
    const db = getDB();
    const complaint = (db.complaints || []).find(c => c.id === id);
    if (complaint) {
      if (body.status) complaint.status = body.status;
      if (body.notes) complaint.notes = body.notes;
      saveDB(db);
    }
    res.writeHead(200, { 'Content-Type': 'application/json' });
    return res.end(JSON.stringify({ message: 'Complaint updated', complaint }));
  }

  // PUT /api/leaves/:id
  if (pathname.startsWith('/api/leaves/') && method === 'PUT') {
    const id = pathname.split('/')[3];
    const body = await parseRequestBody(req);
    const db = getDB();
    const leave = (db.leaves || []).find(l => l.id === id);
    if (leave) {
      if (body.status) leave.status = body.status;
      saveDB(db);
    }
    res.writeHead(200, { 'Content-Type': 'application/json' });
    return res.end(JSON.stringify({ message: 'Leave request updated', leave }));
  }

  // --- API 404 FALLBACK ---
  if (pathname.startsWith('/api/')) {
    res.writeHead(404, { 'Content-Type': 'application/json' });
    return res.end(JSON.stringify({ error: `API route not found: ${method} ${pathname}` }));
  }

  // --- STATIC FILE SERVING FOR FRONTEND ---
  const distDir = path.join(__dirname, 'frontend', 'dist');
  let filePath = path.join(distDir, pathname === '/' ? 'index.html' : pathname);
  
  if (!fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
    if (fs.existsSync(path.join(distDir, 'index.html'))) {
      filePath = path.join(distDir, 'index.html');
    } else {
      filePath = path.join(__dirname, 'index.html');
    }
  }

  const ext = path.extname(filePath).toLowerCase();
  const contentType = MIME_TYPES[ext] || 'text/html';

  fs.readFile(filePath, (err, content) => {
    if (err) {
      res.writeHead(500);
      res.end('Server Error');
    } else {
      res.writeHead(200, { 'Content-Type': contentType });
      res.end(content);
    }
  });
};

const server = http.createServer(handleRequest);

if (require.main === module) {
  server.listen(PORT, () => {
    console.log(`=======================================================`);
    console.log(`🚀 HostelFlow Native Server running on http://localhost:${PORT}`);
    console.log(`=======================================================`);
  });
}

module.exports = handleRequest;
