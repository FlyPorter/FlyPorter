import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { API_BASE_URL } from "../config";

const RegisterPage = () => {
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [role, setRole] = useState("USER");
    const [error, setError] = useState("");
    const navigate = useNavigate();
  
    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        try {
          const response = await fetch(`${API_BASE_URL}/auth/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password, role })
          });
          const data = await response.json();
          if (!response.ok) throw new Error(data.message || 'Register Failed');
          localStorage.setItem('token', data.token);
          localStorage.setItem('user', JSON.stringify(data.user));
          navigate('/dashboard');
        } catch (err: any) {
          setError(err.message);
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
            <select 
              value={role} 
              onChange={(e) => setRole(e.target.value)} 
              className="w-full p-2 border rounded"
            >
              <option value="USER">User</option>
              <option value="ADMIN">Admin</option>
            </select>
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