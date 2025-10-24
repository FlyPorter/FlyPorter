import { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useParams } from "react-router-dom";
import { API_BASE_URL } from "../config";

const UpdateFlightPage = () => {
  const navigate = useNavigate();
  const { state } = useLocation();
  const flight = state?.flight;
  const { id } = useParams();

  const [flightData, setFlightData] = useState({
    available_tickets: flight?.availableTickets ?? 0,
    price: flight?.price ?? 0,
    version: flight?.version ?? 0,
  });

  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!flight && id) {
      fetch(`${API_BASE_URL}/flight/${id}`, {
        method: "GET",
        headers: {
          "Authorization": `Bearer ${localStorage.getItem("token")}`,
        },
      })
        .then((res) => res.json())
        .then((data) => {
          setFlightData({
            available_tickets: data.availableTickets,
            price: data.price,
            version: data.version,
          });
        })
        .catch(() => setError("Failed to fetch flight details"));
    }
  }, [flight, id]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFlightData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      const response = await fetch(`${API_BASE_URL}/flight/${flight.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${localStorage.getItem("token")}`
        },
        body: JSON.stringify(flightData)
      });
      
      navigate("/admin");
    } catch (error) {
      setError("Error updating flight. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto mt-10 p-6 bg-white rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-4">Update Flight</h2>

      {error && <p className="text-red-500">{error}</p>}

      <form onSubmit={handleSubmit}>
        <div className="mb-4">
          <label className="block text-sm font-semibold mb-2">Available Tickets</label>
          <input
            type="number"
            name="available_tickets"
            value={flightData.available_tickets}
            onChange={handleChange}
            className="w-full p-2 border border-gray-300 rounded"
            required
          />
        </div>

        <div className="mb-4">
          <label className="block text-sm font-semibold mb-2">Price</label>
          <input
            type="number"
            name="price"
            value={flightData.price}
            onChange={handleChange}
            className="w-full p-2 border border-gray-300 rounded"
            required
          />
        </div>

        <div className="mb-4">
          <button
            type="submit"
            disabled={isLoading}
            className="w-full p-2 bg-blue-500 text-white rounded hover:bg-blue-700"
          >
            {isLoading ? "Updating..." : "Update Flight"}
          </button>
        </div>
      </form>
    </div>
  );
};

export default UpdateFlightPage;
