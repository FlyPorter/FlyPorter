import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import SeatSelection from '../features/seatSelection/components/SeatSelection';
import { Seat } from '../features/seatSelection/types';
import NavigationBar from '../components/NavigationBar';

interface SelectedSeats {
  outbound: Seat | null;
  return: Seat | null;
}

const SeatSelectionPage: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { outboundFlight, returnFlight, isRoundTrip } = location.state || {};
  const [selectedSeats, setSelectedSeats] = useState<SelectedSeats>({
    outbound: null,
    return: null
  });
  const [currentSelection, setCurrentSelection] = useState<'outbound' | 'return'>('outbound');

  const handleSeatSelect = (seat: Seat) => {
    setSelectedSeats(prev => ({
      ...prev,
      [currentSelection]: seat
    }));
  };

  const handleBack = () => {
    if (isRoundTrip && currentSelection === 'return') {
      // If we're selecting return flight seat, go back to outbound seat selection
      setCurrentSelection('outbound');
    } else {
      // Otherwise, go back to search results
      navigate(-1);
    }
  };

  const handleForward = () => {
    if (!outboundFlight) return;

    if (isRoundTrip) {
      if (currentSelection === 'outbound' && selectedSeats.outbound) {
        // Move to return flight seat selection
        setCurrentSelection('return');
      } else if (currentSelection === 'return' && selectedSeats.outbound && selectedSeats.return && returnFlight) {
        // Navigate to booking with both flights and seats
        navigate('/booking', {
          state: {
            outboundFlight,
            outboundSeat: {
              seatNumber: selectedSeats.outbound.seatNumber.toString(),
              price: selectedSeats.outbound.price
            },
            returnFlight,
            returnSeat: {
              seatNumber: selectedSeats.return.seatNumber.toString(),
              price: selectedSeats.return.price
            },
            isRoundTrip: true
          }
        });
      }
    } else {
      // One-way flight booking
      if (selectedSeats.outbound) {
        navigate('/booking', {
          state: {
            outboundFlight,
            outboundSeat: {
              seatNumber: selectedSeats.outbound.seatNumber.toString(),
              price: selectedSeats.outbound.price
            },
            isRoundTrip: false
          }
        });
      }
    }
  };

  if (!outboundFlight) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <h2 className="text-2xl font-semibold text-red-600">Invalid Selection</h2>
          <p className="mt-2 text-gray-600">
            Please select a flight first.
          </p>
          <button
            onClick={() => navigate('/search')}
            className="mt-4 px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
          >
            Back to Search
          </button>
        </div>
      </div>
    );
  }

  const currentFlight = currentSelection === 'outbound' ? outboundFlight : returnFlight;
  const currentSeat = currentSelection === 'outbound' ? selectedSeats.outbound : selectedSeats.return;

  return (
    <div className="min-h-screen bg-gray-50">
      <NavigationBar onBack={handleBack} onForward={handleForward} />
      <div className="container mx-auto px-4 py-8">
        {isRoundTrip && (
          <div className="mb-6">
            <div className="flex items-center justify-center space-x-4">
              <div className={`p-4 rounded-lg ${currentSelection === 'outbound' ? 'bg-blue-100 border-2 border-blue-500' : 'bg-gray-100'}`}>
                <h3 className="font-medium">Outbound Flight</h3>
                <p className="text-sm text-gray-600">{outboundFlight.airline.name} {outboundFlight.flightNumber}</p>
                {selectedSeats.outbound && (
                  <p className="text-sm text-green-600">Seat: {selectedSeats.outbound.seatNumber}</p>
                )}
              </div>
              {isRoundTrip && (
                <div className={`p-4 rounded-lg ${currentSelection === 'return' ? 'bg-blue-100 border-2 border-blue-500' : 'bg-gray-100'}`}>
                  <h3 className="font-medium">Return Flight</h3>
                  <p className="text-sm text-gray-600">{returnFlight.airline.name} {returnFlight.flightNumber}</p>
                  {selectedSeats.return && (
                    <p className="text-sm text-green-600">Seat: {selectedSeats.return.seatNumber}</p>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        <h2 className="text-2xl font-semibold mb-6 text-center">
          Select Your Seat - {currentSelection === 'outbound' ? 'Outbound Flight' : 'Return Flight'}
        </h2>

        <SeatSelection
          flightId={currentFlight.id.toString()}
          onSeatSelect={handleSeatSelect}
          selectedSeat={currentSeat}
          flight={currentFlight}
        />
        
        <div className="mt-6 flex justify-center space-x-4">
          <button
            onClick={handleBack}
            className="px-6 py-2 rounded-md text-gray-700 font-medium border border-gray-300 hover:bg-gray-50"
          >
            Back
          </button>
          <button
            onClick={handleForward}
            disabled={!currentSeat || (isRoundTrip && currentSelection === 'return' && !selectedSeats.outbound)}
            className={`
              px-6 py-2 rounded-md text-white font-medium
              ${currentSeat 
                ? 'bg-blue-500 hover:bg-blue-600' 
                : 'bg-gray-300 cursor-not-allowed'
              }
            `}
          >
            {isRoundTrip && currentSelection === 'outbound' 
              ? 'Continue to Return Flight' 
              : 'Continue to Booking'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default SeatSelectionPage; 