import mongoose from "mongoose";

const QuizQuestionSchema = new mongoose.Schema({
  category: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "QuizCategory",
    required: true,
  },
  question: { type: String, required: true },
  options: [{ type: String, required: true }],
  correctOption: { type: Number, required: true }, // index of the correct option
  hint: { type: String }, // optional hint for the question
});

const QuizQuestion = mongoose.model("QuizQuestion", QuizQuestionSchema);
export default QuizQuestion;
