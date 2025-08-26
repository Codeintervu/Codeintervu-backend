import mongoose from "mongoose";

const interviewQuestionSchema = new mongoose.Schema(
  {
    category: {
      type: String,
      required: [true, "Category is required"],
      lowercase: true,
      trim: true,
    },
    question: {
      type: String,
      required: [true, "Question is required"],
      trim: true,
      maxlength: [1000, "Question cannot exceed 1000 characters"],
    },
    answer: {
      type: String,
      required: [true, "Answer is required"],
      trim: true,
      maxlength: [2000, "Answer cannot exceed 2000 characters"],
    },
    difficulty: {
      type: String,
      required: [true, "Difficulty is required"],
      enum: {
        values: ["Easy", "Medium", "Hard"],
        message: "Difficulty must be one of: Easy, Medium, Hard",
      },
    },
    tags: [
      {
        type: String,
        trim: true,
        maxlength: [50, "Tag cannot exceed 50 characters"],
      },
    ],
    company: {
      type: String,
      trim: true,
      maxlength: [100, "Company name cannot exceed 100 characters"],
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
  },
  {
    timestamps: true,
  }
);

// Indexes for better query performance
interviewQuestionSchema.index({ category: 1, isActive: 1 });
interviewQuestionSchema.index({ difficulty: 1, isActive: 1 });
interviewQuestionSchema.index({ tags: 1 });
interviewQuestionSchema.index({ company: 1 });
interviewQuestionSchema.index({ question: "text", answer: "text" });

// Virtual for formatted category name - will be populated from the category model
interviewQuestionSchema.virtual("categoryName").get(function () {
  // This will be populated when we join with the category model
  // For now, return a formatted version of the slug
  if (!this.category) return "";

  return this.category
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
});

// Ensure virtuals are included in JSON output
interviewQuestionSchema.set("toJSON", { virtuals: true });
interviewQuestionSchema.set("toObject", { virtuals: true });

const InterviewQuestion = mongoose.model(
  "InterviewQuestion",
  interviewQuestionSchema
);

export default InterviewQuestion;
