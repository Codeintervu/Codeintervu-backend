import mongoose from "mongoose";

const CategorySchema = new mongoose.Schema(
  {
    name: { type: String, required: true, unique: true },
    path: { type: String, required: true, unique: true },
    description: { type: String },
    order: { type: Number, default: 0 }, // Add order field for custom arrangement
    adImageUrl: { type: String }, // Add ad image URL field
    topBannerAdImageUrl: { type: String }, // Add top banner ad image URL field
  },
  { timestamps: true }
);

const Category = mongoose.model("Category", CategorySchema);
export default Category;
