import { useState, useEffect } from 'react';
import { useNavigate } from "react-router-dom";
import { Booking , BookingListProps, BookingDisplay  } from '../types';
import { Skeleton } from "@/components/ui/skeleton";
import { Card } from "@/components/ui/card";
import { API_BASE_URL } from "../../../config";

const BookingList: React.FC = () => {
  const [bookings, setBookings] = useState<BookingDisplay[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();
  const [selectedBooking, setSelectedBooking] = useState<BookingDisplay | null>(null);
  const user = JSON.parse(localStorage.getItem("user") || "{}");

  
  useEffect(() => {
    const fetchBookings = async () => {
      setIsLoading(true);
      try {
        let apiUrl = `${API_BASE_URL}/ticket/mytickets`;
        if (user.role === "ADMIN") {
          apiUrl = `${API_BASE_URL}/ticket`;
        }

        const response = await fetch(apiUrl, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem("token")}`
          }
        });
        if (response.status === 404) {
          return (
            <div className="flex justify-center items-center h-64">
              <div className="text-gray-500">No bookings found</div>
            </div>
          );
        }

        if (!response.ok) throw new Error("Failed to fetch bookings");

        const bookingsData  = await response.json();
        console.log("Bookings Data:", bookingsData);

        const enrichedBookings = await Promise.all(bookingsData.map(async (booking: BookingDisplay) => {
          const flightResponse = await fetch(`${API_BASE_URL}/flight/${booking.flight_id}`, {
            headers: { 'Authorization': `Bearer ${localStorage.getItem("token")}` }
          });
  
          if (!flightResponse.ok) throw new Error("Failed to fetch flight data");
  
          const flight = await flightResponse.json();
  
          const airlineResponse = await fetch(`${API_BASE_URL}/airline/${flight.airline_code}`,{
            headers: {
              'Authorization': `Bearer ${localStorage.getItem("token")}`
            }
          });
          const airline = airlineResponse.ok ? await airlineResponse.json() : { code: flight.airline_code, name: flight.airline_code };
  
          const departureResponse = await fetch(`${API_BASE_URL}/airport/${flight.route.departure_airport}`, {
            headers: {
              'Authorization': `Bearer ${localStorage.getItem("token")}`
            }
          });
          const arrivalResponse = await fetch(`${API_BASE_URL}/airport/${flight.route.destination_airport}`,{
            headers: {
              'Authorization': `Bearer ${localStorage.getItem("token")}`
            }
          });
  
        const departureAirport = departureResponse.ok ? await departureResponse.json() : { code: flight.departure_airport, city: flight.departure_airport };
        const arrivalAirport = arrivalResponse.ok ? await arrivalResponse.json() : { code: flight.destination_airport, city: flight.destination_airport };
  
        const [departureHours, departureMins] = flight.route.departure_time.split(":").map(Number);
        const departureTimeStr = `${departureHours.toString().padStart(2, '0')}:${departureMins.toString().padStart(2, '0')}`;

        const duration = flight.route.duration;
        const totalDepartureMinutes = departureHours * 60 + departureMins;
        const arrivalMinutes = totalDepartureMinutes + duration;
        const arrivalHours = Math.floor(arrivalMinutes / 60) % 24;
        const arrivalMins = arrivalMinutes % 60;
        const arrivalTimeStr = `${arrivalHours.toString().padStart(2, '0')}:${arrivalMins.toString().padStart(2, '0')}`;

        const response = await fetch(`${API_BASE_URL}/passenger/${booking.passenger_id}`, {
          headers: { 
            'Authorization': `Bearer ${localStorage.getItem("token")}` 
          }
        });
        const passenger_Data  = await response.json();

          return {
            id: booking.id,
            passenger_name: passenger_Data.name,
            flight_id: flight.flight_number,
            airlineCode: flight.airline_code,
            date: flight.date.split("T")[0],
            price: booking.price,
            version: flight.version || 1,
            seat_number: booking.seat_number,
            airline: {
              code: airline.code,
              name: airline.name
            },
            departure: {
              airport: departureAirport.code,
              city: departureAirport.city,
              time: departureTimeStr 
            },
            arrival: {
              airport: arrivalAirport.code,
              city: arrivalAirport.city,
              time: arrivalTimeStr 
            },
            duration: `${Math.floor(duration / 60)}h ${duration % 60}m`
          };
        }));
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
      const response = await fetch(`${API_BASE_URL}/ticket/${booking.id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem("token")}`
        },
      });

      if (!response.ok) throw new Error("Failed to cancel booking");

      setBookings((prev) => prev.filter((b) => b.id !== booking.id));
    } catch (err) {
      console.error("Error canceling booking:", err);
      alert("Failed to cancel booking.");
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

  return (
    <div className="space-y-4">
      {bookings.map((booking) => (
        <Card key={booking.id} className="p-4 hover:shadow-md transition-shadow">
          <div className="flex flex-col sm:flex-row justify-between items-start space-y-2 sm:space-y-0">
            <div className="flex-1 w-full">
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
            <div className="ml-0 sm:ml-4 text-left sm:text-right w-full sm:w-auto">
              <div className="text-lg sm:text-xl font-bold text-blue-600">${booking.price}</div>
            </div>
          </div>

          {/* Actions: View, Modify, Cancel */}
          <div className="mt-4 flex space-x-4">
            <button
              onClick={() => handleViewBooking(booking)}
              className="text-blue-600 hover:text-blue-800 border border-blue-600 hover:border-blue-800 px-3 py-1 rounded cursor-pointer"
            >
              View
            </button>
            <button
              onClick={() => handleModifyBooking(booking)}
              className="text-yellow-600 hover:text-yellow-800 border border-yellow-600 hover:border-yellow-800 px-3 py-1 rounded cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={isLoading}
            >
              Change Seat
            </button>
            <button
              onClick={() => handleCancelBooking(booking)}
              className="text-red-600 hover:text-red-800 border border-red-600 hover:border-red-800 px-3 py-1 rounded cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={isLoading}
            >
              Cancel
            </button>
          </div>
        </Card>
      ))}

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
