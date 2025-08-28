import dotenv from "dotenv";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import compression from "compression";
import rateLimit from "express-rate-limit";
import { connectDB } from "./db/connectDB.js";
import adminRoutes from "./routes/admin.js";
import authRoutes from "./routes/auth.js";
import categoryRoutes from "./routes/category.js";
import tutorialRoutes from "./routes/tutorial.js";
import quizRoutes from "./routes/quiz.js";
import projectRoutes from "./routes/project.js";
import interviewQuestionRoutes from "./routes/interviewQuestion.js";
import interviewQuestionCategoryRoutes from "./routes/interviewQuestionCategory.js";
import progressRoutes from "./routes/progress.js";

dotenv.config();

const app = express();

// Security middleware
app.use(helmet());

// Compression middleware
app.use(compression());

// Trust proxy for correct client IP behind proxies (Render/NGINX/etc.)
app.set("trust proxy", 1);

// Global rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: process.env.NODE_ENV === "production" ? 300 : 1000,
  standardHeaders: true,
  legacyHeaders: false,
});
app.use(limiter);

// Slightly tighter rate limiting for admin routes in production
const adminLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: process.env.NODE_ENV === "production" ? 150 : 1000,
  standardHeaders: true,
  legacyHeaders: false,
});

// CORS configuration
const corsOptions = {
  origin: function (origin, callback) {
    if (!origin) return callback(null, true);

    if (process.env.NODE_ENV !== "production") {
      if (
        origin.includes("localhost") ||
        origin.includes("127.0.0.1") ||
        origin.includes("chrome-untrusted")
      ) {
        return callback(null, true);
      }
    }

    const envOrigins = (process.env.ALLOWED_ORIGINS || "")
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
    const allowedOrigins = envOrigins.length
      ? envOrigins
      : [
          "https://codeintervu.com",
          "https://www.codeintervu.com",
          "https://admincodeintervu.netlify.app",
        ];

    if (allowedOrigins.includes(origin)) return callback(null, true);
    return callback(new Error("Not allowed by CORS"));
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
  console.log("Registering auth routes...");
  app.use("/api/auth", authRoutes);
  console.log("✅ Auth routes registered");
} catch (error) {
  console.error("❌ Error registering auth routes:", error);
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

try {
  console.log("Registering project routes...");
  app.use("/api/projects", projectRoutes);
  console.log("✅ Project routes registered");
} catch (error) {
  console.error("❌ Error registering project routes:", error);
  process.exit(1);
}

try {
  console.log("Registering interview question routes...");
  app.use("/api/interview-questions", interviewQuestionRoutes);
  console.log("✅ Interview question routes registered");
} catch (error) {
  console.error("❌ Error registering interview question routes:", error);
  process.exit(1);
}

try {
  console.log("Registering interview question category routes...");
  app.use(
    "/api/interview-question-categories",
    interviewQuestionCategoryRoutes
  );
  console.log("✅ Interview question category routes registered");
} catch (error) {
  console.error(
    "❌ Error registering interview question category routes:",
    error
  );
  process.exit(1);
}

try {
  console.log("Registering progress routes...");
  app.use("/api/progress", progressRoutes);
  console.log("✅ Progress routes registered");
} catch (error) {
  console.error("❌ Error registering progress routes:", error);
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
