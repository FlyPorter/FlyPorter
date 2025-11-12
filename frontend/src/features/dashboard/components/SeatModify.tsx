import React, { useEffect, useState } from 'react';
import { Seat, SeatSelectionProps } from '../types';
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { getFlightSeats} from '../api/seatApi';

// get seat style based on status
const getSeatStyle = (seat: Seat, selectedSeat: Seat | null, currentSeat: Seat | null | undefined) => {
  if (seat.status !== 'AVAILABLE') {
    return seat.status === 'BOOKED'
      ? 'bg-gray-200 text-gray-500 cursor-not-allowed border-2 border-gray-300'
      : 'bg-gray-50 text-gray-300 cursor-not-allowed border border-gray-200 before:absolute before:inset-0 before:bg-gradient-to-br before:from-gray-300 before:to-transparent before:opacity-50';
  }
  
  // Check if this is the current seat
  if (currentSeat?.id === seat.id) {
    return 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white hover:from-emerald-600 hover:to-teal-600 border-emerald-400 shadow-lg';
  }
  
  // If the seat is available, check if it's selected
  return selectedSeat?.id === seat.id
    ? 'bg-gradient-to-r from-teal-600 to-cyan-600 text-white hover:from-teal-700 hover:to-cyan-700 border-teal-400 shadow-lg'
    : 'bg-teal-50 hover:bg-teal-100 text-teal-700 border-teal-300 hover:border-teal-400';
};

const SeatModify: React.FC<SeatSelectionProps> = ({
  flightId,
  onSeatSelect,
  selectedSeat,
  currentSeat,
}) => {
  const [seats, setSeats] = useState<Seat[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Sort seats by row number first, then by seat letter
  const sortSeats = (seats: Seat[]): Seat[] => {
    return [...seats].sort((a, b) => {
      // Extract row number and seat letter from seat IDs like "1A", "12B", etc.
      const parseSeat = (seatId: string) => {
        const match = seatId.match(/^(\d+)([A-Z]+)$/);
        if (match) {
          return {
            row: parseInt(match[1], 10),
            letter: match[2]
          };
        }
        // Fallback if format doesn't match
        return { row: 0, letter: seatId };
      };

      const seatA = parseSeat(a.id);
      const seatB = parseSeat(b.id);

      // First sort by row number
      if (seatA.row !== seatB.row) {
        return seatA.row - seatB.row;
      }

      // If same row, sort by letter
      return seatA.letter.localeCompare(seatB.letter);
    });
  };

  useEffect(() => {
    const fetchSeats = async () => {
      try {
        const seatsData = await getFlightSeats(flightId);
        const sortedSeats = sortSeats(seatsData);
        setSeats(sortedSeats);
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
        <div className="text-lg text-teal-700 font-medium">Loading seats...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <div className="text-red-500 font-medium bg-red-50 px-4 py-2 rounded-lg border border-red-200">{error}</div>
      </div>
    );
  }

  return (
    <div className="max-w-full sm:max-w-2xl md:max-w-4xl mx-auto p-3 sm:p-4 md:p-6">
      <Card className="border-teal-200/50 shadow-2xl bg-white/90 backdrop-blur-sm">
        <CardHeader>
          <h2 className="text-xl sm:text-2xl font-semibold bg-gradient-to-r from-teal-700 to-cyan-700 bg-clip-text text-transparent">Select Your Seat</h2>
        </CardHeader>
        
        <CardContent>
          {/* Flight Information */}
          <div className="mb-4 sm:mb-6 p-3 sm:p-4 bg-gradient-to-r from-teal-50 to-cyan-50 rounded-lg border border-teal-200/50">
            <h3 className="text-lg sm:text-xl font-medium mb-2 text-teal-800">Flight Details</h3>
            <p className="text-sm sm:text-base text-teal-700">Flight ID: <span className="font-semibold text-teal-900">{flightId}</span></p>
            {currentSeat && (
              <div className="mt-3 p-2 bg-gradient-to-r from-emerald-50 to-teal-50 rounded-lg border border-emerald-200">
                <p className="text-sm font-medium text-emerald-800">Current Seat: <span className="text-emerald-900 font-semibold">{currentSeat.id}</span></p>
              </div>
            )}
          </div>

          {/* Seat Map */}
          <div className="mb-6 sm:mb-8">
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2 sm:gap-3">
              {seats.map((seat) => (
                <Button
                  key={seat.id}
                  onClick={() => handleSeatSelect(seat)}
                  variant={seat.status === 'AVAILABLE' ? 'outline' : 'ghost'}
                  className={`
                    aspect-square rounded-md flex items-center justify-center text-sm sm:text-base
                    transition-colors duration-200 relative
                    ${getSeatStyle(seat, selectedSeat, currentSeat)}
                  `}
                >
                  {seat.id}
                </Button>
              ))}
            </div>
          </div>

          {/* Legend */}
          <div className="flex flex-wrap gap-3 sm:gap-4 items-center justify-center text-sm sm:text-base">
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="w-4 h-4 sm:w-6 sm:h-6 bg-teal-50 border-teal-300"></Badge>
              <span className="text-teal-700">Available</span>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="w-4 h-4 sm:w-6 sm:h-6 bg-gray-200 border-2 border-gray-300"></Badge>
              <span className="text-gray-600">Booked</span>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="w-4 h-4 sm:w-6 sm:h-6 bg-gray-50 relative before:absolute before:inset-0 before:bg-gradient-to-br before:from-gray-300 before:to-transparent before:opacity-50 border-gray-200"></Badge>
              <span className="text-gray-600">Unavailable</span>
            </div>
            {currentSeat && (
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="w-4 h-4 sm:w-6 sm:h-6 bg-gradient-to-r from-emerald-500 to-teal-500 border-emerald-400"></Badge>
                <span className="text-emerald-700">Current Seat</span>
              </div>
            )}
          </div>

          {/* Selected Seat Information */}
          {selectedSeat && (
            <div className="mt-4 sm:mt-6 p-3 sm:p-4 bg-gradient-to-r from-teal-50 to-cyan-50 rounded-lg border border-teal-200/50">
              <h3 className="text-lg sm:text-xl font-medium mb-2 text-teal-800">Selected Seat</h3>
              <p className="text-sm sm:text-base text-teal-700 font-semibold">
                Seat Number: <span className="text-teal-900">{selectedSeat.id}</span>
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default SeatModify; 