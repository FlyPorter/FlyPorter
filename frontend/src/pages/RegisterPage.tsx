import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { API_BASE_URL } from "../config";
import NavigationBar from "../components/NavigationBar";

const RegisterPage = () => {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const navigate = useNavigate();
  
    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        try {
          const trimmedEmail = email.trim();
          const response = await fetch(`${API_BASE_URL}/auth/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: trimmedEmail, password })
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
            throw new Error(data.error || data.message || 'Register Failed');
          }
          
          // Handle the response structure from sendSuccess
          if (data.success && data.data) {
            localStorage.setItem('token', data.data.token);
            localStorage.setItem('user', JSON.stringify(data.data.user));
            navigate('/dashboard');
          } else {
            throw new Error(data.error || data.message || 'Register Failed');
          }
        } catch (err: any) {
          setError(err.message || 'An error occurred during registration. Please try again.');
        }
      };
  
    return (
      <div className="min-h-screen flex flex-col bg-gradient-to-br from-teal-50 via-cyan-50 to-teal-100/30">
        <NavigationBar minimal={true} />
        <div className="flex-1 flex flex-col items-center justify-center">
        {/* Register Panel */}
        <div className="max-w-md w-full p-6 shadow-2xl rounded-xl bg-white/90 backdrop-blur-sm border border-teal-200/50">
          <div className="text-center mb-6">
            <h2 className="text-2xl font-semibold bg-gradient-to-r from-teal-700 to-cyan-700 bg-clip-text text-transparent mb-2">Register</h2>
          </div>
          {error && <p className="text-red-500 text-center mb-4">{error}</p>}
          <form onSubmit={handleRegister} className="space-y-4">
            <input 
              type="email" 
              placeholder="Email" 
              value={email} 
              onChange={(e) => setEmail(e.target.value)} 
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
              className="w-full py-2 rounded-lg text-white font-semibold bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 shadow-lg hover:shadow-xl transition-all cursor-pointer"
            >
              Register
            </button>
          </form>

          <div className="text-center mt-4">
            <p className="text-teal-700">Already have an account?</p>
            <button 
              onClick={() => navigate("/login")} 
              className="w-full py-2 mt-2 rounded-lg text-white font-semibold bg-gradient-to-r from-teal-600 to-cyan-600 hover:from-teal-700 hover:to-cyan-700 shadow-lg hover:shadow-xl transition-all cursor-pointer"
            >
              Login
            </button>
          </div>
          <button
            onClick={() => navigate("/")}
            className="w-full py-2 mt-3 rounded-lg border border-teal-300 text-teal-700 font-semibold hover:bg-teal-50 hover:border-teal-400 transition-colors cursor-pointer"
          >
            Back to Home
          </button>
        </div>
        </div>
      </div>
    );
  };
  
  export default RegisterPage;