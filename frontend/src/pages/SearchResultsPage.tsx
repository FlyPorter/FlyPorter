import React, { useState, useEffect } from 'react';
import { useNavigate} from 'react-router-dom';
import FlightSearchPanel from '../features/search/components/FlightSearchPanel';
import FlightList from '../features/search/components/FlightList';
import CheapFlightRecommendations from '../features/search/components/CheapFlightRecommendations';
import { SearchData, FlightDisplay } from '../features/search/types';
import { searchFlights, getAllFlights, transformFlightToDisplay } from '../features/search/api/flightApi';
import NavigationBar from '../components/NavigationBar';
import Sidebar from '../features/dashboard/components/Sidebar';
import { Menu, X } from 'lucide-react';
import { Button } from '../components/ui/button';

const SearchResultsPage: React.FC = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | undefined>();
  const [flights, setFlights] = useState<FlightDisplay[]>([]);
  const [selectedOutboundFlight, setSelectedOutboundFlight] = useState<FlightDisplay | null>(null);
  const [isSearchingReturn, setIsSearchingReturn] = useState(false);
  const [searchData, setSearchData] = useState<SearchData | null>(null);
  const [hasSearched, setHasSearched] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Disable body scroll when sidebar is open on mobile
  useEffect(() => {
    if (isSidebarOpen) {
      // Check if we're on mobile (window width < 1024px which is lg breakpoint)
      const isMobile = window.innerWidth < 1024;
      if (isMobile) {
        document.body.style.overflow = 'hidden';
      }
    } else {
      document.body.style.overflow = '';
    }

    // Cleanup function to restore scroll when component unmounts
    return () => {
      document.body.style.overflow = '';
    };
  }, [isSidebarOpen]);

  // Get user role
  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const role = user?.role || "user";
  const isAdmin = role === "ADMIN" || role === "admin";

  // For admin users, fetch all flights on mount
  useEffect(() => {
    if (isAdmin) {
      const fetchAllFlights = async () => {
        setIsLoading(true);
        try {
          const allFlights = await getAllFlights();
          const displayFlights = allFlights.map(transformFlightToDisplay);
          setFlights(displayFlights);
          setHasSearched(true); // Mark as searched so it shows flights instead of recommendations
        } catch (err) {
          setError('Failed to load flights. Please try again.');
          console.error('Error fetching all flights:', err);
        } finally {
          setIsLoading(false);
        }
      };
      fetchAllFlights();
    }
  }, [isAdmin]);

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
            ? new Date(flight.departure_time || flight.route.departure_time).toISOString().split('T')[0] 
            : null;
          matchesDate = flightDate === searchData.route.departDate;
        }
        
        return matchesRoute && matchesAirline && matchesPrice && matchesDate;
      });

      // Transform flights for display - filter out any that fail to transform
      const displayFlights = matchedFlights
        .map((flight: any) => {
          try {
            return transformFlightToDisplay(flight);
          } catch (err) {
            console.error('Error transforming flight:', err, flight);
            return null;
          }
        })
        .filter((flight: any) => flight !== null) as FlightDisplay[];
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
    // If no searchData, treat as one-way trip and navigate directly
    if (!searchData) {
      navigate('/seat-selection', {
        state: {
          outboundFlight: flight,
          isRoundTrip: false
        }
      });
      return;
    }

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
    <div className="min-h-screen bg-gradient-to-br from-teal-50/50 via-cyan-50/50 to-teal-100/20">
      <NavigationBar />
      <div className="flex flex-col lg:flex-row relative lg:h-[calc(100vh-3.5rem)]">
        {/* Mobile Sidebar Overlay */}
        {isSidebarOpen && (
          <div 
            className="fixed inset-0 bg-black/50 z-40 lg:hidden"
            onClick={() => setIsSidebarOpen(false)}
          />
        )}

        {/* Sidebar - Collapsible on mobile, always visible on desktop */}
        <div 
          className={`
            fixed lg:sticky top-14 left-0 z-50 lg:z-10
            h-[calc(100vh-3.5rem)] lg:h-[calc(100vh-3.5rem)]
            transform transition-transform duration-300 ease-in-out
            ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
            lg:top-14 lg:self-start
          `}
        >
          <Sidebar role={role} onClose={() => setIsSidebarOpen(false)} />
        </div>

        {/* Main Content */}
        <div className="flex-1 w-full lg:w-auto lg:overflow-y-auto">
          {/* Mobile Menu Button */}
          <div className="lg:hidden sticky z-30 bg-gradient-to-r from-teal-50 to-cyan-50 border-b border-teal-200/50 px-4 py-2 -mt-[1px]" style={{ top: 'calc(3.5rem - 1px)' }}>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="text-teal-700 hover:text-teal-900"
            >
              {isSidebarOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </Button>
          </div>

          <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8">
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 sm:gap-6 lg:gap-8">
              {/* Search Panel */}
              <div className="lg:col-span-1">
                <div className="lg:sticky lg:top-20 z-40">
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
                    <div className="mb-4 sm:mb-6">
                      <h2 className="text-xl sm:text-2xl font-semibold bg-gradient-to-r from-teal-700 to-cyan-700 bg-clip-text text-transparent">
                        {isSearchingReturn ? 'Select Return Flight' : 'Available Flights'}
                      </h2>
                      {isSearchingReturn && (
                        <div className="text-xs sm:text-sm text-teal-700 mt-2 break-words">
                          Selected outbound flight: {selectedOutboundFlight?.airline.name} {selectedOutboundFlight?.flightNumber}
                        </div>
                      )}
                      <p className="text-xs sm:text-sm text-teal-700 mt-1">
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