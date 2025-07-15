import QuizCategory from "../models/QuizCategory.js";
import QuizQuestion from "../models/QuizQuestion.js";

// Quiz Category Controllers
export const getQuizCategories = async (req, res) => {
  try {
    const categories = await QuizCategory.find();
    res.json(categories);
  } catch (error) {
    res.status(500).json({ message: "Server Error" });
  }
};

export const addQuizCategory = async (req, res) => {
  try {
    const { name, description } = req.body;
    const category = new QuizCategory({ name, description });
    await category.save();
    res.status(201).json(category);
  } catch (error) {
    res.status(500).json({ message: "Server Error" });
  }
};

// Quiz Question Controllers
export const getQuizQuestions = async (req, res) => {
  try {
    const questions = await QuizQuestion.find({
      category: req.params.categoryId,
    });
    res.json(questions);
  } catch (error) {
    res.status(500).json({ message: "Server Error" });
  }
};

export const addQuizQuestion = async (req, res) => {
  try {
    const { question, options, correctOption, hint } = req.body;
    const quizQuestion = new QuizQuestion({
      category: req.params.categoryId,
      question,
      options,
      correctOption,
      hint,
    });
    await quizQuestion.save();
    res.status(201).json(quizQuestion);
  } catch (error) {
    res.status(500).json({ message: "Server Error" });
  }
};

export const updateQuizQuestion = async (req, res) => {
  try {
    const { question, options, correctOption, hint } = req.body;
    const quizQuestion = await QuizQuestion.findByIdAndUpdate(
      req.params.questionId,
      { question, options, correctOption, hint },
      { new: true }
    );
    res.json(quizQuestion);
  } catch (error) {
    res.status(500).json({ message: "Server Error" });
  }
};

export const deleteQuizQuestion = async (req, res) => {
  try {
    await QuizQuestion.findByIdAndDelete(req.params.questionId);
    res.json({ message: "Quiz question deleted" });
  } catch (error) {
    res.status(500).json({ message: "Server Error" });
  }
};

// Get question count for a quiz category
export const getQuizCategoryQuestionCount = async (req, res) => {
  try {
    const categoryId = req.params.categoryId;
    const count = await QuizQuestion.countDocuments({ category: categoryId });
    res.json({ count });
  } catch (error) {
    res.status(500).json({ message: "Server Error" });
  }
};

// Get quiz category by slug
export const getQuizCategoryBySlug = async (req, res) => {
  try {
    const slug = req.params.slug;
    const category = await QuizCategory.findOne({ slug });
    if (!category) {
      return res.status(404).json({ message: "Quiz category not found" });
    }
    res.json(category);
  } catch (error) {
    res.status(500).json({ message: "Server Error" });
  }
};
