// recruitment-ai-system/frontend/src/App.js

import React, { useEffect, useState } from "react";
import { io } from "socket.io-client";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import Dashboard from "./pages/Dashboard";
import Applicants from "./pages/Applicants";
import PostJob from "./pages/PostJob";
import Messages from "./pages/Messages"; // ✅ messaging
import Interviews from "./pages/Interviews"; // ✅ interviews
import ScheduleInterview from "./pages/ScheduleInterview"; // ✅ scheduling
import CVAnalysis from "./pages/CVAnalysis"; // ✅ AI CV Analysis
import AppliedJobs from "./pages/AppliedJobs"; // ✅ Applied Jobs
import Navbar from "./components/Navbar";
import BackToHome from "./components/BackToHome";
import ProtectedRoute from "./components/ProtectedRoute";
import Profile from "./pages/Profile";
import JobDetails from "./pages/JobDetails";
import AccountSettings from "./pages/AccountSettings";
import NotificationBanner from "./components/NotificationBanner";
import { NotificationProvider } from "./components/NotificationSystem";
import { useAuth } from "./context/AuthContext";

function App() {
  const [notifications, setNotifications] = useState([]);
  const { user } = useAuth();

  useEffect(() => {
    // Use environment variable or default to relative path for production (proxy)
    const socketUrl = process.env.NODE_ENV === 'production' ? '/' : 'http://localhost:5000';
    const socket = io(socketUrl);

    socket.on("connect", () => {
      console.log("✅ Connected to Socket.io server!", socket.id);
    });

    // Listen for different notification types
    socket.on("new_job_posted", (notification) => {
      console.log("🔔 Raw job notification received:", notification);
      if (user && user.role === "candidate") {
        console.log("✅ Adding job notification for candidate");
        setNotifications(prev => [{ ...notification, id: Date.now() }, ...prev]);
      } else {
        console.log("❌ User not candidate or not logged in:", user);
      }
    });

    socket.on("new_application", (notification) => {
      console.log("🔔 Raw application notification received:", notification);
      if (user && user.role === "recruiter") {
        console.log("✅ Adding application notification for recruiter");
        setNotifications(prev => [{ ...notification, id: Date.now() }, ...prev]);
      }
    });

    socket.on("job_match_found", (notification) => {
      console.log("🔔 Raw match notification received:", notification);
      if (user && user.role === "candidate") {
        console.log("✅ Adding match notification for candidate");
        setNotifications(prev => [{ ...notification, id: Date.now() }, ...prev]);
      }
    });

    socket.on("disconnect", () => {
      console.log("🔌 Disconnected from Socket.io server.");
    });

    // Register user connection after socket connects and user is available
    if (user) {
      console.log("👤 Registering user connection:", user.userId, "Role:", user.role);
      socket.emit("user_connected", user.userId);
    }

    return () => {
      socket.disconnect();
    };
  }, [user]); // Dependency on user to reconnect when user changes

  const removeNotification = (notificationId) => {
    setNotifications(prev => prev.filter(n => n.id !== notificationId));
  };

  return (
    <NotificationProvider>
      <Router>
        <Navbar />
        <BackToHome />
        <Routes>
          <Route path="/" element={<Login />} />
          <Route path="/signup" element={<Signup />} />

          <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
          <Route path="/jobs/:id" element={<ProtectedRoute><JobDetails /></ProtectedRoute>} />
          <Route path="/account" element={<ProtectedRoute><AccountSettings /></ProtectedRoute>} />
          <Route path="/messages" element={<ProtectedRoute><Messages /></ProtectedRoute>} />
          <Route path="/interviews" element={<ProtectedRoute><Interviews /></ProtectedRoute>} />
          <Route path="/schedule-interview" element={<ProtectedRoute role="recruiter"><ScheduleInterview /></ProtectedRoute>} />
          <Route path="/cv-analysis" element={<ProtectedRoute><CVAnalysis /></ProtectedRoute>} />

          {/* ✅ New route for editing a job */}
          <Route path="/edit-job/:id" element={<ProtectedRoute role="recruiter"><PostJob /></ProtectedRoute>} />

          <Route path="/post-job" element={<ProtectedRoute role="recruiter"><PostJob /></ProtectedRoute>} />
          <Route path="/applicants/:jobId" element={<ProtectedRoute role="recruiter"><Applicants /></ProtectedRoute>} />
          <Route path="/profile" element={<ProtectedRoute role="candidate"><Profile /></ProtectedRoute>} />
          <Route path="/applied-jobs" element={<ProtectedRoute role="candidate"><AppliedJobs /></ProtectedRoute>} />
        </Routes>

        {/* Notification Banners */}
        {notifications.map((notification) => (
          <NotificationBanner
            key={notification.id}
            notification={notification}
            onClose={() => removeNotification(notification.id)}
          />
        ))}
      </Router>
    </NotificationProvider>
  );
}

export default App;
