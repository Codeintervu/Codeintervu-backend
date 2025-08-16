import Project from "../models/Project.js";
import { uploadToCloudinary } from "../config/cloudinary.js";

// Get all projects (admin)
const getAllProjects = async (req, res) => {
  try {
    const { search, filter, sort = "createdAt", order = "desc" } = req.query;
    
    let query = {};
    
    // Search functionality
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: "i" } },
        { description: { $regex: search, $options: "i" } },
        { key: { $regex: search, $options: "i" } }
      ];
    }
    
    // Filter functionality
    if (filter && filter !== "all") {
      query.key = { $regex: filter, $options: "i" };
    }
    
    // Sorting
    const sortOptions = {};
    sortOptions[sort] = order === "desc" ? -1 : 1;
    
    const projects = await Project.find(query)
      .sort(sortOptions)
      .select("-__v");
    
    res.status(200).json({
      success: true,
      count: projects.length,
      data: projects,
    });
  } catch (error) {
    console.error("Error fetching projects:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching projects",
      error: error.message,
    });
  }
};

// Get all active projects (frontend)
const getActiveProjects = async (req, res) => {
  try {
    const projects = await Project.find({ isActive: true })
      .sort({ order: 1, createdAt: -1 })
      .select("-__v");
    
    res.status(200).json({
      success: true,
      count: projects.length,
      data: projects,
    });
  } catch (error) {
    console.error("Error fetching active projects:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching active projects",
      error: error.message,
    });
  }
};

// Get single project by ID
const getProjectById = async (req, res) => {
  try {
    const project = await Project.findById(req.params.id).select("-__v");
    
    if (!project) {
      return res.status(404).json({
        success: false,
        message: "Project not found",
      });
    }
    
    res.status(200).json({
      success: true,
      data: project,
    });
  } catch (error) {
    console.error("Error fetching project:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching project",
      error: error.message,
    });
  }
};

// Get project by key (frontend)
const getProjectByKey = async (req, res) => {
  try {
    const project = await Project.findOne({ 
      key: req.params.key, 
      isActive: true 
    }).select("-__v");
    
    if (!project) {
      return res.status(404).json({
        success: false,
        message: "Project not found",
      });
    }
    
    res.status(200).json({
      success: true,
      data: project,
    });
  } catch (error) {
    console.error("Error fetching project by key:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching project",
      error: error.message,
    });
  }
};

// Create new project
const createProject = async (req, res) => {
  try {
    const projectData = req.body;
    
    // Handle image upload if provided
    if (req.file) {
      const result = await uploadToCloudinary(req.file.path, "projects");
      projectData.image = result.secure_url;
    }
    
    // Create project
    const project = await Project.create(projectData);
    
    res.status(201).json({
      success: true,
      message: "Project created successfully",
      data: project,
    });
  } catch (error) {
    console.error("Error creating project:", error);
    
    // Handle validation errors
    if (error.name === "ValidationError") {
      const errors = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        success: false,
        message: "Validation error",
        errors,
      });
    }
    
    // Handle duplicate key error
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: "Project key already exists",
      });
    }
    
    res.status(500).json({
      success: false,
      message: "Error creating project",
      error: error.message,
    });
  }
};

// Update project
const updateProject = async (req, res) => {
  try {
    const projectData = req.body;
    
    // Handle image upload if provided
    if (req.file) {
      const result = await uploadToCloudinary(req.file.path, "projects");
      projectData.image = result.secure_url;
    }
    
    const project = await Project.findByIdAndUpdate(
      req.params.id,
      projectData,
      {
        new: true,
        runValidators: true,
      }
    ).select("-__v");
    
    if (!project) {
      return res.status(404).json({
        success: false,
        message: "Project not found",
      });
    }
    
    res.status(200).json({
      success: true,
      message: "Project updated successfully",
      data: project,
    });
  } catch (error) {
    console.error("Error updating project:", error);
    
    // Handle validation errors
    if (error.name === "ValidationError") {
      const errors = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        success: false,
        message: "Validation error",
        errors,
      });
    }
    
    // Handle duplicate key error
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: "Project key already exists",
      });
    }
    
    res.status(500).json({
      success: false,
      message: "Error updating project",
      error: error.message,
    });
  }
};

// Delete project
const deleteProject = async (req, res) => {
  try {
    const project = await Project.findByIdAndDelete(req.params.id);
    
    if (!project) {
      return res.status(404).json({
        success: false,
        message: "Project not found",
      });
    }
    
    res.status(200).json({
      success: true,
      message: "Project deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting project:", error);
    res.status(500).json({
      success: false,
      message: "Error deleting project",
      error: error.message,
    });
  }
};

// Toggle project status
const toggleProjectStatus = async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    
    if (!project) {
      return res.status(404).json({
        success: false,
        message: "Project not found",
      });
    }
    
    project.isActive = !project.isActive;
    await project.save();
    
    res.status(200).json({
      success: true,
      message: `Project ${project.isActive ? "activated" : "deactivated"} successfully`,
      data: {
        _id: project._id,
        isActive: project.isActive,
      },
    });
  } catch (error) {
    console.error("Error toggling project status:", error);
    res.status(500).json({
      success: false,
      message: "Error toggling project status",
      error: error.message,
    });
  }
};

// Update project order
const updateProjectOrder = async (req, res) => {
  try {
    const { order } = req.body;
    
    if (typeof order !== "number" || order < 0) {
      return res.status(400).json({
        success: false,
        message: "Order must be a non-negative number",
      });
    }
    
    const project = await Project.findByIdAndUpdate(
      req.params.id,
      { order },
      { new: true, runValidators: true }
    ).select("-__v");
    
    if (!project) {
      return res.status(404).json({
        success: false,
        message: "Project not found",
      });
    }
    
    res.status(200).json({
      success: true,
      message: "Project order updated successfully",
      data: {
        _id: project._id,
        order: project.order,
      },
    });
  } catch (error) {
    console.error("Error updating project order:", error);
    res.status(500).json({
      success: false,
      message: "Error updating project order",
      error: error.message,
    });
  }
};

// Upload project image
const uploadProjectImage = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "No image file provided",
      });
    }
    
    const result = await uploadToCloudinary(req.file.path, "projects");
    
    res.status(200).json({
      success: true,
      message: "Image uploaded successfully",
      data: {
        url: result.secure_url,
        public_id: result.public_id,
      },
    });
  } catch (error) {
    console.error("Error uploading image:", error);
    res.status(500).json({
      success: false,
      message: "Error uploading image",
      error: error.message,
    });
  }
};

// Get project statistics
const getProjectStats = async (req, res) => {
  try {
    const totalProjects = await Project.countDocuments();
    const activeProjects = await Project.countDocuments({ isActive: true });
    const projectsWithTopmate = await Project.countDocuments({ 
      topmateLink: { $exists: true, $ne: "" } 
    });
    const projectsWithoutTopmate = await Project.countDocuments({ 
      $or: [
        { topmateLink: { $exists: false } },
        { topmateLink: "" }
      ]
    });
    
    res.status(200).json({
      success: true,
      data: {
        total: totalProjects,
        active: activeProjects,
        withTopmate: projectsWithTopmate,
        withoutTopmate: projectsWithoutTopmate,
      },
    });
  } catch (error) {
    console.error("Error fetching project stats:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching project statistics",
      error: error.message,
    });
  }
};

export {
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
};
