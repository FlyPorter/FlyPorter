import React from 'react';
import { FlightListProps } from '../types';
import { Skeleton } from "@/components/ui/skeleton";
import { Card } from "@/components/ui/card";

const FlightList: React.FC<FlightListProps> = ({
  flights,
  onSelectFlight,
  isLoading = false,
  error,
}) => {
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

  if (flights.length === 0) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-gray-500">No flights found</div>
      </div>
    );
  }

  return (
    <div className="space-y-4 pb-12">
      {flights.map((flight) => (
        <Card
          key={flight.id}
          className="p-4 hover:shadow-md transition-shadow cursor-pointer"
          onClick={() => onSelectFlight(flight)}
        >
          <div className="flex flex-col sm:flex-row justify-between items-start space-y-2 sm:space-y-0">
            <div className="flex-1 w-full">
              <div className="flex items-center space-x-4">
                <div className="text-base sm:text-lg font-semibold">
                  {flight.airline.name} ({flight.airline.code})
                </div>
                <div className="text-sm sm:text-base text-gray-600">
                  Flight {flight.flightNumber}
                </div>
              </div>
              <div className="mt-2 flex flex-col sm:flex-row items-start sm:items-center space-y-2 sm:space-y-0 sm:space-x-4">
                <div>
                  <div className="text-base sm:text-lg font-medium">{flight.departure.time}</div>
                  <div className="text-sm text-gray-500">{flight.departure.date}</div>
                  <div className="text-sm sm:text-base text-gray-600">
                    {flight.departure.city} ({flight.departure.airport})
                  </div>
                </div>
                <div className="flex-1 text-center">
                  <div className="text-xs sm:text-sm text-gray-600">{flight.duration}</div>
                  <div className="h-0.5 bg-gray-200 my-2"></div>
                  <div className="text-xs sm:text-sm text-gray-600">
                    Direct Flight
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-base sm:text-lg font-medium">{flight.arrival.time}</div>
                  <div className="text-sm text-gray-500">{flight.arrival.date}</div>
                  <div className="text-xs sm:text-sm text-gray-600">
                    {flight.arrival.city} ({flight.arrival.airport})
                  </div>
                </div>
              </div>
              <div className="text-sm text-gray-500 mt-1">
                All times are shown in origin city time
              </div>
            </div>
            <div className="ml-0 sm:ml-4 text-left sm:text-right w-full sm:w-auto">
              <div className="text-lg sm:text-xl font-bold text-blue-600">
                ${flight.price}
              </div>
              <div className="text-xs sm:text-sm text-gray-600">
                {flight.availableTickets} tickets available
              </div>
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
};

export default FlightList;
