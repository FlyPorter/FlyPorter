import { useState } from "react";
import { useNavigate } from "react-router-dom";
import NavigationBar from '../components/NavigationBar';
import Sidebar from '../features/dashboard/components/Sidebar';

const SettingsPage = () => {
  const navigate = useNavigate();
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  // Get user role
  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const role = user?.role || "user";
  const isAdmin = role?.toUpperCase() === "ADMIN";

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/login");
  };

  const handleLogoutClick = () => {
    setShowLogoutConfirm(true);
  };

  const handleCancelLogout = () => {
    setShowLogoutConfirm(false);
  };

  return (
    <div className="h-screen overflow-hidden">
      <NavigationBar />
      <div className="flex h-[calc(100vh-3.5rem)] overflow-hidden">
        <div className="sticky top-0 left-0 z-10">
          <Sidebar role={role} />
        </div>
        <div className="flex-1 overflow-y-auto">
          <div className="p-6">
            <h2 className="text-2xl font-bold mb-6">Settings</h2>
            
            <div className="space-y-6">
              {/* Profile Section - Hidden for admin users */}
              {!isAdmin && (
                <div className="bg-white rounded-lg border border-gray-200 p-6">
                  <h3 className="text-lg font-semibold mb-4">Profile</h3>
                  <p className="text-gray-600 mb-4">
                    Manage your profile for easy booking
                  </p>
                  <button
                    onClick={() => navigate('/profile', { state: { from: '/settings' } })}
                    className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
                  >
                    Edit Profile
                  </button>
                </div>
              )}

              {/* Account Actions */}
              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <h3 className="text-lg font-semibold mb-4">Account</h3>
                <div className="space-y-3">
                  <button
                    onClick={handleLogoutClick}
                    className="w-full text-left px-4 py-3 border border-red-200 rounded hover:bg-red-50 transition-colors text-red-600"
                  >
                    <div className="font-medium">Logout</div>
                    <div className="text-sm text-red-500">Sign out of your account</div>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Logout Confirmation Popup */}
      {showLogoutConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold mb-4">Confirm Logout</h3>
            <p className="text-gray-600 mb-6">
              Are you sure you want to sign out of your account? You will need to log in again to access your bookings.
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={handleCancelLogout}
                className="px-4 py-2 border border-gray-300 rounded text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleLogout}
                className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 transition-colors"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SettingsPage;
