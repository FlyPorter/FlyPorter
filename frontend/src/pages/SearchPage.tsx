import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import FlightSearchPanel from '../features/search/components/FlightSearchPanel';
import FlightList from '../features/search/components/FlightList';
import NavigationBar from '../components/NavigationBar';
import { SearchData, FlightDisplay } from '../features/search/types';
import { searchFlights, transformFlightToDisplay } from '../features/search/api/flightApi';
import { Smartphone, Sparkles } from 'lucide-react';

const SearchPage: React.FC = () => {
  const navigate = useNavigate();
  const token = localStorage.getItem('token');
  const userStr = localStorage.getItem('user');
  const user = userStr ? JSON.parse(userStr) : null;
  const isLoggedIn = !!token && !!user;
  const role = user?.role || 'user';
  const resultsRef = useRef<HTMLDivElement>(null);

  // Redirect logged-in users to their home page
  useEffect(() => {
    if (isLoggedIn) {
      const homePath = role?.toUpperCase() === "ADMIN" ? '/admin' : '/dashboard';
      navigate(homePath, { replace: true });
    }
  }, [isLoggedIn, role, navigate]);

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | undefined>();
  const [flights, setFlights] = useState<FlightDisplay[]>([]);
  const [hasSearched, setHasSearched] = useState(false);

  // Scroll to results when search results are available
  useEffect(() => {
    if (hasSearched && !isLoading && resultsRef.current && flights.length > 0) {
      // Small delay to ensure DOM is updated
      setTimeout(() => {
        if (resultsRef.current) {
          // Calculate offset to account for sticky panel (top-20 = 5rem = 80px) plus some margin
          const offset = 100;
          const elementPosition = resultsRef.current.getBoundingClientRect().top + window.pageYOffset;
          const offsetPosition = elementPosition - offset;

          window.scrollTo({
            top: offsetPosition,
            behavior: 'smooth'
          });
        }
      }, 150);
    }
  }, [hasSearched, isLoading, flights.length]);

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

      // Transform flights for display - filter out any that fail to transform
      let displayFlights = matchedFlights
        .map((flight: any) => {
          try {
            return transformFlightToDisplay(flight);
          } catch (err) {
            console.error('Error transforming flight:', err, flight);
            return null;
          }
        })
        .filter((flight: any) => flight !== null) as FlightDisplay[];
      
      // Filter out past flights (only show future flights)
      const now = new Date();
      displayFlights = displayFlights.filter((flight: FlightDisplay) => {
        try {
          // Parse the departure date and time from the flight
          // The flight has date (YYYY-MM-DD) and departure.time (HH:mm)
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
      <div className="container mx-auto pl-2 sm:pl-3 md:pl-4 lg:pl-6 pr-4 sm:pr-6 lg:pr-8 py-4 sm:py-6 lg:py-8">
        <div className="max-w-7xl mx-auto">
          {/* Page Title */}
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold bg-gradient-to-r from-teal-700 to-cyan-700 bg-clip-text text-transparent mb-4 sm:mb-6 text-center">
            Book a Flight
          </h1>
          
          {/* Search Form Card */}
          <div className="sticky top-20 z-30 mb-6 sm:mb-8">
            <FlightSearchPanel 
              onSearch={handleSearch} 
              onClearFilters={handleClearFilters}
            />
          </div>

          {/* Mobile App Promotion Banner */}
          {!hasSearched && (
            <div className="mb-6 sm:mb-8">
              <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-purple-600 via-purple-500 to-blue-500 shadow-xl">
                <div className="relative z-10 px-6 sm:px-8 lg:px-12 py-8 sm:py-10 lg:py-12">
                  <div className="flex flex-col lg:flex-row items-center justify-between gap-6 lg:gap-8">
                    {/* Left Section - Text Content */}
                    <div className="flex-1 text-center lg:text-left">
                      <div className="inline-flex items-center gap-2 mb-3">
                        <span className="px-3 py-1 bg-yellow-400/20 backdrop-blur-sm border border-yellow-300/30 text-yellow-200 text-xs sm:text-sm font-semibold rounded-full">
                          Coming Soon
                        </span>
                      </div>
                      <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white mb-3 sm:mb-4">
                        The FlyPorter Experience
                      </h2>
                      <p className="text-base sm:text-lg text-white/90 mb-4 sm:mb-6 max-w-2xl mx-auto lg:mx-0">
                        Find out how we are elevating your travel experience. Our mobile app is coming soon!
                      </p>
                      <button
                        onClick={() => {
                          // Could navigate to a coming soon page or show a modal
                          alert('Mobile app coming soon! Stay tuned for updates.');
                        }}
                        className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-yellow-400 to-orange-400 hover:from-yellow-500 hover:to-orange-500 text-gray-900 font-semibold rounded-lg shadow-lg hover:shadow-xl transition-all transform hover:scale-105"
                      >
                        Learn More
                      </button>
                    </div>
                    
                    {/* Right Section - Mobile App Icon */}
                    <div className="flex-shrink-0 flex items-center justify-center">
                      <div className="relative">
                        {/* Phone Icon with Gradient Background */}
                        <div className="relative w-32 h-32 sm:w-40 sm:h-40 lg:w-48 lg:h-48 flex items-center justify-center mx-auto">
                          {/* Glow Effect */}
                          <div className="absolute inset-0 bg-gradient-to-br from-yellow-400/30 to-orange-400/30 rounded-full blur-2xl"></div>
                          {/* Phone Icon */}
                          <div className="relative z-10 bg-white/10 backdrop-blur-md rounded-3xl p-6 sm:p-8 border border-white/20 shadow-2xl">
                            <Smartphone className="w-16 h-16 sm:w-20 sm:h-20 lg:w-24 lg:h-24 text-white" strokeWidth={1.5} />
                            {/* Sparkles for "coming soon" effect */}
                            <Sparkles className="absolute -top-1 -right-1 sm:-top-2 sm:-right-2 w-6 h-6 sm:w-8 sm:h-8 text-yellow-300 animate-pulse" />
                            <Sparkles className="absolute -bottom-1 -left-1 sm:-bottom-2 sm:-left-2 w-4 h-4 sm:w-6 sm:h-6 text-orange-300 animate-pulse" style={{ animationDelay: '0.5s' }} />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                {/* Decorative Elements */}
                <div className="absolute top-0 right-0 w-32 h-32 bg-yellow-400/20 rounded-full blur-3xl"></div>
                <div className="absolute bottom-0 left-0 w-40 h-40 bg-purple-400/20 rounded-full blur-3xl"></div>
              </div>
            </div>
          )}

          {/* Show results below search panel if user is not logged in */}
          {!isLoggedIn && hasSearched && (
            <div ref={resultsRef} className="mt-6 sm:mt-8 scroll-mt-20">
              <h2 className="text-xl sm:text-2xl font-semibold text-teal-800 mb-3 sm:mb-4">Available Flights</h2>
              <p className="text-sm sm:text-base text-teal-700 mb-4 sm:mb-6">
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
      {/* Footer */}
      <footer className="mt-4 py-2 text-center text-gray-600 text-xs">
        © 2025 FlyPorter
      </footer>
    </div>
  );
};

export default SearchPage;
