import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from "react-router-dom";
import BookingList from '../features/dashboard/components/BookingList';
import Sidebar from "../features/dashboard/components/Sidebar";
import { Button } from "../components/ui/button";
import { Home, User } from 'lucide-react';
import { NotificationCenter } from '../features/notificationCenter';
import { API_BASE_URL } from "../config";

const DashboardPage = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();
  const location = useLocation();

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

  if (error) {
    return <p className="text-red-500">{error}</p>;
  }

  if (loading) {
    return <p>Loading...</p>;
  }

  return (
    <div className="h-screen overflow-hidden bg-gradient-to-br from-teal-50/50 via-cyan-50/50 to-teal-100/20">
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
            
            <div className="flex items-center gap-2 px-3 py-2 text-teal-700 bg-teal-50 rounded-lg border border-teal-200/50">
              <User className="h-5 w-5" />
              <span className="font-medium">{user.email || 'User'}</span>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content with Sidebar */}
      <div className="flex h-[calc(100vh-3.5rem)] overflow-hidden">
        <div className="sticky top-0 left-0 z-10">
          <Sidebar role={role} />
        </div>
        <div className="flex-1 overflow-y-auto">
          <div className="p-6">
            <div className="flex justify-start items-center mb-4">
              <h2 className="text-2xl font-bold bg-gradient-to-r from-teal-700 to-cyan-700 bg-clip-text text-transparent">Your Bookings</h2>
            </div>
            <BookingList />
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
