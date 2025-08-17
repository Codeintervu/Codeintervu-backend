import mongoose from "mongoose";

const interviewQuestionCategorySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Category name is required"],
      trim: true,
      maxlength: [50, "Category name cannot exceed 50 characters"],
      unique: true,
    },
    slug: {
      type: String,
      required: [true, "Category slug is required"],
      trim: true,
      lowercase: true,
      unique: true,
      match: [
        /^[a-z0-9-]+$/,
        "Slug can only contain lowercase letters, numbers, and hyphens",
      ],
    },
    description: {
      type: String,
      trim: true,
      maxlength: [200, "Description cannot exceed 200 characters"],
    },
    color: {
      type: String,
      trim: true,
      default: "#10B981", // Default teal color
      match: [/^#[0-9A-Fa-f]{6}$/, "Color must be a valid hex color"],
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    order: {
      type: Number,
      default: 0,
      min: [0, "Order cannot be negative"],
    },
    questionCount: {
      type: Number,
      default: 0,
      min: [0, "Question count cannot be negative"],
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for better query performance
// Note: unique: true on name and slug fields automatically creates indexes
interviewQuestionCategorySchema.index({ order: 1, isActive: 1 });
interviewQuestionCategorySchema.index({ name: "text", description: "text" });

// Virtual for formatted display name
interviewQuestionCategorySchema.virtual("displayName").get(function () {
  return this.name;
});

// Ensure virtuals are included in JSON output
interviewQuestionCategorySchema.set("toJSON", { virtuals: true });
interviewQuestionCategorySchema.set("toObject", { virtuals: true });

const InterviewQuestionCategory = mongoose.model(
  "InterviewQuestionCategory",
  interviewQuestionCategorySchema
);

export default InterviewQuestionCategory;
