import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import SeatModify from '../features/dashboard/components/SeatModify';
import { Seat } from '../features/dashboard/types';
import NavigationBar from '../components/NavigationBar';

import { API_BASE_URL } from "../config";

const SeatModifyPage: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const flight = location.state?.flight;
  const bookingId = location.state?.ticketId;
  const [selectedSeat, setSelectedSeat] = useState<Seat | null>(null);
  const [currentSeat, setCurrentSeat] = useState<Seat | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSeatSelect = (seat: Seat) => {
    setSelectedSeat(seat);
  };

  // Fetch current booking details to get current seat
  useEffect(() => {
    const fetchCurrentBooking = async () => {
      if (!bookingId) return;
      
      try {
        const token = localStorage.getItem("token");
        if (!token) return;

        const response = await fetch(`${API_BASE_URL}/bookings/${bookingId}`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        if (response.ok) {
          const responseData = await response.json();
          const bookingData = responseData.success && responseData.data ? responseData.data : responseData;
          
          // Extract current seat information if available
          if (bookingData.seat_number) {
            const seatModifier = bookingData.seat?.price_modifier 
              ? Number(bookingData.seat.price_modifier) 
              : 1;
            
            // Parse seat number to extract row and column if possible (e.g., "1A" -> row: 1, column: 0)
            const seatNumberStr = bookingData.seat_number.toString();
            const match = seatNumberStr.match(/^(\d+)([A-Z])?$/);
            const row = match ? parseInt(match[1]) : 0;
            const column = match && match[2] ? match[2].charCodeAt(0) - 65 : 0;
            
            setCurrentSeat({
              id: bookingData.seat_number.toString(),
              row: row,
              column: column,
              status: 'BOOKED',
              price: seatModifier,
              version: bookingData.seat?.class === 'first' ? 2 : bookingData.seat?.class === 'business' ? 1 : 0
            });
          }
        }
      } catch (err) {
        console.error('Error fetching current booking:', err);
      }
    };

    fetchCurrentBooking();
  }, [bookingId]);

  const handleModifySeat = async () => {
    if (!selectedSeat || !flight || !bookingId) return;
    setIsUpdating(true);
    setError(null);

    try {
      const token = localStorage.getItem("token");
      if (!token) throw new Error("Unauthorized: No token found");

      // Since backend doesn't have a direct update booking seat endpoint,
      // we need to cancel the current booking and create a new one
      // First, get the current booking details
      const bookingResponse = await fetch(`${API_BASE_URL}/bookings/${bookingId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!bookingResponse.ok) {
        throw new Error("Failed to fetch current booking");
      }

      const bookingData = await bookingResponse.json();
      const booking = bookingData.success && bookingData.data ? bookingData.data : bookingData;

      // Cancel the current booking
      const cancelResponse = await fetch(`${API_BASE_URL}/bookings/${bookingId}`, {
        method: "DELETE",
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!cancelResponse.ok) {
        const errorData = await cancelResponse.json().catch(() => ({}));
        throw new Error(errorData.error || errorData.message || "Failed to cancel current booking");
      }

      // Create a new booking with the new seat
      const createResponse = await fetch(`${API_BASE_URL}/bookings`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          flight_id: booking.flight_id,
          seat_number: selectedSeat.id
        }),
      });

      if (!createResponse.ok) {
        const errorData = await createResponse.json().catch(() => ({}));
        throw new Error(errorData.error || errorData.message || "Failed to create new booking with selected seat");
      }

      navigate("/dashboard");
    } catch (err: any) {
      console.error("Error modifying seat:", err);
      setError(err.message || "Error updating seat. Please try again.");
    } finally {
      setIsUpdating(false);
    }
  };

  if (!flight || !bookingId) {
    return (
      <div className="min-h-screen bg-gray-50">
        <NavigationBar />
        <div className="container mx-auto px-4 py-8 text-center">
          <h2 className="text-2xl font-semibold text-red-600">Invalid Selection</h2>
          <p className="mt-2 text-gray-600">Missing flight or booking information.</p>
          <button
            onClick={() => navigate("/search")}
            className="mt-4 px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
          >
            Back to Search
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <NavigationBar />
      <div className="container mx-auto px-4 py-8">
        <SeatModify
          flightId={flight}
          onSeatSelect={handleSeatSelect}
          selectedSeat={selectedSeat}
          currentSeat={currentSeat}
        />
        
        <div className="mt-6 flex flex-col items-center gap-4">
          {error && (
            <div className="text-red-500 text-sm">{error}</div>
          )}
          <button
            onClick={handleModifySeat}
            disabled={!selectedSeat || isUpdating}
            className={`
              px-6 py-2 rounded-md text-white font-medium
              ${selectedSeat && !isUpdating
                ? 'bg-blue-500 hover:bg-blue-600' 
                : 'bg-gray-300 cursor-not-allowed'
              }
            `}
          >
            {isUpdating ? 'Updating Seat...' : 'Update Seat'}
          </button>
        </div>
      </div>
      {/* Footer */}
      <footer className="mt-4 py-2 text-center text-gray-600 text-xs">
        © 2025 FlyPorter
      </footer>
    </div>
  );
};

export default SeatModifyPage; 