import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import User from "../models/User.js";

// @desc    Register a new user
// @route   POST /api/auth/register
// @access  Public
export const registerUser = async (req, res) => {
  const {
    fullName,
    email,
    phoneNumber,
    password,
    confirmPassword,
    termsAccepted,
  } = req.body;

  try {
    // Validation
    if (!fullName || !email || !password || !confirmPassword) {
      return res.status(400).json({ message: "All fields are required" });
    }

    if (password !== confirmPassword) {
      return res.status(400).json({ message: "Passwords do not match" });
    }

    if (password.length < 6) {
      return res
        .status(400)
        .json({ message: "Password must be at least 6 characters long" });
    }

    if (!termsAccepted) {
      return res
        .status(400)
        .json({ message: "You must accept the terms and conditions" });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res
        .status(400)
        .json({ message: "User with this email already exists" });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create new user
    const user = new User({
      fullName,
      email,
      phoneNumber: phoneNumber || "", // Make phone number optional
      password: hashedPassword,
      termsAccepted,
    });

    await user.save();

    // Generate JWT token
    const token = jwt.sign(
      { id: user._id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    // Return user data (without password)
    const userResponse = {
      id: user._id,
      fullName: user.fullName,
      email: user.email,
      phoneNumber: user.phoneNumber,
      enrolledCourses: user.enrolledCourses,
      wishlist: user.wishlist,
      createdAt: user.createdAt,
    };

    res.status(201).json({
      message: "User registered successfully",
      token,
      user: userResponse,
    });
  } catch (error) {
    console.error("Registration error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
export const loginUser = async (req, res) => {
  const { email, password } = req.body;

  try {
    // Validation
    if (!email || !password) {
      return res
        .status(400)
        .json({ message: "Email and password are required" });
    }

    // Find user by email
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    // Check if user is active
    if (!user.isActive) {
      return res.status(400).json({ message: "Account is deactivated" });
    }

    // Check password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    // Generate JWT token
    const token = jwt.sign(
      { id: user._id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    // Return user data (without password)
    const userResponse = {
      id: user._id,
      fullName: user.fullName,
      email: user.email,
      phoneNumber: user.phoneNumber,
      enrolledCourses: user.enrolledCourses,
      wishlist: user.wishlist,
      createdAt: user.createdAt,
    };

    res.json({
      message: "Login successful",
      token,
      user: userResponse,
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// @desc    Get user profile
// @route   GET /api/auth/profile
// @access  Private
export const getUserProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("-password");
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json(user);
  } catch (error) {
    console.error("Get profile error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// @desc    Update user profile
// @route   PUT /api/auth/profile
// @access  Private
export const updateUserProfile = async (req, res) => {
  const {
    fullName,
    phoneNumber,
    bio,
    profilePicture,
    socialLinks,
    learningPreferences,
    privacySettings,
  } = req.body;

  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Update basic fields
    if (fullName) user.fullName = fullName;
    if (phoneNumber) user.phoneNumber = phoneNumber;
    if (bio !== undefined) user.bio = bio;
    if (profilePicture !== undefined) user.profilePicture = profilePicture;

    // Update social links
    if (socialLinks) {
      if (socialLinks.github !== undefined)
        user.socialLinks.github = socialLinks.github;
      if (socialLinks.linkedin !== undefined)
        user.socialLinks.linkedin = socialLinks.linkedin;
      if (socialLinks.instagram !== undefined)
        user.socialLinks.instagram = socialLinks.instagram;
      if (socialLinks.twitter !== undefined)
        user.socialLinks.twitter = socialLinks.twitter;
      if (socialLinks.portfolio !== undefined)
        user.socialLinks.portfolio = socialLinks.portfolio;
      if (socialLinks.website !== undefined)
        user.socialLinks.website = socialLinks.website;
    }

    // Update learning preferences
    if (learningPreferences) {
      if (learningPreferences.preferredLanguages !== undefined) {
        user.learningPreferences.preferredLanguages =
          learningPreferences.preferredLanguages;
      }
      if (learningPreferences.difficultyLevel !== undefined) {
        user.learningPreferences.difficultyLevel =
          learningPreferences.difficultyLevel;
      }
      if (learningPreferences.learningGoals !== undefined) {
        user.learningPreferences.learningGoals =
          learningPreferences.learningGoals;
      }
    }

    // Update privacy settings
    if (privacySettings) {
      if (privacySettings.profileVisibility !== undefined) {
        user.privacySettings.profileVisibility =
          privacySettings.profileVisibility;
      }
      if (privacySettings.showEmail !== undefined) {
        user.privacySettings.showEmail = privacySettings.showEmail;
      }
      if (privacySettings.showPhone !== undefined) {
        user.privacySettings.showPhone = privacySettings.showPhone;
      }
      if (privacySettings.allowMessages !== undefined) {
        user.privacySettings.allowMessages = privacySettings.allowMessages;
      }
    }

    await user.save();

    // Return updated user (without password)
    const userResponse = {
      id: user._id,
      fullName: user.fullName,
      email: user.email,
      phoneNumber: user.phoneNumber,
      bio: user.bio,
      profilePicture: user.profilePicture,
      socialLinks: user.socialLinks,
      learningPreferences: user.learningPreferences,
      privacySettings: user.privacySettings,
      enrolledCourses: user.enrolledCourses,
      wishlist: user.wishlist,
      createdAt: user.createdAt,
    };

    res.json({
      message: "Profile updated successfully",
      user: userResponse,
    });
  } catch (error) {
    console.error("Update profile error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// @desc    Change user password
// @route   PUT /api/auth/change-password
// @access  Private
export const changePassword = async (req, res) => {
  const { currentPassword, newPassword } = req.body;

  try {
    // Validation
    if (!currentPassword || !newPassword) {
      return res
        .status(400)
        .json({ message: "Current password and new password are required" });
    }

    if (newPassword.length < 6) {
      return res
        .status(400)
        .json({ message: "New password must be at least 6 characters long" });
    }

    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Verify current password
    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Current password is incorrect" });
    }

    // Hash new password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    // Update password
    user.password = hashedPassword;
    await user.save();

    res.json({ message: "Password changed successfully" });
  } catch (error) {
    console.error("Change password error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};
