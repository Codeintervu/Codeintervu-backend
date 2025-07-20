import Category from "../models/Category.js";

// @desc    Fetch all categories
// @route   GET /api/categories
// @access  Public
export const getCategories = async (req, res) => {
  try {
    const categories = await Category.find().sort({ order: 1, name: 1 }); // Sort by order first, then by name
    res.json(categories);
  } catch (error) {
    res.status(500).json({ message: "Server Error" });
  }
};

// @desc    Fetch a single category by its path
// @route   GET /api/categories/path/:path
// @access  Public
export const getCategoryByPath = async (req, res) => {
  try {
    const category = await Category.findOne({ path: req.params.path });
    if (category) {
      res.json(category);
    } else {
      res.status(404).json({ message: "Category not found" });
    }
  } catch (error) {
    console.error("Error fetching category by path:", error);
    res.status(500).json({ message: "Server Error" });
  }
};

// @desc    Add a new category
// @route   POST /api/categories
// @access  Private/Admin
export const addCategory = async (req, res) => {
  const { name, path, description } = req.body;

  try {
    const category = new Category({ name, path, description });
    await category.save();
    res.status(201).json(category);
  } catch (error) {
    if (error.code === 11000) {
      return res
        .status(400)
        .json({ message: "Category with this name or path already exists." });
    }
    res.status(500).json({ message: "Server Error" });
  }
};

// @desc    Delete a category
// @route   DELETE /api/categories/:id
// @access  Private/Admin
export const deleteCategory = async (req, res) => {
  try {
    const category = await Category.findById(req.params.categoryId);

    if (category) {
      await category.deleteOne();
      res.json({ message: "Category removed" });
    } else {
      res.status(404).json({ message: "Category not found" });
    }
  } catch (error) {
    res.status(500).json({ message: "Server Error" });
  }
};

// @desc    Update category order
// @route   PUT /api/categories/order
// @access  Private/Admin
export const updateCategoryOrder = async (req, res) => {
  try {
    const { categoryOrders } = req.body; // Array of { categoryId, order }

    // Update each category's order
    for (const item of categoryOrders) {
      await Category.findByIdAndUpdate(item.categoryId, { order: item.order });
    }

    res.json({ message: "Category order updated successfully" });
  } catch (error) {
    console.error("Error updating category order:", error);
    res.status(500).json({ message: "Server Error" });
  }
};
