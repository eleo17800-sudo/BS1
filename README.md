# Swahili Port Hub Room Booking System

## Overview
The Swahili Port Hub Room Booking System is a digital platform designed to simplify how rooms and spaces within Swahili Port Hub are reserved, managed, and tracked. The system allows users to book available rooms while enabling administrators to efficiently manage availability, approvals, and records.

This solution is ideal for meetings, creative sessions, training, co-working, and events hosted at Swahili Port Hub.

---

## Objectives
- **Simplicity:** Provide a simple and fast room booking process  
- **Efficiency:** Reduce booking conflicts and manual paperwork  
- **Visibility:** Improve visibility of room availability  
- **Centralization:** Centralize booking data and usage history  

---

## Key Features

### User Features
- View room availability  
- Easy room booking by date and time  
- Receive booking confirmations  
- Manage bookings (cancel or update within policy)

### Admin Features
- Add, edit, or remove rooms  
- Configure room capacity and rules  
- Approve or reject booking requests  
- View booking history and analytics  

---

## Room Information
Each room includes:
- Room name  
- Capacity  
- Available facilities (Wi-Fi, Projector, AC, etc.)  
- Booking price (if applicable)  
- Availability schedule  

---

## System Workflow
1. User logs in or accesses the platform  
2. User selects date, time, and room  
3. Booking request is submitted  
4. Admin approves or rejects the request (if required)  
5. Confirmation is sent to the user  

---

## Logic Flow
[Log In]
|
[Dashboard]
|
[View Rooms]
|
[Booking Page]
|
[Available?]
|---- YES ---> [Booked]
|---- NO ---> [Reserve / Book Another Room]

---

## Folder Structure
BS1/
├── backend/
│ ├── package.json
│ └── package-lock.json
├── frontend/
│ ├── index.js
│ └── package.json
└── README.md

---

## Technology Stack
- **Frontend:** React, Vite  
- **Styling:** Tailwind CSS  
- **Backend:** Node.js, Express  
- **Database:** MySQL  
- **Authentication:** Email or phone-based login  

---

## Security & Access
- Role-Based Access Control (RBAC)  
- Secure authentication mechanisms  
- Data protection and regular backups  

---

## Future Enhancements
- Mobile app integration  
- Calendar synchronization (Google Calendar)  
- Automated reminders and notifications  
- Multi-language support (English)  

---

## Contributors
- **Project Owner:** Swahili Port Hub  
- **Developers & Designers:**  
  - Anthony Muhati  
  - Nassoro Mohammad  
  - Cynthia Wafula  
  - Eben Leo Makhanu  

---

## Support
For support or inquiries, contact **Swahili Port Hub Management**.

---

*Building smarter spaces for collaboration and innovation.*
