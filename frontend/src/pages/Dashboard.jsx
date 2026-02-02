import React, { useState, useEffect } from 'react';
import { Search, Users, DoorOpen, Bookmark } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';
import BookingModal from '../components/BookingModal';
import Footer from '../components/Footer';

const Dashboard = () => {
    const navigate = useNavigate();
    const [rooms, setRooms] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [currentView, setCurrentView] = useState('available');

    useEffect(() => {
        const defaultRooms = [
            { id: 1, name: 'Conference Room A', floor: 'Floor 1', capacity: 10, amenities: ['Projector', 'Whiteboard', 'Video Conference'], status: 'Available' },
            { id: 2, name: 'Meeting Room B', floor: 'Floor 1', capacity: 6, amenities: ['Whiteboard', 'TV Display'], status: 'Available' },
            { id: 3, name: 'Boardroom', floor: 'Floor 2', capacity: 12, amenities: ['Projector', 'Video Conference', 'AC'], status: 'Available' },
            { id: 4, name: 'Focus Room 1', floor: 'Floor 2', capacity: 2, amenities: ['Whiteboard'], status: 'Available' },
            { id: 5, name: 'Training Hall', floor: 'Ground Floor', capacity: 50, amenities: ['Sound System', 'Projector'], status: 'Reserved' },
            { id: 6, name: 'Podcast Studio', floor: 'Floor 3', capacity: 4, amenities: ['Soundproofing', 'Mics'], status: 'Booked' }
        ];

        try {
            const storedRooms = JSON.parse(localStorage.getItem('rooms')) || defaultRooms;
            setRooms(storedRooms);
            if (!localStorage.getItem('rooms')) {
                localStorage.setItem('rooms', JSON.stringify(defaultRooms));
            }
        } catch (e) {
            console.error('Error parsing rooms:', e);
            setRooms(defaultRooms);
        }
    }, []);

    // Modal State
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedRoom, setSelectedRoom] = useState(null);
    const [modalType, setModalType] = useState('booking'); // 'booking' or 'reservation'

    const handleNavigate = (viewId) => {
        if (viewId === 'home') {
            setCurrentView('available');
        } else {
            setCurrentView(viewId);
        }
        setIsSidebarOpen(false);
    };

    const handleLogout = () => {
        navigate('/login');
    };

    const openModal = (room, type) => {
        setSelectedRoom(room);
        setModalType(type);
        setIsModalOpen(true);
    };

    // Filter rooms based on search term AND current view
    const filteredRooms = rooms.filter(room => {
        const matchesSearch = room.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            room.amenities.some(amenity => amenity.toLowerCase().includes(searchTerm.toLowerCase()));

        const matchesView = currentView === 'available' ? room.status === 'Available' :
            currentView === 'reserved' ? room.status === 'Reserved' :
                currentView === 'booked' ? room.status === 'Booked' :
                    true;

        return matchesSearch && matchesView;
    });

    const getPageTitle = () => {
        switch (currentView) {
            case 'reserved': return 'Reserved Rooms';
            case 'booked': return 'Booked Rooms';
            default: return 'Available Rooms';
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col">
            <Navbar onMenuClick={() => setIsSidebarOpen(true)} />

            <Sidebar
                isOpen={isSidebarOpen}
                onClose={() => setIsSidebarOpen(false)}
                currentView={currentView}
                onNavigate={handleNavigate}
                onLogout={handleLogout}
            />

            <BookingModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                room={selectedRoom}
                type={modalType}
            />

            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full flex-grow">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-8 gap-4">
                    <h1 className="text-2xl font-bold text-gray-900">{getPageTitle()}</h1>

                    <div className="relative w-full sm:w-96">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <Search className="h-5 w-5 text-gray-400" />
                        </div>
                        <input
                            type="text"
                            className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                            placeholder="Search by room name, amenities, capacity..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>

                {filteredRooms.length === 0 ? (
                    <div className="text-center py-12">
                        <p className="text-gray-500 text-lg">No rooms found in this category.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {filteredRooms.map((room) => (
                            <div key={room.id} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
                                <div className="flex justify-between items-start mb-4">
                                    <div>
                                        <h3 className="text-lg font-bold text-gray-900">{room.name}</h3>
                                        <p className="text-sm text-gray-500">{room.floor}</p>
                                    </div>
                                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${room.status === 'Available' ? 'bg-green-100 text-green-800' :
                                        room.status === 'Reserved' ? 'bg-yellow-100 text-yellow-800' :
                                            'bg-red-100 text-red-800'
                                        }`}>
                                        {room.status}
                                    </span>
                                </div>

                                <div className="flex items-center space-x-2 text-sm text-gray-600 mb-4">
                                    <Users className="w-4 h-4" />
                                    <span>Capacity: {room.capacity} people</span>
                                </div>

                                <div className="mb-6">
                                    <p className="text-sm font-medium text-gray-900 mb-2">Amenities:</p>
                                    <div className="flex flex-wrap gap-2">
                                        {room.amenities.map((amenity, index) => (
                                            <span
                                                key={index}
                                                className="inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-medium bg-gray-100 text-gray-800 border border-gray-200"
                                            >
                                                {amenity}
                                            </span>
                                        ))}
                                    </div>
                                </div>

                                <div className="space-y-3">
                                    <button
                                        onClick={() => openModal(room, 'booking')}
                                        className="w-full flex items-center justify-center px-4 py-2 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-gray-900 hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-900 transition-colors"
                                        disabled={room.status !== 'Available'}
                                    >
                                        <DoorOpen className="w-4 h-4 mr-2" />
                                        {room.status === 'Available' ? 'Book Room' : room.status}
                                    </button>
                                    <button
                                        onClick={() => openModal(room, 'reservation')}
                                        className="w-full flex items-center justify-center px-4 py-2 border border-gray-300 rounded-lg shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition-colors"
                                    >
                                        <Bookmark className="w-4 h-4 mr-2" />
                                        Reserve for Later
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </main>

            <Footer />
        </div>
    );
};

export default Dashboard;
