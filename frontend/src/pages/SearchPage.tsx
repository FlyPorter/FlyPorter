import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import FlightSearchPanel from '../features/search/components/FlightSearchPanel';
import FlightList from '../features/search/components/FlightList';
import NavigationBar from '../components/NavigationBar';
import { SearchData, FlightDisplay } from '../features/search/types';
import { searchFlights, transformFlightToDisplay } from '../features/search/api/flightApi';

const SearchPage: React.FC = () => {
  const navigate = useNavigate();
  const token = localStorage.getItem('token');
  const userStr = localStorage.getItem('user');
  const isLoggedIn = !!token && !!userStr;

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | undefined>();
  const [flights, setFlights] = useState<FlightDisplay[]>([]);
  const [hasSearched, setHasSearched] = useState(false);

  const handleSearch = async (searchData: SearchData) => {
    // If user is logged in, navigate to search results page
    if (isLoggedIn) {
      navigate('/search-results', { state: { searchData } });
      return;
    }

    // If user is not logged in, show results on the same page
    setIsLoading(true);
    setError(undefined);
    setHasSearched(true);

    try {
      const response = await searchFlights({
        origin: searchData.route.origin,
        destination: searchData.route.destination,
        date: searchData.route.departDate,
        airlines: searchData.airline && searchData.airline !== 'all' ? [searchData.airline] : undefined,
        priceMin: searchData.priceRange[0],
        priceMax: searchData.priceRange[1]
      });

      // Filter flights based on search parameters
      const matchedFlights = response.filter((flight: any) => {
        // Get airport codes from the flight route
        const originCode = flight.route?.origin_airport_code || flight.route?.departure_airport;
        const destCode = flight.route?.destination_airport_code || flight.route?.destination_airport;

        // Check route match only if both origin and destination are provided
        const matchesRoute = !searchData.route.origin || !searchData.route.destination ||
          (originCode === searchData.route.origin &&
            destCode === searchData.route.destination);

        // Check airline match only if airline is selected and not "all"
        const airlineCode = flight.airline?.code || flight.airline_code;
        const matchesAirline = !searchData.airline || searchData.airline === 'all' ||
          airlineCode === searchData.airline;

        // Check price range
        const basePrice = parseFloat(flight.base_price || flight.price || '0');
        const matchesPrice = basePrice >= searchData.priceRange[0] &&
          basePrice <= searchData.priceRange[1];

        // Check date if provided
        let matchesDate = true;
        if (searchData.route.departDate) {
          const flightDate = (flight.departure_time || flight.route?.departure_time)
            ? new Date(flight.departure_time || flight.route?.departure_time).toISOString().split('T')[0]
            : null;
          matchesDate = flightDate === searchData.route.departDate;
        }

        return matchesRoute && matchesAirline && matchesPrice && matchesDate;
      });

      // Transform flights for display
      const displayFlights = matchedFlights.map(transformFlightToDisplay);
      setFlights(displayFlights);
    } catch (err) {
      setError('Failed to search flights. Please try again.');
      console.error('Search error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClearFilters = () => {
    setHasSearched(false);
    setFlights([]);
    setError(undefined);
  };

  const handleSelectFlight = (flight: FlightDisplay) => {
    // If not logged in, redirect to login page
    if (!isLoggedIn) {
      navigate('/login', { state: { from: '/seat-selection', state: { outboundFlight: flight, isRoundTrip: false } } });
      return;
    }
    // If logged in, navigate to seat selection
    navigate('/seat-selection', {
      state: {
        outboundFlight: flight,
        isRoundTrip: false
      }
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50 via-cyan-50 to-teal-100/30">
      <NavigationBar />
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-5xl mx-auto">
          {/* Page Title */}
          <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-teal-700 to-cyan-700 bg-clip-text text-transparent mb-6 text-center">
            Book a Flight
          </h1>
          
          {/* Search Form Card */}
          <FlightSearchPanel 
            onSearch={handleSearch} 
            onClearFilters={handleClearFilters}
          />
          
          {/* Show results below search panel if user is not logged in */}
          {!isLoggedIn && hasSearched && (
            <div className="mt-8">
              <h2 className="text-2xl font-semibold text-teal-800 mb-4">Available Flights</h2>
              <p className="text-teal-700 mb-6">
                {flights.length} flights found. Please log in to book a flight.
              </p>
              <FlightList
                flights={flights}
                onSelectFlight={handleSelectFlight}
                isLoading={isLoading}
                error={error}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SearchPage;
