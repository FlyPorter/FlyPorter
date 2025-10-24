import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { API_BASE_URL } from "../config";

interface Airline {
  code: string;
  name: string;
}

interface Route {
  id: number;
  flight_number: number;
  airline_code: string;
  departure_airport: string;
  destination_airport: string;
  departure_time: string;
  duration: number;
  aircraft_id: number;
  start_date: string;
  end_date: string;
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
      const routesData = await routesRes.json();
      setRoutes(routesData);
    } catch (err) {
      console.error("Error fetching data:", err);
    }
  };

  const handleAddFlight = async () => {
    setError(null);

    if (!selectedRouteId  || !date || !availableTickets || !price) {
      setError("Please fill in all fields.");
      return;
    }

    try {
      const routeParts = selectedRouteId.split(" - ");
      const flightNumber = parseInt(routeParts[0], 10);
      const selectedRoute = routes.find((route) => route.flight_number === flightNumber);
      if (!selectedRoute) {
        throw new Error("Selected route not found.");
      }

      const response = await fetch(`${API_BASE_URL}/flight`, {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify({
          flight_number: Number(selectedRoute.flight_number),
          airline_code: selectedRoute.airline_code,
          date,
          available_tickets: Number(availableTickets),
          price: Number(price),
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Error adding flight.");
      }

      setSelectedRouteId("");
      setDate("");
      setAvailableTickets("");
      setPrice("");
    } catch (err: any) {
      setError(err.message);
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
                <option key={route.id} value={route.id}>
                  {route.flight_number} - {route.departure_airport} to {route.destination_airport}
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
