import express from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";

const router = express.Router();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Import controllers
import {
  getAllProjects,
  getActiveProjects,
  getProjectById,
  getProjectByKey,
  createProject,
  updateProject,
  deleteProject,
  toggleProjectStatus,
  updateProjectOrder,
  uploadProjectImage,
  getProjectStats,
} from "../controllers/project.js";

// Import middleware
import { adminAuth } from "../middleware/auth.js";

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = "uploads/projects";
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(
      null,
      file.fieldname + "-" + uniqueSuffix + path.extname(file.originalname)
    );
  },
});

const fileFilter = (req, file, cb) => {
  // Accept images only
  if (file.mimetype.startsWith("image/")) {
    cb(null, true);
  } else {
    cb(new Error("Only image files are allowed!"), false);
  }
};

const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
});

// Clean up uploaded files after request
const cleanupUploads = (req, res, next) => {
  res.on("finish", () => {
    if (req.file && req.file.path) {
      fs.unlink(req.file.path, (err) => {
        if (err) console.error("Error deleting uploaded file:", err);
      });
    }
  });
  next();
};

// ==================== ADMIN ROUTES (Protected) ====================

// Get all projects (admin) - with search, filter, sort
router.get("/admin", adminAuth, getAllProjects);

// Get project statistics (admin)
router.get("/admin/stats", adminAuth, getProjectStats);

// Create new project (admin)
router.post(
  "/admin",
  adminAuth,
  upload.single("image"),
  cleanupUploads,
  createProject
);

// Get single project by ID (admin)
router.get("/admin/:id", adminAuth, getProjectById);

// Update project (admin)
router.put(
  "/admin/:id",
  adminAuth,
  upload.single("image"),
  cleanupUploads,
  updateProject
);

// Delete project (admin)
router.delete("/admin/:id", adminAuth, deleteProject);

// Toggle project status (admin)
router.patch("/admin/:id/toggle-status", adminAuth, toggleProjectStatus);

// Update project order (admin)
router.patch("/admin/:id/order", adminAuth, updateProjectOrder);

// Upload project image (admin)
router.post(
  "/admin/upload-image",
  adminAuth,
  upload.single("image"),
  cleanupUploads,
  uploadProjectImage
);

// ==================== FRONTEND ROUTES (Public) ====================

// Get all active projects (frontend)
router.get("/", getActiveProjects);

// Get project by key (frontend)
router.get("/key/:key", getProjectByKey);

// Get single project by ID (frontend - for direct access)
router.get("/:id", getProjectById);

export default router;
