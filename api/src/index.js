const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const userRoutes = require("./routes/user");

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(helmet()); // Security headers
app.use(cors()); // Enable CORS for all origins (configure for production)
app.use(express.json()); // Parse JSON bodies
app.use(morgan("combined")); // Request logging

// Health check endpoint (no auth required)
app.get("/health", (req, res) => {
  res.json({
    status: "healthy",
    service: "teamnotes-api",
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || "development",
  });
});

// API routes
app.use("/api/user", userRoutes);

// Root endpoint
app.get("/", (req, res) => {
  res.json({
    service: "TeamNotes API",
    version: "1.0.0",
    description: "Node.js API demonstrating Firebase Auth integration in a Cloud Run environment",
    endpoints: {
      health: "GET /health",
      userStats: "GET /api/user/stats (requires auth)",
      userExport: "POST /api/user/export (requires auth)",
    },
    documentation: "See README.md for authentication details",
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    error: "NotFound",
    message: `Route ${req.method} ${req.path} not found`,
  });
});

// Error handler
app.use((err, req, res, next) => {
  console.error("❌ Unhandled error:", err);

  res.status(err.status || 500).json({
    error: "InternalServerError",
    message: err.message || "An unexpected error occurred",
    details: process.env.NODE_ENV === "development" ? err.stack : undefined,
  });
});

// Start server
app.listen(PORT, "0.0.0.0", () => {
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("🚀 TeamNotes API Server");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log(`📡 Listening on: http://localhost:${PORT}`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || "development"}`);
  console.log(`🔥 Firebase Project: ${process.env.FIREBASE_PROJECT_ID || "teamnotes-demo"}`);

  if (process.env.FIREBASE_AUTH_EMULATOR_HOST) {
    console.log("🔧 Using Firebase Emulator");
    console.log(`   Auth: ${process.env.FIREBASE_AUTH_EMULATOR_HOST}`);
    console.log(`   Firestore: ${process.env.FIRESTORE_EMULATOR_HOST}`);
  }

  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
});

// Graceful shutdown
process.on("SIGTERM", () => {
  console.log("⚠️  SIGTERM signal received: closing HTTP server");
  process.exit(0);
});

process.on("SIGINT", () => {
  console.log("⚠️  SIGINT signal received: closing HTTP server");
  process.exit(0);
});
