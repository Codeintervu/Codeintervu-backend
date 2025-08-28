import express from "express";
import {
  getAllCategories,
  getCategoriesWithCounts,
  getAllCategoriesAdmin,
  createCategory,
  getCategoryById,
  updateCategory,
  deleteCategory,
  toggleCategoryStatus,
} from "../controllers/interviewQuestionCategory.js";
import { adminAuth } from "../middleware/auth.js";

const router = express.Router();

// ==================== PUBLIC ROUTES (Frontend) ====================

// Get all active categories
router.get("/", getAllCategories);

// Get all active categories with question counts
router.get("/with-counts", getCategoriesWithCounts);

// ==================== ADMIN ROUTES (Protected) ====================

// Get all categories (admin) - including inactive
router.get("/admin/all", adminAuth, getAllCategoriesAdmin);

// Create new category (admin)
router.post("/admin", adminAuth, createCategory);

// Get single category by ID (admin)
router.get("/admin/:id", adminAuth, getCategoryById);

// Update category (admin)
router.put("/admin/:id", adminAuth, updateCategory);

// Delete category (admin)
router.delete("/admin/:id", adminAuth, deleteCategory);

// Toggle category status (admin)
router.patch("/admin/:id/toggle", adminAuth, toggleCategoryStatus);

export default router;
