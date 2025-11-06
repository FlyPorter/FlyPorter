import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { API_BASE_URL } from "../config";

interface Airline {
  code: string;
  name: string;
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

interface Flight {
  id: number;
  flight_number: number;
  airline_code: string;
  date: string;
  available_tickets: number;
  price: number;
}

const AddFlightPage = () => {
  const [routes, setRoutes] = useState<Route[]>([]);
  const [selectedRouteId, setSelectedRouteId] = useState<string | "">("");
  const [date, setDate] = useState("");
  const [availableTickets, setAvailableTickets] = useState<number | "">("");
  const [price, setPrice] = useState<number | "">("");
  const [error, setError] = useState<string | null>(null);

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
      const routesRes = await fetch(`${API_BASE_URL}/route`, {
        headers: getAuthHeaders(),
      });
      if (!routesRes.ok) {
        throw new Error("Failed to fetch routes");
      }
      const responseData = await routesRes.json();
      
      // Handle the response structure from sendSuccess
      const routesData = responseData.success && responseData.data 
        ? responseData.data 
        : Array.isArray(responseData) 
          ? responseData 
          : responseData.data || [];
      
      if (!Array.isArray(routesData)) {
        console.error('Invalid response format. Expected array of routes:', routesData);
        setRoutes([]);
        return;
      }
      
      setRoutes(routesData);
    } catch (err) {
      console.error("Error fetching data:", err);
      setRoutes([]);
    }
  };

  const handleAddFlight = async () => {
    setError(null);

    if (!selectedRouteId || !date || availableTickets === "" || price === "") {
      setError("Please fill in all fields.");
      return;
    }

    try {
      const routeId = parseInt(selectedRouteId, 10);
      const selectedRoute = routes.find((route) => route.route_id === routeId);
      if (!selectedRoute) {
        throw new Error("Selected route not found.");
      }

      // Parse date and time - need to create departure_time and arrival_time
      // For now, we'll use the date and add default times
      const departureTime = new Date(`${date}T08:00:00Z`).toISOString();
      const arrivalTime = new Date(`${date}T11:00:00Z`).toISOString(); // Default 3 hours later

      const response = await fetch(`${API_BASE_URL}/flight`, {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify({
          route_id: selectedRoute.route_id,
          origin_airport_code: selectedRoute.origin_airport_code,
          destination_airport_code: selectedRoute.destination_airport_code,
          airline_code: "FP", // Default airline, should be selectable
          departure_time: departureTime,
          arrival_time: arrivalTime,
          base_price: Number(price),
          seat_capacity: Number(availableTickets),
        }),
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
      setDate("");
      setAvailableTickets("");
      setPrice("");
      setError(null);
      alert("Flight added successfully!");
    } catch (err: any) {
      setError(err.message || "Error adding flight.");
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h2 className="text-2xl font-bold mb-4">Add Flight</h2>

      <div className="mb-6 p-4 border rounded shadow">
        <h3 className="text-lg font-semibold mb-2">Flight Details</h3>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium">Route</label>
            <select
              value={selectedRouteId}
              onChange={(e) => setSelectedRouteId(e.target.value || "")}
              className="border p-2 rounded w-full"
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

          <div>
            <label className="block text-sm font-medium">Date</label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="border p-2 rounded w-full"
            />
          </div>

          <div>
            <label className="block text-sm font-medium">Available Tickets</label>
            <input
              type="number"
              value={availableTickets}
              onChange={(e) => setAvailableTickets(e.target.value)}
              className="border p-2 rounded w-full"
            />
          </div>

          <div>
            <label className="block text-sm font-medium">Price</label>
            <input
              type="number"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              className="border p-2 rounded w-full"
            />
          </div>
        </div>

        <button
          onClick={handleAddFlight}
          className="bg-green-500 text-white px-4 py-2 mt-4 rounded"
        >
          Add Flight
        </button>
        {error && <p className="text-red-500 mt-2">{error}</p>}
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

export default AddFlightPage;
