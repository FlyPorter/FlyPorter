import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { API_BASE_URL } from "../config";

interface Airport {
  airport_code: string;
  city_name: string;
  airport_name?: string;
}

const AddAirportPage = () => {
  const [airports, setAirports] = useState<Airport[]>([]);
  const [code, setCode] = useState("");
  const [city, setCity] = useState("");
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    fetchAirports();
  }, []);

  const getAuthHeaders = () => ({
    Authorization: `Bearer ${localStorage.getItem("token")}`,
    "Content-Type": "application/json",
  });

  const fetchAirports = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/airport`, {
        headers: getAuthHeaders(),
      });
      if (!response.ok) throw new Error("Failed to fetch airports");

      const responseData = await response.json();
      
      // Handle the response structure from sendSuccess
      const airportsData = responseData.success && responseData.data 
        ? responseData.data 
        : Array.isArray(responseData) 
          ? responseData 
          : responseData.data || [];
      
      if (!Array.isArray(airportsData)) {
        console.error('Invalid response format. Expected array of airports:', airportsData);
        setAirports([]);
        return;
      }
      
      setAirports(airportsData);
    } catch (err) {
      console.error("Error fetching airports:", err);
      setAirports([]);
    }
  };

  const handleAddAirport = async () => {
    setError(null);

    if (!code || !city) {
      setError("Please provide both Airport Code and City.");
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/airport`, {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify({ 
          airport_code: code.toUpperCase(),
          airport_name: code.toUpperCase(), // Use code as name if not provided
          city_name: city 
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || errorData.error || "Error adding airport.");
      }

      const responseData = await response.json();
      if (responseData.success === false) {
        throw new Error(responseData.message || "Error adding airport.");
      }

      fetchAirports();
      setCode("");
      setCity("");
      setError(null);
    } catch (err: any) {
      setError(err.message || "Error adding airport.");
    }
  };

  const handleUpdateAirport = async (airportCode: string, newCity: string) => {
    try {
      const response = await fetch(`${API_BASE_URL}/airport/${airportCode}`, {
        method: "PUT",
        headers: getAuthHeaders(),
        body: JSON.stringify({ airport_name: newCity }), // Backend expects airport_name, not city
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || errorData.error || "Error updating airport.");
      }

      const responseData = await response.json();
      if (responseData.success === false) {
        throw new Error(responseData.message || "Error updating airport.");
      }

      fetchAirports();
    } catch (err: any) {
      setError(err.message || "Error updating airport.");
    }
  };

  const handleDeleteAirport = async (airportCode: string) => {
    try {
      const response = await fetch(`${API_BASE_URL}/airport/${airportCode}`, {
        method: "DELETE",
        headers: getAuthHeaders(),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Error deleting airport.");
      }

      fetchAirports();
    } catch (err: any) {
      setError(err.message);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h2 className="text-2xl font-bold mb-4">Manage Airports</h2>

      <div className="mb-6 p-4 border rounded shadow">
        <h3 className="text-lg font-semibold mb-2">Add Airport</h3>
        <div className="flex gap-4">
          <input
            type="text"
            placeholder="Airport Code"
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            className="border p-2 rounded w-1/3"
          />
          <input
            type="text"
            placeholder="City"
            value={city}
            onChange={(e) => setCity(e.target.value)}
            className="border p-2 rounded w-1/3"
          />
          <button
            onClick={handleAddAirport}
            className="bg-green-500 text-white px-4 py-2 rounded"
          >
            Add
          </button>
        </div>
        {error && <p className="text-red-500 mt-2">{error}</p>}
      </div>

      <div className="border p-4 rounded shadow">
        <h3 className="text-lg font-semibold mb-2">Existing Airports</h3>
        <table className="w-full border-collapse border border-gray-300">
          <thead>
            <tr className="bg-gray-200">
              <th className="border p-2">Code</th>
              <th className="border p-2">City</th>
              <th className="border p-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {airports.map((airport) => (
              <tr key={airport.airport_code} className="border">
                <td className="border p-2">{airport.airport_code}</td>
                <td className="border p-2">
                  <input
                    type="text"
                    defaultValue={airport.city_name}
                    onBlur={(e) =>
                      handleUpdateAirport(airport.airport_code, e.target.value)
                    }
                    className="border p-1 rounded w-40"
                  />
                </td>
                <td className="border p-2">
                  <button
                    onClick={() => handleDeleteAirport(airport.airport_code)}
                    className="bg-red-500 text-white px-4 py-1 rounded"
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
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

export default AddAirportPage;
