import express from "express";
import {
  getAllQuestions,
  getQuestionsByCategory,
  searchQuestions,
  getQuestionStats,
  getAllQuestionsAdmin,
  createQuestion,
  getQuestionById,
  updateQuestion,
  deleteQuestion,
  toggleQuestionStatus,
  getQuestionBySlug,
  getQuestionMeta,
  generatePreviewImage,
} from "../controllers/interviewQuestion.js";
import auth from "../middleware/auth.js";

const router = express.Router();

// ==================== PUBLIC ROUTES (Frontend) ====================

// Get all questions with search, filter, pagination
router.get("/", getAllQuestions);

// Get questions by category
router.get("/category/:category", getQuestionsByCategory);

// Search questions
router.get("/search", searchQuestions);

// Get question statistics
router.get("/stats", getQuestionStats);

// Get single question by ID (public)
router.get("/:id", getQuestionById);

// Get question by slug (for direct access)
router.get("/slug/:category/:slug", getQuestionBySlug);

// Get question meta tags for social sharing
router.get("/:id/meta", getQuestionMeta);

// Generate preview image for social sharing
router.get("/:id/preview-image", generatePreviewImage);

// ==================== ADMIN ROUTES (Protected) ====================

// Get all questions (admin) - with search, filter, sort
router.get("/admin/all", auth, getAllQuestionsAdmin);

// Get question statistics (admin)
router.get("/admin/stats", auth, getQuestionStats);

// Create new question (admin)
router.post("/admin", auth, createQuestion);

// Get single question by ID (admin)
router.get("/admin/:id", auth, getQuestionById);

// Update question (admin)
router.put("/admin/:id", auth, updateQuestion);

// Delete question (admin)
router.delete("/admin/:id", auth, deleteQuestion);

// Toggle question status (admin)
router.patch("/admin/:id/toggle", auth, toggleQuestionStatus);

export default router;
