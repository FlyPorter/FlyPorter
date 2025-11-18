import { useNavigate } from "react-router-dom";

const AddAircraftPage = () => {
  const navigate = useNavigate();


  return (
    <div className="container mx-auto px-4 py-8">
      <h2 className="text-2xl font-bold mb-4">Manage Aircraft</h2>

      <div className="mb-6 p-6 border rounded shadow bg-yellow-50">
        <h3 className="text-lg font-semibold mb-2 text-yellow-800">Aircraft Management Not Available</h3>
        <p className="text-yellow-700 mb-4">
          The backend does not currently support separate aircraft management. 
          Aircraft capacity is managed directly through flight creation and updates.
        </p>
        <p className="text-yellow-700">
          To set aircraft capacity, use the <strong>Add Flight</strong> or <strong>Update Flight</strong> pages, 
          where you can specify the <strong>seat capacity</strong> for each flight.
        </p>
      </div>
      
      <div className="mt-6 text-center">
        <button
          onClick={() => navigate("/admin")}
          className="bg-blue-500 text-white px-6 py-2 rounded hover:bg-blue-600"
        >
          Back to Admin
        </button>
      </div>
      {/* Footer */}
      <footer className="mt-4 py-2 text-center text-gray-600 text-xs">
        © 2025 FlyPorter
      </footer>
    </div>
  );
};

export default AddAircraftPage;
