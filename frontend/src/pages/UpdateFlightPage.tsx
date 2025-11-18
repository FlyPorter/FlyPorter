import { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useParams } from "react-router-dom";
import { API_BASE_URL } from "../config";
import { X } from "lucide-react";

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
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Faded Backdrop */}
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={() => navigate("/admin")}
      />
      
      {/* Modal Content */}
      <div className="relative z-10 w-full max-w-md mx-4">
        <div className="p-6 bg-white/95 backdrop-blur-md rounded-xl shadow-2xl border border-teal-200/50">
          {/* Close Button */}
          <button
            onClick={() => navigate("/admin")}
            className="absolute top-4 right-4 text-teal-600 hover:text-teal-800 transition-colors cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>

          <h2 className="text-2xl font-bold mb-4 bg-gradient-to-r from-teal-700 to-cyan-700 bg-clip-text text-transparent pr-8">Update Flight</h2>

          {error && (
            <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-lg border border-red-200 font-medium">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <label className="block text-sm font-semibold mb-2 text-teal-700">Seat Capacity</label>
              <input
                type="number"
                name="seat_capacity"
                value={flightData.seat_capacity}
                onChange={handleChange}
                className="w-full p-2 border border-teal-200 rounded-lg focus:border-teal-400 focus:ring-2 focus:ring-teal-200 text-teal-900"
                min="1"
                required
              />
            </div>

            <div className="mb-4">
              <label className="block text-sm font-semibold mb-2 text-teal-700">Base Price</label>
              <input
                type="number"
                name="base_price"
                value={flightData.base_price}
                onChange={handleChange}
                className="w-full p-2 border border-teal-200 rounded-lg focus:border-teal-400 focus:ring-2 focus:ring-teal-200 text-teal-900"
                min="0"
                step="0.01"
                required
              />
            </div>

            <div className="mb-4 flex gap-3">
              <button
                type="button"
                onClick={() => navigate("/admin")}
                className="flex-1 p-2 border border-teal-300 rounded-lg text-teal-700 hover:bg-teal-50 hover:border-teal-400 transition-colors cursor-pointer font-medium"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isLoading}
                className={`flex-1 p-2 bg-gradient-to-r from-teal-600 to-cyan-600 hover:from-teal-700 hover:to-cyan-700 text-white rounded-lg font-semibold shadow-lg hover:shadow-xl transition-all ${
                  isLoading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
                }`}
              >
                {isLoading ? "Updating..." : "Update Flight"}
              </button>
            </div>
          </form>
        </div>
      </div>
      {/* Footer */}
      <footer className="mt-4 py-2 text-center text-gray-600 text-xs">
        © 2025 FlyPorter
      </footer>
    </div>
  );
};

export default UpdateFlightPage;
