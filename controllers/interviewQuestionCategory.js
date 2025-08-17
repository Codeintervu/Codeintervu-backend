import InterviewQuestionCategory from "../models/InterviewQuestionCategory.js";
import InterviewQuestion from "../models/InterviewQuestion.js";

// Get all categories (frontend)
const getAllCategories = async (req, res) => {
  try {
    const categories = await InterviewQuestionCategory.find({ isActive: true })
      .sort({ order: 1, createdAt: 1 })
      .select("-__v");

    res.status(200).json({
      success: true,
      data: categories,
    });
  } catch (error) {
    console.error("Error fetching categories:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching categories",
      error: error.message,
    });
  }
};

// Get all categories with question counts (frontend)
const getCategoriesWithCounts = async (req, res) => {
  try {
    const categories = await InterviewQuestionCategory.find({ isActive: true })
      .sort({ order: 1, createdAt: 1 })
      .select("-__v");

    // Get question counts for each category
    const categoriesWithCounts = await Promise.all(
      categories.map(async (category) => {
        const count = await InterviewQuestion.countDocuments({
          category: category.slug,
          isActive: true,
        });
        return {
          ...category.toObject(),
          questionCount: count,
        };
      })
    );

    res.status(200).json({
      success: true,
      data: categoriesWithCounts,
    });
  } catch (error) {
    console.error("Error fetching categories with counts:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching categories with counts",
      error: error.message,
    });
  }
};

// Get all categories (admin)
const getAllCategoriesAdmin = async (req, res) => {
  try {
    const categories = await InterviewQuestionCategory.find()
      .sort({ order: 1, createdAt: 1 })
      .select("-__v");

    // Get question counts for each category
    const categoriesWithCounts = await Promise.all(
      categories.map(async (category) => {
        const count = await InterviewQuestion.countDocuments({
          category: category.slug,
        });
        return {
          ...category.toObject(),
          questionCount: count,
        };
      })
    );

    res.status(200).json({
      success: true,
      data: categoriesWithCounts,
    });
  } catch (error) {
    console.error("Error fetching categories (admin):", error);
    res.status(500).json({
      success: false,
      message: "Error fetching categories",
      error: error.message,
    });
  }
};

// Create new category (admin)
const createCategory = async (req, res) => {
  try {
    const { name, slug, description, color, order } = req.body;

    // Check if category with same name or slug already exists
    const existingCategory = await InterviewQuestionCategory.findOne({
      $or: [{ name }, { slug }],
    });

    if (existingCategory) {
      return res.status(400).json({
        success: false,
        message: "Category with this name or slug already exists",
      });
    }

    // If no order is provided, get the highest order and add 1 to put new category at the end
    let finalOrder = order;
    if (!finalOrder) {
      const highestOrderCategory = await InterviewQuestionCategory.findOne()
        .sort({ order: -1 })
        .select("order");
      finalOrder = highestOrderCategory ? highestOrderCategory.order + 1 : 1;
    }

    const category = new InterviewQuestionCategory({
      name,
      slug,
      description,
      color,
      order: finalOrder,
    });

    await category.save();

    res.status(201).json({
      success: true,
      message: "Category created successfully",
      data: category,
    });
  } catch (error) {
    console.error("Error creating category:", error);

    if (error.name === "ValidationError") {
      const validationErrors = Object.values(error.errors).map(
        (err) => err.message
      );
      return res.status(400).json({
        success: false,
        message: "Validation error",
        errors: validationErrors,
      });
    }

    res.status(500).json({
      success: false,
      message: "Error creating category",
      error: error.message,
    });
  }
};

// Get category by ID (admin)
const getCategoryById = async (req, res) => {
  try {
    const { id } = req.params;
    const category = await InterviewQuestionCategory.findById(id).select(
      "-__v"
    );

    if (!category) {
      return res.status(404).json({
        success: false,
        message: "Category not found",
      });
    }

    res.status(200).json({
      success: true,
      data: category,
    });
  } catch (error) {
    console.error("Error fetching category:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching category",
      error: error.message,
    });
  }
};

// Update category (admin)
const updateCategory = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, slug, description, color, order, isActive } = req.body;

    const category = await InterviewQuestionCategory.findById(id);

    if (!category) {
      return res.status(404).json({
        success: false,
        message: "Category not found",
      });
    }

    // Check if name or slug already exists (excluding current category)
    if (name || slug) {
      const existingCategory = await InterviewQuestionCategory.findOne({
        $or: [
          { name: name || category.name, _id: { $ne: id } },
          { slug: slug || category.slug, _id: { $ne: id } },
        ],
      });

      if (existingCategory) {
        return res.status(400).json({
          success: false,
          message: "Category with this name or slug already exists",
        });
      }
    }

    // Update fields
    if (name !== undefined) category.name = name;
    if (slug !== undefined) category.slug = slug;
    if (description !== undefined) category.description = description;
    if (color !== undefined) category.color = color;
    if (order !== undefined) category.order = order;
    if (isActive !== undefined) category.isActive = isActive;

    await category.save();

    res.status(200).json({
      success: true,
      message: "Category updated successfully",
      data: category,
    });
  } catch (error) {
    console.error("Error updating category:", error);

    if (error.name === "ValidationError") {
      const validationErrors = Object.values(error.errors).map(
        (err) => err.message
      );
      return res.status(400).json({
        success: false,
        message: "Validation error",
        errors: validationErrors,
      });
    }

    res.status(500).json({
      success: false,
      message: "Error updating category",
      error: error.message,
    });
  }
};

// Delete category (admin)
const deleteCategory = async (req, res) => {
  try {
    const { id } = req.params;

    // Check if category has questions
    const questionCount = await InterviewQuestion.countDocuments({
      category: {
        $in: await InterviewQuestionCategory.findById(id).then((cat) =>
          cat ? [cat.slug] : []
        ),
      },
    });

    if (questionCount > 0) {
      return res.status(400).json({
        success: false,
        message: `Cannot delete category. It has ${questionCount} question(s). Please move or delete the questions first.`,
      });
    }

    const category = await InterviewQuestionCategory.findByIdAndDelete(id);

    if (!category) {
      return res.status(404).json({
        success: false,
        message: "Category not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Category deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting category:", error);
    res.status(500).json({
      success: false,
      message: "Error deleting category",
      error: error.message,
    });
  }
};

// Toggle category status (admin)
const toggleCategoryStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const category = await InterviewQuestionCategory.findById(id);

    if (!category) {
      return res.status(404).json({
        success: false,
        message: "Category not found",
      });
    }

    category.isActive = !category.isActive;
    await category.save();

    res.status(200).json({
      success: true,
      message: `Category ${
        category.isActive ? "activated" : "deactivated"
      } successfully`,
      data: category,
    });
  } catch (error) {
    console.error("Error toggling category status:", error);
    res.status(500).json({
      success: false,
      message: "Error toggling category status",
      error: error.message,
    });
  }
};

export {
  getAllCategories,
  getCategoriesWithCounts,
  getAllCategoriesAdmin,
  createCategory,
  getCategoryById,
  updateCategory,
  deleteCategory,
  toggleCategoryStatus,
};
