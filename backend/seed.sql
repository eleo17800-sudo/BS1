-- Seed data for SwahiliPot Hub Room Booking System
-- This file populates the database with initial room data

-- Insert default rooms
INSERT INTO rooms (name, space, capacity, amenities, status) VALUES
('Conference Room A', 'Floor 1', 10, '["Projector", "Whiteboard", "Video Conference"]', 'Available'),
('Meeting Room B', 'Floor 1', 6, '["Whiteboard", "TV Display"]', 'Available'),
('Boardroom', 'Floor 2', 12, '["Projector", "Video Conference", "AC"]', 'Available'),
('Focus Room 1', 'Floor 2', 2, '["Whiteboard"]', 'Available'),
('Focus Room 2', 'Floor 2', 2, '["Whiteboard", "Monitor"]', 'Available'),
('Training Hall', 'Ground Floor', 50, '["Sound System", "Projector", "AC", "Stage"]', 'Available'),
('Podcast Studio', 'Floor 3', 4, '["Soundproofing", "Mics", "Recording Equipment"]', 'Available'),
('Creative Space', 'Floor 3', 8, '["Whiteboard", "Art Supplies", "Natural Light"]', 'Available'),
('Tech Lab', 'Ground Floor', 15, '["Computers", "Projector", "High-Speed Internet"]', 'Available'),
('Quiet Room', 'Floor 1', 1, '["Desk", "Chair", "Natural Light"]', 'Available')
ON DUPLICATE KEY UPDATE name=name;

-- Success message
SELECT 'Seed data inserted successfully!' AS message;
SELECT COUNT(*) AS total_rooms FROM rooms;
