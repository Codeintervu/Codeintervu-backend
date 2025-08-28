import express from "express";
import {
  registerUser,
  loginUser,
  getUserProfile,
  updateUserProfile,
  changePassword,
} from "../controllers/user.js";
import { auth } from "../middleware/auth.js";

const router = express.Router();

// @route   POST /api/auth/register
// @desc    Register a new user
// @access  Public
router.post("/register", registerUser);

// @route   POST /api/auth/login
// @desc    Login user
// @access  Public
router.post("/login", loginUser);

// @route   GET /api/auth/profile
// @desc    Get user profile
// @access  Private
router.get("/profile", auth, getUserProfile);

// @route   PUT /api/auth/profile
// @desc    Update user profile
// @access  Private
router.put("/profile", auth, updateUserProfile);

// @route   PUT /api/auth/change-password
// @desc    Change user password
// @access  Private
router.put("/change-password", auth, changePassword);
export default router;
