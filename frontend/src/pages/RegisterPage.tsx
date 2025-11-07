import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { API_BASE_URL } from "../config";

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
      <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-blue-50 via-sky-50 to-blue-100">
        {/* FlyPorter Title - Outside Panel */}
        <div className="text-center mb-8">
          <h1 className="text-5xl font-bold text-blue-600 mb-2">FlyPorter</h1>
        </div>
        
        {/* Register Panel */}
        <div className="max-w-md w-full p-6 shadow-lg rounded-lg bg-white">
          <div className="text-center mb-6">
            <h2 className="text-2xl font-semibold text-gray-800 mb-2">Register</h2>
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
              className="w-full py-2 rounded text-white bg-green-500 hover:bg-green-600 cursor-pointer"
            >
              Register
            </button>
          </form>

          <div className="text-center mt-4">
            <p className="text-gray-600">Already have an account?</p>
            <button 
              onClick={() => navigate("/login")} 
              className="w-full py-2 mt-2 rounded text-white bg-blue-500 hover:bg-blue-600 cursor-pointer"
            >
              Login
            </button>
          </div>
        </div>
      </div>
    );
  };
  
  export default RegisterPage;