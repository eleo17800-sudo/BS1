SwahiliPot Hub Room Booking System

Overview
The SwahiliPot Hub Room Booking System is a digital platform designed to simplify how rooms and spaces within SwahiliPot Hub are reserved, managed, and tracked. The system allows users to book available rooms while enabling administrators to manage availability, approvals, and records efficiently.

This solution is ideal for meetings, creative sessions, training, co-working, and events hosted at SwahiliPot Hub.


Objectives
Simplicity: Provide a simple and fast room booking process.
Efficiency: Reduce booking conflicts and manual paperwork.
Visibility: Improve visibility of room availability.
Centralization: Centralize booking data and usage history.


Key Features

User Features
View Availability: Browse available rooms looking for suitable slots.
Easy Booking: Book rooms by selecting date and time.
Notifications: Receive booking confirmations.
Manage Bookings: Cancel or update bookings (within policy guidelines).

Admin Features
Room Management: Add, edit, or remove rooms.
Configuration: Set room capacity and specific rules.
Workflow Control: Approve or reject booking requests.
Insights: View booking history and analytics.


Room Information
Each room listing in the system includes:
Room Name
Capacity
Available Facilities (e.g., Wi-Fi, Projector, AC)
Booking Price (if applicable)
Availability Schedule


System Workflow
1. Access: User logs in or accesses the platform.
2. Selection: User selects a desired date, time, and room.
3. Request: A booking request is submitted. If the room is already booked, the user can reserve it (waitlist).
4. Approval: Admin reviews and approves the request (if required).
5. Confirmation: A booking confirmation is sent to the user.


Project Structure

BS1/
├── backend/
│   ├── package.json
│   └── package-lock.json
├── frontend/
│   ├── public/
│   ├── src/
│   │   ├── assets/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── App.jsx
│   │   ├── index.css
│   │   └── main.jsx
│   ├── eslint.config.js
│   ├── index.html
│   ├── package.json
│   ├── postcss.config.js
│   ├── tailwind.config.js
│   └── vite.config.js
├── index.js
├── package.json
└── README.md


Technology Stack
Frontend: React, Vite
Styling: Tailwind CSS
Backend: Node.js, Express
Database: MySQL
Authentication: Email or phone-based login


Security & Access
Role-Based Access Control (RBAC): Distinct permissions for Users and Admins.
Secure Authentication: Robust login mechanisms.
Data Safety: Data protection measures and regular backups.


Future Enhancements
Mobile App Integration
Calendar Sync (e.g., Google Calendar)
Automated Reminders & Notifications
Multi-language Support (English)


Contributors
Project Owner: Swahili Port Hub
Developers & Designers: Anthony Muhati, NASSORO MOHAMMAD, Cynthia Wafula, Eben Leo Makhanu


Support
For support or inquiries, contact: Swahili Port Hub Management


Building smarter spaces for collaboration and innovation.

## Getting Started (for Developers)

To run this project locally, follow these steps:

### Prerequisites
- Node.js installed on your machine.

### Installation
1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```

### Running the Application
Start the development server:
```bash
npm run dev
```
The application will be available at `http://localhost:5173`.

### Troubleshooting

#### PowerShell "script cannot be loaded" Error
If you encounter an error like `npm : File ... npm.ps1 cannot be loaded because running scripts is disabled`, it is due to PowerShell's execution policy.

**Solution 1 (Recommended):**
Run the command in **Command Prompt (cmd)** instead of PowerShell.

**Solution 2 (PowerShell):**
Temporarily bypass the execution policy for the current session:
```powershell
Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass
```
Then try running `npm run dev` again.

**Solution 3 (Permanent):**
Change the execution policy for your user (allows local scripts):
```powershell
Set-ExecutionPolicy -Scope CurrentUser -ExecutionPolicy RemoteSigned
```

#### Tailwind CSS v4 PostCSS Error
If you see an error about `tailwindcss` moving to a separate package for PostCSS:
1. Install the PostCSS plugin:
   ```bash
   npm install @tailwindcss/postcss
   ```
2. Update `postcss.config.js`:
   ```js
   export default {
     plugins: {
       '@tailwindcss/postcss': {},
       autoprefixer: {},
     },
   }
   ```
3. Update `src/index.css` to use `@import "tailwindcss";`.
