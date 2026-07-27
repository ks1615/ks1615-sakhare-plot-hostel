const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');

// File DB fallback setup
const DATA_DIR = path.join(__dirname, '../data');
const DB_FILE = path.join(DATA_DIR, 'db.json');

let useMongo = false;

// Mongoose Schemas (if MongoDB is connected)
const UserSchema = new mongoose.Schema({
  id: String,
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['admin', 'staff'], default: 'staff' },
  phone: String,
  hostelName: { type: String, default: 'Sakhare Plot Hostel' },
  upiId: { type: String, default: '9322465627@ybl' },
  createdAt: { type: Date, default: Date.now }
});

const StudentSchema = new mongoose.Schema({
  id: String,
  name: { type: String, required: true },
  phone: { type: String, required: true },
  parentPhone: String,
  email: String,
  roomNo: { type: String, required: true },
  bedNo: { type: String, required: true },
  joinDate: { type: String, required: true }, // YYYY-MM-DD
  monthlyRent: { type: Number, required: true },
  depositAmount: { type: Number, default: 5000 },
  idType: { type: String, default: 'Aadhaar Card' },
  idNumber: String,
  idDocUrl: String, // Base64 or URL
  bikeNumber: String,
  parkingSlot: String,
  status: { type: String, enum: ['active', 'vacated'], default: 'active' },
  createdAt: { type: Date, default: Date.now }
});

const PaymentSchema = new mongoose.Schema({
  id: String,
  studentId: { type: String, required: true },
  studentName: String,
  roomNo: String,
  month: { type: String, required: true }, // e.g. "July 2026"
  year: Number,
  amount: { type: Number, required: true },
  type: { type: String, enum: ['rent', 'light_bill', 'deposit', 'fine'], default: 'rent' },
  status: { type: String, enum: ['pending_owner', 'confirmed', 'rejected'], default: 'pending_owner' },
  upiTransactionId: String,
  paymentMethod: { type: String, default: 'UPI QR' },
  notes: String,
  receiptUrl: String,
  submittedBy: String,
  confirmedBy: String,
  date: { type: String, default: () => new Date().toISOString().split('T')[0] },
  createdAt: { type: Date, default: Date.now }
});

const LightBillSchema = new mongoose.Schema({
  id: String,
  month: { type: String, required: true },
  year: { type: Number, required: true },
  roomNo: { type: String, required: true },
  previousReading: { type: Number, required: true },
  currentReading: { type: Number, required: true },
  ratePerUnit: { type: Number, default: 8.5 },
  totalUnits: Number,
  totalAmount: Number,
  studentCount: { type: Number, default: 2 },
  perStudentAmount: Number,
  status: { type: String, enum: ['unpaid', 'partially_paid', 'paid'], default: 'unpaid' },
  dateAdded: { type: String, default: () => new Date().toISOString().split('T')[0] }
});

const ParkingSlotSchema = new mongoose.Schema({
  id: String,
  slotNo: { type: String, required: true },
  type: { type: String, default: 'Bike' },
  status: { type: String, enum: ['occupied', 'vacant', 'maintenance'], default: 'vacant' },
  studentId: String,
  studentName: String,
  vehicleNumber: String,
  helmetLockerNo: String
});

const GateLogSchema = new mongoose.Schema({
  id: String,
  studentId: String,
  studentName: { type: String, required: true },
  roomNo: { type: String, required: true },
  date: { type: String, required: true },
  outTime: String,
  inTime: { type: String, required: true },
  expectedTime: { type: String, default: '22:00' },
  reason: { type: String, required: true },
  status: { type: String, enum: ['on_time', 'late', 'permission_granted'], default: 'late' },
  approvedBy: String
});

const RuleSchema = new mongoose.Schema({
  id: String,
  category: { type: String, required: true },
  title: { type: String, required: true },
  description: { type: String, required: true },
  penalty: String,
  active: { type: Boolean, default: true }
});

const SettingsSchema = new mongoose.Schema({
  id: { type: String, default: 'global' },
  hostelName: { type: String, default: 'Sakhare Plot Hostel' },
  address: { type: String, default: '123 University Campus Road, Sector 4, Pune' },
  ownerName: { type: String, default: 'Sandeep Sakhare' },
  ownerPhone: { type: String, default: '+91 98765 43210' },
  upiId: { type: String, default: '9322465627@ybl' },
  gateClosingTime: { type: String, default: '22:00' },
  gateStatus: { type: String, enum: ['OPEN', 'CLOSED'], default: 'OPEN' },
  perUnitLightRate: { type: Number, default: 8.5 },
  monthlyRentDefault: { type: Number, default: 6500 }
});

// Seed data generator for memory/JSON DB
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
    },
    { id: 'u-room01', name: 'Rahul Verma (Room 01)', email: 'room01', password: 'ONEROOM', role: 'student', roomNo: '01', phone: '+91 98123 45678', hostelName: 'Sakhare Plot Hostel', upiId: '9322465627@ybl' },
    { id: 'u-room02', name: 'Priya Patel (Room 02)', email: 'room02', password: 'TWOROOM', role: 'student', roomNo: '02', phone: '+91 98234 56789', hostelName: 'Sakhare Plot Hostel', upiId: '9322465627@ybl' },
    { id: 'u-room03', name: 'Vikram Singh (Room 03)', email: 'room03', password: 'THREEROOM', role: 'student', roomNo: '03', phone: '+91 98345 67890', hostelName: 'Sakhare Plot Hostel', upiId: '9322465627@ybl' },
    { id: 'u-room04', name: 'Ananya Roy (Room 04)', email: 'room04', password: 'FOURROOM', role: 'student', roomNo: '04', phone: '+91 98456 78901', hostelName: 'Sakhare Plot Hostel', upiId: '9322465627@ybl' },
    { id: 'u-room05', name: 'Aditya Kulkarni (Room 05)', email: 'room05', password: 'FIVEROOM', role: 'student', roomNo: '05', phone: '+91 98567 89012', hostelName: 'Sakhare Plot Hostel', upiId: '9322465627@ybl' },
    { id: 'u-room06', name: 'Sneha Deshmukh (Room 06)', email: 'room06', password: 'SIXROOM', role: 'student', roomNo: '06', phone: '+91 98678 90123', hostelName: 'Sakhare Plot Hostel', upiId: '9322465627@ybl' },
    { id: 'u-room07', name: 'Tanmay Joshi (Room 07)', email: 'room07', password: 'SEVENROOM', role: 'student', roomNo: '07', phone: '+91 98789 01234', hostelName: 'Sakhare Plot Hostel', upiId: '9322465627@ybl' },
    { id: 'u-room08', name: 'Pooja Patil (Room 08)', email: 'room08', password: 'EIGHTROOM', role: 'student', roomNo: '08', phone: '+91 98890 12345', hostelName: 'Sakhare Plot Hostel', upiId: '9322465627@ybl' }
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

// In-Memory DB Helper
const getMemoryDB = () => {
  try {
    const raw = fs.readFileSync(DB_FILE, 'utf8');
    return JSON.parse(raw);
  } catch (err) {
    return initialSeed;
  }
};

const saveMemoryDB = (data) => {
  fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2));
};

module.exports = {
  User: mongoose.model('User', UserSchema),
  Student: mongoose.model('Student', StudentSchema),
  Payment: mongoose.model('Payment', PaymentSchema),
  LightBill: mongoose.model('LightBill', LightBillSchema),
  ParkingSlot: mongoose.model('ParkingSlot', ParkingSlotSchema),
  GateLog: mongoose.model('GateLog', GateLogSchema),
  Rule: mongoose.model('Rule', RuleSchema),
  Settings: mongoose.model('Settings', SettingsSchema),
  getMemoryDB,
  saveMemoryDB,
  isMongoConnected: () => useMongo,
  setMongoConnected: (val) => { useMongo = val; }
};
