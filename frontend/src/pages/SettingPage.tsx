import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import NavigationBar from '../components/NavigationBar';
import Sidebar from '../features/dashboard/components/Sidebar';

const SettingsPage = () => {
  const navigate = useNavigate();
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  // Check authentication
  useEffect(() => {
    const token = localStorage.getItem('token');
    const user = localStorage.getItem('user');
    if (!token || !user) {
      navigate('/');
    }
  }, [navigate]);

  // Get user role
  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const role = user?.role || "user";
  const isAdmin = role?.toUpperCase() === "ADMIN";

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/");
  };

  const handleLogoutClick = () => {
    setShowLogoutConfirm(true);
  };

  const handleCancelLogout = () => {
    setShowLogoutConfirm(false);
  };

  return (
    <div className="h-screen overflow-hidden bg-gradient-to-br from-teal-50/50 via-cyan-50/50 to-teal-100/20">
      <NavigationBar />
      <div className="flex h-[calc(100vh-3.5rem)] overflow-hidden">
        <div className="sticky top-0 left-0 z-10">
          <Sidebar role={role} />
        </div>
        <div className="flex-1 overflow-y-auto">
          <div className="p-6">
            <h2 className="text-2xl font-bold mb-6 bg-gradient-to-r from-teal-700 to-cyan-700 bg-clip-text text-transparent">Settings</h2>
            
            <div className="space-y-6">
              {/* Profile Section - Hidden for admin users */}
              {!isAdmin && (
                <div className="bg-white/90 backdrop-blur-sm rounded-lg border border-teal-200/50 p-6 shadow-lg">
                  <h3 className="text-lg font-semibold mb-4 text-teal-800">Profile</h3>
                  <p className="text-teal-700 mb-4">
                    Manage your profile for easy booking
                  </p>
                  <button
                    onClick={() => navigate('/profile', { state: { from: '/settings' } })}
                    className="px-4 py-2 bg-gradient-to-r from-teal-600 to-cyan-600 hover:from-teal-700 hover:to-cyan-700 text-white rounded-lg font-semibold shadow-lg hover:shadow-xl transition-all cursor-pointer"
                  >
                    Edit Profile
                  </button>
                </div>
              )}

              {/* Account Actions */}
              <div className="bg-white/90 backdrop-blur-sm rounded-lg border border-teal-200/50 p-6 shadow-lg">
                <h3 className="text-lg font-semibold mb-4 text-teal-800">Account</h3>
                <div className="space-y-3">
                  <button
                    onClick={handleLogoutClick}
                    className="w-full text-left px-4 py-3 border border-red-300 rounded-lg hover:bg-red-50 transition-colors text-red-600 hover:border-red-400 cursor-pointer"
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
          <div className="bg-white/90 backdrop-blur-sm rounded-lg border border-teal-200/50 p-6 max-w-md w-full mx-4 shadow-2xl">
            <h3 className="text-lg font-semibold mb-4 text-teal-800">Confirm Logout</h3>
            <p className="text-teal-700 mb-6">
              Are you sure you want to sign out of your account? You will need to log in again to access your bookings.
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={handleCancelLogout}
                className="px-4 py-2 border border-teal-300 rounded-lg text-teal-700 hover:bg-teal-50 hover:border-teal-400 transition-colors cursor-pointer font-medium"
              >
                Cancel
              </button>
              <button
                onClick={handleLogout}
                className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors cursor-pointer font-medium shadow-md hover:shadow-lg"
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
