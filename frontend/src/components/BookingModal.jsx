import React, { useState } from 'react';
import { X, Calendar as CalendarIcon, Clock, ChevronDown } from 'lucide-react';

const BookingModal = ({ isOpen, onClose, room, type }) => {
    const isReservation = type === 'reservation';
    const [formData, setFormData] = useState({
        date: new Date().toISOString().split('T')[0],
        startTime: '',
        endTime: '',
        duration: '',
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);

    if (!isOpen || !room) return null;

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        setSuccess(false);

        // Get current user from localStorage
        const userStr = localStorage.getItem('user');
        if (!userStr) {
            setError('Please login to book a room');
            setLoading(false);
            return;
        }
        const user = JSON.parse(userStr);

        try {
            const response = await fetch('http://localhost:3000/book', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    userId: user.id,
                    roomId: room.id,
                    date: formData.date,
                    startTime: formData.startTime.replace(' AM', ':00').replace(' PM', ':00'), // Simple conversion for backend
                    endTime: formData.endTime.replace(' AM', ':00').replace(' PM', ':00'),
                    type: type // 'booking' or 'reservation'
                }),
            });

            const data = await response.json();

            if (response.ok) {
                setSuccess(true);
                setTimeout(() => {
                    onClose();
                }, 2000);
            } else {
                setError(data.error || 'Booking failed');
            }
        } catch (err) {
            console.error('Booking error:', err);
            setError('Network error. Please check if the backend server is running.');
        } finally {
            setLoading(false);
        }
    };

    const timeOptions = [
        '08:00 AM', '09:00 AM', '10:00 AM', '11:00 AM', '12:00 PM',
        '01:00 PM', '02:00 PM', '03:00 PM', '04:00 PM', '05:00 PM'
    ];

    const durationOptions = [
        '30 mins', '1 hour', '1.5 hours', '2 hours', '3 hours', 'Full day'
    ];

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <div
                className="fixed inset-0 bg-black/40 backdrop-blur-sm"
                onClick={onClose}
            ></div>

            {/* Modal Content */}
            <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in duration-200">
                <div className="p-6">
                    <div className="flex justify-between items-start mb-6">
                        <div>
                            <h2 className="text-2xl font-bold text-gray-900">
                                {isReservation ? 'Reserve' : 'Book'} {room.name}
                            </h2>
                            <p className="text-gray-500 mt-1">
                                Select a date, time, and duration for your {isReservation ? 'reservation' : 'booking'}
                            </p>
                        </div>
                        <button
                            onClick={onClose}
                            className="p-1 rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
                        >
                            <X className="w-6 h-6" />
                        </button>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-6">
                        {error && (
                            <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-600 font-medium">
                                {error}
                            </div>
                        )}
                        {success && (
                            <div className="p-3 bg-green-50 border border-green-200 rounded-xl text-sm text-green-600 font-medium">
                                Booking confirmed! Check your email for details.
                            </div>
                        )}
                        {/* Date Picker */}
                        <div className="space-y-2">
                            <label className="text-sm font-semibold text-gray-700 flex items-center">
                                Date
                            </label>
                            <div className="relative">
                                <input
                                    type="date"
                                    value={formData.date}
                                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                                    className="w-full bg-gray-50 border border-transparent rounded-xl px-4 py-3 text-gray-900 focus:bg-white focus:ring-2 focus:ring-blue-500 transition-all outline-none"
                                    required
                                />
                                <CalendarIcon className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
                            </div>
                        </div>

                        {/* Start Time Select */}
                        <div className="space-y-2">
                            <label className="text-sm font-semibold text-gray-700">Start Time</label>
                            <div className="relative">
                                <select
                                    value={formData.startTime}
                                    onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                                    className="w-full bg-gray-50 border border-transparent rounded-xl px-4 py-3 text-gray-900 focus:bg-white focus:ring-2 focus:ring-blue-500 transition-all outline-none appearance-none"
                                    required
                                >
                                    <option value="" disabled>Select start time</option>
                                    {timeOptions.map(time => (
                                        <option key={time} value={time}>{time}</option>
                                    ))}
                                </select>
                                <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
                            </div>
                        </div>

                        {/* End Time Select */}
                        <div className="space-y-2">
                            <label className="text-sm font-semibold text-gray-700">End Time</label>
                            <div className="relative">
                                <select
                                    value={formData.endTime}
                                    onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                                    className="w-full bg-gray-50 border border-transparent rounded-xl px-4 py-3 text-gray-900 focus:bg-white focus:ring-2 focus:ring-blue-500 transition-all outline-none appearance-none"
                                    required
                                >
                                    <option value="" disabled>Select end time</option>
                                    {timeOptions.map(time => (
                                        <option key={time} value={time}>{time}</option>
                                    ))}
                                </select>
                                <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
                            </div>
                        </div>

                        {/* Duration Select - Only for Reservation as per mockup */}
                        {isReservation && (
                            <div className="space-y-2">
                                <label className="text-sm font-semibold text-gray-700">Duration</label>
                                <div className="relative">
                                    <select
                                        value={formData.duration}
                                        onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
                                        className="w-full bg-gray-50 border border-transparent rounded-xl px-4 py-3 text-gray-900 focus:bg-white focus:ring-2 focus:ring-blue-500 transition-all outline-none appearance-none"
                                        required={isReservation}
                                    >
                                        <option value="" disabled>Select duration</option>
                                        {durationOptions.map(d => (
                                            <option key={d} value={d}>{d}</option>
                                        ))}
                                    </select>
                                    <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
                                </div>
                            </div>
                        )}

                        {/* Footer Buttons */}
                        <div className="flex justify-end gap-3 mt-8 pt-6 border-t border-gray-100">
                            <button
                                type="button"
                                onClick={onClose}
                                className="px-6 py-2.5 rounded-xl text-sm font-bold text-gray-700 bg-white border border-gray-200 hover:bg-gray-50 transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={loading || success}
                                className="px-6 py-2.5 rounded-xl text-sm font-bold text-white bg-black hover:bg-gray-900 transition-colors shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {loading ? 'Submitting...' : success ? 'Confirmed!' : `Confirm ${isReservation ? 'Reservation' : 'Booking'}`}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default BookingModal;
