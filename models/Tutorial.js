import mongoose from "mongoose";

const ContentBlockSchema = new mongoose.Schema({
  subheading: String,
  content: String,
  mediaUrl: String,
  compiler: {
    enabled: { type: Boolean, default: false },
    language: { type: String, default: "java" },
    boilerplate: { type: String, default: "" },
    editable: { type: Boolean, default: true },
  },
  syntaxEnabled: { type: Boolean, default: false },
  syntax: { type: String, default: "" },
});

const SectionSchema = new mongoose.Schema({
  heading: String,
  contentBlocks: [ContentBlockSchema],
  mediaUrl: String,
  youtubeUrl: String,
  compiler: {
    enabled: { type: Boolean, default: false },
    language: { type: String, default: "java" },
    boilerplate: { type: String, default: "" },
  },
});

const TutorialSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    slug: { type: String, required: true, unique: true },
    category: { type: mongoose.Schema.Types.ObjectId, ref: "Category" },
    sections: [SectionSchema],
  },
  { timestamps: true }
);

const Tutorial = mongoose.model("Tutorial", TutorialSchema);
export default Tutorial;
