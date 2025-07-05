import dotenv from "dotenv";
import express from "express";
import cors from "cors";
import { connectDB } from "./db/connectDB.js";
import adminRoutes from "./routes/admin.js";
import categoryRoutes from "./routes/category.js";
import tutorialRoutes from "./routes/tutorial.js";

dotenv.config();

const app = express();

// CORS configuration
const corsOptions = {
  origin: [
    "https://codeintervu.com",
    "https://www.codeintervu.com",
    "http://localhost:3000",
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://127.0.0.1:3000",
  ],
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "x-auth-token"],
};

app.use(cors(corsOptions));
app.use(express.json());

// Connect to MongoDB
connectDB();

// Health check endpoint
app.get("/health", (req, res) => {
  res.json({
    status: "OK",
    message: "Server is running",
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || "development",
  });
});

app.use("/api/admin", adminRoutes);
app.use("/api/categories", categoryRoutes);
app.use("/api/tutorials", tutorialRoutes);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
