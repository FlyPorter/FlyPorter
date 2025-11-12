import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { API_BASE_URL } from "../config";
import { getAirlines } from "../features/search/api/airlineApi";
import { getAirports } from "../features/search/api/airportApi";

interface Airline {
  code: string;
  name: string;
}

interface Airport {
  code: string;
  city: string;
}

interface Route {
  route_id: number;
  origin_airport_code: string;
  destination_airport_code: string;
  origin_airport?: {
    airport_code: string;
    airport_name: string;
    city_name: string;
  };
  destination_airport?: {
    airport_code: string;
    airport_name: string;
    city_name: string;
  };
}

const AddFlightPage = () => {
  const [creationMethod, setCreationMethod] = useState<'route' | 'airport'>('route');
  const [routes, setRoutes] = useState<Route[]>([]);
  const [airlines, setAirlines] = useState<Airline[]>([]);
  const [airports, setAirports] = useState<Airport[]>([]);
  
  // Route-based fields
  const [selectedRouteId, setSelectedRouteId] = useState<string>("");
  
  // Airport-based fields
  const [originAirportCode, setOriginAirportCode] = useState<string>("");
  const [destinationAirportCode, setDestinationAirportCode] = useState<string>("");
  
  // Common fields
  const [airlineCode, setAirlineCode] = useState<string>("");
  const [departureDate, setDepartureDate] = useState<string>("");
  const [departureTime, setDepartureTime] = useState<string>("08:00");
  const [arrivalDate, setArrivalDate] = useState<string>("");
  const [arrivalTime, setArrivalTime] = useState<string>("11:00");
  const [seatCapacity, setSeatCapacity] = useState<number | "">("");
  const [basePrice, setBasePrice] = useState<number | "">("");
  
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const navigate = useNavigate();

  useEffect(() => {
    fetchData();
  }, []);

  const getAuthHeaders = () => ({
    Authorization: `Bearer ${localStorage.getItem("token")}`,
    "Content-Type": "application/json",
  });

  const fetchData = async () => {
    try {
      setIsLoading(true);
      const [routesRes, airlinesData, airportsData] = await Promise.all([
        fetch(`${API_BASE_URL}/route`, { headers: getAuthHeaders() }),
        getAirlines(),
        getAirports(),
      ]);

      if (!routesRes.ok) {
        throw new Error("Failed to fetch routes");
      }

      const routesResponseData = await routesRes.json();
      const routesData = routesResponseData.success && routesResponseData.data 
        ? routesResponseData.data 
        : Array.isArray(routesResponseData) 
          ? routesResponseData 
          : routesResponseData.data || [];
      
      if (!Array.isArray(routesData)) {
        console.error('Invalid response format. Expected array of routes:', routesData);
        setRoutes([]);
      } else {
        setRoutes(routesData);
      }
      
      setAirlines(airlinesData);
      setAirports(airportsData);
    } catch (err) {
      console.error("Error fetching data:", err);
      setError("Failed to load data. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddFlight = async () => {
    setError(null);

    // Validate common fields
    if (!airlineCode || !departureDate || !departureTime || !arrivalDate || !arrivalTime || seatCapacity === "" || basePrice === "") {
      setError("Please fill in all required fields.");
      return;
    }

    // Validate method-specific fields
    if (creationMethod === 'route' && !selectedRouteId) {
      setError("Please select a route.");
      return;
    }

    if (creationMethod === 'airport') {
      if (!originAirportCode || !destinationAirportCode) {
        setError("Please select both origin and destination airports.");
        return;
      }
      if (originAirportCode === destinationAirportCode) {
        setError("Origin and destination airports cannot be the same.");
        return;
      }
    }

    try {
      // Build departure and arrival datetime strings
      const departureDateTime = new Date(`${departureDate}T${departureTime}:00`).toISOString();
      const arrivalDateTime = new Date(`${arrivalDate}T${arrivalTime}:00`).toISOString();

      // Build request body based on creation method
      const requestBody: any = {
        airline_code: airlineCode,
        departure_time: departureDateTime,
        arrival_time: arrivalDateTime,
        base_price: Number(basePrice),
        seat_capacity: Number(seatCapacity),
      };

      if (creationMethod === 'route') {
        const routeId = parseInt(selectedRouteId, 10);
        requestBody.route_id = routeId;
      } else {
        requestBody.origin_airport_code = originAirportCode.toUpperCase();
        requestBody.destination_airport_code = destinationAirportCode.toUpperCase();
      }

      const response = await fetch(`${API_BASE_URL}/flight`, {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || errorData.error || "Error adding flight.");
      }

      const responseData = await response.json();
      if (responseData.success === false) {
        throw new Error(responseData.message || "Error adding flight.");
      }

      // Reset form
      setSelectedRouteId("");
      setOriginAirportCode("");
      setDestinationAirportCode("");
      setAirlineCode("");
      setDepartureDate("");
      setDepartureTime("08:00");
      setArrivalDate("");
      setArrivalTime("11:00");
      setSeatCapacity("");
      setBasePrice("");
      setError(null);
      alert("Flight added successfully!");
    } catch (err: any) {
      setError(err.message || "Error adding flight.");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50/50 via-cyan-50/50 to-teal-100/20">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <h2 className="text-2xl font-bold mb-4 bg-gradient-to-r from-teal-700 to-cyan-700 bg-clip-text text-transparent">Add Flight</h2>

        {error && (
          <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-lg border border-red-200 font-medium">
            {error}
          </div>
        )}

        <div className="mb-6 p-6 border border-teal-200/50 rounded-lg shadow-2xl bg-white/90 backdrop-blur-sm">
          <h3 className="text-lg font-semibold mb-4 text-teal-800">Creation Method</h3>
          <div className="flex gap-4 mb-6">
            <label className="flex items-center cursor-pointer">
              <input
                type="radio"
                value="route"
                checked={creationMethod === 'route'}
                onChange={(e) => setCreationMethod(e.target.value as 'route')}
                className="mr-2 accent-teal-600"
              />
              <span className="text-teal-700 font-medium">Create by Route</span>
            </label>
            <label className="flex items-center cursor-pointer">
              <input
                type="radio"
                value="airport"
                checked={creationMethod === 'airport'}
                onChange={(e) => setCreationMethod(e.target.value as 'airport')}
                className="mr-2 accent-teal-600"
              />
              <span className="text-teal-700 font-medium">Create by Airports</span>
            </label>
          </div>

        <div className="grid grid-cols-2 gap-4">
          {/* Route Selection (when method is 'route') */}
          {creationMethod === 'route' && (
            <div className="col-span-2">
              <label className="block text-sm font-medium mb-1 text-teal-700">Route *</label>
              <select
                value={selectedRouteId}
                onChange={(e) => setSelectedRouteId(e.target.value)}
                className="border border-teal-200 p-2 rounded-lg w-full focus:border-teal-400 focus:ring-2 focus:ring-teal-200 text-teal-900"
                required
              >
                <option value="">Select Route</option>
                {routes.map((route) => (
                  <option key={route.route_id} value={route.route_id}>
                    {route.origin_airport_code} → {route.destination_airport_code}
                    {route.origin_airport?.city_name && route.destination_airport?.city_name 
                      ? ` (${route.origin_airport.city_name} → ${route.destination_airport.city_name})`
                      : ''}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Airport Selection (when method is 'airport') */}
          {creationMethod === 'airport' && (
            <>
              <div>
                <label className="block text-sm font-medium mb-1 text-teal-700">Origin Airport *</label>
                <select
                  value={originAirportCode}
                  onChange={(e) => setOriginAirportCode(e.target.value)}
                  className="border border-teal-200 p-2 rounded-lg w-full focus:border-teal-400 focus:ring-2 focus:ring-teal-200 text-teal-900"
                  required
                >
                  <option value="">Select Origin Airport</option>
                  {airports.map((airport) => (
                    <option key={airport.code} value={airport.code}>
                      {airport.code} - {airport.city}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1 text-teal-700">Destination Airport *</label>
                <select
                  value={destinationAirportCode}
                  onChange={(e) => setDestinationAirportCode(e.target.value)}
                  className="border border-teal-200 p-2 rounded-lg w-full focus:border-teal-400 focus:ring-2 focus:ring-teal-200 text-teal-900"
                  required
                >
                  <option value="">Select Destination Airport</option>
                  {airports.map((airport) => (
                    <option key={airport.code} value={airport.code}>
                      {airport.code} - {airport.city}
                    </option>
                  ))}
                </select>
              </div>
            </>
          )}

          {/* Common Fields */}
          <div>
            <label className="block text-sm font-medium mb-1 text-teal-700">Airline *</label>
            <select
              value={airlineCode}
              onChange={(e) => setAirlineCode(e.target.value)}
              className="border border-teal-200 p-2 rounded-lg w-full focus:border-teal-400 focus:ring-2 focus:ring-teal-200 text-teal-900"
              required
            >
              <option value="">Select Airline</option>
              {airlines.map((airline) => (
                <option key={airline.code} value={airline.code}>
                  {airline.name} ({airline.code})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1 text-teal-700">Seat Capacity *</label>
            <input
              type="number"
              value={seatCapacity}
              onChange={(e) => setSeatCapacity(e.target.value ? parseInt(e.target.value) : "")}
              className="border border-teal-200 p-2 rounded-lg w-full focus:border-teal-400 focus:ring-2 focus:ring-teal-200 text-teal-900"
              min="1"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1 text-teal-700">Base Price *</label>
            <input
              type="number"
              value={basePrice}
              onChange={(e) => setBasePrice(e.target.value ? parseFloat(e.target.value) : "")}
              className="border border-teal-200 p-2 rounded-lg w-full focus:border-teal-400 focus:ring-2 focus:ring-teal-200 text-teal-900"
              min="0"
              step="0.01"
              required
            />
          </div>

          <div className="col-span-2 border-t border-teal-200 pt-4 mt-2">
            <h4 className="text-md font-medium mb-3 text-teal-800">Departure</h4>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1 text-teal-700">Departure Date *</label>
                <input
                  type="date"
                  value={departureDate}
                  onChange={(e) => setDepartureDate(e.target.value)}
                  className="border border-teal-200 p-2 rounded-lg w-full focus:border-teal-400 focus:ring-2 focus:ring-teal-200 text-teal-900"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1 text-teal-700">Departure Time *</label>
                <input
                  type="time"
                  value={departureTime}
                  onChange={(e) => setDepartureTime(e.target.value)}
                  className="border border-teal-200 p-2 rounded-lg w-full focus:border-teal-400 focus:ring-2 focus:ring-teal-200 text-teal-900"
                  required
                />
              </div>
            </div>
          </div>

          <div className="col-span-2 border-t border-teal-200 pt-4 mt-2">
            <h4 className="text-md font-medium mb-3 text-teal-800">Arrival</h4>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1 text-teal-700">Arrival Date *</label>
                <input
                  type="date"
                  value={arrivalDate}
                  onChange={(e) => setArrivalDate(e.target.value)}
                  min={departureDate}
                  className="border border-teal-200 p-2 rounded-lg w-full focus:border-teal-400 focus:ring-2 focus:ring-teal-200 text-teal-900"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1 text-teal-700">Arrival Time *</label>
                <input
                  type="time"
                  value={arrivalTime}
                  onChange={(e) => setArrivalTime(e.target.value)}
                  className="border border-teal-200 p-2 rounded-lg w-full focus:border-teal-400 focus:ring-2 focus:ring-teal-200 text-teal-900"
                  required
                />
              </div>
            </div>
          </div>
        </div>

          <button
            onClick={handleAddFlight}
            disabled={isLoading}
            className={`mt-6 bg-gradient-to-r from-teal-600 to-cyan-600 hover:from-teal-700 hover:to-cyan-700 text-white px-6 py-2 rounded-lg font-semibold shadow-lg hover:shadow-xl transition-all ${
              isLoading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
            }`}
          >
            {isLoading ? 'Adding...' : 'Add Flight'}
          </button>
        </div>

        <div className="mt-6 text-center">
          <button
            onClick={() => navigate("/admin")}
            className="bg-gradient-to-r from-teal-600 to-cyan-600 hover:from-teal-700 hover:to-cyan-700 text-white px-6 py-2 rounded-lg font-semibold shadow-lg hover:shadow-xl transition-all cursor-pointer"
          >
            Back to Admin
          </button>
        </div>
      </div>
    </div>
  );
};

export default AddFlightPage;
