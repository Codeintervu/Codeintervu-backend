import express from "express";
import {
  getCategories,
  getCategoryByPath,
  addCategory,
  deleteCategory,
} from "../controllers/category.js";
import auth from "../middleware/auth.js";

const router = express.Router();

router.route("/").get(getCategories).post(auth, addCategory);
router.route("/path/:path").get(getCategoryByPath);
router.route("/:id").delete(auth, deleteCategory);

export default router;
