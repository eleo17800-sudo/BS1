require('dotenv').config();
const express = require('express');
const mysql = require('mysql2');
const bcrypt = require('bcrypt');
const cors = require('cors');
const sendMail = require('./mailer');

const app = express();

// Middleware
app.use(express.json());
app.use(cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    credentials: true
}));

// Database connection pool
const db = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASS,
    database: process.env.DB_NAME,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

// Promisify for async/await
const dbPromise = db.promise();

// Test database connection
db.getConnection((err, connection) => {
    if (err) {
        console.error('❌ Database connection failed:', err.message);
    } else {
        console.log('✅ Database connected successfully');
        connection.release();
    }
});

// ============================================
// ROUTES
// ============================================

// Health check endpoint
app.get('/health', async (req, res) => {
    try {
        await dbPromise.query('SELECT 1');
        res.json({ status: 'ok', database: 'connected' });
    } catch (error) {
        res.status(500).json({ status: 'error', database: 'disconnected' });
    }
});

// SIGNUP ROUTE
app.post('/signup', async (req, res) => {
    const { email, password, fullName, department } = req.body;

    // Validate required fields
    if (!email || !password || !fullName) {
        return res.status(400).json({ error: 'Email, password, and full name are required' });
    }

    // Check if email is admin email
    if (email.toLowerCase() === process.env.ADMIN_EMAIL?.toLowerCase()) {
        return res.status(403).json({ error: 'Cannot use admin email for signup' });
    }

    try {
        // Check if user already exists
        const [existing] = await dbPromise.query(
            'SELECT id FROM users WHERE email = ?',
            [email]
        );

        if (existing.length > 0) {
            return res.status(409).json({ error: 'Email already registered' });
        }

        // Hash password
        const saltRounds = 10;
        const passwordHash = await bcrypt.hash(password, saltRounds);

        // Insert new user
        const [result] = await dbPromise.query(
            'INSERT INTO users (email, password_hash, full_name, department, role) VALUES (?, ?, ?, ?, ?)',
            [email, passwordHash, fullName, department || null, 'user']
        );

        console.log(`✅ New user registered: ${email}`);

        // Send welcome email (don't wait for it)
        sendMail(
            email,
            'Welcome to SwahiliPot Hub!',
            `Hello ${fullName},\n\nWelcome to SwahiliPot Hub Room Booking System! You can now book rooms for your meetings and events.\n\nBest regards,\nSwahiliPot Hub Team`,
            `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h2 style="color: #0B4F6C;">Welcome to SwahiliPot Hub!</h2>
                <p>Hello <strong>${fullName}</strong>,</p>
                <p>Welcome to SwahiliPot Hub Room Booking System! You can now book rooms for your meetings and events.</p>
                <p>Get started by logging in and exploring our available rooms.</p>
                <br>
                <p>Best regards,<br><strong>SwahiliPot Hub Team</strong></p>
            </div>
            `
        );

        res.status(201).json({
            message: 'User registered successfully',
            userId: result.insertId
        });

    } catch (error) {
        console.error('Signup error:', error);
        res.status(500).json({ error: 'Registration failed' });
    }
});

// LOGIN ROUTE
app.post('/login', async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ error: 'Email and password are required' });
    }

    try {
        const [results] = await dbPromise.query(
            'SELECT * FROM users WHERE email = ?',
            [email]
        );

        if (results.length === 0) {
            return res.status(401).json({ error: 'Invalid email or password' });
        }

        const user = results[0];

        // Compare password
        const match = await bcrypt.compare(password, user.password_hash);

        if (match) {
            console.log(`✅ User logged in: ${user.email}`);

            res.json({
                message: 'Login successful',
                user: {
                    id: user.id,
                    email: user.email,
                    fullName: user.full_name,
                    department: user.department,
                    role: user.role
                }
            });
        } else {
            res.status(401).json({ error: 'Invalid email or password' });
        }
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ error: 'Login failed' });
    }
});

// GET ROOMS (with availability check)
app.get('/rooms', async (req, res) => {
    const { date } = req.query;

    try {
        let query = `
            SELECT 
                r.id,
                r.name,
                r.space,
                r.capacity,
                r.amenities,
                r.status
            FROM rooms r
        `;

        // If date is provided, filter out booked rooms for that date
        if (date) {
            query += `
                WHERE r.id NOT IN (
                    SELECT room_id 
                    FROM bookings 
                    WHERE booking_date = ? 
                    AND status IN ('pending', 'confirmed')
                )
            `;
        }

        query += ' ORDER BY r.name';

        const [rooms] = await dbPromise.query(query, date ? [date] : []);

        // Parse JSON amenities
        const parsedRooms = rooms.map(room => ({
            ...room,
            amenities: JSON.parse(room.amenities || '[]')
        }));

        res.json(parsedRooms);
    } catch (error) {
        console.error('Get rooms error:', error);
        res.status(500).json({ error: 'Failed to fetch rooms' });
    }
});

// GET SINGLE ROOM
app.get('/rooms/:id', async (req, res) => {
    const { id } = req.params;

    try {
        const [rooms] = await dbPromise.query(
            'SELECT * FROM rooms WHERE id = ?',
            [id]
        );

        if (rooms.length === 0) {
            return res.status(404).json({ error: 'Room not found' });
        }

        const room = {
            ...rooms[0],
            amenities: JSON.parse(rooms[0].amenities || '[]')
        };

        res.json(room);
    } catch (error) {
        console.error('Get room error:', error);
        res.status(500).json({ error: 'Failed to fetch room' });
    }
});

// BOOK ROOM
app.post('/book', async (req, res) => {
    const { userId, roomId, date, startTime, endTime } = req.body;

    // Validate required fields
    if (!userId || !roomId || !date || !startTime || !endTime) {
        return res.status(400).json({ error: 'All fields are required' });
    }

    try {
        // Check if room exists
        const [rooms] = await dbPromise.query(
            'SELECT * FROM rooms WHERE id = ?',
            [roomId]
        );

        if (rooms.length === 0) {
            return res.status(404).json({ error: 'Room not found' });
        }

        const room = rooms[0];

        // Check if room is already booked for this date/time
        const [existingBookings] = await dbPromise.query(
            `SELECT * FROM bookings 
             WHERE room_id = ? 
             AND booking_date = ? 
             AND status IN ('pending', 'confirmed')
             AND (
                 (start_time <= ? AND end_time > ?) OR
                 (start_time < ? AND end_time >= ?) OR
                 (start_time >= ? AND end_time <= ?)
             )`,
            [roomId, date, startTime, startTime, endTime, endTime, startTime, endTime]
        );

        if (existingBookings.length > 0) {
            return res.status(409).json({
                error: 'Room is already booked for this time slot',
                conflictingBooking: existingBookings[0]
            });
        }

        // Get user details
        const [users] = await dbPromise.query(
            'SELECT * FROM users WHERE id = ?',
            [userId]
        );

        if (users.length === 0) {
            return res.status(404).json({ error: 'User not found' });
        }

        const user = users[0];

        // Create booking
        const [result] = await dbPromise.query(
            'INSERT INTO bookings (user_id, room_id, booking_date, start_time, end_time, status) VALUES (?, ?, ?, ?, ?, ?)',
            [userId, roomId, date, startTime, endTime, 'pending']
        );

        console.log(`✅ Booking created: Room ${room.name} by ${user.email}`);

        // Send email to admin
        const adminEmail = process.env.ADMIN_EMAIL;
        if (adminEmail) {
            sendMail(
                adminEmail,
                'New Room Booking Request',
                `New booking request:\n\nRoom: ${room.name}\nUser: ${user.full_name} (${user.email})\nDate: ${date}\nTime: ${startTime} - ${endTime}`,
                `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                    <h2 style="color: #0B4F6C;">New Room Booking Request</h2>
                    <table style="width: 100%; border-collapse: collapse;">
                        <tr>
                            <td style="padding: 8px; border-bottom: 1px solid #ddd;"><strong>Room:</strong></td>
                            <td style="padding: 8px; border-bottom: 1px solid #ddd;">${room.name}</td>
                        </tr>
                        <tr>
                            <td style="padding: 8px; border-bottom: 1px solid #ddd;"><strong>User:</strong></td>
                            <td style="padding: 8px; border-bottom: 1px solid #ddd;">${user.full_name}</td>
                        </tr>
                        <tr>
                            <td style="padding: 8px; border-bottom: 1px solid #ddd;"><strong>Email:</strong></td>
                            <td style="padding: 8px; border-bottom: 1px solid #ddd;">${user.email}</td>
                        </tr>
                        <tr>
                            <td style="padding: 8px; border-bottom: 1px solid #ddd;"><strong>Date:</strong></td>
                            <td style="padding: 8px; border-bottom: 1px solid #ddd;">${date}</td>
                        </tr>
                        <tr>
                            <td style="padding: 8px; border-bottom: 1px solid #ddd;"><strong>Time:</strong></td>
                            <td style="padding: 8px; border-bottom: 1px solid #ddd;">${startTime} - ${endTime}</td>
                        </tr>
                    </table>
                </div>
                `
            );
        }

        // Send confirmation email to user
        sendMail(
            user.email,
            'Room Booking Confirmation',
            `Hello ${user.full_name},\n\nYour booking request has been received!\n\nRoom: ${room.name}\nDate: ${date}\nTime: ${startTime} - ${endTime}\n\nYou will receive a confirmation once approved.\n\nBest regards,\nSwahiliPot Hub Team`,
            `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h2 style="color: #0B4F6C;">Booking Confirmation</h2>
                <p>Hello <strong>${user.full_name}</strong>,</p>
                <p>Your booking request has been received!</p>
                <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
                    <tr>
                        <td style="padding: 8px; border-bottom: 1px solid #ddd;"><strong>Room:</strong></td>
                        <td style="padding: 8px; border-bottom: 1px solid #ddd;">${room.name}</td>
                    </tr>
                    <tr>
                        <td style="padding: 8px; border-bottom: 1px solid #ddd;"><strong>Date:</strong></td>
                        <td style="padding: 8px; border-bottom: 1px solid #ddd;">${date}</td>
                    </tr>
                    <tr>
                        <td style="padding: 8px; border-bottom: 1px solid #ddd;"><strong>Time:</strong></td>
                        <td style="padding: 8px; border-bottom: 1px solid #ddd;">${startTime} - ${endTime}</td>
                    </tr>
                </table>
                <p>You will receive a confirmation once approved.</p>
                <br>
                <p>Best regards,<br><strong>SwahiliPot Hub Team</strong></p>
            </div>
            `
        );

        res.status(201).json({
            message: 'Booking created successfully',
            booking: {
                id: result.insertId,
                roomName: room.name,
                date,
                startTime,
                endTime,
                status: 'pending'
            }
        });

    } catch (error) {
        console.error('Booking error:', error);
        res.status(500).json({ error: 'Booking failed' });
    }
});

// GET USER BOOKINGS
app.get('/bookings/user/:userId', async (req, res) => {
    const { userId } = req.params;

    try {
        const [bookings] = await dbPromise.query(
            `SELECT 
                b.id,
                b.booking_date,
                b.start_time,
                b.end_time,
                b.status,
                b.created_at,
                r.name as room_name,
                r.space,
                r.capacity
            FROM bookings b
            JOIN rooms r ON b.room_id = r.id
            WHERE b.user_id = ?
            ORDER BY b.booking_date DESC, b.start_time DESC`,
            [userId]
        );

        res.json(bookings);
    } catch (error) {
        console.error('Get bookings error:', error);
        res.status(500).json({ error: 'Failed to fetch bookings' });
    }
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
    console.log(`📍 Frontend URL: ${process.env.FRONTEND_URL || 'http://localhost:5173'}`);
});
