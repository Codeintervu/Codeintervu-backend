import express from "express";
import {
  getCategories,
  getCategoryByPath,
  addCategory,
  deleteCategory,
  updateCategoryOrder,
} from "../controllers/category.js";
import { adminAuth } from "../middleware/auth.js";

const router = express.Router();

// Base routes
router.get("/", getCategories);
router.post("/", adminAuth, addCategory);

// Path-based routes (for frontend)
router.get("/by-path/:path", getCategoryByPath);

// ID-based routes (for admin operations)
router.delete("/by-id/:categoryId", adminAuth, deleteCategory);
router.put("/order", adminAuth, updateCategoryOrder);

export default router;
