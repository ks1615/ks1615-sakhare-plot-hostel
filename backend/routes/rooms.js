const express = require('express');
const router = express.Router();
const db = require('../db/database');
const { authenticateToken, requireRole } = require('../middleware/authMiddleware');

// GET /api/rooms - List all rooms with bed allocations
router.get('/', authenticateToken, async (req, res) => {
  try {
    const rooms = await db.asyncAll(`SELECT * FROM rooms ORDER BY room_number ASC`);
    
    // Fetch occupants for each room
    const roomsWithOccupants = await Promise.all(
      rooms.map(async (room) => {
        const occupants = await db.asyncAll(
          `SELECT id, name, email, phone, bed_number, monthly_rent FROM users WHERE room_id = ? AND role = 'student' AND status = 'active'`,
          [room.id]
        );
        let parsedAmenities = [];
        try {
          parsedAmenities = typeof room.amenities === 'string' ? JSON.parse(room.amenities) : room.amenities;
        } catch (e) {
          parsedAmenities = ['Wi-Fi', 'Study Table'];
        }
        return {
          ...room,
          amenities: parsedAmenities,
          occupied_beds: occupants.length,
          vacant_beds: Math.max(0, room.capacity - occupants.length),
          occupants
        };
      })
    );

    res.json({ rooms: roomsWithOccupants });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/rooms - Create a new room (Owner only)
router.post('/', authenticateToken, requireRole('owner'), async (req, res) => {
  const { room_number, floor, capacity, type, ac_type, monthly_rent, amenities } = req.body;

  if (!room_number || !floor || !capacity) {
    return res.status(400).json({ error: 'Room number, floor, and capacity are required' });
  }

  try {
    const existing = await db.asyncGet('SELECT id FROM rooms WHERE room_number = ?', [room_number]);
    if (existing) {
      return res.status(400).json({ error: `Room ${room_number} already exists` });
    }

    const amenitiesJson = JSON.stringify(amenities || ['Wi-Fi', 'Study Table', 'Attached Bath']);
    const result = await db.asyncRun(
      `INSERT INTO rooms (room_number, floor, capacity, type, ac_type, monthly_rent, amenities)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        room_number,
        parseInt(floor),
        parseInt(capacity),
        type || 'Double Sharing',
        ac_type || 'Non-AC',
        parseFloat(monthly_rent || 6500),
        amenitiesJson
      ]
    );

    const newRoom = await db.asyncGet('SELECT * FROM rooms WHERE id = ?', [result.lastID]);
    res.status(201).json({ message: 'Room created successfully', room: newRoom });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/rooms/:id - Update room details (Owner only)
router.put('/:id', authenticateToken, requireRole('owner'), async (req, res) => {
  const { room_number, floor, capacity, type, ac_type, monthly_rent, amenities } = req.body;

  try {
    const room = await db.asyncGet('SELECT id FROM rooms WHERE id = ?', [req.params.id]);
    if (!room) {
      return res.status(404).json({ error: 'Room not found' });
    }

    const amenitiesJson = amenities ? JSON.stringify(amenities) : undefined;

    await db.asyncRun(
      `UPDATE rooms SET
        room_number = COALESCE(?, room_number),
        floor = COALESCE(?, floor),
        capacity = COALESCE(?, capacity),
        type = COALESCE(?, type),
        ac_type = COALESCE(?, ac_type),
        monthly_rent = COALESCE(?, monthly_rent),
        amenities = COALESCE(?, amenities)
       WHERE id = ?`,
      [room_number, floor, capacity, type, ac_type, monthly_rent, amenitiesJson, req.params.id]
    );

    const updated = await db.asyncGet('SELECT * FROM rooms WHERE id = ?', [req.params.id]);
    res.json({ message: 'Room updated successfully', room: updated });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/rooms/:id - Delete room (Owner only)
router.delete('/:id', authenticateToken, requireRole('owner'), async (req, res) => {
  try {
    // Unassign students from this room first
    await db.asyncRun('UPDATE users SET room_id = NULL, bed_number = NULL WHERE room_id = ?', [req.params.id]);
    const result = await db.asyncRun('DELETE FROM rooms WHERE id = ?', [req.params.id]);

    if (result.changes === 0) {
      return res.status(404).json({ error: 'Room not found' });
    }

    res.json({ message: 'Room deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
