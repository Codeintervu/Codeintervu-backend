import Category from "../models/Category.js";
import { cloudinary } from "../config/cloudinary.js";
import fs from "fs";

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

// @desc    Upload ad image for a category
// @route   POST /api/categories/:categoryId/ad
// @access  Private/Admin
export const uploadAdImage = async (req, res) => {
  try {
    const { categoryId } = req.params;

    if (!req.file) {
      return res.status(400).json({ message: "No image file provided" });
    }

    const category = await Category.findById(categoryId);
    if (!category) {
      return res.status(404).json({ message: "Category not found" });
    }

    // Upload to Cloudinary
    const result = await cloudinary.uploader.upload(req.file.path, {
      folder: "category-ads",
      transformation: [{ width: 300, height: 600, crop: "fill" }],
    });

    // Update category with ad image URL
    category.adImageUrl = result.secure_url;
    await category.save();

    // Clean up temporary file
    fs.unlinkSync(req.file.path);

    res.json({
      message: "Ad image uploaded successfully",
      adImageUrl: result.secure_url,
    });
  } catch (error) {
    console.error("Error uploading ad image:", error);
    res.status(500).json({ message: "Server Error" });
  }
};

// @desc    Get ad image for a category
// @route   GET /api/categories/:categoryId/ad
// @access  Public
export const getAdImage = async (req, res) => {
  try {
    const { categoryId } = req.params;

    const category = await Category.findById(categoryId);
    if (!category) {
      return res.status(404).json({ message: "Category not found" });
    }

    if (!category.adImageUrl) {
      return res
        .status(404)
        .json({ message: "No ad image found for this category" });
    }

    res.json({ adImageUrl: category.adImageUrl });
  } catch (error) {
    console.error("Error getting ad image:", error);
    res.status(500).json({ message: "Server Error" });
  }
};

// @desc    Remove ad image for a category
// @route   DELETE /api/categories/:categoryId/ad
// @access  Private/Admin
export const removeAdImage = async (req, res) => {
  try {
    const { categoryId } = req.params;

    const category = await Category.findById(categoryId);
    if (!category) {
      return res.status(404).json({ message: "Category not found" });
    }

    if (category.adImageUrl) {
      // Extract public_id from Cloudinary URL for deletion
      const urlParts = category.adImageUrl.split("/");
      const publicId = urlParts[urlParts.length - 1].split(".")[0];

      // Delete from Cloudinary
      await cloudinary.uploader.destroy(`category-ads/${publicId}`);
    }

    // Remove ad image URL from category
    category.adImageUrl = undefined;
    await category.save();

    res.json({ message: "Ad image removed successfully" });
  } catch (error) {
    console.error("Error removing ad image:", error);
    res.status(500).json({ message: "Server Error" });
  }
};

// @desc    Upload top banner ad image for a category
// @route   POST /api/categories/:categoryId/top-banner-ad
// @access  Private/Admin
export const uploadTopBannerAdImage = async (req, res) => {
  try {
    const { categoryId } = req.params;

    if (!req.file) {
      return res.status(400).json({ message: "No image file provided" });
    }

    const category = await Category.findById(categoryId);
    if (!category) {
      return res.status(404).json({ message: "Category not found" });
    }

    // Upload to Cloudinary
    const result = await cloudinary.uploader.upload(req.file.path, {
      folder: "category-top-banner-ads",
      transformation: [{ width: 1200, height: 120, crop: "fill" }],
    });

    // Update category with top banner ad image URL
    category.topBannerAdImageUrl = result.secure_url;
    await category.save();

    // Clean up temporary file
    fs.unlinkSync(req.file.path);

    res.json({
      message: "Top banner ad image uploaded successfully",
      adImageUrl: result.secure_url,
    });
  } catch (error) {
    console.error("Error uploading top banner ad image:", error);
    res.status(500).json({ message: "Server Error" });
  }
};

// @desc    Get top banner ad image for a category
// @route   GET /api/categories/:categoryId/top-banner-ad
// @access  Public
export const getTopBannerAdImage = async (req, res) => {
  try {
    const { categoryId } = req.params;

    const category = await Category.findById(categoryId);
    if (!category) {
      return res.status(404).json({ message: "Category not found" });
    }

    if (!category.topBannerAdImageUrl) {
      return res
        .status(404)
        .json({ message: "No top banner ad image found for this category" });
    }

    res.json({ adImageUrl: category.topBannerAdImageUrl });
  } catch (error) {
    console.error("Error getting top banner ad image:", error);
    res.status(500).json({ message: "Server Error" });
  }
};

// @desc    Remove top banner ad image for a category
// @route   DELETE /api/categories/:categoryId/top-banner-ad
// @access  Private/Admin
export const removeTopBannerAdImage = async (req, res) => {
  try {
    const { categoryId } = req.params;

    const category = await Category.findById(categoryId);
    if (!category) {
      return res.status(404).json({ message: "Category not found" });
    }

    if (category.topBannerAdImageUrl) {
      // Extract public_id from Cloudinary URL for deletion
      const urlParts = category.topBannerAdImageUrl.split("/");
      const publicId = urlParts[urlParts.length - 1].split(".")[0];

      // Delete from Cloudinary
      await cloudinary.uploader.destroy(`category-top-banner-ads/${publicId}`);
    }

    // Remove top banner ad image URL from category
    category.topBannerAdImageUrl = undefined;
    await category.save();

    res.json({ message: "Top banner ad image removed successfully" });
  } catch (error) {
    console.error("Error removing top banner ad image:", error);
    res.status(500).json({ message: "Server Error" });
  }
};
