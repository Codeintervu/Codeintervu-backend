import InterviewQuestion from "../models/InterviewQuestion.js";
import InterviewQuestionCategory from "../models/InterviewQuestionCategory.js";
import SimpleImageGenerator from "../utils/simpleImageGenerator.js";

// Get all questions (frontend) - with search, filter, pagination
const getAllQuestions = async (req, res) => {
  try {
    const {
      search,
      category,
      difficulty,
      company,
      page = 1,
      limit = 10,
      sort = "createdAt",
      order = "desc",
    } = req.query;

    let query = { isActive: true };

    // Search functionality
    if (search) {
      query.$or = [
        { question: { $regex: search, $options: "i" } },
        { answer: { $regex: search, $options: "i" } },
        { tags: { $in: [new RegExp(search, "i")] } },
        { companies: { $in: [new RegExp(search, "i")] } },
      ];
    }

    // Category filter
    if (category && category !== "all") {
      query.category = category;
    }

    // Difficulty filter
    if (difficulty && difficulty !== "all") {
      query.difficulty = difficulty;
    }

    // Company filter
    if (company && company !== "all") {
      query.companies = company;
    }

    // Sorting
    const sortOptions = {};
    sortOptions[sort] = order === "desc" ? -1 : 1;

    // Pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const questions = await InterviewQuestion.find(query)
      .sort(sortOptions)
      .skip(skip)
      .limit(parseInt(limit))
      .select("-__v");

    // Populate category information
    const questionsWithCategories = await Promise.all(
      questions.map(async (question) => {
        const categoryInfo = await InterviewQuestionCategory.findOne({
          slug: question.category,
          isActive: true,
        }).select("name color");

        return {
          ...question.toObject(),
          categoryName: categoryInfo ? categoryInfo.name : question.category,
          categoryColor: categoryInfo ? categoryInfo.color : "#10B981",
        };
      })
    );

    const total = await InterviewQuestion.countDocuments(query);
    const totalPages = Math.ceil(total / parseInt(limit));

    res.status(200).json({
      success: true,
      data: {
        questions: questionsWithCategories,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: totalPages,
        },
      },
    });
  } catch (error) {
    console.error("Error fetching questions:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching questions",
      error: error.message,
    });
  }
};

// Get questions by category
const getQuestionsByCategory = async (req, res) => {
  try {
    const { category } = req.params;
    const { page = 1, limit = 10 } = req.query;

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const questions = await InterviewQuestion.find({
      category,
      isActive: true,
    })
      .sort({ order: 1, createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .select("-__v");

    const total = await InterviewQuestion.countDocuments({
      category,
      isActive: true,
    });

    res.status(200).json({
      success: true,
      data: {
        questions,
        category,
        total,
      },
    });
  } catch (error) {
    console.error("Error fetching questions by category:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching questions by category",
      error: error.message,
    });
  }
};

// Search questions
const searchQuestions = async (req, res) => {
  try {
    const { q, category, difficulty, page = 1, limit = 10 } = req.query;

    if (!q) {
      return res.status(400).json({
        success: false,
        message: "Search query is required",
      });
    }

    let query = { isActive: true };

    // Search in question, answer, tags, and companies
    query.$or = [
      { question: { $regex: q, $options: "i" } },
      { answer: { $regex: q, $options: "i" } },
      { tags: { $in: [new RegExp(q, "i")] } },
      { companies: { $in: [new RegExp(q, "i")] } },
    ];

    // Additional filters
    if (category && category !== "all") {
      query.category = category;
    }

    if (difficulty && difficulty !== "all") {
      query.difficulty = difficulty;
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const questions = await InterviewQuestion.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .select("-__v");

    const total = await InterviewQuestion.countDocuments(query);

    res.status(200).json({
      success: true,
      data: {
        questions,
        searchQuery: q,
        total,
      },
    });
  } catch (error) {
    console.error("Error searching questions:", error);
    res.status(500).json({
      success: false,
      message: "Error searching questions",
      error: error.message,
    });
  }
};

// Get question statistics
const getQuestionStats = async (req, res) => {
  try {
    const stats = await InterviewQuestion.aggregate([
      { $match: { isActive: true } },
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          byCategory: {
            $push: {
              category: "$category",
              categoryName: "$categoryName",
            },
          },
          byDifficulty: {
            $push: {
              difficulty: "$difficulty",
            },
          },
        },
      },
      {
        $project: {
          _id: 0,
          total: 1,
          categoryStats: {
            $reduce: {
              input: "$byCategory",
              initialValue: {},
              in: {
                $mergeObjects: [
                  "$$value",
                  {
                    $literal: {
                      $concat: [
                        "$$this.category",
                        ": ",
                        {
                          $toString: {
                            $add: [
                              { $ifNull: ["$$value.$$this.category", 0] },
                              1,
                            ],
                          },
                        },
                      ],
                    },
                  },
                ],
              },
            },
          },
          difficultyStats: {
            $reduce: {
              input: "$byDifficulty",
              initialValue: {},
              in: {
                $mergeObjects: [
                  "$$value",
                  {
                    $literal: {
                      $concat: [
                        "$$this.difficulty",
                        ": ",
                        {
                          $toString: {
                            $add: [
                              { $ifNull: ["$$value.$$this.difficulty", 0] },
                              1,
                            ],
                          },
                        },
                      ],
                    },
                  },
                ],
              },
            },
          },
        },
      },
    ]);

    // Simplify the stats structure
    const categoryCounts = {};
    const difficultyCounts = {};
    const companyCounts = {};

    if (stats.length > 0) {
      const stat = stats[0];

      // Count by category
      const categories = await InterviewQuestion.distinct("category", {
        isActive: true,
      });
      for (const cat of categories) {
        const count = await InterviewQuestion.countDocuments({
          category: cat,
          isActive: true,
        });
        categoryCounts[cat] = count;
      }

      // Count by difficulty
      const difficulties = await InterviewQuestion.distinct("difficulty", {
        isActive: true,
      });
      for (const diff of difficulties) {
        const count = await InterviewQuestion.countDocuments({
          difficulty: diff,
          isActive: true,
        });
        difficultyCounts[diff] = count;
      }

      // Count by company
      const companies = await InterviewQuestion.distinct("companies", {
        isActive: true,
        companies: { $exists: true, $ne: null, $ne: "" },
      });
      for (const comp of companies) {
        const count = await InterviewQuestion.countDocuments({
          companies: comp,
          isActive: true,
        });
        companyCounts[comp] = count;
      }
    }

    res.status(200).json({
      success: true,
      data: {
        total: stats.length > 0 ? stats[0].total : 0,
        byCategory: categoryCounts,
        byDifficulty: difficultyCounts,
        byCompany: companyCounts,
      },
    });
  } catch (error) {
    console.error("Error fetching question stats:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching question stats",
      error: error.message,
    });
  }
};

// Get all questions (admin) - with search, filter, sort
const getAllQuestionsAdmin = async (req, res) => {
  try {
    const {
      search,
      category,
      difficulty,
      company,
      isActive,
      sort = "createdAt",
      order = "desc",
    } = req.query;

    let query = {};

    // Search functionality
    if (search) {
      query.$or = [
        { question: { $regex: search, $options: "i" } },
        { answer: { $regex: search, $options: "i" } },
        { tags: { $in: [new RegExp(search, "i")] } },
        { companies: { $in: [new RegExp(search, "i")] } },
      ];
    }

    // Category filter
    if (category && category !== "all") {
      query.category = category;
    }

    // Difficulty filter
    if (difficulty && difficulty !== "all") {
      query.difficulty = difficulty;
    }

    // Company filter
    if (company && company !== "all") {
      query.companies = company;
    }

    // Active filter
    if (isActive !== undefined) {
      query.isActive = isActive === "true";
    }

    // Sorting
    const sortOptions = {};
    sortOptions[sort] = order === "desc" ? -1 : 1;

    const questions = await InterviewQuestion.find(query)
      .sort(sortOptions)
      .select("-__v");

    // Populate category information
    const questionsWithCategories = await Promise.all(
      questions.map(async (question) => {
        const categoryInfo = await InterviewQuestionCategory.findOne({
          slug: question.category,
        }).select("name color");

        return {
          ...question.toObject(),
          categoryName: categoryInfo ? categoryInfo.name : question.category,
          categoryColor: categoryInfo ? categoryInfo.color : "#10B981",
        };
      })
    );

    res.status(200).json({
      success: true,
      count: questionsWithCategories.length,
      data: questionsWithCategories,
    });
  } catch (error) {
    console.error("Error fetching questions (admin):", error);
    res.status(500).json({
      success: false,
      message: "Error fetching questions",
      error: error.message,
    });
  }
};

// Create new question (admin)
const createQuestion = async (req, res) => {
  try {
    const questionData = req.body;

    // Create question
    const question = await InterviewQuestion.create(questionData);

    res.status(201).json({
      success: true,
      message: "Question created successfully",
      data: question,
    });
  } catch (error) {
    console.error("Error creating question:", error);

    // Handle validation errors
    if (error.name === "ValidationError") {
      const errors = Object.values(error.errors).map((err) => err.message);
      return res.status(400).json({
        success: false,
        message: "Validation error",
        errors,
      });
    }

    res.status(500).json({
      success: false,
      message: "Error creating question",
      error: error.message,
    });
  }
};

// Get single question by ID
const getQuestionById = async (req, res) => {
  try {
    const question = await InterviewQuestion.findById(req.params.id).select(
      "-__v"
    );

    if (!question) {
      return res.status(404).json({
        success: false,
        message: "Question not found",
      });
    }

    // Populate category information
    const categoryInfo = await InterviewQuestionCategory.findOne({
      slug: question.category,
    }).select("name color");

    const questionWithCategory = {
      ...question.toObject(),
      categoryName: categoryInfo ? categoryInfo.name : question.category,
      categoryColor: categoryInfo ? categoryInfo.color : "#10B981",
    };

    // Handle migration from old 'company' field to new 'companies' array
    if (questionWithCategory.company && !questionWithCategory.companies) {
      questionWithCategory.companies = [questionWithCategory.company];
      delete questionWithCategory.company;
    } else if (!questionWithCategory.companies) {
      questionWithCategory.companies = [];
    }

    res.status(200).json({
      success: true,
      data: questionWithCategory,
    });
  } catch (error) {
    console.error("Error fetching question:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching question",
      error: error.message,
    });
  }
};

// Update question (admin)
const updateQuestion = async (req, res) => {
  try {
    const questionData = req.body;

    // Handle migration from old 'company' field to new 'companies' array
    if (questionData.company && !questionData.companies) {
      questionData.companies = [questionData.company];
      delete questionData.company;
    }

    const question = await InterviewQuestion.findByIdAndUpdate(
      req.params.id,
      questionData,
      {
        new: true,
        runValidators: true,
      }
    ).select("-__v");

    if (!question) {
      return res.status(404).json({
        success: false,
        message: "Question not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Question updated successfully",
      data: question,
    });
  } catch (error) {
    console.error("Error updating question:", error);

    // Handle validation errors
    if (error.name === "ValidationError") {
      const errors = Object.values(error.errors).map((err) => err.message);
      return res.status(400).json({
        success: false,
        message: "Validation error",
        errors,
      });
    }

    res.status(500).json({
      success: false,
      message: "Error updating question",
      error: error.message,
    });
  }
};

// Delete question (admin)
const deleteQuestion = async (req, res) => {
  try {
    const question = await InterviewQuestion.findByIdAndDelete(req.params.id);

    if (!question) {
      return res.status(404).json({
        success: false,
        message: "Question not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Question deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting question:", error);
    res.status(500).json({
      success: false,
      message: "Error deleting question",
      error: error.message,
    });
  }
};

// Toggle question status (admin)
const toggleQuestionStatus = async (req, res) => {
  try {
    const question = await InterviewQuestion.findById(req.params.id);

    if (!question) {
      return res.status(404).json({
        success: false,
        message: "Question not found",
      });
    }

    question.isActive = !question.isActive;
    await question.save();

    res.status(200).json({
      success: true,
      message: `Question ${
        question.isActive ? "activated" : "deactivated"
      } successfully`,
      data: question,
    });
  } catch (error) {
    console.error("Error toggling question status:", error);
    res.status(500).json({
      success: false,
      message: "Error toggling question status",
      error: error.message,
    });
  }
};

// Get question by slug (for direct access)
const getQuestionBySlug = async (req, res) => {
  try {
    const { category, slug } = req.params;

    // First, find the category to get the slug
    const categoryInfo = await InterviewQuestionCategory.findOne({
      slug: category,
      isActive: true,
    });

    if (!categoryInfo) {
      return res.status(404).json({
        success: false,
        message: "Category not found",
      });
    }

    // Find the question by category and create a slug from the question
    const questions = await InterviewQuestion.find({
      category: categoryInfo.slug,
      isActive: true,
    });

    // Find the question that matches the slug (simplified matching)
    const question = questions.find((q) => {
      const questionSlug = q.question
        .toLowerCase()
        .replace(/[^a-z0-9\s]/g, "")
        .replace(/\s+/g, "-")
        .substring(0, 50);
      return questionSlug === slug;
    });

    if (!question) {
      return res.status(404).json({
        success: false,
        message: "Question not found",
      });
    }

    // Add category information
    const questionWithCategory = {
      ...question.toObject(),
      categoryName: categoryInfo.name,
      categoryColor: categoryInfo.color,
    };

    res.status(200).json({
      success: true,
      data: questionWithCategory,
    });
  } catch (error) {
    console.error("Error fetching question by slug:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching question",
      error: error.message,
    });
  }
};

// Get question meta tags for social sharing
const getQuestionMeta = async (req, res) => {
  try {
    const { id } = req.params;

    const question = await InterviewQuestion.findById(id).select("-__v");

    if (!question) {
      return res.status(404).json({
        success: false,
        message: "Question not found",
      });
    }

    // Get category information
    const categoryInfo = await InterviewQuestionCategory.findOne({
      slug: question.category,
      isActive: true,
    }).select("name color");

    // Generate meta tags
    const metaTags = {
      title: `${categoryInfo?.name || question.category} Interview Question: ${
        question.question
      }`,
      description:
        question.answer.length > 150
          ? `${question.answer.substring(0, 150)}...`
          : question.answer,
      image: `${
        process.env.FRONTEND_URL || "https://yourdomain.com"
      }/assets/images/logo.png`,
      url: `${
        process.env.FRONTEND_URL || "https://yourdomain.com"
      }/interview-questions/${question.category}/${question._id}`,
      tags: question.tags.join(", "),
      category: categoryInfo?.name || question.category,
      difficulty: question.difficulty,
      type: "article",
      siteName: "CodeIntervu",
    };

    res.status(200).json({
      success: true,
      data: metaTags,
    });
  } catch (error) {
    console.error("Error fetching question meta:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching question meta",
      error: error.message,
    });
  }
};

// Generate preview image for social sharing
const generatePreviewImage = async (req, res) => {
  try {
    const { id } = req.params;

    const question = await InterviewQuestion.findById(id).select("-__v");

    if (!question) {
      return res.status(404).json({
        success: false,
        message: "Question not found",
      });
    }

    // Get category information
    const categoryInfo = await InterviewQuestionCategory.findOne({
      slug: question.category,
      isActive: true,
    }).select("name color");

    // Prepare question data with category info
    const questionData = {
      ...question.toObject(),
      categoryName: categoryInfo?.name || question.category,
      categoryColor: categoryInfo?.color || "#10B981",
    };

    // Generate the preview HTML
    const imageGenerator = new SimpleImageGenerator();
    const result = await imageGenerator.generateQuestionPreview(questionData);

    // Set response headers for HTML that social media crawlers can interpret
    res.setHeader("Content-Type", "text/html; charset=utf-8");
    res.setHeader("Cache-Control", "public, max-age=3600"); // Cache for 1 hour
    res.setHeader("X-Frame-Options", "ALLOWALL"); // Allow embedding
    res.setHeader("X-Content-Type-Options", "nosniff");

    // Send the HTML
    res.send(result.html);
  } catch (error) {
    console.error("Error generating preview image:", error);
    res.status(500).json({
      success: false,
      message: "Error generating preview image",
      error: error.message,
    });
  }
};

export {
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
};
