import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { API_BASE_URL } from "../config";

interface Airport {
  code: string;
  city: string;
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

      const data = await response.json();
      setAirports(data);
    } catch (err) {
      console.error("Error fetching airports:", err);
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
        body: JSON.stringify({ code, city }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Error adding airport.");
      }

      fetchAirports();
      setCode("");
      setCity("");
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleUpdateAirport = async (airportCode: string, newCity: string) => {
    try {
      const response = await fetch(`${API_BASE_URL}/airport/${airportCode}`, {
        method: "PUT",
        headers: getAuthHeaders(),
        body: JSON.stringify({ city: newCity }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Error updating airport.");
      }

      fetchAirports();
    } catch (err: any) {
      setError(err.message);
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
              <tr key={airport.code} className="border">
                <td className="border p-2">{airport.code}</td>
                <td className="border p-2">
                  <input
                    type="text"
                    defaultValue={airport.city}
                    onBlur={(e) =>
                      handleUpdateAirport(airport.code, e.target.value)
                    }
                    className="border p-1 rounded w-40"
                  />
                </td>
                <td className="border p-2">
                  <button
                    onClick={() => handleDeleteAirport(airport.code)}
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
