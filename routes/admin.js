import express from "express";
import { registerAdmin, loginAdmin } from "../controllers/admin.js";

const router = express.Router();

// The registration logic now only exists in the controller and is not exposed
// as a route. To create another admin, you would have to temporarily add:
// router.post("/register", registerAdmin);

// Login route
router.post("/login", loginAdmin);

export default router;
