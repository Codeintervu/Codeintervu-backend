import express from "express";
import {
  getQuizCategories,
  addQuizCategory,
  getQuizQuestions,
  addQuizQuestion,
  updateQuizQuestion,
  deleteQuizQuestion,
  getQuizCategoryQuestionCount,
  getQuizCategoryBySlug,
} from "../controllers/quiz.js";
import auth from "../middleware/auth.js";

const router = express.Router();

// Quiz categories
router.get("/categories", getQuizCategories);
router.post("/categories", auth, addQuizCategory);

// Add this route for fetching quiz category by slug - MUST come before parameterized routes
router.get("/categories/slug/:slug", getQuizCategoryBySlug);

// Quiz questions for a category
router.get("/categories/:categoryId/questions", getQuizQuestions);
router.post("/categories/:categoryId/questions", auth, addQuizQuestion);

// Add question count route
router.get(
  "/categories/:categoryId/question-count",
  getQuizCategoryQuestionCount
);

// Update/delete a quiz question
router.put("/questions/:questionId", auth, updateQuizQuestion);
router.delete("/questions/:questionId", auth, deleteQuizQuestion);

export default router;
