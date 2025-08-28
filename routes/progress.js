import express from "express";
import { auth } from "../middleware/auth.js";
import {
  saveSectionResult,
  getSummary,
  getRecent,
  listBookmarks,
  addBookmark,
  deleteBookmark,
  updateResume,
  getResume,
  importGuestProgress,
} from "../controllers/progress.js";

const router = express.Router();

// Results
router.post("/section-result", auth, saveSectionResult);
router.get("/summary", auth, getSummary);
router.get("/recent", auth, getRecent);

// Resume
router.get("/resume/:quizId", auth, getResume);
router.post("/resume", auth, updateResume);

// Bookmarks
router.get("/bookmarks", auth, listBookmarks);
router.post("/bookmarks", auth, addBookmark);
router.delete("/bookmarks/:questionId", auth, deleteBookmark);

// Import guest/local progress
router.post("/import", auth, importGuestProgress);

export default router;
