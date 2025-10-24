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
      const response = await fetch(`${API_BASE_URL}/auth/myinfo`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch user info');
      }

      const data = await response.json();
      return data.user;
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
