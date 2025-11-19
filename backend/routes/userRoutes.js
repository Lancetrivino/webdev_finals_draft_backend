import express from "express";
import {
  getUsers,
  getUserById,
  updateUser,
  deleteUser,
  updateUserRole,
  toggleUserActive,
  updateProfile, // ✅ ADD THIS
} from "../controllers/userController.js";
import { protect, admin } from "../middleware/authMiddleware.js";
import { uploadAvatar } from "../config/cloudinary.js"; // ✅ ADD THIS

const router = express.Router();

// ============================
// ✅ NEW: Update current user's profile (authenticated users)
// This must come BEFORE admin routes
// ============================
router.put(
  "/profile", 
  protect, 
  uploadAvatar.single("avatar"), 
  updateProfile
);

// ============================
// Admin routes below
// ============================
router.use(protect); // check JWT
router.use(admin);   // check role === Admin

router.get("/", getUsers);
router.get("/:id", getUserById);
router.put("/:id", updateUser);
router.put("/:id/role", updateUserRole);
router.put("/:id/active", toggleUserActive);
router.delete("/:id", deleteUser);

export default router;