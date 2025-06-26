import dotenv from "dotenv";
dotenv.config();

import { v2 as cloudinary } from "cloudinary";
import { CloudinaryStorage } from "multer-storage-cloudinary";

// Debug: Check if environment variables are loaded
console.log(
  "Cloudinary ENV Check:",
  "Cloud Name:",
  process.env.CLOUDINARY_CLOUD_NAME,
  "API Key:",
  process.env.CLOUDINARY_API_KEY ? "Present" : "Missing",
  "API Secret:",
  process.env.CLOUDINARY_API_SECRET ? "Present" : "Missing"
);

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Configure multer storage for Cloudinary
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: "codeintervu-tutorials",
    allowed_formats: ["jpg", "jpeg", "png", "gif", "webp"],
    transformation: [{ width: 1000, height: 1000, crop: "limit" }],
  },
});

export { cloudinary, storage };
