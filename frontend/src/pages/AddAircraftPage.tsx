import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { API_BASE_URL } from "../config";

interface Aircraft {
  id: number;
  capacity: number;
}

const AddAircraftPage = () => {
  const [aircrafts, setAircrafts] = useState<Aircraft[]>([]);
  const [id, setId] = useState("");
  const [capacity, setCapacity] = useState("");
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    fetchAircrafts();
  }, []);

  const getAuthHeaders = () => ({
    Authorization: `Bearer ${localStorage.getItem("token")}`,
    "Content-Type": "application/json",
  });

  const fetchAircrafts = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/aircraft`, {
        headers: getAuthHeaders(),
      });
      if (!response.ok) throw new Error("Failed to fetch aircrafts");

      const data = await response.json();
      setAircrafts(data);
    } catch (err) {
      console.error("Error fetching aircrafts:", err);
    }
  };

  const handleAddAircraft = async () => {
    setError(null);

    if (!id || !capacity) {
      setError("Please provide both ID and Capacity.");
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/aircraft`, {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify({
          id: parseInt(id, 10),
          capacity: parseInt(capacity, 10),
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Error adding aircraft.");
      }

      fetchAircrafts();
      setId("");
      setCapacity("");
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleUpdateAircraft = async (aircraftId: number, newCapacity: number) => {
    try {
      const response = await fetch(`${API_BASE_URL}/aircraft/${aircraftId}`, {
        method: "PUT",
        headers: getAuthHeaders(),
        body: JSON.stringify({ capacity: newCapacity }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Error updating aircraft.");
      }

      fetchAircrafts();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleDeleteAircraft = async (aircraftId: number) => {
    try {
      const response = await fetch(`${API_BASE_URL}/aircraft/${aircraftId}`, {
        method: "DELETE",
        headers: getAuthHeaders(),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Error deleting aircraft.");
      }

      fetchAircrafts();
    } catch (err: any) {
      setError(err.message);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h2 className="text-2xl font-bold mb-4">Manage Aircraft</h2>

      <div className="mb-6 p-4 border rounded shadow">
        <h3 className="text-lg font-semibold mb-2">Add Aircraft</h3>
        <div className="flex gap-4">
          <input
            type="number"
            placeholder="Aircraft ID"
            value={id}
            onChange={(e) => setId(e.target.value)}
            className="border p-2 rounded w-1/3"
          />
          <input
            type="number"
            placeholder="Capacity"
            value={capacity}
            onChange={(e) => setCapacity(e.target.value)}
            className="border p-2 rounded w-1/3"
          />
          <button
            onClick={handleAddAircraft}
            className="bg-green-500 text-white px-4 py-2 rounded"
          >
            Add
          </button>
        </div>
        {error && <p className="text-red-500 mt-2">{error}</p>}
      </div>

      <div className="border p-4 rounded shadow">
        <h3 className="text-lg font-semibold mb-2">Existing Aircraft</h3>
        <table className="w-full border-collapse border border-gray-300">
          <thead>
            <tr className="bg-gray-200">
              <th className="border p-2">ID</th>
              <th className="border p-2">Capacity</th>
              <th className="border p-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {aircrafts.map((aircraft) => (
              <tr key={aircraft.id} className="border">
                <td className="border p-2">{aircraft.id}</td>
                <td className="border p-2">
                  <input
                    type="number"
                    defaultValue={aircraft.capacity}
                    onBlur={(e) =>
                      handleUpdateAircraft(aircraft.id, parseInt(e.target.value, 10))
                    }
                    className="border p-1 rounded w-20"
                  />
                </td>
                <td className="border p-2">
                  <button
                    onClick={() => handleDeleteAircraft(aircraft.id)}
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

export default AddAircraftPage;
