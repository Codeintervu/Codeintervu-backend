import express from "express";
import {
  registerAdmin,
  loginAdmin,
  getAllUsers,
  getUserById,
  getUserStats,
  deleteUser,
} from "../controllers/admin.js";
import { adminAuth } from "../middleware/auth.js";

const router = express.Router();

// The registration logic now only exists in the controller and is not exposed
// as a route. To create another admin, you would have to temporarily add:
// router.post("/register", registerAdmin);

// Login route
router.post("/login", loginAdmin);

// User management routes (protected)
router.get("/users", adminAuth, getAllUsers);
router.get("/users/:id", adminAuth, getUserById);
router.get("/stats", adminAuth, getUserStats);
router.delete("/users/:id", adminAuth, deleteUser);

export default router;
