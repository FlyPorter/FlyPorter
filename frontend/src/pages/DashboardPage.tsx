import { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from "react-router-dom";
import BookingList from '../features/dashboard/components/BookingList';
import Sidebar from "../features/dashboard/components/Sidebar";
import { Button } from "../components/ui/button";
import { Home, User, Menu, X, ChevronDown, LogOut } from 'lucide-react';
import { NotificationCenter } from '../features/notificationCenter';
import { API_BASE_URL } from "../config";

const DashboardPage = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Disable body scroll when sidebar is open on mobile
  useEffect(() => {
    if (isSidebarOpen) {
      // Check if we're on mobile (window width < 1024px which is lg breakpoint)
      const isMobile = window.innerWidth < 1024;
      if (isMobile) {
        document.body.style.overflow = 'hidden';
      }
    } else {
      document.body.style.overflow = '';
    }

    // Cleanup function to restore scroll when component unmounts
    return () => {
      document.body.style.overflow = '';
    };
  }, [isSidebarOpen]);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const urlToken = params.get("token");
    let currentToken = localStorage.getItem("token");

    const fetchUserInfo = async (token: string) => {
      try {
        setLoading(true);
        const response = await fetch(`${API_BASE_URL}/profile`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        // Check if response is JSON before parsing
        const contentType = response.headers.get('content-type');
        let data;
        
        if (!contentType || !contentType.includes('application/json')) {
          const text = await response.text();
          console.error('Non-JSON response received:', text.substring(0, 200));
          throw new Error('Server returned an invalid response. Please check if the backend is running and the API URL is correct.');
        } else {
          data = await response.json();
        }

        if (!response.ok) {
          throw new Error(data.error || data.message || 'Failed to fetch user info');
        }

        // Handle the response structure from sendSuccess
        // Profile endpoint returns: { success: true, data: { user_id, email, role, ... } }
        if (data.success && data.data) {
          return data.data;
        } else if (data.user_id) {
          // Fallback for direct user object
          return data;
        } else {
          throw new Error('Invalid response format');
        }
      } catch (err: any) {
        console.error("Error fetching user info:", err.message);
        setError(err.message || "Failed to load user information.");
        setLoading(false);
        return null;
      }
    };

    const handleAuth = async () => {
      setLoading(true);
      setError(null);

      if (urlToken) {
        localStorage.setItem("token", urlToken);
        currentToken = urlToken;
        try {
          const user = await fetchUserInfo(urlToken);
          if (user) {
            localStorage.setItem("user", JSON.stringify(user));
            // Redirect admin users to admin page, regular users to dashboard
            const userRole = user?.role || 'user';
            const redirectPath = userRole?.toUpperCase() === 'ADMIN' ? '/admin' : '/dashboard';
            navigate(redirectPath, { replace: true });
          } else {
            navigate("/");
          }
        } catch (err) {
          console.error("Error during URL token processing:", err);
          navigate("/");
        } finally {
          setLoading(false);
        }
      } else if (!currentToken) {
        setError("Unauthorized: No token found.");
        setLoading(false);
        navigate("/");
      } else {
        try {
          const user = await fetchUserInfo(currentToken);
          if (!user) {
            localStorage.removeItem("token");
            localStorage.removeItem("user");
            navigate("/");
          } else {
            // If admin user somehow reached dashboard, redirect to admin page
            const userRole = user?.role || 'user';
            if (userRole?.toUpperCase() === 'ADMIN' && location.pathname === '/dashboard') {
              navigate('/admin', { replace: true });
            }
          }
        } catch (err) {
          console.error("Error with existing token:", err);
          localStorage.removeItem("token");
          localStorage.removeItem("user");
          navigate("/");
        } finally {
          setLoading(false);
        }
      }
    };

    handleAuth();
  }, [location.search, navigate, API_BASE_URL]);

  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const role = user?.role || "user";
  const isAdmin = role?.toUpperCase() === "ADMIN";

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };

    if (isDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isDropdownOpen]);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/");
    setIsDropdownOpen(false);
    setShowLogoutConfirm(false);
  };

  const handleLogoutClick = () => {
    setIsDropdownOpen(false);
    setShowLogoutConfirm(true);
  };

  const handleCancelLogout = () => {
    setShowLogoutConfirm(false);
  };

  const handleProfileClick = () => {
    navigate('/profile', { state: { from: location.pathname } });
    setIsDropdownOpen(false);
  };

  if (error) {
    return <p className="text-red-500">{error}</p>;
  }

  if (loading) {
    return <p>Loading...</p>;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50/50 via-cyan-50/50 to-teal-100/20">
      {/* Top Navigation Bar */}
      <nav className="sticky top-0 z-50 bg-gradient-to-r from-teal-50 to-cyan-50 border-b border-teal-200/50 shadow-md backdrop-blur-sm">
        <div className="w-full px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold bg-gradient-to-r from-teal-600 to-cyan-600 bg-clip-text text-transparent">
              {role === "ADMIN" ? "FlyPorter Admin" : "FlyPorter"}
            </h1>
          </div>
          
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate('/dashboard')}
            >
              <Home className="h-5 w-5" />
            </Button>
            
            {/* Notification Center */}
            <NotificationCenter />
            
            {/* User Email Dropdown */}
            <div className="relative" ref={dropdownRef}>
              <div 
                className="flex items-center gap-2 px-3 py-2 text-teal-700 bg-teal-50 rounded-lg border border-teal-200/50 cursor-pointer hover:bg-teal-100 hover:border-teal-300 hover:shadow-md active:scale-95 transition-all duration-200"
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    setIsDropdownOpen(!isDropdownOpen);
                  }
                }}
              >
                <User className="h-5 w-5" />
                <span className="font-medium">{user.email || 'User'}</span>
                <ChevronDown className={`h-4 w-4 transition-transform duration-200 ${isDropdownOpen ? 'rotate-180' : ''}`} />
              </div>

              {/* Dropdown Menu */}
              {isDropdownOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-white/95 backdrop-blur-sm border border-teal-200/50 shadow-xl rounded-lg overflow-hidden z-50">
                  <ul className="py-1">
                    {!isAdmin && (
                      <li>
                        <button
                          onClick={handleProfileClick}
                          className="w-full text-left px-4 py-2 text-teal-800 hover:bg-teal-50 transition-colors flex items-center gap-2 cursor-pointer"
                        >
                          <User className="h-4 w-4" />
                          <span>View Profile</span>
                        </button>
                      </li>
                    )}
                    <li>
                      <button
                        onClick={handleLogoutClick}
                        className="w-full text-left px-4 py-2 text-red-600 hover:bg-red-50 transition-colors flex items-center gap-2 cursor-pointer"
                      >
                        <LogOut className="h-4 w-4" />
                        <span>Logout</span>
                      </button>
                    </li>
                  </ul>
                </div>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content with Sidebar */}
      <div className="flex flex-col lg:flex-row relative lg:h-[calc(100vh-3.5rem)]">
        {/* Mobile Sidebar Overlay */}
        {isSidebarOpen && (
          <div 
            className="fixed inset-0 bg-black/50 z-40 lg:hidden"
            onClick={() => setIsSidebarOpen(false)}
          />
        )}

        {/* Sidebar - Collapsible on mobile, always visible on desktop */}
        <div 
          className={`
            fixed lg:sticky top-14 left-0 z-50 lg:z-10
            h-[calc(100vh-3.5rem)] lg:h-[calc(100vh-3.5rem)]
            transform transition-transform duration-300 ease-in-out
            ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
            lg:top-14 lg:self-start
          `}
        >
          <Sidebar role={role} onClose={() => setIsSidebarOpen(false)} />
        </div>

        {/* Main Content */}
        <div className="flex-1 w-full lg:w-auto lg:overflow-y-auto">
          {/* Mobile Menu Button */}
          <div className="lg:hidden sticky z-30 bg-gradient-to-r from-teal-50 to-cyan-50 border-b border-teal-200/50 px-4 py-2 -mt-[1px]" style={{ top: 'calc(3.5rem - 1px)' }}>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="text-teal-700 hover:text-teal-900"
            >
              {isSidebarOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </Button>
          </div>

          <div className="p-4 sm:p-6">
            <div className="flex justify-start items-center mb-4">
              <h2 className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-teal-700 to-cyan-700 bg-clip-text text-transparent">Your Bookings</h2>
            </div>
            <BookingList />
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
      {/* Footer */}
      <footer className="mt-4 py-2 text-center text-gray-600 text-xs">
        © 2025 FlyPorter
      </footer>
    </div>
  );
};

export default DashboardPage;
