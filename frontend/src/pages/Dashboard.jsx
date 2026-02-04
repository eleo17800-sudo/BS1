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
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);

    const fetchRooms = async () => {
        setLoading(true);
        setError('');
        try {
            // Include date in query if we're in the 'available' view
            const queryParam = currentView === 'available' ? `?date=${selectedDate}` : '';
            const response = await fetch(`http://localhost:3000/rooms${queryParam}`);

            if (!response.ok) throw new Error('Failed to fetch rooms');

            const data = await response.json();
            setRooms(data);
        } catch (err) {
            console.error('Error fetching rooms:', err);
            setError('Could not load rooms. Please check your connection.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchRooms();
    }, [currentView, selectedDate]);

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

    // Filter rooms based on search term only (status filtering happens at API level for 'available' view)
    const filteredRooms = rooms.filter(room => {
        const matchesSearch = room.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            room.amenities.some(amenity => amenity.toLowerCase().includes(searchTerm.toLowerCase()));

        // We still filter for 'Reserved' and 'Booked' locally for those specific UI views if needed,
        // although in a full DB app these would likely be separate API queries too.
        if (currentView === 'available') return matchesSearch;

        const matchesView = currentView === 'reserved' ? room.status === 'Reserved' :
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
                    <div className="flex flex-col gap-1">
                        <h1 className="text-2xl font-bold text-gray-900">{getPageTitle()}</h1>
                        {currentView === 'available' && (
                            <div className="flex items-center gap-2">
                                <span className="text-sm text-gray-500 font-medium">For Date:</span>
                                <input
                                    type="date"
                                    value={selectedDate}
                                    onChange={(e) => setSelectedDate(e.target.value)}
                                    className="text-sm border-none bg-transparent font-bold text-blue-600 focus:ring-0 cursor-pointer"
                                />
                            </div>
                        )}
                    </div>

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

                {loading ? (
                    <div className="flex flex-col items-center justify-center py-20">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
                        <p className="text-gray-500">Checking availability...</p>
                    </div>
                ) : error ? (
                    <div className="text-center py-12 bg-red-50 rounded-xl border border-red-100">
                        <p className="text-red-600 mb-4">{error}</p>
                        <button
                            onClick={fetchRooms}
                            className="text-blue-600 font-bold hover:underline"
                        >
                            Try Again
                        </button>
                    </div>
                ) : filteredRooms.length === 0 ? (
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
                                        <p className="text-sm text-gray-500">{room.space}</p>
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
