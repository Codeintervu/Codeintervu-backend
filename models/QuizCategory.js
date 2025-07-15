import mongoose from "mongoose";

// Slugify helper function
function slugify(text) {
  return text
    .toString()
    .toLowerCase()
    .replace(/\s+/g, "-") // Replace spaces with -
    .replace(/[^a-z0-9-]/g, "") // Remove all non-alphanumeric except -
    .replace(/--+/g, "-") // Replace multiple - with single -
    .replace(/^-+/, "") // Trim - from start
    .replace(/-+$/, ""); // Trim - from end
}

const QuizCategorySchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true },
  slug: { type: String, required: true, unique: true }, // <-- Add this line
  description: { type: String },
});

// Pre-validate hook to generate slug from name
QuizCategorySchema.pre("validate", function (next) {
  if (this.name) {
    this.slug = slugify(this.name);
  }
  next();
});

const QuizCategory = mongoose.model("QuizCategory", QuizCategorySchema);
export default QuizCategory;
