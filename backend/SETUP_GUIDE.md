# Setup Guide - Room Booking System Backend

This guide will help you set up the MySQL database, configure Gmail SMTP for email notifications, and migrate existing localStorage data.

---

## 1. MySQL Database Setup

### Option A: Install MySQL Locally (Recommended for Development)

#### Windows Installation:

1. **Download MySQL Installer**:
   - Visit: https://dev.mysql.com/downloads/installer/
   - Download "MySQL Installer for Windows"
   - Choose the "mysql-installer-community" version

2. **Install MySQL**:
   - Run the installer
   - Choose "Developer Default" setup type
   - Click "Next" through the installation
   - Set a root password (remember this!)
   - Complete the installation

3. **Verify Installation**:
   ```bash
   mysql --version
   ```

4. **Create Database**:
   Open MySQL Command Line Client (or use MySQL Workbench):
   ```sql
   CREATE DATABASE swahilipot_booking;
   ```

5. **Create Database User** (Optional but recommended):
   ```sql
   CREATE USER 'booking_user'@'localhost' IDENTIFIED BY 'your_secure_password';
   GRANT ALL PRIVILEGES ON swahilipot_booking.* TO 'booking_user'@'localhost';
   FLUSH PRIVILEGES;
   ```

### Option B: Use XAMPP (Easier for Beginners)

1. **Download XAMPP**:
   - Visit: https://www.apachefriends.org/
   - Download for Windows
   - Install XAMPP

2. **Start MySQL**:
   - Open XAMPP Control Panel
   - Click "Start" next to MySQL

3. **Access phpMyAdmin**:
   - Click "Admin" next to MySQL in XAMPP
   - Or visit: http://localhost/phpmyadmin

4. **Create Database**:
   - Click "New" in the left sidebar
   - Database name: `swahilipot_booking`
   - Collation: `utf8mb4_general_ci`
   - Click "Create"

---

## 2. Run Database Schema

After creating the database, you need to create the tables:

### Using MySQL Command Line:

```bash
# Navigate to backend folder
cd c:\Users\ANTONY\Documents\BS1\backend

# Run the schema file
mysql -u root -p swahilipot_booking < schema.sql
```

### Using phpMyAdmin (XAMPP):

1. Select `swahilipot_booking` database
2. Click "Import" tab
3. Choose `schema.sql` file
4. Click "Go"

### Using MySQL Workbench:

1. Open MySQL Workbench
2. Connect to your local MySQL server
3. Select `swahilipot_booking` schema
4. File → Run SQL Script
5. Select `schema.sql`
6. Click "Run"

---

## 3. Configure Environment Variables

1. **Create `.env` file** in the `backend` folder:
   ```bash
   cd c:\Users\ANTONY\Documents\BS1\backend
   copy .env.example .env
   ```

2. **Edit `.env` file** with your actual values:
   ```env
   # Database Configuration
   DB_HOST=localhost
   DB_USER=root
   DB_PASS=your_mysql_password
   DB_NAME=swahilipot_booking

   # Admin Email (users cannot signup with this email)
   ADMIN_EMAIL=admin@swahilipothub.co.ke

   # SMTP Configuration for Gmail
   SMTP_HOST=smtp.gmail.com
   SMTP_PORT=587
   SMTP_SECURE=false
   SMTP_USER=your-email@gmail.com
   SMTP_PASS=your-app-password

   # Application Settings
   PORT=3000
   ```

---

## 4. Gmail SMTP Configuration

To send emails via Gmail, you need to create an **App Password** (not your regular Gmail password).

### Steps to Get Gmail App Password:

1. **Enable 2-Step Verification**:
   - Go to: https://myaccount.google.com/security
   - Click "2-Step Verification"
   - Follow the setup process

2. **Generate App Password**:
   - Go to: https://myaccount.google.com/apppasswords
   - Or: Google Account → Security → 2-Step Verification → App passwords
   - Select app: "Mail"
   - Select device: "Other (Custom name)"
   - Enter name: "Swahilipot Booking System"
   - Click "Generate"
   - **Copy the 16-character password** (it looks like: `abcd efgh ijkl mnop`)

3. **Update `.env` file**:
   ```env
   SMTP_USER=your-email@gmail.com
   SMTP_PASS=abcd efgh ijkl mnop
   ```
   (Use the app password, not your regular password)

### Alternative: Use Ethereal (Test Email)

If you want to test without Gmail first:
- The system will automatically use Ethereal test email
- Check console logs for preview URLs
- No configuration needed

---

## 5. Automatic Data Migration from localStorage

The system includes an automatic migration script that will:
- Read existing rooms from localStorage
- Insert them into the MySQL database
- Preserve all room details (name, capacity, amenities, etc.)

### How to Run Migration:

1. **Start the backend server**:
   ```bash
   cd c:\Users\ANTONY\Documents\BS1\backend
   npm start
   ```

2. **Access the migration endpoint**:
   - Open browser and visit: http://localhost:3000/migrate
   - Or use the frontend migration button (we'll add this)

3. **Migration Process**:
   - The script reads localStorage data from the frontend
   - Checks if rooms already exist in database
   - Inserts only new rooms
   - Returns a summary of migrated data

### Manual Migration (Alternative):

If you prefer to manually add rooms, use the seed data:

```bash
mysql -u root -p swahilipot_booking < seed.sql
```

---

## 6. Install Backend Dependencies

Make sure all Node.js packages are installed:

```bash
cd c:\Users\ANTONY\Documents\BS1\backend
npm install
```

This will install:
- `express` - Web framework
- `mysql2` - MySQL database driver
- `bcrypt` - Password hashing
- `dotenv` - Environment variables
- `nodemailer` - Email sending
- `cors` - Cross-origin requests

---

## 7. Start the Backend Server

```bash
cd c:\Users\ANTONY\Documents\BS1\backend
npm start
```

Or for development with auto-restart:
```bash
npm run dev
```

You should see:
```
Server running on port 3000
Database connected successfully
```

---

## 8. Test the Setup

### Test Database Connection:
Visit: http://localhost:3000/health

Expected response:
```json
{
  "status": "ok",
  "database": "connected"
}
```

### Test Email Configuration:
The system will send test emails when users signup or book rooms. Check your console for Ethereal preview URLs or your Gmail inbox.

---

## Troubleshooting

### MySQL Connection Error:
```
Error: ER_ACCESS_DENIED_ERROR
```
**Solution**: Check your DB_USER and DB_PASS in `.env` file

### Gmail Authentication Error:
```
Error: Invalid login
```
**Solution**: 
- Make sure you're using an App Password, not your regular password
- Verify 2-Step Verification is enabled
- Check SMTP_USER matches the Gmail account that generated the app password

### Port Already in Use:
```
Error: EADDRINUSE: address already in use :::3000
```
**Solution**: 
- Stop other applications using port 3000
- Or change PORT in `.env` to a different number (e.g., 3001)

### Database Not Found:
```
Error: ER_BAD_DB_ERROR: Unknown database
```
**Solution**: Create the database first using the commands in Section 1

---

## Next Steps

After completing this setup:
1. ✅ MySQL database is running
2. ✅ Tables are created (users, rooms, bookings)
3. ✅ Environment variables are configured
4. ✅ Gmail SMTP is ready
5. ✅ Backend server is running

You can now:
- Test user signup
- Test room booking
- Receive email notifications
- View data in MySQL database
