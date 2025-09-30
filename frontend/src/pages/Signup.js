import React, { useState, useEffect } from "react";
import api from "../utils/api";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useNotification } from "../components/NotificationSystem";

function Signup() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("candidate");
  const { user } = useAuth();
  const navigate = useNavigate();
  const { showSuccess, showError } = useNotification();

  // Redirect if already logged in
  useEffect(() => {
    if (user) {
      navigate("/dashboard");
    }
  }, [user, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.post("/auth/signup", { name, email, password, role });
      showSuccess("Signup successful!");
      navigate("/");
    } catch (err) {
      showError(err.response?.data?.error || "Signup failed");
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-r from-green-100 to-blue-100">
      <form
        onSubmit={handleSubmit}
        className="bg-white p-8 shadow-xl rounded-2xl w-full max-w-md"
      >
        <h2 className="text-2xl font-bold mb-6 text-gray-800 text-center">
          🔑 Create Account
        </h2>
        <input
          type="text"
          placeholder="Full Name"
          className="w-full border rounded-lg p-3 mb-4 focus:ring-2 focus:ring-green-400"
          onChange={(e) => setName(e.target.value)}
        />
        <input
          type="email"
          placeholder="Email"
          className="w-full border rounded-lg p-3 mb-4 focus:ring-2 focus:ring-green-400"
          onChange={(e) => setEmail(e.target.value)}
        />
        <input
          type="password"
          placeholder="Password"
          className="w-full border rounded-lg p-3 mb-4 focus:ring-2 focus:ring-green-400"
          onChange={(e) => setPassword(e.target.value)}
        />
        <select
          className="w-full border rounded-lg p-3 mb-6 focus:ring-2 focus:ring-green-400"
          onChange={(e) => setRole(e.target.value)}
        >
          <option value="candidate">Candidate</option>
          <option value="recruiter">Recruiter</option>
        </select>
        <button className="bg-green-500 hover:bg-green-600 text-white w-full py-3 rounded-lg shadow-md">
          Signup
        </button>
      </form>
    </div>
  );
}

export default Signup;
