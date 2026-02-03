require('dotenv').config();
const express = require('express');
const mysql = require('mysql2');
const bcrypt = require('bcrypt');
const sendMail = require('./mailer'); // Import the mailer
const app = express();

app.use(express.json());

// Database connection using Environment Variables
const db = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASS,
    database: process.env.DB_NAME
});

// LOGIN ROUTE
app.post('/login', async (req, res) => {
    const { email, password } = req.body;

    // 1. Find the user by their email
    const sql = "SELECT * FROM users WHERE email = ?";

    db.query(sql, [email], async (err, results) => {
        if (err) return res.status(500).json({ error: "Database error" });

        // 2. Check if user exists
        if (results.length === 0) {
            return res.status(401).json({ message: "Invalid email or password" });
        }

        const user = results[0];

        // 3. Compare the provided password with the hashed password in the DB
        const match = await bcrypt.compare(password, user.password_hash);

        if (match) {
            // Success! The email provided is the unique identifier (username)

            // Send welcome email (asynchronously, don't wait for it to respond)
            sendMail(user.email, "Welcome Back!", "We noticed a new login properly.");

            res.json({ message: `Welcome, ${user.email}!` });
        } else {
            res.status(401).json({ message: "Invalid email or password" });
        }
    });
});

app.listen(3000, () => console.log('Server running on port 3000'));
