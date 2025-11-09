import express from "express";
import {
  getUsers,
  getUserById,
  updateUser,
  deleteUser,
  updateUserRole,
  toggleUserActive,
} from "../controllers/userController.js";
import { protect, admin } from "../middleware/authMiddleware.js";

const router = express.Router();

// ✅ All routes below are protected and Admin-only
router.use(protect); // check JWT
router.use(admin);   // check role === Admin

// ============================
// GET /api/users
// Get all users
// ============================
router.get("/", getUsers);

// ============================
// GET /api/users/:id
// Get a single user by ID
// ============================
router.get("/:id", getUserById);

// ============================
// PUT /api/users/:id
// Update user details (name, email, role)
// ============================
router.put("/:id", updateUser);

// ============================
// PUT /api/users/:id/role
// Change only user role
// ============================
router.put("/:id/role", updateUserRole);

// ============================
// PUT /api/users/:id/active
// Toggle user active/inactive
// ============================
router.put("/:id/active", toggleUserActive);

// ============================
// DELETE /api/users/:id
// Delete user
// ============================
router.delete("/:id", deleteUser);

export default router;
