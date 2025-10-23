import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { API_BASE_URL, GOOGLE_AUTH_URL } from "../config";

const LoginPage = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const urlToken  = localStorage.getItem("token");
    if (urlToken ) {
      navigate("/dashboard");
      return;
    }

    const params = new URLSearchParams(location.search);
    const token = params.get("token");
    const errorMsg = params.get("error");

    if (token) {
      localStorage.setItem("token", token);
      navigate("/dashboard");
    }

    if (errorMsg) {
      setError("Google login failed. Please try again.");
    }
  }, [location, navigate]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const trimmedUsername = username.trim();
      console.log('Attempting login with:', { username: trimmedUsername, password });
      const response = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: trimmedUsername, password })
      });
      console.log('Login response status:', response.status);
      const data = await response.json();
      console.log('Login response data:', data);
      if (!response.ok) throw new Error(data.message || 'Login Failed');
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      console.log('Login successful, navigating to dashboard');
      navigate('/dashboard');
    } catch (err: any) {
      console.error('Login error:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = () => {
    window.location.href = GOOGLE_AUTH_URL;
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-blue-50 via-sky-50 to-blue-100">
      {/* FlyPorter Title - Outside Panel */}
      <div className="text-center mb-8">
        <h1 className="text-5xl font-bold text-blue-600 mb-2">FlyPorter</h1>
      </div>
      
      {/* Login Panel */}
      <div className="max-w-md w-full p-6 shadow-lg rounded-lg bg-white">
        <div className="text-center mb-6">
          <h2 className="text-2xl font-semibold text-gray-800 mb-2">Login</h2>
        </div>
      {error && <p className="text-red-500 text-center mb-4">{error}</p>}
      <form onSubmit={handleLogin} className="space-y-4">
        <input
          type="text"
          placeholder="Username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          className="w-full p-2 border rounded placeholder:text-gray-400"
          required
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full p-2 border rounded placeholder:text-gray-400"
          required
        />
        <button
          type="submit"
          className={`w-full py-2 rounded text-white ${
            loading
              ? "bg-gray-400 cursor-not-allowed"
              : "bg-blue-500 hover:bg-blue-600 cursor-pointer"
          }`}
          disabled={loading}
        >
          {loading ? "Logging in..." : "Login"}
        </button>

      </form>

      <div className="text-center my-4"></div>

      <button
        onClick={handleGoogleLogin}
        aria-label="Login with Google"
        className="w-full py-2 rounded bg-white text-gray-700 border border-gray-300 hover:bg-gray-50 hover:border-gray-400 flex items-center justify-center transition-colors duration-200 shadow-sm cursor-pointer"
      >
        <img
          src="data:image/png;base64,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"
          alt="Google Logo"
          className="w-5 h-5 mr-2"
        />
        Login with Google
      </button>


      <div className="text-center mt-4">
        <p className="text-gray-600">Don't have an account?</p>
        <button
          onClick={() => navigate("/register")}
          className="w-full py-2 mt-2 rounded text-white bg-green-500 hover:bg-green-600 cursor-pointer"
        >
          Register
        </button>
      </div>
      </div>
    </div>
  );
};

export default LoginPage;