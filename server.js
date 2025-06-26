import dotenv from "dotenv";
import express from "express";
import cors from "cors";
import { connectDB } from "./db/connectDB.js";
import adminRoutes from "./routes/admin.js";
import categoryRoutes from "./routes/category.js";
import tutorialRoutes from "./routes/tutorial.js";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

// Connect to MongoDB
connectDB();

app.use("/api/admin", adminRoutes);
app.use("/api/categories", categoryRoutes);
app.use("/api/tutorials", tutorialRoutes);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
