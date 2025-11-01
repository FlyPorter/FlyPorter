import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { API_BASE_URL } from "../config";

interface Airline {
  code: string;
  name: string;
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

      const data = await response.json();
      setAirlines(data);
    } catch (err) {
      console.error("Error fetching airlines:", err);
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
        body: JSON.stringify({ code, name }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Error adding airline.");
      }

      fetchAirlines();
      setCode("");
      setName("");
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleUpdateAirline = async (airlineCode: string, newName: string) => {
    try {
      const response = await fetch(`${API_BASE_URL}/airline/${airlineCode}`, {
        method: "PUT",
        headers: getAuthHeaders(),
        body: JSON.stringify({ name: newName }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Error updating airline.");
      }

      fetchAirlines();
    } catch (err: any) {
      setError(err.message);
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
    <div className="container mx-auto px-4 py-8">
      <h2 className="text-2xl font-bold mb-4">Manage Airlines</h2>

      <div className="mb-6 p-4 border rounded shadow">
        <h3 className="text-lg font-semibold mb-2">Add Airline</h3>
        <div className="flex gap-4">
          <input
            type="text"
            placeholder="Airline Code"
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            className="border p-2 rounded w-1/3"
          />
          <input
            type="text"
            placeholder="Airline Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="border p-2 rounded w-1/3"
          />
          <button
            onClick={handleAddAirline}
            className="bg-green-500 text-white px-4 py-2 rounded"
          >
            Add
          </button>
        </div>
        {error && <p className="text-red-500 mt-2">{error}</p>}
      </div>

      <div className="border p-4 rounded shadow">
        <h3 className="text-lg font-semibold mb-2">Existing Airlines</h3>
        <table className="w-full border-collapse border border-gray-300">
          <thead>
            <tr className="bg-gray-200">
              <th className="border p-2">Code</th>
              <th className="border p-2">Name</th>
              <th className="border p-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {airlines.map((airline) => (
              <tr key={airline.code} className="border">
                <td className="border p-2">{airline.code}</td>
                <td className="border p-2">
                  <input
                    type="text"
                    defaultValue={airline.name}
                    onBlur={(e) =>
                      handleUpdateAirline(airline.code, e.target.value)
                    }
                    className="border p-1 rounded w-40"
                  />
                </td>
                <td className="border p-2">
                  <button
                    onClick={() => handleDeleteAirline(airline.code)}
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

export default AddAirlinePage;
