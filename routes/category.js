import express from "express";
import {
  getCategories,
  getCategoryByPath,
  addCategory,
  deleteCategory,
  updateCategoryOrder,
} from "../controllers/category.js";
import auth from "../middleware/auth.js";

const router = express.Router();

// Base routes
router.get("/", getCategories);
router.post("/", auth, addCategory);

// Path-based routes (for frontend)
router.get("/by-path/:path", getCategoryByPath);

// ID-based routes (for admin operations)
router.delete("/by-id/:categoryId", auth, deleteCategory);
router.put("/order", auth, updateCategoryOrder);

export default router;
