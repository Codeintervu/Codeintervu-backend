import mongoose from "mongoose";

const UserSchema = new mongoose.Schema(
  {
    fullName: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    phoneNumber: {
      type: String,
      required: false,
      trim: true,
      default: "",
    },
    password: {
      type: String,
      required: true,
    },
    // Profile Management Fields
    bio: {
      type: String,
      trim: true,
      maxlength: 500,
      default: "",
    },
    profilePicture: {
      type: String,
      default: "",
    },
    socialLinks: {
      github: {
        type: String,
        trim: true,
        default: "",
      },
      linkedin: {
        type: String,
        trim: true,
        default: "",
      },
      instagram: {
        type: String,
        trim: true,
        default: "",
      },
      twitter: {
        type: String,
        trim: true,
        default: "",
      },
      portfolio: {
        type: String,
        trim: true,
        default: "",
      },
      website: {
        type: String,
        trim: true,
        default: "",
      },
    },
    learningPreferences: {
      preferredLanguages: [
        {
          type: String,
          enum: [
            "JavaScript",
            "Python",
            "Java",
            "C++",
            "C#",
            "PHP",
            "Ruby",
            "Go",
            "Rust",
            "Swift",
            "Kotlin",
            "TypeScript",
            "React",
            "Vue",
            "Angular",
            "Node.js",
            "Django",
            "Flask",
            "Spring",
            "Laravel",
            "Express",
            "Other",
          ],
          default: [],
        },
      ],
      difficultyLevel: {
        type: String,
        enum: ["Beginner", "Intermediate", "Advanced", "Expert"],
        default: "Beginner",
      },
      learningGoals: {
        type: String,
        enum: [
          "Career Change",
          "Skill Enhancement",
          "Personal Interest",
          "Academic",
          "Freelancing",
          "Other",
        ],
        default: "Skill Enhancement",
      },
    },
    privacySettings: {
      profileVisibility: {
        type: String,
        enum: ["Public", "Private", "Friends Only"],
        default: "Public",
      },
      showEmail: {
        type: Boolean,
        default: false,
      },
      showPhone: {
        type: Boolean,
        default: false,
      },
      allowMessages: {
        type: Boolean,
        default: true,
      },
    },
    enrolledCourses: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Course",
      },
    ],
    wishlist: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Course",
      },
    ],
    progress: {
      type: Map,
      of: {
        completedLessons: [String],
        currentLesson: String,
        lastAccessed: Date,
      },
      default: {},
    },
    // Quiz results history
    quizResults: [
      {
        quizId: { type: String, required: true },
        quizName: { type: String, default: "" },
        sectionIndex: { type: Number, default: null },
        score: { type: Number, default: 0 },
        totalQuestions: { type: Number, default: 0 },
        correctAnswers: { type: Number, default: 0 },
        timeSpent: { type: Number, default: 0 },
        accuracy: { type: Number, default: 0 },
        completedAt: { type: Date, default: Date.now },
      },
    ],
    // Quiz bookmarks
    quizBookmarks: [
      {
        questionId: { type: String, required: true },
        quizId: { type: String, required: true },
        quizName: { type: String, default: "" },
        question: { type: String, default: "" },
        note: { type: String, default: "" },
        createdAt: { type: Date, default: Date.now },
      },
    ],
    // Resume state per quiz
    resumeProgress: {
      type: Map,
      of: {
        currentSection: { type: Number, default: 0 },
        currentQuestion: { type: Number, default: 0 },
        timeSpent: { type: Number, default: 0 },
        updatedAt: { type: Date, default: Date.now },
      },
      default: {},
    },
    termsAccepted: {
      type: Boolean,
      required: true,
      default: false,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

const User = mongoose.model("User", UserSchema);
export default User;
