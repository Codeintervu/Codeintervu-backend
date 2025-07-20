import dotenv from "dotenv";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import compression from "compression";
import rateLimit from "express-rate-limit";
import { connectDB } from "./db/connectDB.js";
import adminRoutes from "./routes/admin.js";
import categoryRoutes from "./routes/category.js";
import tutorialRoutes from "./routes/tutorial.js";
import quizRoutes from "./routes/quiz.js";

dotenv.config();

const app = express();

// Security middleware
app.use(helmet());

// Compression middleware
app.use(compression());

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: "Too many requests from this IP, please try again later.",
  standardHeaders: true,
  legacyHeaders: false,
});
app.use(limiter);

// CORS configuration
const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);

    // For development, allow all localhost origins
    if (process.env.NODE_ENV !== "production") {
      if (
        origin.includes("localhost") ||
        origin.includes("127.0.0.1") ||
        origin.includes("chrome-untrusted")
      ) {
        return callback(null, true);
      }
    }

    const allowedOrigins = [
      "https://codeintervu.com",
      "https://www.codeintervu.com",
      "https://admincodeintervu.netlify.app",
      "http://localhost:3000",
      "http://localhost:5173",
      "http://localhost:4000",
      "http://127.0.0.1:5173",
      "http://127.0.0.1:3000",
      "http://127.0.0.1:4000",
    ];

    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error("Not allowed by CORS"));
    }
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "x-auth-token"],
};

app.use(cors(corsOptions));
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// Connect to MongoDB
connectDB();

// Health check endpoint
app.get("/health", (req, res) => {
  res.json({
    status: "OK",
    message: "Server is running",
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || "development",
    version: "1.0.0",
  });
});

// Root endpoint
app.get("/", (req, res) => {
  res.json({
    message: "CodeIntervu Backend API",
    version: "1.0.0",
    status: "running",
    timestamp: new Date().toISOString(),
  });
});

// Test endpoint for admin panel
app.get("/api/admin/test", (req, res) => {
  res.json({
    message: "Admin API is accessible",
    timestamp: new Date().toISOString(),
    origin: req.headers.origin,
  });
});

// Register routes with individual error handling
try {
  console.log("Registering admin routes...");
  app.use("/api/admin", adminRoutes);
  console.log("✅ Admin routes registered");
} catch (error) {
  console.error("❌ Error registering admin routes:", error);
  process.exit(1);
}

try {
  console.log("Registering category routes...");
  app.use("/api/categories", categoryRoutes);
  console.log("✅ Category routes registered");
} catch (error) {
  console.error("❌ Error registering category routes:", error);
  process.exit(1);
}

try {
  console.log("Registering tutorial routes...");
  app.use("/api/tutorials", tutorialRoutes);
  console.log("✅ Tutorial routes registered");
} catch (error) {
  console.error("❌ Error registering tutorial routes:", error);
  process.exit(1);
}

try {
  console.log("Registering quiz routes...");
  app.use("/api/quiz", quizRoutes);
  console.log("✅ Quiz routes registered");
} catch (error) {
  console.error("❌ Error registering quiz routes:", error);
  process.exit(1);
}

console.log("🎉 All routes registered successfully!");

// 404 handler - using a simple function instead of wildcard
app.use((req, res, next) => {
  if (req.method === "OPTIONS") {
    return next();
  }

  res.status(404).json({
    message: "Route not found",
    path: req.originalUrl,
    method: req.method,
  });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error("Global error:", err);

  // Handle specific error types
  if (err.message && err.message.includes("path-to-regexp")) {
    return res.status(400).json({
      message: "Invalid route pattern",
      error: "Bad request",
    });
  }

  res.status(500).json({
    message: "Internal server error",
    error:
      process.env.NODE_ENV === "development"
        ? err.message
        : "Something went wrong",
  });
});

const PORT = process.env.PORT || 5000;

// Start server with error handling
try {
  const server = app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
    console.log(`🌍 Environment: ${process.env.NODE_ENV || "development"}`);
    console.log(`📊 Health check: http://localhost:${PORT}/health`);
  });

  // Handle server errors
  server.on("error", (error) => {
    console.error("❌ Server error:", error);
    process.exit(1);
  });
} catch (error) {
  console.error("❌ Error starting server:", error);
  process.exit(1);
}
