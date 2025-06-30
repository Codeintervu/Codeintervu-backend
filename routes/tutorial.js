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

router.route("/").get(getTutorials).post(auth, createTutorial);

router.route("/:id").get(getTutorialById).delete(auth, deleteTutorial);

const sectionUploads = upload.fields([
  { name: "mainMedia", maxCount: 1 },
  { name: "contentBlockMedia" },
]);

router.route("/:id/sections").post(auth, sectionUploads, addSectionToTutorial);

router
  .route("/:tutorialId/sections/:sectionId")
  .put(auth, sectionUploads, updateTutorialSection)
  .delete(auth, deleteTutorialSection);

router.route("/:categoryPath/:slug").get(getTutorialByCategoryAndSlug);

export default router;
