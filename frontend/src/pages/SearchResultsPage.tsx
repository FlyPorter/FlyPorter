import React, { useState } from 'react';
import { useNavigate} from 'react-router-dom';
import FlightSearchPanel from '../features/search/components/FlightSearchPanel';
import FlightList from '../features/search/components/FlightList';
import CheapFlightRecommendations from '../features/search/components/CheapFlightRecommendations';
import { SearchData, FlightDisplay } from '../features/search/types';
import { searchFlights, transformFlightToDisplay } from '../features/search/api/flightApi';
import NavigationBar from '../components/NavigationBar';
import Sidebar from '../features/dashboard/components/Sidebar';

const SearchResultsPage: React.FC = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | undefined>();
  const [flights, setFlights] = useState<FlightDisplay[]>([]);
  const [selectedOutboundFlight, setSelectedOutboundFlight] = useState<FlightDisplay | null>(null);
  const [isSearchingReturn, setIsSearchingReturn] = useState(false);
  const [searchData, setSearchData] = useState<SearchData | null>(null);
  const [hasSearched, setHasSearched] = useState(false);

  // Get user role
  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const role = user?.role || "user";

  const handleSearch = async (searchData: SearchData) => {
    setIsLoading(true);
    setError(undefined);
    setSearchData(searchData);
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
      const matchedFlights = response.filter(flight => {
        // Check route match only if both origin and destination are provided
        const matchesRoute = !searchData.route.origin || !searchData.route.destination || 
          (flight.route.departure_airport === searchData.route.origin &&
           flight.route.destination_airport === searchData.route.destination);
        
        // Check airline match only if airline is selected and not "all"
        const matchesAirline = !searchData.airline || searchData.airline === 'all' || 
          flight.airline.code === searchData.airline;
        
        return matchesRoute && matchesAirline;
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
    setSearchData(null);
    setFlights([]);
    setError(undefined);
    setSelectedOutboundFlight(null);
    setIsSearchingReturn(false);
  };

  const handleSelectFlight = async (flight: FlightDisplay) => {
    if (!searchData) return;

    if (searchData.tripType === 'roundTrip' && !isSearchingReturn) {
      // Store the selected outbound flight
      setSelectedOutboundFlight(flight);
      setIsSearchingReturn(true);
      
      // Search for return flights
      const returnSearchData: SearchData = {
        ...searchData,
        route: {
          origin: searchData.route.destination,
          destination: searchData.route.origin,
          departDate: searchData.returnDate || ''
        }
      };
      
      await handleSearch(returnSearchData);
    } else {
      // For one-way trips or when selecting return flight
      if (searchData.tripType === 'roundTrip' && selectedOutboundFlight) {
        // Navigate to seat selection with both flights
        navigate('/seat-selection', {
          state: {
            outboundFlight: selectedOutboundFlight,
            returnFlight: flight,
            isRoundTrip: true
          }
        });
      } else {
        // Navigate with single flight
        navigate('/seat-selection', {
          state: {
            outboundFlight: flight,
            isRoundTrip: false
          }
        });
      }
    }
  };

  return (
    <div className="h-screen overflow-hidden">
      <NavigationBar />
      <div className="flex h-[calc(100vh-3.5rem)] overflow-hidden">
        <div className="sticky top-0 left-0 z-10">
          <Sidebar role={role} />
        </div>
        <div className="flex-1 overflow-y-auto">
          <div className="container mx-auto px-4 py-8">
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
              {/* Search Panel */}
              <div className="lg:col-span-1">
                <div className="sticky top-20 z-40">
                  <FlightSearchPanel 
                    onSearch={handleSearch}
                    onClearFilters={handleClearFilters}
                    disabled={isSearchingReturn}
                    initialSearchData={searchData}
                  />
                </div>
              </div>

              {/* Flight List or Recommendations */}
              <div className="lg:col-span-3">
                {hasSearched ? (
                  <>
                    <div className="mb-6">
                      <h2 className="text-2xl font-semibold">
                        {isSearchingReturn ? 'Select Return Flight' : 'Available Flights'}
                      </h2>
                      {isSearchingReturn && (
                        <div className="text-sm text-gray-600 mt-2">
                          Selected outbound flight: {selectedOutboundFlight?.airline.name} {selectedOutboundFlight?.flightNumber}
                        </div>
                      )}
                      <p className="text-gray-600 mt-1">
                        {searchData?.tripType === 'roundTrip' 
                          ? (isSearchingReturn 
                              ? 'Please select your return flight'
                              : 'Please select your outbound flight first')
                          : `${flights.length} flights found`}
                      </p>
                    </div>
                    <FlightList
                      flights={flights}
                      onSelectFlight={handleSelectFlight}
                      isLoading={isLoading}
                      error={error}
                    />
                  </>
                ) : (
                  <CheapFlightRecommendations />
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SearchResultsPage; 