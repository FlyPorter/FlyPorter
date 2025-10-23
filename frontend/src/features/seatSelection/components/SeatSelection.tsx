import React, { useEffect, useState } from 'react';
import { Seat, SeatSelectionProps } from '../types';
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { getFlightSeats} from '../api/seatApi';

// get seat style based on status
const getSeatStyle = (seat: Seat, selectedSeat: Seat | null) => {
  if (seat.status !== 'AVAILABLE') {
    return seat.status === 'BOOKED'
      ? 'bg-gray-200 text-gray-500 cursor-not-allowed border-2 border-gray-300'
      : 'bg-gray-50 text-gray-300 cursor-not-allowed border border-gray-200 before:absolute before:inset-0 before:bg-gradient-to-br before:from-gray-300 before:to-transparent before:opacity-50';
  }
  // If the seat is available, check if it's selected
  return selectedSeat?.seatNumber === seat.seatNumber
    ? 'bg-blue-500 text-white hover:bg-blue-600 border-blue-300'
    : 'bg-blue-100 hover:bg-blue-200 text-blue-800 border-blue-300';
};

const SeatSelection: React.FC<SeatSelectionProps> = ({
  flightId,
  onSeatSelect,
  selectedSeat,
  flight
}) => {
  const [seats, setSeats] = useState<Seat[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchSeats = async () => {
      try {
        const seatsData = await getFlightSeats(flightId);
        setSeats(seatsData);
      } catch (err) {
        setError('Failed to load seats. Please try again.');
        console.error('Error loading seats:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchSeats();
  }, [flightId]);

  const handleSeatSelect = async (seat: Seat) => {
    if (seat.status === 'AVAILABLE') {
      try {
        // Just select the new seat without changing its status
        onSeatSelect(seat);
      } catch (err) {
        setError('Failed to select seat. Please try again.');
        console.error('Error selecting seat:', err);
      }
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <div className="text-lg">Loading seats...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <div className="text-red-500">{error}</div>
      </div>
    );
  }

  return (
    <div className="max-w-full sm:max-w-2xl md:max-w-4xl mx-auto p-3 sm:p-4 md:p-6">
      <Card>
        <CardHeader>
          <h2 className="text-xl sm:text-2xl font-semibold">Select Your Seat</h2>
        </CardHeader>
        
        <CardContent>
          {/* Flight Information */}
          <div className="mb-4 sm:mb-6 p-3 sm:p-4 bg-muted rounded-md">
            <h3 className="text-lg sm:text-xl font-medium mb-2">Flight Details</h3>
            <div className="space-y-2">
              <p className="text-sm sm:text-base">
                <span className="font-medium">Airline:</span> {flight.airline.name} ({flight.airline.code})
              </p>
              <p className="text-sm sm:text-base flex items-center gap-2">
                {flight.departure.date} {flight.departure.time} {flight.departure.airport} ({flight.departure.city})
                <span className="mx-2 text-gray-500">→</span>
                {flight.arrival.airport} ({flight.arrival.city})
              </p>
            </div>
          </div>

          {/* Seat Map */}
          <div className="mb-6 sm:mb-8">
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2 sm:gap-3">
              {seats.map((seat) => (
                <Button
                  key={seat.seatNumber}
                  onClick={() => handleSeatSelect(seat)}
                  variant={seat.status === 'AVAILABLE' ? 'outline' : 'ghost'}
                  className={`
                    aspect-square rounded-md flex items-center justify-center text-sm sm:text-base
                    transition-colors duration-200 relative
                    ${getSeatStyle(seat, selectedSeat)}
                  `}
                >
                  {seat.seatNumber}
                </Button>
              ))}
            </div>
          </div>

          {/* Legend */}
          <div className="flex flex-wrap gap-3 sm:gap-4 items-center justify-center text-sm sm:text-base">
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="w-4 h-4 sm:w-6 sm:h-6 bg-blue-100"></Badge>
              <span>Available</span>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="w-4 h-4 sm:w-6 sm:h-6 bg-gray-200 border-2 border-gray-300"></Badge>
              <span>Booked</span>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="w-4 h-4 sm:w-6 sm:h-6 bg-gray-50 relative before:absolute before:inset-0 before:bg-gradient-to-br before:from-gray-300 before:to-transparent before:opacity-50"></Badge>
              <span>Unavailable</span>
            </div>
          </div>

          {/* Selected Seat Information */}
          {selectedSeat && (
            <div className="mt-4 sm:mt-6 p-3 sm:p-4 bg-primary/10 rounded-md">
              <h3 className="text-lg sm:text-xl font-medium mb-2">Selected Seat</h3>
              <p className="text-sm sm:text-base">
                Seat Number: {selectedSeat.seatNumber}
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default SeatSelection; 