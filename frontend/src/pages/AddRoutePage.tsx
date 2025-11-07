import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { API_BASE_URL } from "../config";
import { getAirports } from "../features/search/api/airportApi";

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

const AddRoutePage = () => {
  const [routes, setRoutes] = useState<Route[]>([]);
  const [airports, setAirports] = useState<Airport[]>([]);
  const [originAirportCode, setOriginAirportCode] = useState("");
  const [destinationAirportCode, setDestinationAirportCode] = useState("");
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
      const [routesRes, airportsData] = await Promise.all([
        fetch(`${API_BASE_URL}/route`, { headers: getAuthHeaders() }),
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
      
      setAirports(airportsData);
    } catch (err) {
      console.error("Error fetching data:", err);
      setError("Failed to load data. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddRoute = async () => {
    setError(null);

    if (!originAirportCode || !destinationAirportCode) {
      setError("Please select both origin and destination airports.");
      return;
    }

    if (originAirportCode === destinationAirportCode) {
      setError("Origin and destination airports cannot be the same.");
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/route`, {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify({
          origin_airport_code: originAirportCode.toUpperCase(),
          destination_airport_code: destinationAirportCode.toUpperCase(),
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || errorData.error || "Error adding route.");
      }

      const responseData = await response.json();
      if (responseData.success === false) {
        throw new Error(responseData.message || "Error adding route.");
      }

      // Reset form and refresh data
      setOriginAirportCode("");
      setDestinationAirportCode("");
      setError(null);
      fetchData();
      alert("Route added successfully!");
    } catch (err: any) {
      setError(err.message || "Error adding route.");
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h2 className="text-2xl font-bold mb-4">Manage Routes</h2>

      {error && (
        <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-md">
          {error}
        </div>
      )}

      <div className="mb-6 p-4 border rounded shadow">
        <h3 className="text-lg font-semibold mb-4">Add Route</h3>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Origin Airport *</label>
            <select
              value={originAirportCode}
              onChange={(e) => setOriginAirportCode(e.target.value)}
              className="border p-2 rounded w-full"
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
            <label className="block text-sm font-medium mb-1">Destination Airport *</label>
            <select
              value={destinationAirportCode}
              onChange={(e) => setDestinationAirportCode(e.target.value)}
              className="border p-2 rounded w-full"
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
        </div>

        <button
          onClick={handleAddRoute}
          disabled={isLoading}
          className={`mt-4 bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 ${
            isLoading ? 'opacity-50 cursor-not-allowed' : ''
          }`}
        >
          {isLoading ? 'Adding...' : 'Add Route'}
        </button>
      </div>

      <div className="mt-8 p-4 border rounded shadow">
        <h3 className="text-lg font-semibold mb-4">Existing Routes</h3>
        {routes.length === 0 ? (
          <p className="text-gray-600">No routes available.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse border border-gray-300">
              <thead>
                <tr className="bg-gray-200">
                  <th className="border p-2 text-left">Route ID</th>
                  <th className="border p-2 text-left">Origin</th>
                  <th className="border p-2 text-left">Destination</th>
                </tr>
              </thead>
              <tbody>
                {routes.map((route) => (
                  <tr key={route.route_id} className="border">
                    <td className="border p-2">{route.route_id}</td>
                    <td className="border p-2">
                      {route.origin_airport_code}
                      {route.origin_airport?.city_name && ` (${route.origin_airport.city_name})`}
                    </td>
                    <td className="border p-2">
                      {route.destination_airport_code}
                      {route.destination_airport?.city_name && ` (${route.destination_airport.city_name})`}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="mt-6 text-center">
        <button
          onClick={() => navigate("/admin")}
          className="bg-blue-500 text-white px-6 py-2 rounded hover:bg-blue-600"
        >
          Back to Admin
        </button>
      </div>
    </div>
  );
};

export default AddRoutePage;
