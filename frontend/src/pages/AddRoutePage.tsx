import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { API_BASE_URL } from "../config";

interface Airline {
  code: string;
  name: string;
}

interface Airport {
  code: string;
  city: string;
}

interface Aircraft {
  id: number;
  capacity: number;
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

const AddRoutePage = () => {
  const [routes, setRoutes] = useState<Route[]>([]);
  const [airlines, setAirlines] = useState<Airline[]>([]);
  const [airports, setAirports] = useState<Airport[]>([]);
  const [aircrafts, setAircrafts] = useState<Aircraft[]>([]);

  const [flightNumber, setFlightNumber] = useState<number | "">("");
  const [airlineCode, setAirlineCode] = useState("");
  const [departureAirport, setDepartureAirport] = useState("");
  const [destinationAirport, setDestinationAirport] = useState("");
  const [departureTime, setDepartureTime] = useState("");
  const [duration, setDuration] = useState(0);
  const [aircraftId, setAircraftId] = useState<number | "">("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

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
      const [routesRes, airlinesRes, airportsRes, aircraftsRes] = await Promise.all([
        fetch(`${API_BASE_URL}/route`, { headers: getAuthHeaders() }),
        fetch(`${API_BASE_URL}/airline`, { headers: getAuthHeaders() }),
        fetch(`${API_BASE_URL}/airport`, { headers: getAuthHeaders() }),
        fetch(`${API_BASE_URL}/aircraft`, { headers: getAuthHeaders() }),
      ]);

      if (!routesRes.ok || !airlinesRes.ok || !airportsRes.ok || !aircraftsRes.ok) {
        throw new Error("Failed to fetch data");
      }

      setRoutes(await routesRes.json());
      setAirlines(await airlinesRes.json());
      setAirports(await airportsRes.json());
      setAircrafts(await aircraftsRes.json());
    } catch (err) {
      console.error("Error fetching data:", err);
    }
  };

  const handleAddRoute = async () => {
    setError(null);

    if (!flightNumber || !airlineCode || !departureAirport || !destinationAirport || !departureTime || !duration || !aircraftId || !startDate || !endDate) {
      setError("Please fill in all fields.");
      return;
    }

    try {
      const payload = {
        flight_number: Number(flightNumber),
        airline_code: airlineCode,
        departure_airport: departureAirport,
        destination_airport: destinationAirport,
        departure_time: departureTime.toString(),
        duration: Number(duration),
        aircraft_id: Number(aircraftId),
        start_date: startDate,
        end_date: endDate,
      };

      const response = await fetch(`${API_BASE_URL}/route`, {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify(payload),
      });

      console.log("Sending Payload:", JSON.stringify(payload));

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Error adding route.");
      }

      fetchData();
      setFlightNumber("");
      setAirlineCode("");
      setDepartureAirport("");
      setDestinationAirport("");
      setDepartureTime("");
      setDuration(0);
      setAircraftId("");
      setStartDate("");
      setEndDate("");
    } catch (err: any) {
      setError(err.message);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h2 className="text-2xl font-bold mb-4">Manage Routes</h2>

      <div className="mb-6 p-4 border rounded shadow">
        <h3 className="text-lg font-semibold mb-2">Add Route</h3>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium">Flight Number</label>
            <input
              type="number"
              value={flightNumber}
              onChange={(e) => setFlightNumber(e.target.value)}
              className="border p-2 rounded w-full"
            />
          </div>

          <div>
            <label className="block text-sm font-medium">Airline</label>
            <select value={airlineCode} onChange={(e) => setAirlineCode(e.target.value)} className="border p-2 rounded w-full">
              <option value="">Select Airline</option>
              {airlines.map((airline) => (
                <option key={airline.code} value={airline.code}>
                  {airline.name} ({airline.code})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium">Departure Airport</label>
            <select value={departureAirport} onChange={(e) => setDepartureAirport(e.target.value)} className="border p-2 rounded w-full">
              <option value="">Select Departure Airport</option>
              {airports.map((airport) => (
                <option key={airport.code} value={airport.code}>
                  {airport.city} ({airport.code})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium">Destination Airport</label>
            <select value={destinationAirport} onChange={(e) => setDestinationAirport(e.target.value)} className="border p-2 rounded w-full">
              <option value="">Select Destination Airport</option>
              {airports.map((airport) => (
                <option key={airport.code} value={airport.code}>
                  {airport.city} ({airport.code})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium">Departure Time</label>
            <input
              type="time"
              value={departureTime}
              onChange={(e) => setDepartureTime(e.target.value)}
              className="border p-2 rounded w-full"
            />
          </div>

          <div>
            <label className="block text-sm font-medium">Duration (minutes)</label>
            <input
              type="number"
              value={duration}
              onChange={(e) => setDuration(parseInt(e.target.value) || 0)}
              className="border p-2 rounded w-full"
            />
          </div>

          <div>
            <label className="block text-sm font-medium">Aircraft</label>
            <select value={aircraftId} onChange={(e) => setAircraftId(parseInt(e.target.value) || "")} className="border p-2 rounded w-full">
              <option value="">Select Aircraft</option>
              {aircrafts.map((aircraft) => (
                <option key={aircraft.id} value={aircraft.id}>
                  Aircraft ID: {aircraft.id} (Capacity: {aircraft.capacity})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium">Start Date</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="border p-2 rounded w-full"
            />
          </div>

          <div>
            <label className="block text-sm font-medium">End Date</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="border p-2 rounded w-full"
            />
          </div>
        </div>
        <button onClick={handleAddRoute} className="bg-green-500 text-white px-4 py-2 mt-4 rounded">
          Add Route
        </button>
        {error && <p className="text-red-500 mt-2">{error}</p>}
      </div>

      <div className="mt-8 p-4 border rounded shadow">
  <h3 className="text-lg font-semibold mb-2">Existing Routes</h3>
  {routes.length === 0 ? (
    <p>No routes available.</p>
  ) : (
    <table className="w-full border-collapse border border-gray-300">
      <thead>
        <tr className="bg-gray-200">
          <th className="border p-2">Flight Number</th>
          <th className="border p-2">Airline</th>
          <th className="border p-2">Departure</th>
          <th className="border p-2">Destination</th>
          <th className="border p-2">Departure Time</th>
          <th className="border p-2">Duration</th>
          <th className="border p-2">Start Date</th>
          <th className="border p-2">End Date</th>
        </tr>
      </thead>
      <tbody>
        {routes.map((route) => (
          <tr key={route.id} className="text-center">
            <td className="border p-2">{route.flight_number}</td>
            <td className="border p-2">{route.airline_code}</td>
            <td className="border p-2">{route.departure_airport}</td>
            <td className="border p-2">{route.destination_airport}</td>
            <td className="border p-2">{route.departure_time}</td>
            <td className="border p-2">{route.duration} min</td>
            <td className="border p-2">{route.start_date.split("T")[0]}</td>
            <td className="border p-2">{route.end_date.split("T")[0]}</td>
          </tr>
        ))}
      </tbody>
    </table>
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
