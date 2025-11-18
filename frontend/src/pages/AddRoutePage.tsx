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
    <div className="min-h-screen bg-gradient-to-br from-teal-50/50 via-cyan-50/50 to-teal-100/20">
      <div className="container mx-auto px-4 py-8">
        <h2 className="text-2xl font-bold mb-4 bg-gradient-to-r from-teal-700 to-cyan-700 bg-clip-text text-transparent">Manage Routes</h2>

        {error && (
          <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-lg border border-red-200 font-medium">
            {error}
          </div>
        )}

        <div className="mb-6 p-6 border border-teal-200/50 rounded-lg shadow-2xl bg-white/90 backdrop-blur-sm">
          <h3 className="text-lg font-semibold mb-4 text-teal-800">Add Route</h3>
          <div className="grid grid-cols-2 gap-4">
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
          </div>

          <button
            onClick={handleAddRoute}
            disabled={isLoading}
            className={`mt-4 bg-gradient-to-r from-teal-600 to-cyan-600 hover:from-teal-700 hover:to-cyan-700 text-white px-4 py-2 rounded-lg font-semibold shadow-lg hover:shadow-xl transition-all ${
              isLoading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
            }`}
          >
            {isLoading ? 'Adding...' : 'Add Route'}
          </button>
        </div>

        <div className="mt-8 p-6 border border-teal-200/50 rounded-lg shadow-2xl bg-white/90 backdrop-blur-sm">
          <h3 className="text-lg font-semibold mb-4 text-teal-800">Existing Routes</h3>
          {routes.length === 0 ? (
            <p className="text-teal-700 font-medium">No routes available.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-gradient-to-r from-teal-50 to-cyan-50">
                    <th className="border border-teal-200 p-3 text-left text-teal-800 font-semibold">Route ID</th>
                    <th className="border border-teal-200 p-3 text-left text-teal-800 font-semibold">Origin</th>
                    <th className="border border-teal-200 p-3 text-left text-teal-800 font-semibold">Destination</th>
                  </tr>
                </thead>
                <tbody>
                  {routes.map((route) => (
                    <tr key={route.route_id} className="border-b border-teal-100 hover:bg-teal-50/50 transition-colors">
                      <td className="border border-teal-200 p-3 text-teal-900 font-medium">{route.route_id}</td>
                      <td className="border border-teal-200 p-3 text-teal-900">
                        {route.origin_airport_code}
                        {route.origin_airport?.city_name && ` (${route.origin_airport.city_name})`}
                      </td>
                      <td className="border border-teal-200 p-3 text-teal-900">
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
            className="bg-gradient-to-r from-teal-600 to-cyan-600 hover:from-teal-700 hover:to-cyan-700 text-white px-6 py-2 rounded-lg font-semibold shadow-lg hover:shadow-xl transition-all cursor-pointer"
          >
            Back to Admin
          </button>
        </div>
      </div>
      {/* Footer */}
      <footer className="mt-4 py-2 text-center text-gray-600 text-xs">
        © 2025 FlyPorter
      </footer>
    </div>
  );
};

export default AddRoutePage;
