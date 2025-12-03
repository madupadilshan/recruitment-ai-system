import express from "express";
import mongoose from "mongoose";
import dotenv from "dotenv";
import cors from "cors";

// Configure dotenv
dotenv.config();

// Routes
import authRoutes from "./routes/auth.js";
import jobRoutes from "./routes/jobs.js";
import applicationRoutes from "./routes/applications.js";
import userRoutes from "./routes/users.js"; // ✅ new
import messageRoutes from "./routes/messages.js"; // ✅ messaging
import interviewRoutes from "./routes/interviews.js"; // ✅ interviews
import cvAnalysisRoutes from "./routes/cvAnalysis.js"; // ✅ AI CV analysis

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// MongoDB Atlas Connection
const mongoUri = process.env.MONGO_URI;
console.log("📋 Connecting to MongoDB:", mongoUri ? "URI loaded" : "URI not found");

if (!mongoUri) {
  console.error("❌ FATAL ERROR: MONGO_URI is not defined in environment variables.");
  process.exit(1);
}

mongoose.connect(mongoUri)
.then(() => console.log("✅ MongoDB Atlas Connected"))
.catch((err) => console.error("❌ MongoDB Error:", err));

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/jobs", jobRoutes);
app.use("/api/applications", applicationRoutes);
app.use("/api/users", userRoutes); // ✅ new
app.use("/api", messageRoutes); // ✅ messaging routes
app.use("/api/interviews", interviewRoutes); // ✅ interview routes
app.use("/api/cv", cvAnalysisRoutes); // ✅ AI CV analysis routes

// Health check endpoint for Docker
app.get("/health", (req, res) => {
  const memUsage = process.memoryUsage();
  res.json({
    status: "healthy",
    uptime: process.uptime(),
    memory: {
      heapUsed: Math.round(memUsage.heapUsed / 1024 / 1024) + 'MB',
      heapTotal: Math.round(memUsage.heapTotal / 1024 / 1024) + 'MB',
      rss: Math.round(memUsage.rss / 1024 / 1024) + 'MB'
    }
  });
});

app.get("/", (req, res) => res.send("API Running..."));

// Start Server with Socket.io
const PORT = process.env.PORT || 5000;
import { Server } from "socket.io";
import http from "http";
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

// Store connected users by their ID for targeted notifications
const connectedUsers = new Map();

io.on("connection", (socket) => {
  console.log("🔔 Socket.io client connected:", socket.id);

  // Store user connection when they authenticate
  socket.on("user_connected", (userId) => {
    connectedUsers.set(userId, socket.id);
    console.log(`👤 User ${userId} connected with socket ${socket.id}`);
  });

  socket.on("disconnect", () => {
    // Remove user from connected users map
    for (let [userId, socketId] of connectedUsers.entries()) {
      if (socketId === socket.id) {
        connectedUsers.delete(userId);
        console.log(`🔌 User ${userId} disconnected`);
        break;
      }
    }
    console.log("🔌 Socket.io client disconnected:", socket.id);
  });
});

// Make io instance available globally for other modules
global.io = io;
global.connectedUsers = connectedUsers;

server.listen(PORT, () => console.log(`🚀 Server running with Socket.io on port ${PORT}`));
