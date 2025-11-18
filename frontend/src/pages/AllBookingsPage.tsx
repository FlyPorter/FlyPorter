import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../features/dashboard/components/Sidebar';
import NavigationBar from '../components/NavigationBar';
import { Menu, X } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Card } from '../components/ui/card';
import { Skeleton } from '../components/ui/skeleton';
import { API_BASE_URL } from '../config';

interface BookingDisplay {
  booking_id: number;
  user_id: number;
  flight_id: number;
  seat_number: string;
  booking_time: string;
  status: string;
  total_price: number | null;
  confirmation_code: string | null;
  user?: {
    email: string;
    customer_info: {
      full_name: string;
    } | null;
  };
  flight: {
    flight_id: number;
    departure_time: string;
    arrival_time: string;
    route: {
      origin_airport: {
        airport_code: string;
        city_name: string;
      };
      destination_airport: {
        airport_code: string;
        city_name: string;
      };
    };
    airline: {
      airline_code: string;
      airline_name: string;
    };
  };
  seat: {
    seat_number: string;
    class: string;
  };
}

const AllBookingsPage = () => {
  const navigate = useNavigate();
  const [bookings, setBookings] = useState<BookingDisplay[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState<BookingDisplay | null>(null);

  // Get user role
  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const role = user?.role || "user";

  // Disable body scroll when sidebar is open on mobile
  useEffect(() => {
    if (isSidebarOpen) {
      const isMobile = window.innerWidth < 1024;
      if (isMobile) {
        document.body.style.overflow = 'hidden';
      }
    } else {
      document.body.style.overflow = '';
    }

    return () => {
      document.body.style.overflow = '';
    };
  }, [isSidebarOpen]);

  // Fetch all bookings
  useEffect(() => {
    const fetchAllBookings = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const response = await fetch(`${API_BASE_URL}/bookings/admin/all`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem("token")}`
          }
        });

        if (!response.ok) {
          if (response.status === 403) {
            throw new Error('Admin access required');
          }
          throw new Error('Failed to fetch bookings');
        }

        const responseData = await response.json();
        const bookingsData = responseData.success && responseData.data ? responseData.data : responseData;
        
        setBookings(bookingsData);
      } catch (err: any) {
        console.error("Error fetching bookings:", err);
        setError(err.message || "Failed to load bookings");
      } finally {
        setIsLoading(false);
      }
    };

    fetchAllBookings();
  }, []);

  const handleCancelBooking = async (booking: BookingDisplay) => {
    if (!window.confirm(`Are you sure you want to cancel booking ${booking.confirmation_code || booking.booking_id}?`)) {
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/bookings/admin/${booking.booking_id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem("token")}`
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || errorData.message || "Failed to cancel booking");
      }

      // Remove cancelled booking from list
      setBookings((prev) => prev.filter((b) => b.booking_id !== booking.booking_id));
      alert("Booking cancelled successfully!");
    } catch (err: any) {
      console.error("Error canceling booking:", err);
      alert(err.message || "Failed to cancel booking.");
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    });
  };

  const calculateDuration = (departure: string, arrival: string) => {
    const dep = new Date(departure);
    const arr = new Date(arrival);
    const durationMs = arr.getTime() - dep.getTime();
    const durationMins = Math.floor(durationMs / 60000);
    const hours = Math.floor(durationMins / 60);
    const mins = durationMins % 60;
    return `${hours}h ${mins}m`;
  };

  const renderBookingCard = (booking: BookingDisplay) => {
    const isCancelled = booking.status === 'CANCELLED' || booking.status === 'cancelled';
    const isPast = new Date(booking.flight.departure_time) < new Date();

    return (
      <div className="flex flex-col lg:flex-row gap-4 w-full">
        <Card className={`flex-1 p-4 hover:shadow-md transition-shadow relative ${isCancelled ? 'opacity-60' : ''}`}>
          <div className="absolute top-4 right-4 flex flex-col items-end gap-1">
            <div className="text-xl font-bold bg-gradient-to-r from-teal-600 to-cyan-600 bg-clip-text text-transparent">
              ${booking.total_price ? Number(booking.total_price).toFixed(2) : '0.00'}
            </div>
            {isCancelled && (
              <span className="text-xs bg-red-100 text-red-700 px-2 py-1 rounded">CANCELLED</span>
            )}
            {isPast && !isCancelled && (
              <span className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded">PAST</span>
            )}
          </div>

          <div className="w-full pr-24">
            <div className="flex items-center space-x-4 mb-2">
              <div className="text-base sm:text-lg font-semibold">
                {booking.flight.airline.airline_name} ({booking.flight.airline.airline_code})
              </div>
              <div className="text-sm sm:text-base text-gray-600">Flight {booking.flight.flight_id}</div>
            </div>
            
            <div className="text-sm sm:text-base font-medium text-gray-700 mb-2">
              User: {booking.user?.customer_info?.full_name || booking.user?.email || `User #${booking.user_id}`}
              {booking.user?.email && booking.user?.customer_info?.full_name && (
                <span className="text-gray-500 text-xs ml-2">({booking.user.email})</span>
              )}
            </div>
            
            {booking.confirmation_code && (
              <div className="text-sm text-gray-600 mb-2">
                Confirmation: <span className="font-mono">{booking.confirmation_code}</span>
              </div>
            )}

            <div className="mt-2 flex flex-col sm:flex-row items-start sm:items-center space-y-2 sm:space-y-0 sm:space-x-4">
              <div>
                <div className="text-base sm:text-lg font-medium">{formatTime(booking.flight.departure_time)}</div>
                <div className="text-sm text-gray-500">{formatDate(booking.flight.departure_time)}</div>
                <div className="text-sm sm:text-base text-gray-600">
                  {booking.flight.route.origin_airport.city_name} ({booking.flight.route.origin_airport.airport_code})
                </div>
              </div>
              <div className="flex-1 text-center">
                <div className="text-xs sm:text-sm text-gray-600">{calculateDuration(booking.flight.departure_time, booking.flight.arrival_time)}</div>
                <div className="h-0.5 bg-gray-200 my-2"></div>
                <div className="text-xs sm:text-sm text-gray-600">Direct Flight</div>
              </div>
              <div className="text-right">
                <div className="text-base sm:text-lg font-medium">{formatTime(booking.flight.arrival_time)}</div>
                <div className="text-sm text-gray-500">{formatDate(booking.flight.arrival_time)}</div>
                <div className="text-xs sm:text-sm text-gray-600">
                  {booking.flight.route.destination_airport.city_name} ({booking.flight.route.destination_airport.airport_code})
                </div>
              </div>
            </div>
            
            <div className="mt-2 text-sm text-gray-500">
              Seat: {booking.seat_number} ({booking.seat.class})
            </div>
            
            <div className="text-xs text-gray-400 mt-1">
              Booked: {formatDate(booking.booking_time)} at {formatTime(booking.booking_time)}
            </div>
          </div>
        </Card>

        <Card className="p-4 hover:shadow-md transition-shadow w-full lg:w-auto lg:min-w-[200px]">
          <div className="flex flex-col items-center gap-2 h-full justify-center">
            <button
              onClick={() => setSelectedBooking(booking)}
              className="w-full bg-gradient-to-r from-teal-600 to-cyan-600 hover:from-teal-700 hover:to-cyan-700 text-white px-4 py-2 rounded-lg cursor-pointer font-medium transition-all shadow-md hover:shadow-lg"
            >
              View Details
            </button>
            {!isCancelled && !isPast && (
              <button
                onClick={() => handleCancelBooking(booking)}
                className="w-full bg-gradient-to-r from-red-500 to-rose-500 hover:from-red-600 hover:to-rose-600 text-white px-4 py-2 rounded-lg cursor-pointer font-medium transition-all shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={isLoading}
              >
                Cancel Booking
              </button>
            )}
          </div>
        </Card>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50/50 via-cyan-50/50 to-teal-100/20">
      <NavigationBar />
      <div className="flex flex-col lg:flex-row relative lg:h-[calc(100vh-3.5rem)]">
        {/* Mobile Sidebar Overlay */}
        {isSidebarOpen && (
          <div 
            className="fixed inset-0 bg-black/50 z-40 lg:hidden"
            onClick={() => setIsSidebarOpen(false)}
          />
        )}

        {/* Sidebar */}
        <div 
          className={`
            fixed lg:sticky top-14 left-0 z-50 lg:z-10
            h-[calc(100vh-3.5rem)] lg:h-[calc(100vh-3.5rem)]
            transform transition-transform duration-300 ease-in-out
            ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
            lg:top-14 lg:self-start
          `}
        >
          <Sidebar role={role} onClose={() => setIsSidebarOpen(false)} />
        </div>

        {/* Main Content */}
        <div className="flex-1 w-full lg:w-auto lg:overflow-y-auto">
          {/* Mobile Menu Button */}
          <div className="lg:hidden sticky z-30 bg-gradient-to-r from-teal-50 to-cyan-50 border-b border-teal-200/50 px-4 py-2 -mt-[1px]" style={{ top: 'calc(3.5rem - 1px)' }}>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="text-teal-700 hover:text-teal-900"
            >
              {isSidebarOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </Button>
          </div>

          <div className={`container mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8 ${isSidebarOpen ? 'lg:overflow-y-auto overflow-hidden' : 'overflow-y-auto'}`}>
            <div className="mb-6">
              <h2 className="text-xl sm:text-2xl font-semibold bg-gradient-to-r from-teal-700 to-cyan-700 bg-clip-text text-transparent">
                All Bookings
              </h2>
              <p className="text-xs sm:text-sm text-teal-700 mt-1">
                {bookings.length} total booking{bookings.length !== 1 ? 's' : ''}
              </p>
            </div>

            {isLoading && bookings.length === 0 ? (
              <div className="space-y-4">
                {[...Array(3)].map((_, i) => (
                  <Skeleton key={i} className="h-32 rounded-md" />
                ))}
              </div>
            ) : error ? (
              <div className="flex justify-center items-center h-64">
                <div className="text-red-500 font-medium">{error}</div>
              </div>
            ) : bookings.length === 0 ? (
              <div className="flex justify-center items-center h-64">
                <div className="text-gray-500">No bookings found</div>
              </div>
            ) : (() => {
              // Categorize bookings
              const now = new Date();
              const confirmed: BookingDisplay[] = [];
              const cancelled: BookingDisplay[] = [];
              const past: BookingDisplay[] = [];

              bookings.forEach((booking) => {
                const isCancelled = booking.status === 'CANCELLED' || booking.status === 'cancelled';
                const departureDate = new Date(booking.flight.departure_time);
                const isPast = departureDate < now;

                if (isCancelled) {
                  cancelled.push(booking);
                } else if (isPast) {
                  past.push(booking);
                } else {
                  confirmed.push(booking);
                }
              });

              return (
                <div className="space-y-8">
                  {/* Confirmed Bookings */}
                  {confirmed.length > 0 && (
                    <div>
                      <div className="flex items-center gap-3 mb-4">
                        <h3 className="text-lg sm:text-xl font-semibold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
                          Confirmed
                        </h3>
                        <span className="text-sm text-gray-500 bg-green-50 px-3 py-1 rounded-full border border-green-200">
                          {confirmed.length}
                        </span>
                      </div>
                      <div className="space-y-4">
                        {confirmed.map((booking) => (
                          <div key={booking.booking_id}>{renderBookingCard(booking)}</div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Past Bookings */}
                  {past.length > 0 && (
                    <div>
                      <div className="flex items-center gap-3 mb-4">
                        <h3 className="text-lg sm:text-xl font-semibold bg-gradient-to-r from-gray-600 to-slate-600 bg-clip-text text-transparent">
                          Past
                        </h3>
                        <span className="text-sm text-gray-500 bg-gray-50 px-3 py-1 rounded-full border border-gray-200">
                          {past.length}
                        </span>
                      </div>
                      <div className="space-y-4">
                        {past.map((booking) => (
                          <div key={booking.booking_id}>{renderBookingCard(booking)}</div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Cancelled Bookings */}
                  {cancelled.length > 0 && (
                    <div>
                      <div className="flex items-center gap-3 mb-4">
                        <h3 className="text-lg sm:text-xl font-semibold bg-gradient-to-r from-red-600 to-rose-600 bg-clip-text text-transparent">
                          Cancelled
                        </h3>
                        <span className="text-sm text-gray-500 bg-red-50 px-3 py-1 rounded-full border border-red-200">
                          {cancelled.length}
                        </span>
                      </div>
                      <div className="space-y-4">
                        {cancelled.map((booking) => (
                          <div key={booking.booking_id}>{renderBookingCard(booking)}</div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Show message if no bookings in any category */}
                  {confirmed.length === 0 && past.length === 0 && cancelled.length === 0 && (
                    <div className="flex justify-center items-center h-64">
                      <div className="text-gray-500">No bookings found</div>
                    </div>
                  )}
                </div>
              );
            })()}

            {/* Modal for Booking Details */}
            {selectedBooking && (
              <div 
                className="fixed inset-0 flex items-center justify-center bg-black/60 backdrop-blur-sm z-50 p-4"
                onClick={(e) => {
                  if (e.target === e.currentTarget) {
                    setSelectedBooking(null);
                  }
                }}
              >
                <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
                  {/* Header */}
                  <div className="bg-gradient-to-r from-teal-600 to-cyan-600 px-6 py-4 text-white">
                    <div className="flex items-center justify-between">
                      <h2 className="text-xl font-bold">Booking Details</h2>
                      <button
                        onClick={() => setSelectedBooking(null)}
                        className="text-white/80 hover:text-white transition-colors text-2xl leading-none"
                      >
                        ×
                      </button>
                    </div>
                    {selectedBooking.confirmation_code && (
                      <p className="text-teal-100 text-sm mt-1 font-mono">
                        {selectedBooking.confirmation_code}
                      </p>
                    )}
                  </div>

                  {/* Content */}
                  <div className="overflow-y-auto p-6 space-y-6">
                    {/* Status Badge */}
                    <div className="flex items-center gap-3">
                      <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                        selectedBooking.status === 'CANCELLED' || selectedBooking.status === 'cancelled'
                          ? 'bg-red-100 text-red-700'
                          : selectedBooking.status === 'CONFIRMED' || selectedBooking.status === 'confirmed'
                          ? 'bg-green-100 text-green-700'
                          : 'bg-yellow-100 text-yellow-700'
                      }`}>
                        {selectedBooking.status.toUpperCase()}
                      </span>
                      <span className="text-2xl font-bold bg-gradient-to-r from-teal-600 to-cyan-600 bg-clip-text text-transparent">
                        ${selectedBooking.total_price ? Number(selectedBooking.total_price).toFixed(2) : '0.00'}
                      </span>
                    </div>

                    {/* Flight Information */}
                    <div className="border border-gray-200 rounded-lg p-4 bg-gradient-to-br from-teal-50/50 to-cyan-50/50">
                      <h3 className="font-semibold text-gray-700 mb-3 text-sm uppercase tracking-wide">Flight Information</h3>
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-gray-600">Flight Number</span>
                          <span className="font-medium">{selectedBooking.flight.flight_id}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-gray-600">Seat</span>
                          <span className="font-medium">{selectedBooking.seat_number} <span className="text-gray-500">({selectedBooking.seat.class})</span></span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-gray-600">Duration</span>
                          <span className="font-medium">{calculateDuration(selectedBooking.flight.departure_time, selectedBooking.flight.arrival_time)}</span>
                        </div>
                      </div>
                    </div>

                    {/* Route Information */}
                    <div className="border border-gray-200 rounded-lg p-4">
                      <h3 className="font-semibold text-gray-700 mb-3 text-sm uppercase tracking-wide">Route</h3>
                      <div className="space-y-4">
                        {/* Departure */}
                        <div className="flex items-start gap-4">
                          <div className="flex-1">
                            <div className="text-xs text-gray-500 uppercase tracking-wide mb-1">Departure</div>
                            <div className="text-lg font-semibold text-gray-900">
                              {selectedBooking.flight.route.origin_airport.city_name}
                            </div>
                            <div className="text-sm text-gray-600">
                              {selectedBooking.flight.route.origin_airport.airport_code}
                            </div>
                            <div className="text-sm font-medium text-gray-700 mt-1">
                              {formatTime(selectedBooking.flight.departure_time)}
                            </div>
                            <div className="text-xs text-gray-500">
                              {formatDate(selectedBooking.flight.departure_time)}
                            </div>
                          </div>
                        </div>

                        {/* Arrival */}
                        <div className="flex items-start gap-4">
                          <div className="flex-1">
                            <div className="text-xs text-gray-500 uppercase tracking-wide mb-1">Arrival</div>
                            <div className="text-lg font-semibold text-gray-900">
                              {selectedBooking.flight.route.destination_airport.city_name}
                            </div>
                            <div className="text-sm text-gray-600">
                              {selectedBooking.flight.route.destination_airport.airport_code}
                            </div>
                            <div className="text-sm font-medium text-gray-700 mt-1">
                              {formatTime(selectedBooking.flight.arrival_time)}
                            </div>
                            <div className="text-xs text-gray-500">
                              {formatDate(selectedBooking.flight.arrival_time)}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Booking Information */}
                    <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                      <h3 className="font-semibold text-gray-700 mb-3 text-sm uppercase tracking-wide">Booking Information</h3>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-gray-600">Booking ID</span>
                          <span className="font-medium font-mono">{selectedBooking.booking_id}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-gray-600">User</span>
                          <span className="font-medium text-right">
                            {selectedBooking.user?.customer_info?.full_name || selectedBooking.user?.email || `User #${selectedBooking.user_id}`}
                            {selectedBooking.user?.email && selectedBooking.user?.customer_info?.full_name && (
                              <div className="text-sm text-gray-500 font-normal">{selectedBooking.user.email}</div>
                            )}
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-gray-600">User ID</span>
                          <span className="font-medium font-mono">{selectedBooking.user_id}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-gray-600">Booked On</span>
                          <span className="font-medium">{formatDate(selectedBooking.booking_time)} at {formatTime(selectedBooking.booking_time)}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Footer */}
                  <div className="border-t border-gray-200 px-6 py-4 bg-gray-50 flex justify-end gap-3">
                    <button
                      onClick={() => setSelectedBooking(null)}
                      className="px-6 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg font-medium transition-colors cursor-pointer"
                    >
                      Close
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
      {/* Footer */}
      <footer className="mt-4 py-2 text-center text-gray-600 text-xs">
        © 2025 FlyPorter
      </footer>
    </div>
  );
};

export default AllBookingsPage;

