import { useState, useEffect, useRef } from "react";
import { useNavigate } from 'react-router-dom';
import FlightList from '../features/admin/components/FlightList';
import { SearchData, FlightDisplay } from '../features/admin/types';
import { searchFlights, getAllFlights, transformFlightToDisplay } from '../features/search/api/flightApi';
import FlightSearchPanel from '../features/search/components/FlightSearchPanel';
import NavigationBar from '../components/NavigationBar';
import Sidebar from '../features/dashboard/components/Sidebar';
import { Menu, X } from 'lucide-react';
import { Button } from '../components/ui/button';
import { API_BASE_URL } from "../config";

const AdminPage = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>("");
  const [flights, setFlights] = useState<FlightDisplay[]>([]);
  const [searchData, setSearchData] = useState<SearchData | null>(null);
  const [hasSearched, setHasSearched] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

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

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };

    if (isDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isDropdownOpen]);

  // Get user role
  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const role = user?.role || "user";

  // Fetch all flights on component mount
  useEffect(() => {
    const fetchAllFlights = async () => {
      setIsLoading(true);
      setError("");
      
      try {
        const allFlights = await getAllFlights();
        const displayFlights = allFlights.map(transformFlightToDisplay);
        setFlights(displayFlights);
      } catch (err) {
        setError('Failed to load flights. Please try again.');
        console.error('Error fetching all flights:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchAllFlights();
  }, []);

  const handleNavigation = (path: string) => {
    navigate(path);
    setIsDropdownOpen(false);
  };

  const handleUpdateFlight = (flight: FlightDisplay) => {
    navigate(`/admin/update-flight/${flight.id}`, { state: { flight } });
    console.log("Updating flight:", flight);
  };

  const handleDeleteFlight = async (flightId: number) => {
    try {
      const response = await fetch(`${API_BASE_URL}/flight/${flightId}`, {
        method: "DELETE",
        headers: {
          'Authorization': `Bearer ${localStorage.getItem("token")}`
        },
      });
  
      if (!response.ok) {
        const errorData = await response.json();
        if (response.status === 400 && errorData.message) {
          alert(errorData.message);
        } else {
          alert("Failed to delete flight");
        }
        return;
      }
  
      alert("Flight deleted successfully!");
      setFlights((prevFlights) => prevFlights.filter((flight) => flight.id !== flightId));
    } catch (error) {
      console.error("Error deleting flight", error);
      alert("Error deleting flight");
    }
  };

  const handleSearch = async (searchData: SearchData) => {
      setIsLoading(true);
      setError("");
      setSearchData(searchData);
      setHasSearched(true);
      
      try {
        // Build search parameters - only include non-empty values
        const searchParams: any = {};
        
        if (searchData.route.origin && searchData.route.origin.trim() !== '') {
          searchParams.origin = searchData.route.origin;
        }
        if (searchData.route.destination && searchData.route.destination.trim() !== '') {
          searchParams.destination = searchData.route.destination;
        }
        if (searchData.route.departDate && searchData.route.departDate.trim() !== '') {
          searchParams.date = searchData.route.departDate;
        }
        if (searchData.airline && searchData.airline.trim() !== '' && searchData.airline !== 'all') {
          searchParams.airlines = [searchData.airline];
        }
        if (searchData.priceRange[0] > 0) {
          searchParams.priceMin = searchData.priceRange[0];
        }
        if (searchData.priceRange[1] < 10000) { // Assuming max price is 10000
          searchParams.priceMax = searchData.priceRange[1];
        }
        
        // If no search parameters provided, show all flights
        const hasSearchParams = Object.keys(searchParams).length > 0;
        const response = hasSearchParams 
          ? await searchFlights(searchParams)
          : await getAllFlights();
        
        // Transform flights for display
        const displayFlights = response.map(transformFlightToDisplay);
        setFlights(displayFlights);
      } catch (err) {
        setError('Failed to search flights. Please try again.');
        console.error('Search error:', err);
      } finally {
        setIsLoading(false);
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

            <div className={`container mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8 ${isSidebarOpen ? 'lg:overflow-y-auto overflow-hidden' : 'overflow-y-auto'}`}>
              <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 sm:gap-6 lg:gap-8">
                {/* Search Panel */}
                <div className="lg:col-span-1">
                  <div className="lg:sticky lg:top-20 z-40">
                    <FlightSearchPanel 
                      onSearch={handleSearch}
                      compactLayout={true}
                    />
                  </div>
                </div>
      
                {/* Flight List with Add dropdown */}
                <div className="lg:col-span-3">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4 sm:mb-6">
                <div>
                  <h2 className="text-xl sm:text-2xl font-semibold bg-gradient-to-r from-teal-700 to-cyan-700 bg-clip-text text-transparent">
                    {hasSearched ? 'Search Results' : 'All Flights'}
                  </h2>
                  <p className="text-xs sm:text-sm text-teal-700 mt-1">
                    {hasSearched 
                      ? `${flights.length} flights found`
                      : `${flights.length} total flights`}
                  </p>
                </div>
  
                {/* Dropdown Button */}
                <div className="relative w-full sm:w-auto flex justify-end" ref={dropdownRef}>
                  <button
                    onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                    className="bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white px-3 sm:px-4 py-2 rounded-lg font-semibold shadow-lg hover:shadow-xl transition-all cursor-pointer text-sm sm:text-base"
                  >
                    Add
                  </button>
  
                  {isDropdownOpen && (
                    <div className="absolute right-0 mt-2 w-40 sm:w-48 bg-white/95 backdrop-blur-sm border border-teal-200/50 shadow-xl rounded-lg overflow-hidden z-50">
                      <ul>
                        <li className="px-3 sm:px-4 py-2 hover:bg-teal-50 cursor-pointer text-teal-800 transition-colors text-sm sm:text-base" onClick={() => handleNavigation("/admin/add-flight")}>
                          Add Flight
                        </li>
                        <li className="px-3 sm:px-4 py-2 hover:bg-teal-50 cursor-pointer text-teal-800 transition-colors text-sm sm:text-base" onClick={() => handleNavigation("/admin/add-airport")}>
                          Add Airport
                        </li>
                        <li className="px-3 sm:px-4 py-2 hover:bg-teal-50 cursor-pointer text-teal-800 transition-colors text-sm sm:text-base" onClick={() => handleNavigation("/admin/add-airline")}>
                          Add Airline
                        </li>
                        <li className="px-3 sm:px-4 py-2 hover:bg-teal-50 cursor-pointer text-teal-800 transition-colors text-sm sm:text-base" onClick={() => handleNavigation("/admin/add-route")}>
                          Add Route
                        </li>
                      </ul>
                    </div>
                  )}
                </div>
              </div>
  
              {/* Flight List */}
              <FlightList
                flights={flights}
                onSelectFlight={() => {}}
                onUpdateFlight={handleUpdateFlight}
                onDeleteFlight={handleDeleteFlight}
                isLoading={isLoading}
                error={error}
              />
                </div>
              </div>
            </div>
          </div>
        </div>
        {/* Footer */}
        <footer className="mt-4 py-2 text-center text-gray-600 text-xs">
          © 2025 FlyPorter
        </footer>
      </div>
    );
};

export default AdminPage;
