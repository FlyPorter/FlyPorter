import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { API_BASE_URL } from "../config";

interface Airline {
  airline_code: string;
  airline_name: string;
}

const AddAirlinePage = () => {
  const [airlines, setAirlines] = useState<Airline[]>([]);
  const [code, setCode] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    fetchAirlines();
  }, []);

  const getAuthHeaders = () => ({
    Authorization: `Bearer ${localStorage.getItem("token")}`,
    "Content-Type": "application/json",
  });

  const fetchAirlines = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/airline`, {
        headers: getAuthHeaders(),
      });
      if (!response.ok) throw new Error("Failed to fetch airlines");

      const responseData = await response.json();
      
      // Handle the response structure from sendSuccess
      const airlinesData = responseData.success && responseData.data 
        ? responseData.data 
        : Array.isArray(responseData) 
          ? responseData 
          : responseData.data || [];
      
      if (!Array.isArray(airlinesData)) {
        console.error('Invalid response format. Expected array of airlines:', airlinesData);
        setAirlines([]);
        return;
      }
      
      setAirlines(airlinesData);
    } catch (err) {
      console.error("Error fetching airlines:", err);
      setAirlines([]);
    }
  };

  const handleAddAirline = async () => {
    setError(null);

    if (!code || !name) {
      setError("Please provide both Code and Name.");
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/airline`, {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify({ 
          airline_code: code.toUpperCase(),
          airline_name: name 
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || errorData.error || "Error adding airline.");
      }

      const responseData = await response.json();
      if (responseData.success === false) {
        throw new Error(responseData.message || "Error adding airline.");
      }

      fetchAirlines();
      setCode("");
      setName("");
      setError(null);
    } catch (err: any) {
      setError(err.message || "Error adding airline.");
    }
  };

  const handleUpdateAirline = async (airlineCode: string, newName: string) => {
    try {
      const response = await fetch(`${API_BASE_URL}/airline/${airlineCode}`, {
        method: "PATCH",
        headers: getAuthHeaders(),
        body: JSON.stringify({ airline_name: newName }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || errorData.error || "Error updating airline.");
      }

      const responseData = await response.json();
      if (responseData.success === false) {
        throw new Error(responseData.message || "Error updating airline.");
      }

      fetchAirlines();
    } catch (err: any) {
      setError(err.message || "Error updating airline.");
    }
  };

  const handleDeleteAirline = async (airlineCode: string) => {
    try {
      const response = await fetch(`${API_BASE_URL}/airline/${airlineCode}`, {
        method: "DELETE",
        headers: getAuthHeaders(),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Error deleting airline.");
      }

      fetchAirlines();
    } catch (err: any) {
      setError(err.message);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50/50 via-cyan-50/50 to-teal-100/20">
      <div className="container mx-auto px-4 py-8">
        <h2 className="text-2xl font-bold mb-4 bg-gradient-to-r from-teal-700 to-cyan-700 bg-clip-text text-transparent">Manage Airlines</h2>

        {error && (
          <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-lg border border-red-200 font-medium">
            {error}
          </div>
        )}

        <div className="mb-6 p-6 border border-teal-200/50 rounded-lg shadow-2xl bg-white/90 backdrop-blur-sm">
          <h3 className="text-lg font-semibold mb-4 text-teal-800">Add Airline</h3>
          <div className="flex gap-4">
            <div className="flex-1">
              <label className="block text-sm font-medium mb-1 text-teal-700">Airline Code *</label>
              <input
                type="text"
                placeholder="Airline Code"
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                className="border border-teal-200 p-2 rounded-lg w-full focus:border-teal-400 focus:ring-2 focus:ring-teal-200 text-teal-900"
                required
              />
            </div>
            <div className="flex-1">
              <label className="block text-sm font-medium mb-1 text-teal-700">Airline Name *</label>
              <input
                type="text"
                placeholder="Airline Name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="border border-teal-200 p-2 rounded-lg w-full focus:border-teal-400 focus:ring-2 focus:ring-teal-200 text-teal-900"
                required
              />
            </div>
            <div className="flex items-end">
              <button
                onClick={handleAddAirline}
                className="bg-gradient-to-r from-teal-600 to-cyan-600 hover:from-teal-700 hover:to-cyan-700 text-white px-6 py-2 rounded-lg font-semibold shadow-lg hover:shadow-xl transition-all cursor-pointer"
              >
                Add
              </button>
            </div>
          </div>
        </div>

        <div className="border border-teal-200/50 p-6 rounded-lg shadow-2xl bg-white/90 backdrop-blur-sm">
          <h3 className="text-lg font-semibold mb-4 text-teal-800">Existing Airlines</h3>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-gradient-to-r from-teal-50 to-cyan-50">
                  <th className="border border-teal-200 p-3 text-left text-teal-800 font-semibold">Code</th>
                  <th className="border border-teal-200 p-3 text-left text-teal-800 font-semibold">Name</th>
                  <th className="border border-teal-200 p-3 text-left text-teal-800 font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody>
                {airlines.map((airline) => (
                  <tr key={airline.airline_code} className="border-b border-teal-100 hover:bg-teal-50/50 transition-colors">
                    <td className="border border-teal-200 p-3 text-teal-900 font-medium">{airline.airline_code}</td>
                    <td className="border border-teal-200 p-3">
                      <input
                        type="text"
                        defaultValue={airline.airline_name}
                        onBlur={(e) =>
                          handleUpdateAirline(airline.airline_code, e.target.value)
                        }
                        className="border border-teal-200 p-1 rounded-lg w-full focus:border-teal-400 focus:ring-2 focus:ring-teal-200 text-teal-900"
                      />
                    </td>
                    <td className="border border-teal-200 p-3">
                      <button
                        onClick={() => handleDeleteAirline(airline.airline_code)}
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

export default AddAirlinePage;
