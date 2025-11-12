import React from "react";
import { FlightListProps } from "../types";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

const FlightList: React.FC<FlightListProps> = ({
  flights,
  onSelectFlight,
  onDeleteFlight,
  onUpdateFlight,
  isLoading = false,
  error,
}) => {
  if (isLoading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="h-28 bg-gray-200 rounded-md" />
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

  return (
    <div className="space-y-3 sm:space-y-4">
      {flights.map((flight) => (
        <Card key={flight.id} className="p-3 sm:p-4 hover:shadow-md transition-shadow">
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center space-y-3 sm:space-y-4 lg:space-y-0">
            <div className="flex-1 w-full">
              <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 mb-2 sm:mb-0">
                <div className="text-sm sm:text-base lg:text-lg font-semibold break-words">{flight.airline.name} ({flight.airline.code})</div>
                <div className="text-xs sm:text-sm lg:text-base text-gray-600">Flight {flight.flightNumber}</div>
              </div>
              <div className="mt-2 sm:mt-2 flex flex-col sm:flex-row items-start sm:items-center space-y-3 sm:space-y-0 sm:space-x-4">
                <div className="flex-1 sm:flex-none">
                  <div className="text-sm sm:text-base lg:text-lg font-medium">{flight.departure.time}</div>
                  <div className="text-xs sm:text-sm text-gray-500">{flight.departure.date}</div>
                  <div className="text-xs sm:text-sm lg:text-base text-gray-600 break-words">
                    {flight.departure.city} ({flight.departure.airport})
                  </div>
                </div>
                <div className="flex-1 text-center sm:text-center w-full sm:w-auto">
                  <div className="text-xs sm:text-sm text-gray-600">{flight.duration}</div>
                  <div className="h-0.5 bg-gray-200 my-2"></div>
                  <div className="text-xs sm:text-sm text-gray-600">
                    Direct Flight
                  </div>
                </div>
                <div className="flex-1 sm:flex-none text-left sm:text-right w-full sm:w-auto">
                  <div className="text-sm sm:text-base lg:text-lg font-medium">{flight.arrival.time}</div>
                  <div className="text-xs sm:text-sm text-gray-500">{flight.arrival.date}</div>
                  <div className="text-xs sm:text-sm text-gray-600 break-words">
                    {flight.arrival.city} ({flight.arrival.airport})
                  </div>
                  <div className="text-base sm:text-lg lg:text-xl font-bold bg-gradient-to-r from-teal-600 to-cyan-600 bg-clip-text text-transparent mt-2">
                    ${flight.price}
                  </div>
                </div>
              </div>
            </div>

            <div className="flex flex-row sm:flex-col space-x-2 sm:space-x-0 sm:space-y-2 justify-start sm:justify-center w-full sm:w-auto lg:ml-4 mt-2 sm:mt-0 border-t sm:border-t-0 pt-3 sm:pt-0">
              <Button 
                onClick={() => onUpdateFlight(flight)} 
                className="flex-1 sm:flex-none sm:w-24 bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-600 hover:to-yellow-600 text-white px-3 sm:px-4 py-2 rounded-lg font-semibold shadow-md hover:shadow-lg transition-all cursor-pointer text-xs sm:text-sm"
              >
                Update
              </Button>
              <Button 
                onClick={() => onDeleteFlight(flight.id)} 
                className="flex-1 sm:flex-none sm:w-24 bg-gradient-to-r from-red-500 to-rose-500 hover:from-red-600 hover:to-rose-600 text-white px-3 sm:px-4 py-2 rounded-lg font-semibold shadow-md hover:shadow-lg transition-all cursor-pointer text-xs sm:text-sm"
              >
                Delete
              </Button>
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
};

export default FlightList;
