// recruitment-ai-system/frontend/src/pages/AccountSettings.js

import React, { useEffect, useState } from "react";
import api from "../utils/api";
import { useAuth } from "../context/AuthContext";
import { Link } from "react-router-dom";
import { useNotification } from "../components/NotificationSystem";

function AccountSettings() {
  const { user } = useAuth();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  
  const [loading, setLoading] = useState(true);
  const [isDetailsSaving, setIsDetailsSaving] = useState(false);
  const [isPasswordChanging, setIsPasswordChanging] = useState(false);
  const { showSuccess, showError, showWarning } = useNotification();

  useEffect(() => {
    api.get("/users/me")
      .then((res) => {
        setName(res.data.name);
        setEmail(res.data.email);
      })
      .catch(() => showError("Could not fetch user data."))
      .finally(() => setLoading(false));
  }, [showError]);
  
  const handleDetailsSave = async (e) => {
      e.preventDefault();
      setIsDetailsSaving(true);
      try {
        await api.put("/users/account/details", { name, email });
        showSuccess("Account details updated successfully!");
      } catch (err) {
        showError(err.response?.data?.error || "Error updating details");
      } finally {
        setIsDetailsSaving(false);
      }
  };

  const handlePasswordChange = async (e) => {
      e.preventDefault();
      if (newPassword !== confirmPassword) {
          showWarning("New passwords do not match.");
          return;
      }
      setIsPasswordChanging(true);
      try {
        await api.post("/users/account/password", { currentPassword, newPassword });
        showSuccess("Password changed successfully!");
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
      } catch (err) {
        showError(err.response?.data?.error || "Error changing password");
      } finally {
        setIsPasswordChanging(false);
      }
  };

  if (loading) return <p className="p-6">Loading account settings...</p>;

  return (
    <div className="max-w-2xl p-6 mx-auto space-y-8">
      {/* ✅ Back to Dashboard Link Added */}
      <div className="mb-2">
        <Link to="/dashboard" className="font-medium text-blue-600 hover:underline">
          ← Back to Dashboard
        </Link>
      </div>

      {/* Account Details Form */}
      <form onSubmit={handleDetailsSave} className="p-6 bg-white shadow-md rounded-xl">
        <h2 className="mb-6 text-2xl font-bold">Account Settings</h2>
        
        <label className="block mb-2 font-medium">Full Name</label>
        <input className="w-full p-3 mb-4 border rounded-lg" value={name} onChange={(e) => setName(e.target.value)} />

        <label className="block mb-2 font-medium">Email Address</label>
        <input type="email" className="w-full p-3 mb-6 border rounded-lg" value={email} onChange={(e) => setEmail(e.target.value)} />
        
        <button 
          type="submit" 
          className="px-5 py-2 text-white bg-blue-500 rounded-lg shadow-md hover:bg-blue-600 disabled:bg-blue-300 disabled:cursor-not-allowed"
          disabled={isDetailsSaving}
        >
          {isDetailsSaving ? "Saving..." : "Save Changes"}
        </button>
      </form>

      {/* Candidate Profile Link */}
      {user.role === 'candidate' && (
        <div className="p-6 bg-white shadow-md rounded-xl">
            <h2 className="mb-4 text-2xl font-bold">Professional Profile</h2>
            <p className="mb-4 text-gray-600">Manage your skills, professional summary, and other details that recruiters see.</p>
            <Link to="/profile" className="px-5 py-2 text-gray-800 bg-gray-200 rounded-lg shadow-md hover:bg-gray-300">
                Edit Professional Profile
            </Link>
        </div>
      )}

      {/* Change Password Form */}
      <form onSubmit={handlePasswordChange} className="p-6 bg-white shadow-md rounded-xl">
        <h2 className="mb-6 text-2xl font-bold">Change Password</h2>
        
        <label className="block mb-2 font-medium">Current Password</label>
        <input type="password" placeholder="••••••••" className="w-full p-3 mb-4 border rounded-lg" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} />

        <label className="block mb-2 font-medium">New Password</label>
        <input type="password" placeholder="••••••••" className="w-full p-3 mb-4 border rounded-lg" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} />
        
        <label className="block mb-2 font-medium">Confirm New Password</label>
        <input type="password" placeholder="••••••••" className="w-full p-3 mb-6 border rounded-lg" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} />

        <button 
          type="submit" 
          className="px-5 py-2 text-white bg-green-500 rounded-lg shadow-md hover:bg-green-600 disabled:bg-green-300 disabled:cursor-not-allowed"
          disabled={isPasswordChanging}
        >
          {isPasswordChanging ? "Changing..." : "Change Password"}
        </button>
      </form>
    </div>
  );
}

export default AccountSettings;