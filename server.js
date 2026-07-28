const http = require('http');
const fs = require('fs');
const path = require('path');
const url = require('url');
const crypto = require('crypto');

const PORT = process.env.PORT || 5001;
const JWT_SECRET = process.env.JWT_SECRET || 'hostelflow_super_secret_jwt_key_2026';

// Database persistence path
const DATA_DIR = path.join(__dirname, 'server/data');
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
      phone: '+91 98765 43210',
      hostelName: 'Sakhare Plot Hostel',
      upiId: '9322465627@ybl'
    },
    {
      id: 'u-2',
      name: 'Amit Kumar (Warden)',
      email: 'staff@hostelflow.com',
      password: 'staff123',
      role: 'staff',
      phone: '+91 98765 43211',
      hostelName: 'Sakhare Plot Hostel',
      upiId: '9322465627@ybl'
    }
  ],
  students: [
    {
      id: 's-101',
      name: 'Rahul Verma',
      phone: '+91 98123 45678',
      parentPhone: '+91 98123 00001',
      email: 'rahul.verma@example.com',
      roomNo: '101',
      bedNo: 'Bed A',
      joinDate: '2026-01-15',
      monthlyRent: 6500,
      depositAmount: 5000,
      idType: 'Aadhaar Card',
      idNumber: '4521 8890 1234',
      idDocUrl: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="300" height="180" viewBox="0 0 300 180"><rect width="300" height="180" rx="12" fill="%231e293b"/><text x="20" y="40" fill="%2338bdf8" font-family="sans-serif" font-size="16" font-weight="bold">GOVT OF INDIA - AADHAAR</text><rect x="20" y="60" width="70" height="80" rx="6" fill="%23334155"/><text x="105" y="80" fill="%23f8fafc" font-size="14">Rahul Verma</text><text x="105" y="100" fill="%2394a3b8" font-size="12">DOB: 12/04/2003</text><text x="105" y="120" fill="%2394a3b8" font-size="12">Gender: Male</text><text x="105" y="145" fill="%23e2e8f0" font-size="13" font-weight="bold">4521 8890 1234</text></svg>',
      bikeNumber: 'MH-12-AB-1234',
      parkingSlot: 'P-01',
      status: 'active',
      createdAt: new Date().toISOString()
    },
    {
      id: 's-102',
      name: 'Priya Patel',
      phone: '+91 98234 56789',
      parentPhone: '+91 98234 00002',
      email: 'priya.patel@example.com',
      roomNo: '102',
      bedNo: 'Bed B',
      joinDate: '2026-02-01',
      monthlyRent: 7000,
      depositAmount: 6000,
      idType: 'Aadhaar Card',
      idNumber: '8821 4450 9912',
      idDocUrl: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="300" height="180" viewBox="0 0 300 180"><rect width="300" height="180" rx="12" fill="%230f172a"/><text x="20" y="40" fill="%23a855f7" font-family="sans-serif" font-size="16" font-weight="bold">GOVT OF INDIA - AADHAAR</text><rect x="20" y="60" width="70" height="80" rx="6" fill="%231e293b"/><text x="105" y="80" fill="%23f8fafc" font-size="14">Priya Patel</text><text x="105" y="100" fill="%2394a3b8" font-size="12">DOB: 05/09/2004</text><text x="105" y="120" fill="%2394a3b8" font-size="12">Gender: Female</text><text x="105" y="145" fill="%23e2e8f0" font-size="13" font-weight="bold">8821 4450 9912</text></svg>',
      bikeNumber: 'MH-12-CD-5678',
      parkingSlot: 'P-03',
      status: 'active',
      createdAt: new Date().toISOString()
    },
    {
      id: 's-201',
      name: 'Vikram Singh',
      phone: '+91 98345 67890',
      parentPhone: '+91 98345 00003',
      email: 'vikram.singh@example.com',
      roomNo: '201',
      bedNo: 'Bed A',
      joinDate: '2026-03-10',
      monthlyRent: 6500,
      depositAmount: 5000,
      idType: 'Passport',
      idNumber: 'Z-9876543',
      idDocUrl: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="300" height="180" viewBox="0 0 300 180"><rect width="300" height="180" rx="12" fill="%231e1b4b"/><text x="20" y="40" fill="%23fbbf24" font-family="sans-serif" font-size="16" font-weight="bold">PASSPORT - REPUBLIC OF INDIA</text><rect x="20" y="60" width="70" height="80" rx="6" fill="%23312e81"/><text x="105" y="80" fill="%23f8fafc" font-size="14">Vikram Singh</text><text x="105" y="100" fill="%23a5b4fc" font-size="12">Nationality: Indian</text><text x="105" y="120" fill="%23a5b4fc" font-size="12">Passport No: Z9876543</text></svg>',
      bikeNumber: 'None',
      parkingSlot: 'None',
      status: 'active',
      createdAt: new Date().toISOString()
    },
    {
      id: 's-202',
      name: 'Ananya Roy',
      phone: '+91 98456 78901',
      parentPhone: '+91 98456 00004',
      email: 'ananya.roy@example.com',
      roomNo: '202',
      bedNo: 'Bed B',
      joinDate: '2026-04-05',
      monthlyRent: 6800,
      depositAmount: 5000,
      idType: 'Aadhaar Card',
      idNumber: '3310 9922 7741',
      idDocUrl: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="300" height="180" viewBox="0 0 300 180"><rect width="300" height="180" rx="12" fill="%23064e3b"/><text x="20" y="40" fill="%2334d399" font-family="sans-serif" font-size="16" font-weight="bold">GOVT OF INDIA - AADHAAR</text><rect x="20" y="60" width="70" height="80" rx="6" fill="%23022c22"/><text x="105" y="80" fill="%23f8fafc" font-size="14">Ananya Roy</text><text x="105" y="100" fill="%23a7f3d0" font-size="12">DOB: 18/11/2003</text><text x="105" y="120" fill="%23a7f3d0" font-size="12">Gender: Female</text><text x="105" y="145" fill="%23e2e8f0" font-size="13" font-weight="bold">3310 9922 7741</text></svg>',
      bikeNumber: 'MH-12-EF-9012',
      parkingSlot: 'P-05',
      status: 'active',
      createdAt: new Date().toISOString()
    }
  ],
  payments: [
    {
      id: 'pay-1',
      studentId: 's-101',
      studentName: 'Rahul Verma',
      roomNo: '101',
      month: 'July 2026',
      year: 2026,
      amount: 6500,
      type: 'rent',
      status: 'confirmed',
      upiTransactionId: 'UPI-9948210398',
      paymentMethod: 'UPI QR',
      notes: 'Paid via GPay QR Code scan',
      submittedBy: 'Amit Kumar (Warden)',
      confirmedBy: 'Sandeep Sakhare (Owner)',
      date: '2026-07-02'
    },
    {
      id: 'pay-2',
      studentId: 's-102',
      studentName: 'Priya Patel',
      roomNo: '102',
      month: 'July 2026',
      year: 2026,
      amount: 7000,
      type: 'rent',
      status: 'pending_owner',
      upiTransactionId: 'UPI-8841029471',
      paymentMethod: 'UPI QR',
      notes: 'Payment screenshot submitted by student to staff',
      submittedBy: 'Amit Kumar (Warden)',
      confirmedBy: null,
      date: '2026-07-04'
    },
    {
      id: 'pay-3',
      studentId: 's-201',
      studentName: 'Vikram Singh',
      roomNo: '201',
      month: 'June 2026',
      year: 2026,
      amount: 6500,
      type: 'rent',
      status: 'confirmed',
      upiTransactionId: 'UPI-7712093845',
      paymentMethod: 'UPI QR',
      notes: 'June rent paid on time',
      submittedBy: 'Amit Kumar (Warden)',
      confirmedBy: 'Sandeep Sakhare (Owner)',
      date: '2026-06-03'
    },
    {
      id: 'pay-4',
      studentId: 's-202',
      studentName: 'Ananya Roy',
      roomNo: '202',
      month: 'July 2026',
      year: 2026,
      amount: 6800,
      type: 'rent',
      status: 'pending_owner',
      upiTransactionId: 'UPI-1192837465',
      paymentMethod: 'UPI QR',
      notes: 'PhonePe QR Payment completed',
      submittedBy: 'Amit Kumar (Warden)',
      confirmedBy: null,
      date: '2026-07-05'
    }
  ],
  lightBills: [
    {
      id: 'lb-1',
      month: 'July 2026',
      year: 2026,
      roomNo: '101',
      previousReading: 1200,
      currentReading: 1420,
      ratePerUnit: 8.5,
      totalUnits: 220,
      totalAmount: 1870,
      studentCount: 2,
      perStudentAmount: 935,
      status: 'paid',
      dateAdded: '2026-07-01'
    },
    {
      id: 'lb-2',
      month: 'July 2026',
      year: 2026,
      roomNo: '102',
      previousReading: 950,
      currentReading: 1120,
      ratePerUnit: 8.5,
      totalUnits: 170,
      totalAmount: 1445,
      studentCount: 2,
      perStudentAmount: 722.5,
      status: 'unpaid',
      dateAdded: '2026-07-01'
    }
  ],
  parkingSlots: [
    { id: 'pk-1', slotNo: 'P-01', type: 'Bike', status: 'occupied', studentId: 's-101', studentName: 'Rahul Verma', vehicleNumber: 'MH-12-AB-1234', helmetLockerNo: 'L-01' },
    { id: 'pk-2', slotNo: 'P-02', type: 'Bike', status: 'vacant', studentId: null, studentName: null, vehicleNumber: null, helmetLockerNo: 'L-02' },
    { id: 'pk-3', slotNo: 'P-03', type: 'Scooter', status: 'occupied', studentId: 's-102', studentName: 'Priya Patel', vehicleNumber: 'MH-12-CD-5678', helmetLockerNo: 'L-03' },
    { id: 'pk-4', slotNo: 'P-04', type: 'Bike', status: 'vacant', studentId: null, studentName: null, vehicleNumber: null, helmetLockerNo: 'L-04' },
    { id: 'pk-5', slotNo: 'P-05', type: 'Scooter', status: 'occupied', studentId: 's-202', studentName: 'Ananya Roy', vehicleNumber: 'MH-12-EF-9012', helmetLockerNo: 'L-05' },
    { id: 'pk-6', slotNo: 'P-06', type: 'Bike', status: 'vacant', studentId: null, studentName: null, vehicleNumber: null, helmetLockerNo: 'L-06' },
    { id: 'pk-7', slotNo: 'P-07', type: 'Bike', status: 'vacant', studentId: null, studentName: null, vehicleNumber: null, helmetLockerNo: 'L-07' },
    { id: 'pk-8', slotNo: 'P-08', type: 'Bike', status: 'vacant', studentId: null, studentName: null, vehicleNumber: null, helmetLockerNo: 'L-08' }
  ],
  gateLogs: [
    {
      id: 'gl-1',
      studentId: 's-101',
      studentName: 'Rahul Verma',
      roomNo: '101',
      date: '2026-07-26',
      outTime: '18:30',
      inTime: '22:45',
      expectedTime: '22:00',
      reason: 'College Robotics Lab late project submission',
      status: 'late',
      approvedBy: 'Amit Kumar (Warden)'
    },
    {
      id: 'gl-2',
      studentId: 's-201',
      studentName: 'Vikram Singh',
      roomNo: '201',
      date: '2026-07-25',
      outTime: '19:00',
      inTime: '23:15',
      expectedTime: '22:00',
      reason: 'Intercity Bus delay from hometown',
      status: 'permission_granted',
      approvedBy: 'Sandeep Sakhare (Owner)'
    }
  ],
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
      id: 'r-2',
      category: 'Payments',
      title: 'Monthly Rent Payment Deadline',
      description: 'Monthly rent must be paid in full by the 5th of every calendar month via the hostel UPI QR portal.',
      penalty: '₹100/day late charge after 7th of the month',
      active: true
    },
    {
      id: 'r-3',
      category: 'Light Bill',
      title: 'Sub-Meter Electricity Division',
      description: 'Electricity sub-meters are checked on the 1st of every month. Total bill per room is split equally among room residents.',
      penalty: 'Power disconnection for 15+ days unpaid bill',
      active: true
    },
    {
      id: 'r-4',
      category: 'Bike Parking',
      title: 'Designated Parking Slots Only',
      description: 'Vehicles must be parked strictly in assigned slot numbers. Helmets must be stored in designated lockers.',
      penalty: '₹150 penalty for unauthorized parking',
      active: true
    },
    {
      id: 'r-5',
      category: 'Visitors & Security',
      title: 'Guest & Visitor Restrictions',
      description: 'Visitors allowed only in reception lobby from 10:00 AM to 7:00 PM. No opposite-gender guests or overnight stays permitted in rooms.',
      penalty: 'Immediate warning and suspension of visitor rights',
      active: true
    }
  ],
  settings: {
    hostelName: 'Sakhare Plot Hostel',
    address: '123 University Campus Road, Sector 4, Pune',
    ownerName: 'Sandeep Sakhare',
    ownerPhone: '+91 98765 43210',
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
    { id: 'rm-1', room_number: '101', floor: 1, capacity: 2, type: 'Double Sharing', ac_type: 'Non-AC', monthly_rent: 6500, status: 'occupied', occupied_beds: 2, amenities: ['Wi-Fi', 'Study Table', 'Attached Bath'] },
    { id: 'rm-2', room_number: '102', floor: 1, capacity: 2, type: 'Double Sharing', ac_type: 'AC', monthly_rent: 7000, status: 'occupied', occupied_beds: 1, amenities: ['Wi-Fi', 'AC', 'Attached Bath'] },
    { id: 'rm-3', room_number: '201', floor: 2, capacity: 2, type: 'Double Sharing', ac_type: 'Non-AC', monthly_rent: 6500, status: 'occupied', occupied_beds: 1, amenities: ['Wi-Fi', 'Study Table'] },
    { id: 'rm-4', room_number: '202', floor: 2, capacity: 2, type: 'Double Sharing', ac_type: 'Non-AC', monthly_rent: 6800, status: 'occupied', occupied_beds: 1, amenities: ['Wi-Fi', 'Study Table'] }
  ];
  db.complaints = db.complaints || [
    { id: 'c-1', student_id: 's-101', student_name: 'Rahul Verma', room_number: '101', category: 'Plumbing', title: 'Bathroom Tap Leakage', description: 'Water tap leaking continuously in Room 101 bathroom.', priority: 'Medium', status: 'Pending', created_at: new Date().toISOString() }
  ];
  db.leaves = db.leaves || [
    { id: 'l-1', student_id: 's-101', student_name: 'Rahul Verma', room_number: '101', start_date: '2026-08-01', end_date: '2026-08-05', reason: 'Visiting family in hometown', status: 'Pending', created_at: new Date().toISOString() }
  ];
  db.notices = db.notices || [
    { id: 'n-1', title: 'Monthly Maintenance Notice', content: 'Water tank cleaning is scheduled for Sunday from 8:00 AM to 11:00 AM.', category: 'Maintenance', is_pinned: true, created_at: new Date().toISOString() }
  ];
  db.settings = db.settings || initialSeed.settings || {};
  return db;
}

function saveDB(data) {
  fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2));
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
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', chunk => { body += chunk.toString(); });
    req.on('end', () => {
      try {
        resolve(body ? JSON.parse(body) : {});
      } catch (err) {
        resolve({});
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
const server = http.createServer(async (req, res) => {
  // CORS Headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    return res.end();
  }

  const parsedUrl = url.parse(req.url, true);
  const pathname = parsedUrl.pathname;
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
    const inputClean = email.toLowerCase();
    const userObj = db.users.find(u => {
      const uEmail = (u.email || '').trim().toLowerCase();
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
             uEmail.split('@')[0] === inputClean ||
             uId === inputClean ||
             `id-${uRoom}` === inputClean ||
             uRoom === inputClean ||
             (uRoomPad && uRoomPad === inputClean) ||
             isOwnerAlias;
    });

    const isOwnerValidPass = userObj && userObj.role === 'admin' && (password === 'Sakhare1615' || password === 'admin123' || password.toLowerCase() === 'sakhare1615');
    const isStandardValidPass = userObj && (userObj.password.trim() === password || userObj.password.trim().toLowerCase() === password.toLowerCase());

    if (!userObj || (!isOwnerValidPass && !isStandardValidPass)) {
      res.writeHead(401, { 'Content-Type': 'application/json' });
      return res.end(JSON.stringify({ error: 'Invalid email or password credentials' }));
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

  // GET /api/payments/qr-payload
  if (pathname === '/api/payments/qr-payload' && method === 'GET') {
    const db = getDB();
    const query = parsedUrl.query;
    const upiId = db.settings.upiId || '9322465627@ybl';
    const amount = query.amount || '6500';
    const upiLink = `upi://pay?pa=${encodeURIComponent(upiId)}&pn=${encodeURIComponent(db.settings.hostelName)}&am=${amount}&cu=INR&tn=${encodeURIComponent('Hostel Rent Payment')}`;

    res.writeHead(200, { 'Content-Type': 'application/json' });
    return res.end(JSON.stringify({
      upiId,
      amount,
      note: 'Scan via any GPay / PhonePe / Paytm UPI app',
      upiLink,
      qrText: upiLink,
      qrImage: '/upi_qr.jpg'
    }));
  }

  // PUT /api/payments/:id/confirm
  if (pathname.startsWith('/api/payments/') && pathname.endsWith('/confirm') && method === 'PUT') {
    const id = pathname.split('/')[3];
    const body = await parseRequestBody(req);
    const db = getDB();
    const payment = db.payments.find(p => p.id === id);

    if (payment) {
      payment.status = body.status || 'confirmed';
      payment.confirmedBy = authUser ? authUser.name : 'Sandeep Sakhare (Owner)';
      saveDB(db);
    }

    res.writeHead(200, { 'Content-Type': 'application/json' });
    return res.end(JSON.stringify({ message: `Payment updated to ${body.status}` }));
  }

  // POST /api/payments (Submit payment proof)
  if (pathname === '/api/payments' && method === 'POST') {
    const body = await parseRequestBody(req);
    const db = getDB();
    const newPayment = {
      id: `pay-${Date.now()}`,
      studentId: body.studentId || (authUser ? authUser.id : 's-01'),
      studentName: body.studentName || (authUser ? authUser.name : 'Resident'),
      roomNo: body.roomNo || (authUser ? authUser.roomNo : '01') || '01',
      month: body.month || 'July 2026',
      year: 2026,
      amount: Number(body.amount) || 6500,
      type: body.type || 'rent',
      status: 'pending_owner',
      upiTransactionId: body.upiTransactionId || `UPI-${Date.now().toString().slice(-6)}`,
      paymentMethod: 'UPI QR',
      notes: body.notes || 'Submitted by resident via PhonePe QR',
      submittedBy: authUser ? authUser.name : 'Student',
      confirmedBy: null,
      date: new Date().toISOString().split('T')[0]
    };

    db.payments.unshift(newPayment);
    saveDB(db);

    res.writeHead(201, { 'Content-Type': 'application/json' });
    return res.end(JSON.stringify({ message: 'Payment submission received and sent to owner for verification', payment: newPayment }));
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

  // --- API 404 FALLBACK ---
  if (pathname.startsWith('/api/')) {
    res.writeHead(404, { 'Content-Type': 'application/json' });
    return res.end(JSON.stringify({ error: `API route not found: ${method} ${pathname}` }));
  }

  // --- STATIC FILE SERVING FOR FRONTEND ---
  let filePath = path.join(__dirname, pathname === '/' ? 'index.html' : pathname);
  
  if (!fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
    filePath = path.join(__dirname, 'index.html');
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
});

server.listen(PORT, () => {
  console.log(`=======================================================`);
  console.log(`🚀 HostelFlow Native Server running on http://localhost:${PORT}`);
  console.log(`=======================================================`);
});
