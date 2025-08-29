import express from "express";
import {
  getCategories,
  getCategoryByPath,
  addCategory,
  deleteCategory,
  updateCategoryOrder,
  uploadAdImage,
  getAdImage,
  removeAdImage,
  uploadTopBannerAdImage,
  getTopBannerAdImage,
  removeTopBannerAdImage,
} from "../controllers/category.js";
import { adminAuth } from "../middleware/auth.js";
import upload from "../middleware/upload.js";

const router = express.Router();

// Base routes
router.get("/", getCategories);
router.post("/", adminAuth, addCategory);

// Path-based routes (for frontend)
router.get("/by-path/:path", getCategoryByPath);

// Order management route
router.put("/order", adminAuth, updateCategoryOrder);

// Test route to check if routing works
router.get("/test-ad-route", (req, res) => {
  res.json({ message: "Ad route test successful" });
});

// Ad management routes (original working format)
router.post(
  "/:categoryId/ad",
  adminAuth,
  upload.single("adImage"),
  uploadAdImage
);
router.get("/:categoryId/ad", getAdImage);
router.delete("/:categoryId/ad", adminAuth, removeAdImage);

// Top banner ad management routes (original working format)
router.post(
  "/:categoryId/top-banner-ad",
  adminAuth,
  upload.single("adImage"),
  uploadTopBannerAdImage
);
router.get("/:categoryId/top-banner-ad", getTopBannerAdImage);
router.delete("/:categoryId/top-banner-ad", adminAuth, removeTopBannerAdImage);

// ID-based routes (for admin operations) - must come after ad routes
router.delete("/by-id/:categoryId", adminAuth, deleteCategory);

export default router;
