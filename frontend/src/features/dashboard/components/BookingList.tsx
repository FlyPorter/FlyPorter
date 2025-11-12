import { useState, useEffect } from 'react';
import { useNavigate } from "react-router-dom";
import { BookingDisplay  } from '../types';
import { Skeleton } from "@/components/ui/skeleton";
import { Card } from "@/components/ui/card";
import { API_BASE_URL } from "../../../config";

const BookingList: React.FC = () => {
  const [bookings, setBookings] = useState<BookingDisplay[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();
  const [selectedBooking, setSelectedBooking] = useState<BookingDisplay | null>(null);
  const [showPastFlights, setShowPastFlights] = useState(false);

  
  useEffect(() => {
    const fetchBookings = async () => {
      setIsLoading(true);
      try {
        // Use the correct bookings endpoint
        const apiUrl = `${API_BASE_URL}/bookings`;

        const response = await fetch(apiUrl, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem("token")}`
          }
        });

        // Check if response is JSON before parsing
        const contentType = response.headers.get('content-type');
        let responseData;
        
        if (!contentType || !contentType.includes('application/json')) {
          const text = await response.text();
          console.error('Non-JSON response received:', text.substring(0, 200));
          throw new Error('Server returned an invalid response. Please check if the backend is running and the API URL is correct.');
        } else {
          responseData = await response.json();
        }

        if (response.status === 404) {
          setBookings([]);
          setIsLoading(false);
          return;
        }

        if (!response.ok) {
          throw new Error(responseData.error || responseData.message || "Failed to fetch bookings");
        }

        // Handle the response structure from sendSuccess
        const bookingsData = responseData.success && responseData.data ? responseData.data : responseData;
        console.log("Bookings Data:", bookingsData);

        // Filter out cancelled bookings
        const activeBookings = bookingsData.filter((booking: any) => booking.status !== 'CANCELLED' && booking.status !== 'cancelled');
        console.log("Active Bookings (after filtering cancelled):", activeBookings);

        // Get user profile to get passenger name from customer_info
        const profileResponse = await fetch(`${API_BASE_URL}/profile`, {
          headers: { 
            'Authorization': `Bearer ${localStorage.getItem("token")}` 
          }
        });
        let passengerName = "Passenger";
        if (profileResponse.ok) {
          const profileData = await profileResponse.json();
          const profile = profileData.success && profileData.data ? profileData.data : profileData;
          
          // Use full_name from customer_info (this is the passenger name used for booking)
          // The profile endpoint already includes customer_info
          if (profile.customer_info && profile.customer_info.full_name) {
            passengerName = profile.customer_info.full_name;
          } else {
            // Fallback to email if customer_info doesn't exist or doesn't have full_name
            passengerName = profile.email || "Passenger";
          }
        }

        const enrichedBookings = activeBookings.map((booking: any) => {
          // Booking structure from backend
          const flight = booking.flight;
          const route = flight.route;
          const airline = flight.airline;
          const seat = booking.seat;

          // Parse dates
          const departureDate = new Date(flight.departure_time);
          const arrivalDate = new Date(flight.arrival_time);
          const dateStr = departureDate.toISOString().split("T")[0];
          
          // Format times
          const departureTime = departureDate.toLocaleTimeString('en-US', { 
            hour: '2-digit', 
            minute: '2-digit',
            hour12: false 
          });
          const arrivalTime = arrivalDate.toLocaleTimeString('en-US', { 
            hour: '2-digit', 
            minute: '2-digit',
            hour12: false 
          });

          // Calculate duration
          const durationMs = arrivalDate.getTime() - departureDate.getTime();
          const durationMins = Math.floor(durationMs / 60000);
          const hours = Math.floor(durationMins / 60);
          const mins = durationMins % 60;

          return {
            id: booking.booking_id,
            passenger_name: passengerName,
            flight_id: flight.flight_id,
            airlineCode: airline.airline_code,
            date: dateStr,
            price: booking.total_price ? Number(booking.total_price) : 0,
            version: seat?.class === 'business' ? 1 : seat?.class === 'first' ? 2 : 0,
            seat_number: booking.seat_number,
            airline: {
              code: airline.airline_code,
              name: airline.airline_name
            },
            departure: {
              airport: route.origin_airport.airport_code,
              city: route.origin_airport.city_name,
              time: departureTime
            },
            arrival: {
              airport: route.destination_airport.airport_code,
              city: route.destination_airport.city_name,
              time: arrivalTime
            },
            duration: `${hours}h ${mins}m`
          };
        });
        console.log("Enriched Bookings:", enrichedBookings);
  
        setBookings(enrichedBookings);
      } catch (error) {
        console.error("Error fetching bookings:", error);
        setError("Error fetching bookings. Please try again later.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchBookings();
  }, []);
  

  const handleViewBooking = (booking: BookingDisplay) => {
    setSelectedBooking(booking);
  };

  const closeModal = () => {
    setSelectedBooking(null);
  };

  const handleModifyBooking = (booking: BookingDisplay) => {
    navigate("/seat-modify", { state: { flight: booking.flight_id, ticketId: booking.id } });
  };

  const handleCancelBooking = async (booking: BookingDisplay) => {
    if (!window.confirm("Are you sure you want to cancel this booking?")) return;

    setIsLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/bookings/${booking.id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem("token")}`
        },
      });

      // Check if response is JSON before parsing
      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        const data = await response.json();
        if (!response.ok) {
          throw new Error(data.error || data.message || "Failed to cancel booking");
        }
      } else if (!response.ok) {
        throw new Error("Failed to cancel booking");
      }

      setBookings((prev) => prev.filter((b) => b.id !== booking.id));
    } catch (err: any) {
      console.error("Error canceling booking:", err);
      alert(err.message || "Failed to cancel booking.");
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    const [datePart] = dateString.split('T');
    const [year, month, day] = datePart.split('-');
    const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <Skeleton key={i} className="h-28 rounded-md" />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-red-500 font-medium">{error}</div>
      </div>
    );
  }

  if (bookings.length === 0) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-gray-500">No bookings found</div>
      </div>
    );
  }

  // Separate bookings into past and upcoming based on departure date
  const today = new Date();
  today.setHours(0, 0, 0, 0); // Reset time to start of day for accurate comparison

  const upcomingBookings = bookings.filter((booking) => {
    const [year, month, day] = booking.date.split('-');
    const departureDate = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
    departureDate.setHours(0, 0, 0, 0);
    return departureDate >= today;
  }).sort((a, b) => {
    // Sort by departure date (earliest first)
    const dateA = new Date(a.date);
    const dateB = new Date(b.date);
    return dateA.getTime() - dateB.getTime();
  });

  const pastBookings = bookings.filter((booking) => {
    const [year, month, day] = booking.date.split('-');
    const departureDate = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
    departureDate.setHours(0, 0, 0, 0);
    return departureDate < today;
  }).sort((a, b) => {
    // Sort by departure date (most recent first)
    const dateA = new Date(a.date);
    const dateB = new Date(b.date);
    return dateB.getTime() - dateA.getTime();
  });

  const renderBookingCard = (booking: BookingDisplay, isPastFlight: boolean = false) => (
        <div className="flex flex-col lg:flex-row gap-4 w-full">
          {/* Flight Card - Takes most of the width */}
          <Card className="flex-1 p-4 hover:shadow-md transition-shadow relative">
            {/* Price at top right corner */}
            <div className="absolute top-4 right-4 text-xl font-bold bg-gradient-to-r from-teal-600 to-cyan-600 bg-clip-text text-transparent">
              ${booking.price}
            </div>
            
            <div className="w-full pr-20">
              <div className="flex items-center space-x-4">
                <div className="text-base sm:text-lg font-semibold">{booking.airline.name} ({booking.airline.code})</div>
                <div className="text-sm sm:text-base text-gray-600">Flight {booking.flight_id}</div>
              </div>
              <div className="text-sm sm:text-base font-medium text-gray-700 mt-1">
                Passenger: {booking.passenger_name}
              </div>
              <div className="mt-2 flex flex-col sm:flex-row items-start sm:items-center space-y-2 sm:space-y-0 sm:space-x-4">
                <div>
                  <div className="text-base sm:text-lg font-medium">{booking.departure.time}</div>
                  <div className="text-sm text-gray-500">{formatDate(booking.date)}</div>
                  <div className="text-sm sm:text-base text-gray-600">
                    {booking.departure.city} ({booking.departure.airport})
                  </div>
                </div>
                <div className="flex-1 text-center">
                  <div className="text-xs sm:text-sm text-gray-600">{booking.duration}</div>
                  <div className="h-0.5 bg-gray-200 my-2"></div>
                  <div className="text-xs sm:text-sm text-gray-600">
                    Direct Flight
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-base sm:text-lg font-medium">{booking.arrival.time}</div>
                  <div className="text-sm text-gray-500">{formatDate(booking.date)}</div>
                  <div className="text-xs sm:text-sm text-gray-600">
                    {booking.arrival.city} ({booking.arrival.airport})
                  </div>
                </div>
              </div>
              <div className="text-sm text-gray-500 mt-1">
                All times are shown in origin city time
              </div>
            </div>
          </Card>

          {/* Actions Card - Separate card for buttons */}
          <Card className="p-4 hover:shadow-md transition-shadow w-full lg:w-auto lg:min-w-[200px]">
            <div className="flex flex-col items-center lg:items-center gap-2 h-full justify-center">
              {/* Actions: View only for past flights, all actions for upcoming flights */}
              <div className="flex flex-col gap-2 w-full">
                <button
                  onClick={() => handleViewBooking(booking)}
                  className="w-full bg-gradient-to-r from-teal-600 to-cyan-600 hover:from-teal-700 hover:to-cyan-700 text-white px-4 py-2 rounded-lg cursor-pointer font-medium transition-all shadow-md hover:shadow-lg"
                >
                  View
                </button>
                {!isPastFlight && (
                  <>
                    <button
                      onClick={() => handleModifyBooking(booking)}
                      className="w-full bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-600 hover:to-yellow-600 text-white px-4 py-2 rounded-lg cursor-pointer font-medium transition-all shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                      disabled={isLoading}
                    >
                      Change Seat
                    </button>
                    <button
                      onClick={() => handleCancelBooking(booking)}
                      className="w-full bg-gradient-to-r from-red-500 to-rose-500 hover:from-red-600 hover:to-rose-600 text-white px-4 py-2 rounded-lg cursor-pointer font-medium transition-all shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                      disabled={isLoading}
                    >
                      Cancel
                    </button>
                  </>
                )}
              </div>
            </div>
          </Card>
        </div>
  );

  return (
    <div className="space-y-6">
      {/* Upcoming Flights */}
      {upcomingBookings.length > 0 && (
        <div>
          <h3 className="text-xl font-semibold mb-4 bg-gradient-to-r from-teal-700 to-cyan-700 bg-clip-text text-transparent">
            Upcoming Flights ({upcomingBookings.length})
          </h3>
          <div className="space-y-4">
            {upcomingBookings.map((booking) => (
              <div key={booking.id}>{renderBookingCard(booking, false)}</div>
            ))}
          </div>
        </div>
      )}

      {/* Past Flights - Collapsible */}
      {pastBookings.length > 0 && (
        <div>
          <button
            onClick={() => setShowPastFlights(!showPastFlights)}
            className="flex items-center justify-between w-full text-xl font-semibold mb-4 text-teal-800 hover:text-teal-900 transition-colors p-2 rounded-lg hover:bg-teal-50 border border-teal-200/50"
          >
            <span>Past Flights ({pastBookings.length})</span>
            <span className="text-sm font-normal text-teal-600">
              {showPastFlights ? '▼ Collapse' : '▶ Expand'}
            </span>
          </button>
          {showPastFlights && (
            <div className="space-y-4">
              {pastBookings.map((booking) => (
                <div key={booking.id}>{renderBookingCard(booking, true)}</div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Show message if no bookings in either category */}
      {upcomingBookings.length === 0 && pastBookings.length === 0 && (
        <div className="flex justify-center items-center h-64">
          <div className="text-gray-500">No bookings found</div>
        </div>
      )}

      {/* Modal for Booking Details */}
      {selectedBooking && (
        <div className="fixed inset-0 flex items-center justify-center bg-gray-800 bg-opacity-50 z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg w-96 max-h-[90vh] overflow-y-auto">
            <h2 className="text-lg font-bold mb-4">Booking Details</h2>
            <div className="space-y-2">
              <p>
                <span className="font-semibold">Airline:</span> {selectedBooking.airline.name}
              </p>
              <p>
                <span className="font-semibold">Flight Number:</span> {selectedBooking.flight_id}
              </p>
              <p>
                <span className="font-semibold">Date:</span> {selectedBooking.date}
              </p>
              <p>
                <span className="font-semibold">Passenger Name:</span> {selectedBooking.passenger_name}
              </p>
              {selectedBooking.seat_number && (
                <p>
                  <span className="font-semibold">Seat Number:</span> {selectedBooking.seat_number}
                </p>
              )}
              <p>
                <span className="font-semibold">Price:</span> ${selectedBooking.price}
              </p>
              <p>
                <span className="font-semibold">Departure:</span> {selectedBooking.departure.city} (
                {selectedBooking.departure.airport}) at {selectedBooking.departure.time}
              </p>
              <p>
                <span className="font-semibold">Arrival:</span> {selectedBooking.arrival.city} (
                {selectedBooking.arrival.airport}) at {selectedBooking.arrival.time}
              </p>
              <p>
                <span className="font-semibold">Duration:</span> {selectedBooking.duration}
              </p>
              <p>
                <span className="font-semibold">All times are shown in origin city time</span>
              </p>
            </div>
            <div className="mt-4 flex justify-end">
              <button
                onClick={closeModal}
                className="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400 border border-gray-400 hover:border-gray-500 cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BookingList;
