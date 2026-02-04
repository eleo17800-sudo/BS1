require('dotenv').config();
const express = require('express');
const mysql = require('mysql2');
const bcrypt = require('bcrypt');
const cors = require('cors');
const nodeCron = require('node-cron');
const sendMail = require('./mailer');

const app = express();

// Middleware
app.use(express.json());
app.use(cors({
    origin: [
        process.env.FRONTEND_URL || 'http://localhost:5173',
        'http://127.0.0.1:5173',
        'http://localhost:5174',
        'http://127.0.0.1:5174'
    ],
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
    const { userId, roomId, date, startTime, endTime, type } = req.body;

    // Validate required fields
    if (!userId || !roomId || !date || !startTime || !endTime) {
        return res.status(400).json({ error: 'All fields are required' });
    }

    const bookingType = type === 'reservation' ? 'reservation' : 'booking';

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
            'INSERT INTO bookings (user_id, room_id, booking_date, start_time, end_time, type, status) VALUES (?, ?, ?, ?, ?, ?, ?)',
            [userId, roomId, date, startTime, endTime, bookingType, 'pending']
        );

        console.log(`✅ ${bookingType === 'reservation' ? 'Reservation' : 'Booking'} created: Room ${room.name} by ${user.email}`);

        // Send email to admin
        const adminEmail = process.env.ADMIN_EMAIL;
        if (adminEmail) {
            sendMail(
                adminEmail,
                `New Room ${bookingType === 'reservation' ? 'Reservation' : 'Booking'} Request`,
                `New ${bookingType} request:\n\nRoom: ${room.name}\nUser: ${user.full_name} (${user.email})\nDate: ${date}\nTime: ${startTime} - ${endTime}`,
                `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #eee; padding: 20px; border-radius: 10px;">
                    <h2 style="color: #0B4F6C;">New Room ${bookingType === 'reservation' ? 'Reservation' : 'Booking'} Request</h2>
                    <p>A user has placed a new ${bookingType} request.</p>
                    <table style="width: 100%; border-collapse: collapse;">
                        <tr>
                            <td style="padding: 10px; border-bottom: 1px solid #eee;"><strong>Room:</strong></td>
                            <td style="padding: 10px; border-bottom: 1px solid #eee;">${room.name}</td>
                        </tr>
                        <tr>
                            <td style="padding: 10px; border-bottom: 1px solid #eee;"><strong>User:</strong></td>
                            <td style="padding: 10px; border-bottom: 1px solid #eee;">${user.full_name}</td>
                        </tr>
                        <tr>
                            <td style="padding: 10px; border-bottom: 1px solid #eee;"><strong>Email:</strong></td>
                            <td style="padding: 10px; border-bottom: 1px solid #eee;">${user.email}</td>
                        </tr>
                        <tr>
                            <td style="padding: 10px; border-bottom: 1px solid #eee;"><strong>Date:</strong></td>
                            <td style="padding: 10px; border-bottom: 1px solid #eee;">${date}</td>
                        </tr>
                        <tr>
                            <td style="padding: 10px; border-bottom: 1px solid #eee;"><strong>Time:</strong></td>
                            <td style="padding: 10px; border-bottom: 1px solid #eee;">${startTime} - ${endTime}</td>
                        </tr>
                        <tr>
                            <td style="padding: 10px; border-bottom: 1px solid #eee;"><strong>Type:</strong></td>
                            <td style="padding: 10px; border-bottom: 1px solid #eee; text-transform: capitalize;">${bookingType}</td>
                        </tr>
                    </table>
                    <div style="margin-top: 20px; text-align: center;">
                        <a href="${process.env.FRONTEND_URL}/admin-dashboard" style="background: #0B4F6C; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Manage in Dashboard</a>
                    </div>
                </div>
                `
            );
        }

        // Send confirmation email to user
        sendMail(
            user.email,
            `Room ${bookingType === 'reservation' ? 'Reservation' : 'Booking'} Confirmation`,
            `Hello ${user.full_name},\n\nYour ${bookingType} request has been received!\n\nRoom: ${room.name}\nDate: ${date}\nTime: ${startTime} - ${endTime}\n\nYou will receive a confirmation once reviewed.\n\nBest regards,\nSwahiliPot Hub Team`,
            `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #eee; padding: 20px; border-radius: 10px;">
                <h2 style="color: #0B4F6C; border-bottom: 2px solid #0B4F6C; padding-bottom: 10px;">${bookingType === 'reservation' ? 'Reservation' : 'Booking'} Received!</h2>
                <p>Hello <strong>${user.full_name}</strong>,</p>
                <p>Thank you for choosing SwahiliPot Hub. Your request for a room ${bookingType} is being processed.</p>
                
                <div style="background: #f9f9f9; padding: 15px; border-radius: 8px; margin: 20px 0;">
                    <h3 style="margin-top: 0; color: #333;">Summary:</h3>
                    <p style="margin: 5px 0;"><strong>Space:</strong> ${room.name}</p>
                    <p style="margin: 5px 0;"><strong>Date:</strong> ${date}</p>
                    <p style="margin: 5px 0;"><strong>Time Slot:</strong> ${startTime} - ${endTime}</p>
                    <p style="margin: 5px 0;"><strong>Status:</strong> Pending Approval</p>
                </div>

                <p>Our administration team will review your request and get back to you shortly.</p>
                <div style="margin-top: 30px; font-size: 12px; color: #777; border-top: 1px solid #eee; padding-top: 10px;">
                    This is an automated message from SwahiliPot Hub Room Booking System.
                </div>
            </div>
            `
        );

        res.status(201).json({
            message: `${bookingType === 'reservation' ? 'Reservation' : 'Booking'} created successfully`,
            booking: {
                id: result.insertId,
                roomName: room.name,
                date,
                startTime,
                endTime,
                type: bookingType,
                status: 'pending'
            }
        });

    } catch (error) {
        console.error('Booking error:', error);
        res.status(500).json({ error: 'Booking failed' });
    }
});

// GET ALL BOOKINGS (Admin Only)
app.get('/admin/bookings', async (req, res) => {
    try {
        const [bookings] = await dbPromise.query(
            `SELECT 
                b.id,
                b.booking_date,
                b.start_time,
                b.end_time,
                b.type,
                b.status,
                b.created_at,
                r.name as room_name,
                r.space,
                u.full_name as user_name,
                u.email as user_email
            FROM bookings b
            JOIN rooms r ON b.room_id = r.id
            JOIN users u ON b.user_id = u.id
            ORDER BY b.booking_date DESC, b.start_time DESC`
        );

        res.json(bookings);
    } catch (error) {
        console.error('Get admin bookings error:', error);
        res.status(500).json({ error: 'Failed to fetch admin bookings' });
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
                b.type,
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

// CRON JOB: Send reminders every 30 minutes
nodeCron.schedule('*/30 * * * *', async () => {
    console.log('⏰ Running booking reminder check...');
    try {
        const now = new Date();
        const oneHourFromNow = new Date(now.getTime() + (60 * 60 * 1000));

        const dateStr = now.toISOString().split('T')[0];
        const timeStr = now.toTimeString().split(' ')[0];
        const futureTimeStr = oneHourFromNow.toTimeString().split(' ')[0];

        const [upcoming] = await dbPromise.query(
            `SELECT b.*, u.full_name, u.email, r.name as room_name 
             FROM bookings b
             JOIN users u ON b.user_id = u.id
             JOIN rooms r ON b.room_id = r.id
             WHERE b.booking_date = ? 
             AND b.start_time > ? 
             AND b.start_time <= ?
             AND b.status = 'confirmed'`,
            [dateStr, timeStr, futureTimeStr]
        );

        for (const booking of upcoming) {
            console.log(`📧 Sending reminder to ${booking.email} for ${booking.room_name}`);
            sendMail(
                booking.email,
                'Upcoming Room Booking Reminder',
                `Reminder: Your booking for ${booking.room_name} is starting at ${booking.start_time}.`,
                `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #0B4F6C; padding: 20px; border-radius: 10px;">
                    <h2 style="color: #0B4F6C;">Reminder: Upcoming Booking</h2>
                    <p>Hello <strong>${booking.full_name}</strong>,</p>
                    <p>This is a friendly reminder that your booking/reservation for <strong>${booking.room_name}</strong> is starting within the hour.</p>
                    
                    <div style="background: #f0f7fa; padding: 15px; border-radius: 8px; margin: 20px 0;">
                        <p style="margin: 5px 0;"><strong>Time:</strong> ${booking.start_time} - ${booking.end_time}</p>
                        <p style="margin: 5px 0;"><strong>Location:</strong> SwahiliPot Hub</p>
                    </div>

                    <p>We look forward to seeing you!</p>
                </div>
                `
            );
        }
    } catch (error) {
        console.error('Reminder cron error:', error);
    }
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
    console.log(`📍 Frontend URL: ${process.env.FRONTEND_URL || 'http://localhost:5173'}`);
});
