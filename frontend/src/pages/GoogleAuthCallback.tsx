import { useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { API_BASE_URL } from "../config";

const GoogleAuthCallback = () => {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const token = params.get("token");
    const errorMsg = params.get("error");

    const fetchUserInfo = async (token: string) => {
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
    };

    const handleAuth = async () => {
      if (token) {
        localStorage.setItem("token", token);
        try {
          const user = await fetchUserInfo(token);
          localStorage.setItem("user", JSON.stringify(user));
          navigate("/dashboard");
        } catch (err) {
          console.error(err);
          navigate("/login");
        }
      } else if (errorMsg) {
        navigate(`/login?error=${errorMsg}`);
      } else {
        navigate("/login");
      }
    };

    handleAuth();
  }, [location.search, navigate]);
  return <div>Processing Google Login...</div>;
};

export default GoogleAuthCallback;
