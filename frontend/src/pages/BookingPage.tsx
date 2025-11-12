import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import BookingForm from '../features/booking/components/BookingForm';
import NavigationBar from '../components/NavigationBar';
import { FlightDisplay } from '../features/search/types';
import { Flight, PassengerInfo } from '../features/booking/types';
import { API_BASE_URL } from '../config';

// Helper function to convert FlightDisplay to Flight
const convertFlightDisplayToFlight = (flightDisplay: FlightDisplay): Flight => {
  return {
    id: flightDisplay.id,
    flightNumber: flightDisplay.flightNumber,
    airlineCode: flightDisplay.airline.code,
    date: flightDisplay.date,
    availableTickets: flightDisplay.availableTickets,
    price: flightDisplay.price,
    airline: {
      code: flightDisplay.airline.code,
      name: flightDisplay.airline.name
    },
    departure: {
      airport: flightDisplay.departure.airport,
      city: flightDisplay.departure.city,
      time: flightDisplay.departure.time,
      date: flightDisplay.departure.date
    },
    arrival: {
      airport: flightDisplay.arrival.airport,
      city: flightDisplay.arrival.city,
      time: flightDisplay.arrival.time,
      date: flightDisplay.arrival.date
    },
    duration: flightDisplay.duration,
    aircraft: {
      id: flightDisplay.aircraft.id,
      capacity: flightDisplay.aircraft.capacity,
      model: flightDisplay.aircraft.model
    }
  };
};

const BookingPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isLoading, setIsLoading] = useState(false);
  
  // Get booking data from navigation state
  const bookingData = location.state as {
    outboundFlight: FlightDisplay;
    outboundSeat: { seatNumber: string; price: string };
    returnFlight?: FlightDisplay;
    returnSeat?: { seatNumber: string; price: string };
    isRoundTrip: boolean;
  } | null;

  useEffect(() => {
    // Check authentication first
    const token = localStorage.getItem('token');
    const user = localStorage.getItem('user');
    if (!token || !user) {
      // Redirect to login, then back to booking after login
      navigate('/login', { state: { from: location.pathname, state: location.state } });
      return;
    }

    // If no booking data, redirect to search
    if (!bookingData || !bookingData.outboundFlight) {
      navigate('/');
    }
  }, [bookingData, navigate, location]);

  const handleBookingSubmit = async (passengerInfo: PassengerInfo) => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('No authentication token found');
      }

      // Create outbound booking
      const outboundBookingResponse = await fetch(`${API_BASE_URL}/bookings`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          flight_id: bookingData!.outboundFlight.id,
          seat_number: bookingData!.outboundSeat.seatNumber
        })
      });

      if (!outboundBookingResponse.ok) {
        const errorData = await outboundBookingResponse.json().catch(() => ({}));
        throw new Error(errorData.error || errorData.message || 'Failed to create outbound booking');
      }

      const outboundBookingData = await outboundBookingResponse.json();
      const outboundBooking = outboundBookingData.success ? outboundBookingData.data : outboundBookingData;

      // Get user ID for passenger_id
      const profileResponse = await fetch(`${API_BASE_URL}/profile`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      const profileData = await profileResponse.json();
      const userId = profileData.success ? profileData.data.user_id : profileData.user_id;

      // Calculate final price: base flight price * seat price modifier
      const outboundBasePrice = parseFloat(bookingData!.outboundFlight.price);
      const outboundSeatModifier = parseFloat(bookingData!.outboundSeat.price);
      const outboundFinalPrice = outboundBasePrice * outboundSeatModifier;

      // Create outbound ticket object for confirmation page
      const outboundTicket = {
        id: outboundBooking.booking_id,
        passenger_id: userId,
        flight_id: bookingData!.outboundFlight.id,
        seat_number: parseInt(bookingData!.outboundSeat.seatNumber),
        price: outboundFinalPrice,
        passenger: {
          id: userId,
          name: passengerInfo.name,
          birth_date: passengerInfo.birth_date,
          gender: passengerInfo.gender || 'male', // Default to male if not provided
          address: passengerInfo.address,
          phone_number: passengerInfo.phone_number
        }
      };

      // Convert FlightDisplay to Flight format for confirmation page
      const outboundFlightForConfirmation = {
        id: bookingData!.outboundFlight.id,
        airline: {
          code: bookingData!.outboundFlight.airline.code,
          name: bookingData!.outboundFlight.airline.name
        },
        departure: {
          airport: bookingData!.outboundFlight.departure.airport,
          city: bookingData!.outboundFlight.departure.city,
          date: bookingData!.outboundFlight.departure.date,
          time: bookingData!.outboundFlight.departure.time
        },
        arrival: {
          airport: bookingData!.outboundFlight.arrival.airport,
          city: bookingData!.outboundFlight.arrival.city
        },
        price: parseFloat(bookingData!.outboundFlight.price)
      };

      let returnTicket = undefined;
      let returnFlightForConfirmation = undefined;

      // If round trip, create return booking
      if (bookingData!.isRoundTrip && bookingData!.returnFlight && bookingData!.returnSeat) {
        const returnBookingResponse = await fetch(`${API_BASE_URL}/bookings`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            flight_id: bookingData!.returnFlight.id,
            seat_number: bookingData!.returnSeat.seatNumber
          })
        });

        if (!returnBookingResponse.ok) {
          const errorData = await returnBookingResponse.json().catch(() => ({}));
          throw new Error(errorData.error || errorData.message || 'Failed to create return booking');
        }

        const returnBookingData = await returnBookingResponse.json();
        const returnBooking = returnBookingData.success ? returnBookingData.data : returnBookingData;

        // Calculate final price: base flight price * seat price modifier
        const returnBasePrice = parseFloat(bookingData!.returnFlight.price);
        const returnSeatModifier = parseFloat(bookingData!.returnSeat.price);
        const returnFinalPrice = returnBasePrice * returnSeatModifier;

        // Create return ticket object
        returnTicket = {
          id: returnBooking.booking_id,
          passenger_id: userId,
          flight_id: bookingData!.returnFlight.id,
          seat_number: parseInt(bookingData!.returnSeat.seatNumber),
          price: returnFinalPrice,
          passenger: {
            id: userId,
            name: passengerInfo.name,
            birth_date: passengerInfo.birth_date,
            gender: passengerInfo.gender || 'male', // Default to male if not provided
            address: passengerInfo.address,
            phone_number: passengerInfo.phone_number
          }
        };

        // Convert return FlightDisplay to Flight format
        returnFlightForConfirmation = {
          id: bookingData!.returnFlight.id,
          airline: {
            code: bookingData!.returnFlight.airline.code,
            name: bookingData!.returnFlight.airline.name
          },
          departure: {
            airport: bookingData!.returnFlight.departure.airport,
            city: bookingData!.returnFlight.departure.city,
            date: bookingData!.returnFlight.departure.date,
            time: bookingData!.returnFlight.departure.time
          },
          arrival: {
            airport: bookingData!.returnFlight.arrival.airport,
            city: bookingData!.returnFlight.arrival.city
          },
          price: parseFloat(bookingData!.returnFlight.price)
        };
      }

      // Navigate to booking confirmation with all necessary data
      navigate('/booking-confirmation', {
        state: {
          outboundFlight: outboundFlightForConfirmation,
          outboundTicket: outboundTicket,
          returnFlight: returnFlightForConfirmation,
          returnTicket: returnTicket,
          isRoundTrip: bookingData!.isRoundTrip
        }
      });
    } catch (error: any) {
      console.error('Booking error:', error);
      alert(error.message || 'Failed to complete booking. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  if (!bookingData || !bookingData.outboundFlight) {
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

  const outboundFlight = convertFlightDisplayToFlight(bookingData.outboundFlight);
  const returnFlight = bookingData.returnFlight ? convertFlightDisplayToFlight(bookingData.returnFlight) : undefined;

  return (
    <div className="min-h-screen bg-gray-50">
      <NavigationBar />
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold text-gray-800 mb-8">Complete Your Booking</h1>
          
          <BookingForm 
            outboundFlight={outboundFlight}
            outboundSeatNumber={bookingData.outboundSeat.seatNumber}
            returnFlight={returnFlight}
            returnSeatNumber={bookingData.returnSeat?.seatNumber}
            onSubmit={handleBookingSubmit}
            isLoading={isLoading}
          />
        </div>
      </div>
    </div>
  );
};

export default BookingPage;
