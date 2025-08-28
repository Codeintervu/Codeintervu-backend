import jwt from "jsonwebtoken";
import Admin from "../models/Admin.js";
import User from "../models/User.js";

// Admin authentication middleware
export const adminAuth = async (req, res, next) => {
  const token = req.header("Authorization")?.replace("Bearer ", "");
  if (!token)
    return res.status(401).json({ message: "No token, authorization denied" });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.admin = await Admin.findById(decoded.id).select("-password");
    if (!req.admin) throw new Error();
    next();
  } catch {
    res.status(401).json({ message: "Token is not valid" });
  }
};

// User authentication middleware
export const auth = async (req, res, next) => {
  const token = req.header("Authorization")?.replace("Bearer ", "");
  if (!token)
    return res.status(401).json({ message: "No token, authorization denied" });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = await User.findById(decoded.id).select("-password");
    if (!req.user) throw new Error();
    next();
  } catch {
    res.status(401).json({ message: "Token is not valid" });
  }
};

// Default export for backward compatibility
export default auth;
