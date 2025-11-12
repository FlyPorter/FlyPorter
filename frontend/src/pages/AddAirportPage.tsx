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
  const [airportName, setAirportName] = useState("");
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

    if (!code || !airportName || !city) {
      setError("Please provide Airport Code, Airport Name, and City.");
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/airport`, {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify({ 
          airport_code: code.toUpperCase(),
          airport_name: airportName,
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
      setAirportName("");
      setCity("");
      setError(null);
    } catch (err: any) {
      setError(err.message || "Error adding airport.");
    }
  };

  const handleUpdateAirport = async (airportCode: string, newAirportName: string) => {
    try {
      const response = await fetch(`${API_BASE_URL}/airport/${airportCode}`, {
        method: "PUT",
        headers: getAuthHeaders(),
        body: JSON.stringify({ airport_name: newAirportName }),
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
    <div className="min-h-screen bg-gradient-to-br from-teal-50/50 via-cyan-50/50 to-teal-100/20">
      <div className="container mx-auto px-4 py-8">
        <h2 className="text-2xl font-bold mb-4 bg-gradient-to-r from-teal-700 to-cyan-700 bg-clip-text text-transparent">Manage Airports</h2>

        {error && (
          <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-lg border border-red-200 font-medium">
            {error}
          </div>
        )}

        <div className="mb-6 p-6 border border-teal-200/50 rounded-lg shadow-2xl bg-white/90 backdrop-blur-sm">
          <h3 className="text-lg font-semibold mb-4 text-teal-800">Add Airport</h3>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1 text-teal-700">Airport Code *</label>
              <input
                type="text"
                placeholder="e.g., YYZ"
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                className="border border-teal-200 p-2 rounded-lg w-full focus:border-teal-400 focus:ring-2 focus:ring-teal-200 text-teal-900"
                maxLength={10}
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1 text-teal-700">Airport Name *</label>
              <input
                type="text"
                placeholder="e.g., Toronto Pearson International"
                value={airportName}
                onChange={(e) => setAirportName(e.target.value)}
                className="border border-teal-200 p-2 rounded-lg w-full focus:border-teal-400 focus:ring-2 focus:ring-teal-200 text-teal-900"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1 text-teal-700">City *</label>
              <input
                type="text"
                placeholder="e.g., Toronto"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                className="border border-teal-200 p-2 rounded-lg w-full focus:border-teal-400 focus:ring-2 focus:ring-teal-200 text-teal-900"
                required
              />
            </div>
          </div>
          <button
            onClick={handleAddAirport}
            className="mt-4 bg-gradient-to-r from-teal-600 to-cyan-600 hover:from-teal-700 hover:to-cyan-700 text-white px-4 py-2 rounded-lg font-semibold shadow-lg hover:shadow-xl transition-all cursor-pointer"
          >
            Add Airport
          </button>
        </div>

        <div className="border border-teal-200/50 p-6 rounded-lg shadow-2xl bg-white/90 backdrop-blur-sm">
          <h3 className="text-lg font-semibold mb-4 text-teal-800">Existing Airports</h3>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-gradient-to-r from-teal-50 to-cyan-50">
                  <th className="border border-teal-200 p-3 text-left text-teal-800 font-semibold">Code</th>
                  <th className="border border-teal-200 p-3 text-left text-teal-800 font-semibold">Airport Name</th>
                  <th className="border border-teal-200 p-3 text-left text-teal-800 font-semibold">City</th>
                  <th className="border border-teal-200 p-3 text-left text-teal-800 font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody>
                {airports.map((airport) => (
                  <tr key={airport.airport_code} className="border-b border-teal-100 hover:bg-teal-50/50 transition-colors">
                    <td className="border border-teal-200 p-3 text-teal-900 font-medium">{airport.airport_code}</td>
                    <td className="border border-teal-200 p-3">
                      <input
                        type="text"
                        defaultValue={airport.airport_name || ''}
                        onBlur={(e) =>
                          handleUpdateAirport(airport.airport_code, e.target.value)
                        }
                        className="border border-teal-200 p-1 rounded-lg w-full focus:border-teal-400 focus:ring-2 focus:ring-teal-200 text-teal-900"
                        placeholder="Airport name"
                      />
                    </td>
                    <td className="border border-teal-200 p-3 text-teal-900">{airport.city_name}</td>
                    <td className="border border-teal-200 p-3">
                      <button
                        onClick={() => handleDeleteAirport(airport.airport_code)}
                        className="bg-red-500 text-white px-4 py-1 rounded-lg hover:bg-red-600 transition-colors cursor-pointer font-medium shadow-md hover:shadow-lg"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
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

export default AddAirportPage;
