import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FlightDisplay } from '../types';
import { searchFlights, transformFlightToDisplay } from '../api/flightApi';
import FlightList from './FlightList';
import { Skeleton } from "@/components/ui/skeleton";

const CheapFlightRecommendations: React.FC = () => {
  const navigate = useNavigate();
  const [recommendations, setRecommendations] = useState<FlightDisplay[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | undefined>();

  useEffect(() => {
    const fetchRecommendations = async () => {
      try {
        const response = await searchFlights({
          origin: '',
          destination: '',
          date: '',
          priceMax: 200
        });
        
        // Transform flights
        let displayFlights = response.map(transformFlightToDisplay);
        
        // Filter out past flights (only show future flights)
        const now = new Date();
        displayFlights = displayFlights.filter((flight: FlightDisplay) => {
          try {
            const departureDateStr = flight.date; // YYYY-MM-DD format
            const departureTimeStr = flight.departure.time; // HH:mm format
            const departureDateTime = new Date(`${departureDateStr}T${departureTimeStr}`);
            
            // Check if departure time is in the future
            return departureDateTime > now;
          } catch (err) {
            console.error('Error parsing flight departure time:', err, flight);
            // If we can't parse the date, exclude it to be safe
            return false;
          }
        });
        
        // Sort by price and get top 10 cheapest flights
        displayFlights = displayFlights
          .sort((a, b) => Number(a.price) - Number(b.price))
          .slice(0, 10);

        setRecommendations(displayFlights);
      } catch (err) {
        setError('Failed to load recommendations');
        console.error('Error fetching recommendations:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchRecommendations();
  }, []);

  const handleSelectFlight = (flight: FlightDisplay) => {
    navigate('/seat-selection', {
      state: {
        outboundFlight: flight,
        isRoundTrip: false
      }
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
      <div className="text-red-500 font-medium">{error}</div>
    );
  }

  if (recommendations.length === 0) {
    return (
      <div className="text-gray-500">No recommendations available</div>
    );
  }

  return (
    <div className="space-y-4">
      <h3 className="text-2xl font-semibold mb-4">Cheap Flight Recommendations</h3>
      <p className="text-gray-600 mb-4">Top 10 cheapest flights under $200</p>
      <FlightList
        flights={recommendations}
        onSelectFlight={handleSelectFlight}
        isLoading={isLoading}
        error={error}
      />
    </div>
  );
};

export default CheapFlightRecommendations; 