import express from "express";
import {
  getTutorials,
  getTutorialById,
  createTutorial,
  addSectionToTutorial,
  deleteTutorial,
  deleteTutorialSection,
  updateTutorialSection,
  getTutorialByCategoryAndSlug,
} from "../controllers/tutorial.js";
import auth from "../middleware/auth.js";
import multer from "multer";
import { storage } from "../config/cloudinary.js";

const router = express.Router();

// Multer setup for Cloudinary uploads
const upload = multer({ storage });

// Base routes
router.get("/", getTutorials);
router.post("/", auth, createTutorial);

// ID-based routes (for admin operations)
router.get("/by-id/:tutorialId", getTutorialById);
router.delete("/by-id/:tutorialId", auth, deleteTutorial);

const sectionUploads = upload.fields([
  { name: "mainMedia", maxCount: 1 },
  { name: "contentBlockMedia" },
]);

// Section management routes (ID-based)
router.post(
  "/by-id/:tutorialId/sections",
  auth,
  sectionUploads,
  addSectionToTutorial
);
router.put(
  "/by-id/:tutorialId/sections/:sectionId",
  auth,
  sectionUploads,
  updateTutorialSection
);
router.delete(
  "/by-id/:tutorialId/sections/:sectionId",
  auth,
  deleteTutorialSection
);

// Slug-based routes (for frontend pretty URLs)
router.get("/cat/:categoryPath/:slug", getTutorialByCategoryAndSlug);

export default router;
