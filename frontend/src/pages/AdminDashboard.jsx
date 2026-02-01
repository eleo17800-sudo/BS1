import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Trash2, Edit, LogOut, LayoutGrid, Building2, Users, Clock, Monitor, XCircle } from 'lucide-react';
import AddRoomModal from '../components/AddRoomModal';

const AdminDashboard = () => {
    const navigate = useNavigate();
    const [rooms, setRooms] = useState([]);
    const [activeSessions, setActiveSessions] = useState([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [activeTab, setActiveTab] = useState('rooms'); // 'rooms' or 'users'

    useEffect(() => {
        const isAdmin = localStorage.getItem('isAdmin');
        if (!isAdmin) {
            navigate('/admin/login');
            return;
        }

        const storedRooms = JSON.parse(localStorage.getItem('rooms')) || [
            { id: 1, name: 'Conference Room A', floor: 'Floor 1', capacity: 10, amenities: ['Projector', 'Whiteboard'], status: 'Available' },
            { id: 2, name: 'Meeting Room B', floor: 'Floor 1', capacity: 6, amenities: ['Whiteboard'], status: 'Available' },
            { id: 3, name: 'Boardroom', floor: 'Floor 2', capacity: 12, amenities: ['Projector', 'Video Conference'], status: 'Available' },
            { id: 4, name: 'Focus Room 1', floor: 'Floor 2', capacity: 2, amenities: ['Whiteboard'], status: 'Available' },
        ];
        setRooms(storedRooms);
        localStorage.setItem('rooms', JSON.stringify(storedRooms));

        const storedSessions = JSON.parse(localStorage.getItem('activeSessions')) || [];
        setActiveSessions(storedSessions);
    }, [navigate]);

    const calculateDuration = (loginTime) => {
        const start = new Date(loginTime);
        const now = new Date();
        const diff = Math.floor((now - start) / 60000); // duration in minutes
        if (diff < 60) return `${diff} mins`;
        const hours = Math.floor(diff / 60);
        const mins = diff % 60;
        return `${hours}h ${mins}m`;
    };

    const removeSession = (id) => {
        const updatedSessions = activeSessions.filter(s => s.id !== id);
        setActiveSessions(updatedSessions);
        localStorage.setItem('activeSessions', JSON.stringify(updatedSessions));
    };

    const handleLogout = () => {
        localStorage.removeItem('isAdmin');
        navigate('/admin/login');
    };

    const deleteRoom = (id) => {
        const updatedRooms = rooms.filter(r => r.id !== id);
        setRooms(updatedRooms);
        localStorage.setItem('rooms', JSON.stringify(updatedRooms));
    };

    const handleAddRoom = (newRoom) => {
        const updatedRooms = [...rooms, newRoom];
        setRooms(updatedRooms);
        localStorage.setItem('rooms', JSON.stringify(updatedRooms));
    };

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col">
            <AddRoomModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onAdd={handleAddRoom}
            />
            {/* Admin Header */}
            <header className="bg-white border-b border-gray-200 h-16 flex items-center justify-between px-8 sticky top-0 z-10">
                <div className="flex items-center">
                    <div className="w-10 h-10 bg-red-600 rounded-lg flex items-center justify-center mr-3">
                        <Building2 className="text-white w-6 h-6" />
                    </div>
                    <div>
                        <h1 className="text-lg font-bold text-gray-900 leading-none">Admin Control Panel</h1>
                        <p className="text-sm text-gray-500">Manage Rooms</p>
                    </div>
                </div>
                <button
                    onClick={handleLogout}
                    className="flex items-center px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition-colors"
                >
                    <LogOut className="w-4 h-4 mr-2" />
                    Logout
                </button>
            </header>

            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
                    <div className="flex bg-white p-1 rounded-xl shadow-sm border border-gray-200">
                        <button
                            onClick={() => setActiveTab('rooms')}
                            className={`flex items-center px-4 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === 'rooms' ? 'bg-red-600 text-white shadow-md' : 'text-gray-600 hover:bg-gray-50'}`}
                        >
                            <LayoutGrid className="w-4 h-4 mr-2" />
                            Rooms
                        </button>
                        <button
                            onClick={() => setActiveTab('users')}
                            className={`flex items-center px-4 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === 'users' ? 'bg-red-600 text-white shadow-md' : 'text-gray-600 hover:bg-gray-50'}`}
                        >
                            <Users className="w-4 h-4 mr-2" />
                            Active Users
                        </button>
                    </div>

                    {activeTab === 'rooms' && (
                        <button
                            onClick={() => setIsModalOpen(true)}
                            className="flex items-center px-6 py-2.5 bg-red-600 text-white font-bold rounded-lg hover:bg-red-700 transition-all shadow-lg shadow-red-100 scale-100 hover:scale-105"
                        >
                            <Plus className="w-5 h-5 mr-2" />
                            Add New Room
                        </button>
                    )}
                </div>

                {activeTab === 'rooms' ? (
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Room Name</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Floor</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Capacity</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {rooms.map((room) => (
                                    <tr key={room.id} className="hover:bg-gray-50 transition-colors">
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{room.name}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{room.floor}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{room.capacity} people</td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${room.status === 'Available' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                                                }`}>
                                                {room.status}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                            <button className="text-blue-600 hover:text-blue-900 mr-4">
                                                <Edit className="w-4 h-4" />
                                            </button>
                                            <button
                                                onClick={() => deleteRoom(room.id)}
                                                className="text-red-600 hover:text-red-900"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User Email</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Login Time</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Duration</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {activeSessions.length > 0 ? (
                                    activeSessions.map((session) => (
                                        <tr key={session.id} className="hover:bg-gray-50 transition-colors">
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="flex items-center">
                                                    <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center mr-3">
                                                        <Monitor className="w-4 h-4 text-blue-600" />
                                                    </div>
                                                    <span className="text-sm font-medium text-gray-900">{session.email}</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                <div className="flex items-center">
                                                    <Clock className="w-3.5 h-3.5 mr-1.5" />
                                                    {new Date(session.loginTime).toLocaleTimeString()}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{calculateDuration(session.loginTime)}</td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                                    {session.status}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                                <button
                                                    onClick={() => removeSession(session.id)}
                                                    className="text-red-600 hover:text-red-900 flex items-center justify-end ml-auto"
                                                    title="Disconnect User"
                                                >
                                                    <XCircle className="w-4 h-4 mr-1" />
                                                    Disconnect
                                                </button>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan="5" className="px-6 py-12 text-center text-gray-500">
                                            No active user sessions found.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                )}
            </main>
        </div>
    );
};

export default AdminDashboard;
