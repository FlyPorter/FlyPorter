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
    base_price: flight?.price ? parseFloat(flight.price) : 0,
    seat_capacity: flight?.aircraft?.capacity ?? 0,
  });

  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const fetchFlight = async () => {
      if (!flight && id) {
        try {
          const response = await fetch(`${API_BASE_URL}/flight/${id}`, {
            method: "GET",
            headers: {
              "Authorization": `Bearer ${localStorage.getItem("token")}`,
            },
          });
          
          if (!response.ok) {
            throw new Error("Failed to fetch flight");
          }
          
          const responseData = await response.json();
          const data = responseData.success && responseData.data ? responseData.data : responseData;
          
          setFlightData({
            base_price: data.base_price ? parseFloat(data.base_price) : 0,
            seat_capacity: data.seat_capacity ?? data.aircraft?.capacity ?? 0,
          });
        } catch (err) {
          setError("Failed to fetch flight details");
        }
      } else if (flight) {
        setFlightData({
          base_price: flight.price ? parseFloat(flight.price) : 0,
          seat_capacity: flight.aircraft?.capacity ?? 0,
        });
      }
    };
    
    fetchFlight();
  }, [flight, id]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFlightData((prev) => ({
      ...prev,
      [name]: name === 'base_price' ? parseFloat(value) || 0 : parseInt(value) || 0
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    const flightId = id || flight?.id;
    if (!flightId) {
      setError("Flight ID is missing");
      setIsLoading(false);
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/flight/${flightId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${localStorage.getItem("token")}`
        },
        body: JSON.stringify(flightData)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || errorData.error || "Failed to update flight");
      }
      
      const responseData = await response.json();
      if (responseData.success === false) {
        throw new Error(responseData.message || "Failed to update flight");
      }
      
      navigate("/admin");
    } catch (error: any) {
      setError(error.message || "Error updating flight. Please try again.");
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
          <label className="block text-sm font-semibold mb-2">Seat Capacity</label>
          <input
            type="number"
            name="seat_capacity"
            value={flightData.seat_capacity}
            onChange={handleChange}
            className="w-full p-2 border border-gray-300 rounded"
            min="1"
            required
          />
        </div>

        <div className="mb-4">
          <label className="block text-sm font-semibold mb-2">Base Price</label>
          <input
            type="number"
            name="base_price"
            value={flightData.base_price}
            onChange={handleChange}
            className="w-full p-2 border border-gray-300 rounded"
            min="0"
            step="0.01"
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
