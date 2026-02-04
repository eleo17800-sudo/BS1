require('dotenv').config();
const mysql = require('mysql2/promise');
const bcrypt = require('bcrypt');

async function fixAdmin() {
    const connection = await mysql.createConnection({
        host: process.env.DB_HOST,
        user: process.env.DB_USER,
        password: process.env.DB_PASS,
        database: process.env.DB_NAME
    });

    try {
        console.log('--- DB CONNECTION SUCCESS ---');

        // 1. Check tables
        const [tables] = await connection.execute('SHOW TABLES');
        console.log('Tables found:', tables.map(t => Object.values(t)[0]));

        if (tables.length === 0) {
            console.error('❌ NO TABLES FOUND. Database is empty!');
            return;
        }

        // 2. Generate proper hash for "admin123"
        const newHash = await bcrypt.hash('admin123', 10);
        console.log('Generated new hash for "admin123"');

        // 3. Update or Insert Admin
        const email = 'admin@swahilipothub.co.ke';
        const [rows] = await connection.execute('SELECT id FROM users WHERE email = ?', [email]);

        if (rows.length > 0) {
            await connection.execute(
                'UPDATE users SET password_hash = ?, role = "admin" WHERE email = ?',
                [newHash, email]
            );
            console.log(`✅ Updated existing admin: ${email}`);
        } else {
            await connection.execute(
                'INSERT INTO users (email, password_hash, full_name, department, role) VALUES (?, ?, ?, ?, ?)',
                [email, newHash, 'Admin User', 'Administration', 'admin']
            );
            console.log(`✅ Created new admin: ${email}`);
        }

    } catch (err) {
        console.error('❌ Error:', err.message);
    } finally {
        await connection.end();
    }
}

fixAdmin();
