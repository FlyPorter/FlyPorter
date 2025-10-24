import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import BookingForm from '../features/booking/components/BookingForm';
import NavigationBar from '../components/NavigationBar';
import { FlightDisplay } from '../features/search/types';

const BookingPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [selectedFlight, setSelectedFlight] = useState<FlightDisplay | null>(null);

  useEffect(() => {
    // Get flight data from navigation state
    const flightData = location.state as { flight: FlightDisplay } | null;
    if (flightData?.flight) {
      setSelectedFlight(flightData.flight);
    } else {
      // If no flight data, redirect to search
      navigate('/search');
    }
  }, [location.state, navigate]);

  const handleBookingComplete = (bookingId: string) => {
    // Navigate to booking confirmation page
    navigate('/booking-confirmation', { state: { bookingId } });
  };

  if (!selectedFlight) {
    return (
      <div className="min-h-screen bg-gray-50">
        <NavigationBar />
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">No Flight Selected</h2>
            <p className="text-gray-600 mb-6">Please select a flight to continue with booking.</p>
            <button
              onClick={() => navigate('/search')}
              className="px-6 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              Search Flights
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <NavigationBar />
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold text-gray-800 mb-8">Complete Your Booking</h1>
          
          {/* Flight Summary */}
          <div className="bg-white rounded-lg shadow-md p-6 mb-8">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Flight Details</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-600">From</p>
                <p className="text-lg font-medium">{selectedFlight.origin.name}</p>
                <p className="text-sm text-gray-500">{selectedFlight.origin.code}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">To</p>
                <p className="text-lg font-medium">{selectedFlight.destination.name}</p>
                <p className="text-sm text-gray-500">{selectedFlight.destination.code}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Departure</p>
                <p className="text-lg font-medium">{selectedFlight.departureTime}</p>
                <p className="text-sm text-gray-500">{selectedFlight.departureDate}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Arrival</p>
                <p className="text-lg font-medium">{selectedFlight.arrivalTime}</p>
                <p className="text-sm text-gray-500">{selectedFlight.arrivalDate}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Airline</p>
                <p className="text-lg font-medium">{selectedFlight.airline.name}</p>
                <p className="text-sm text-gray-500">Flight {selectedFlight.flightNumber}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Price</p>
                <p className="text-2xl font-bold text-blue-600">${selectedFlight.price}</p>
              </div>
            </div>
          </div>

          {/* Booking Form */}
          <BookingForm 
            flight={selectedFlight} 
            onBookingComplete={handleBookingComplete}
          />
        </div>
      </div>
    </div>
  );
};

export default BookingPage;
