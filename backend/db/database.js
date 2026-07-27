const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const bcrypt = require('bcryptjs');

const dbPath = path.resolve(__dirname, 'hostel.db');
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Error connecting to SQLite database:', err.message);
  } else {
    console.log('Connected to SQLite database at:', dbPath);
  }
});

// Helper for promises
db.asyncRun = function (sql, params = []) {
  return new Promise((resolve, reject) => {
    this.run(sql, params, function (err) {
      if (err) reject(err);
      else resolve(this);
    });
  });
};

db.asyncAll = function (sql, params = []) {
  return new Promise((resolve, reject) => {
    this.all(sql, params, (err, rows) => {
      if (err) reject(err);
      else resolve(rows);
    });
  });
};

db.asyncGet = function (sql, params = []) {
  return new Promise((resolve, reject) => {
    this.get(sql, params, (err, row) => {
      if (err) reject(err);
      else resolve(row);
    });
  });
};

async function initDb() {
  db.serialize(async () => {
    // 1. Create Users table
    db.run(`
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        email TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        role TEXT CHECK(role IN ('owner', 'student')) NOT NULL DEFAULT 'student',
        phone TEXT,
        room_id INTEGER,
        bed_number INTEGER,
        monthly_rent REAL DEFAULT 6500,
        rent_due_date TEXT DEFAULT '05th of every month',
        guardian_name TEXT,
        guardian_phone TEXT,
        address TEXT,
        status TEXT DEFAULT 'active',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // 2. Create Rooms table
    db.run(`
      CREATE TABLE IF NOT EXISTS rooms (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        room_number TEXT UNIQUE NOT NULL,
        floor INTEGER NOT NULL,
        capacity INTEGER NOT NULL DEFAULT 2,
        type TEXT DEFAULT 'Double Sharing',
        ac_type TEXT DEFAULT 'Non-AC',
        monthly_rent REAL NOT NULL DEFAULT 6500,
        amenities TEXT DEFAULT '["Wi-Fi", "Study Table", "Attached Bath", "Balcony"]',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // 3. Create Settings Table for Owner (Sandeep Sakhare) UPI QR Code Config
    db.run(`
      CREATE TABLE IF NOT EXISTS settings (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        owner_name TEXT DEFAULT 'Sandeep Sakhare',
        upi_id TEXT DEFAULT '9322465627@ybl',
        account_holder TEXT DEFAULT 'Sandeep Sakhare',
        qr_code_url TEXT DEFAULT '/sandeep_qr.jpg',
        hostel_name TEXT DEFAULT 'Sakhare Plot Hostel',
        hostel_phone TEXT DEFAULT '+91 89835 35847',
        hostel_address TEXT DEFAULT 'Plot No. 14, Main Road, Block A, City Center',
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // 4. Create Payments Table with UTR & Verification Workflow
    db.run(`
      CREATE TABLE IF NOT EXISTS payments (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        student_id INTEGER NOT NULL,
        amount REAL NOT NULL,
        month_year TEXT NOT NULL,
        payment_date TEXT,
        payment_method TEXT DEFAULT 'UPI QR',
        transaction_id TEXT,
        utr_number TEXT,
        payment_app TEXT DEFAULT 'GPay / PhonePe',
        proof_url TEXT,
        status TEXT CHECK(status IN ('Paid', 'Pending Verification', 'Pending', 'Overdue', 'Rejected')) NOT NULL DEFAULT 'Pending',
        receipt_number TEXT UNIQUE,
        admin_note TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(student_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `);

    // 5. Create Complaints table
    db.run(`
      CREATE TABLE IF NOT EXISTS complaints (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        student_id INTEGER NOT NULL,
        category TEXT NOT NULL,
        priority TEXT CHECK(priority IN ('Low', 'Medium', 'High', 'Emergency')) DEFAULT 'Medium',
        title TEXT NOT NULL,
        description TEXT NOT NULL,
        status TEXT CHECK(status IN ('Pending', 'In Progress', 'Resolved')) DEFAULT 'Pending',
        admin_response TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(student_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `);

    // 6. Create Leave Requests table
    db.run(`
      CREATE TABLE IF NOT EXISTS leave_requests (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        student_id INTEGER NOT NULL,
        start_date TEXT NOT NULL,
        end_date TEXT NOT NULL,
        reason TEXT NOT NULL,
        destination TEXT NOT NULL,
        emergency_contact TEXT NOT NULL,
        status TEXT CHECK(status IN ('Pending', 'Approved', 'Rejected')) DEFAULT 'Pending',
        admin_remark TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(student_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `);

    // 7. Create Notices table
    db.run(`
      CREATE TABLE IF NOT EXISTS notices (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL,
        content TEXT NOT NULL,
        category TEXT DEFAULT 'General',
        is_pinned INTEGER DEFAULT 0,
        created_by TEXT DEFAULT 'Sandeep Sakhare (Owner)',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Clean Production Initialization
    setTimeout(async () => {
      try {
        // 1. Ensure Settings row exists
        const settingsCount = await db.asyncGet(`SELECT COUNT(*) as count FROM settings`);
        if (settingsCount.count === 0) {
          await db.asyncRun(`
            INSERT INTO settings (owner_name, upi_id, account_holder, qr_code_url, hostel_name, hostel_phone, hostel_address)
            VALUES ('Sandeep Sakhare', '9322465627@ybl', 'Sandeep Sakhare', '/sandeep_qr.jpg', 'Sakhare Plot Hostel', '+91 89835 35847', 'Plot No. 14, Main Road, Block A, City Center')
          `);
        } else {
          await db.asyncRun(`UPDATE settings SET owner_name = 'Sandeep Sakhare', upi_id = '9322465627@ybl', qr_code_url = '/sandeep_qr.jpg', hostel_phone = '+91 89835 35847'`);
        }

        // 2. Seed initial rooms ONLY if rooms table is completely empty
        const roomCount = await db.asyncGet(`SELECT COUNT(*) as count FROM rooms`);
        if (roomCount.count === 0) {
          const defaultRooms = [
            { num: '101', floor: 1, cap: 2, type: 'Double Sharing', ac: 'AC', rent: 7500 },
            { num: '102', floor: 1, cap: 3, type: 'Triple Sharing', ac: 'Non-AC', rent: 6000 },
            { num: '103', floor: 1, cap: 2, type: 'Double Sharing', ac: 'Non-AC', rent: 6500 },
            { num: '104', floor: 1, cap: 2, type: 'Double Sharing', ac: 'AC', rent: 7500 },
            { num: '105', floor: 2, cap: 3, type: 'Triple Sharing', ac: 'Non-AC', rent: 6000 },
            { num: '106', floor: 2, cap: 4, type: 'Four Sharing', ac: 'Non-AC', rent: 5500 },
            { num: '107', floor: 2, cap: 2, type: 'Double Sharing', ac: 'AC', rent: 8000 },
            { num: '108', floor: 3, cap: 2, type: 'Single Deluxe', ac: 'AC', rent: 10000 },
          ];

          for (const r of defaultRooms) {
            await db.asyncRun(
              `INSERT INTO rooms (room_number, floor, capacity, type, ac_type, monthly_rent) VALUES (?, ?, ?, ?, ?, ?)`,
              [r.num, r.floor, r.cap, r.type, r.ac, r.rent]
            );
          }
        }

        // 3. Ensure Owner Sandeep Sakhare exists
        const hashedOwnerPass = await bcrypt.hash('admin123', 10);
        const ownerExists = await db.asyncGet('SELECT id FROM users WHERE role = "owner"');
        if (!ownerExists) {
          await db.asyncRun(
            `INSERT INTO users (name, email, password, role, phone, address) VALUES (?, ?, ?, 'owner', '+91 89835 35847', 'Sakhare Plot, Main Road, Block A')`,
            ['Sandeep Sakhare (Owner)', 'sandeep@sakharehostel.com', hashedOwnerPass]
          );
        } else {
          await db.asyncRun(
            `UPDATE users SET name = 'Sandeep Sakhare (Owner)', email = 'sandeep@sakharehostel.com', password = ?, phone = '+91 89835 35847' WHERE role = 'owner'`,
            [hashedOwnerPass]
          );
        }

        console.log('Production Database initialized successfully!');
      } catch (e) {
        console.error('Error initializing production database:', e);
      }
    }, 500);
  });
}

initDb();

module.exports = db;
