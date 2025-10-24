import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import SeatModify from '../features/dashboard/components/SeatModify';
import { Seat } from '../features/seatSelection/types';
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

        const response = await fetch(`${API_BASE_URL}/ticket/${bookingId}`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (response.ok) {
          const bookingData = await response.json();
          // Extract current seat information if available
          if (bookingData.seat_number) {
            setCurrentSeat({
              seatNumber: bookingData.seat_number,
              status: 'BOOKED',
              price: bookingData.price || 0,
              version: 0 // Default to economy
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

      const response = await fetch(`${API_BASE_URL}/ticket/${bookingId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          seat_number: selectedSeat.seatNumber.toString(),
          price: selectedSeat.price
        }),
      });

      if (!response.ok) {
        if (response.status === 401) throw new Error("Unauthorized: Invalid token");
        if (response.status === 400) throw new Error("Invalid input or seat unavailable");
        if (response.status === 404) throw new Error("Ticket or seat not found");
        throw new Error("Failed to modify booking");
      }

      navigate("/dashboard");
    } catch (err) {
      setError("Error updating seat. Please try again.");
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
        
        <div className="mt-6 flex justify-center">
          <button
            onClick={handleModifySeat}
            disabled={!selectedSeat}
            className={`
              px-6 py-2 rounded-md text-white font-medium
              ${selectedSeat 
                ? 'bg-blue-500 hover:bg-blue-600' 
                : 'bg-gray-300 cursor-not-allowed'
              }
            `}
          >
            Continue to Booking
          </button>
        </div>
      </div>
    </div>
  );
};

export default SeatModifyPage; 