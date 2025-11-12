import { useState, useEffect } from "react";
import { useNavigate } from 'react-router-dom';
import FlightList from '../features/admin/components/FlightList';
import { SearchData, FlightDisplay } from '../features/admin/types';
import { searchFlights, getAllFlights, transformFlightToDisplay } from '../features/search/api/flightApi';
import FlightSearchPanel from '../features/search/components/FlightSearchPanel';
import NavigationBar from '../components/NavigationBar';
import Sidebar from '../features/dashboard/components/Sidebar';
import { API_BASE_URL } from "../config";

const AdminPage = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>("");
  const [flights, setFlights] = useState<FlightDisplay[]>([]);
  const [searchData, setSearchData] = useState<SearchData | null>(null);
  const [hasSearched, setHasSearched] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

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
      <div className="h-screen overflow-hidden bg-gradient-to-br from-teal-50/50 via-cyan-50/50 to-teal-100/20">
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
                    <FlightSearchPanel onSearch={handleSearch} />
                  </div>
                </div>
      
                {/* Flight List with Add dropdown */}
                <div className="lg:col-span-3">
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h2 className="text-2xl font-semibold bg-gradient-to-r from-teal-700 to-cyan-700 bg-clip-text text-transparent">
                    {hasSearched ? 'Search Results' : 'All Flights'}
                  </h2>
                  <p className="text-teal-700 mt-1">
                    {hasSearched 
                      ? `${flights.length} flights found`
                      : `${flights.length} total flights`}
                  </p>
                </div>
  
                {/* Dropdown Button */}
                <div className="relative">
                  <button
                    onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                    className="bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white px-4 py-2 rounded-lg font-semibold shadow-lg hover:shadow-xl transition-all cursor-pointer"
                  >
                    Add
                  </button>
  
                  {isDropdownOpen && (
                    <div className="absolute right-0 mt-2 w-48 bg-white/95 backdrop-blur-sm border border-teal-200/50 shadow-xl rounded-lg overflow-hidden">
                      <ul>
                        <li className="px-4 py-2 hover:bg-teal-50 cursor-pointer text-teal-800 transition-colors" onClick={() => handleNavigation("/admin/add-flight")}>
                          Add Flight
                        </li>
                        <li className="px-4 py-2 hover:bg-teal-50 cursor-pointer text-teal-800 transition-colors" onClick={() => handleNavigation("/admin/add-airport")}>
                          Add Airport
                        </li>
                        <li className="px-4 py-2 hover:bg-teal-50 cursor-pointer text-teal-800 transition-colors" onClick={() => handleNavigation("/admin/add-airline")}>
                          Add Airline
                        </li>
                        <li className="px-4 py-2 hover:bg-teal-50 cursor-pointer text-teal-800 transition-colors" onClick={() => handleNavigation("/admin/add-route")}>
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
      </div>
    );
};

export default AdminPage;
