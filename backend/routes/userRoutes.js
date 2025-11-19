import express from "express";
import {
  getUsers,
  getUserById,
  updateUser,
  deleteUser,
  updateUserRole,
  toggleUserActive,
  updateProfile, 
} from "../controllers/userController.js";
import { protect, admin } from "../middleware/authMiddleware.js";
import { uploadAvatar } from "../config/cloudinary.js"; 

const router = express.Router();

router.put(
  "/profile", 
  protect, 
  uploadAvatar.single("avatar"), 
  updateProfile
);

// Admin routes (everything below requires admin access)
router.use(protect); // check JWT
router.use(admin);   // check role === Admin

router.get("/", getUsers);
router.get("/:id", getUserById);
router.put("/:id", updateUser);
router.put("/:id/role", updateUserRole);
router.put("/:id/active", toggleUserActive);
router.delete("/:id", deleteUser);

export default router;