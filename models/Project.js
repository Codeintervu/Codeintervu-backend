import mongoose from "mongoose";

const projectSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Project name is required"],
      trim: true,
      maxlength: [100, "Project name cannot exceed 100 characters"],
    },
    key: {
      type: String,
      required: [true, "Project key is required"],
      unique: true,
      trim: true,
      lowercase: true,
      match: [
        /^[a-z0-9-]+$/,
        "Project key can only contain lowercase letters, numbers, and hyphens",
      ],
    },
    description: {
      type: String,
      required: [true, "Project description is required"],
      trim: true,
      maxlength: [1000, "Description cannot exceed 1000 characters"],
    },
    realPrice: {
      type: Number,
      default: 0,
      min: [0, "Real price cannot be negative"],
    },
    offerPrice: {
      type: Number,
      required: [true, "Offer price is required"],
      min: [0, "Offer price cannot be negative"],
    },
    image: {
      type: String,
      required: false,
    },
    topmateLink: {
      type: String,
      trim: true,
      validate: {
        validator: function (v) {
          if (!v) return true; // Allow empty
          return /^https:\/\/topmate\.io\/.+/.test(v);
        },
        message: "Topmate link must be a valid topmate.io URL",
      },
    },
    features: [
      {
        type: String,
        trim: true,
        maxlength: [200, "Feature cannot exceed 200 characters"],
      },
    ],
    techStack: {
      frontend: {
        type: String,
        trim: true,
        maxlength: [200, "Frontend tech stack cannot exceed 200 characters"],
      },
      backend: {
        type: String,
        trim: true,
        maxlength: [200, "Backend tech stack cannot exceed 200 characters"],
      },
      database: {
        type: String,
        trim: true,
        maxlength: [200, "Database tech stack cannot exceed 200 characters"],
      },
      others: {
        type: String,
        trim: true,
        maxlength: [200, "Other technologies cannot exceed 200 characters"],
      },
    },
    screenshots: [
      {
        type: String,
        trim: true,
      },
    ],
    demoVideo: {
      type: String,
      trim: true,
      validate: {
        validator: function (v) {
          if (!v) return true; // Allow empty
          return /^https:\/\/(www\.)?(youtube\.com|youtu\.be)\/.+/.test(v);
        },
        message: "Demo video must be a valid YouTube URL",
      },
    },
    authentication: [
      {
        type: String,
        trim: true,
        maxlength: [200, "Authentication feature cannot exceed 200 characters"],
      },
    ],
    adminFeatures: [
      {
        type: String,
        trim: true,
        maxlength: [200, "Admin feature cannot exceed 200 characters"],
      },
    ],
    deployment: {
      frontend: {
        type: String,
        trim: true,
        maxlength: [100, "Frontend deployment cannot exceed 100 characters"],
      },
      backend: {
        type: String,
        trim: true,
        maxlength: [100, "Backend deployment cannot exceed 100 characters"],
      },
      database: {
        type: String,
        trim: true,
        maxlength: [100, "Database deployment cannot exceed 100 characters"],
      },
      frontendLink: {
        type: String,
        trim: true,
        validate: {
          validator: function (v) {
            if (!v) return true; // Allow empty
            return /^https?:\/\/.+/.test(v);
          },
          message: "Frontend link must be a valid URL",
        },
      },
      backendLink: {
        type: String,
        trim: true,
        validate: {
          validator: function (v) {
            if (!v) return true; // Allow empty
            return /^https?:\/\/.+/.test(v);
          },
          message: "Backend link must be a valid URL",
        },
      },
    },
    usp: {
      type: String,
      trim: true,
      maxlength: [500, "USP cannot exceed 500 characters"],
    },
    testingSecurity: [
      {
        type: String,
        trim: true,
        maxlength: [
          200,
          "Testing/Security feature cannot exceed 200 characters",
        ],
      },
    ],
    scalability: [
      {
        type: String,
        trim: true,
        maxlength: [200, "Scalability feature cannot exceed 200 characters"],
      },
    ],
    users: [
      {
        type: String,
        trim: true,
        maxlength: [100, "Target user cannot exceed 100 characters"],
      },
    ],
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

// Index for better query performance
projectSchema.index({ key: 1 });
projectSchema.index({ isActive: 1 });
projectSchema.index({ order: 1 });
projectSchema.index({ createdAt: -1 });

// Pre-save middleware to ensure unique key
projectSchema.pre("save", async function (next) {
  if (this.isModified("key")) {
    const existingProject = await this.constructor.findOne({
      key: this.key,
      _id: { $ne: this._id },
    });
    if (existingProject) {
      throw new Error("Project key already exists");
    }
  }
  next();
});

// Virtual for discount percentage
projectSchema.virtual("discountPercentage").get(function () {
  if (this.realPrice > 0 && this.offerPrice < this.realPrice) {
    return Math.round(
      ((this.realPrice - this.offerPrice) / this.realPrice) * 100
    );
  }
  return 0;
});

// Ensure virtual fields are serialized
projectSchema.set("toJSON", { virtuals: true });
projectSchema.set("toObject", { virtuals: true });

export default mongoose.model("Project", projectSchema);
