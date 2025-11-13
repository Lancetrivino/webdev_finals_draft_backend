import express from "express";
import { upload } from "../config/cloudinary.js";
import {
  createEvent,
  getEvents,
  getEventById,
  approveEvent,
  updateEvent,
  deleteEvent,
  joinEvent,
  leaveEvent,
  getAvailableEvents,
} from "../controllers/eventController.js";
import { protect, admin } from "../middleware/authMiddleware.js";

const router = express.Router();

// ✅ IMPORTANT: Specific routes MUST come before parameterized routes
// Put /available BEFORE /:id to avoid route conflicts
router.get("/available", getAvailableEvents);

// Main routes
router.route("/")
  .get(protect, getEvents)
  .post(protect, upload.fields([{ name: "image", maxCount: 1 }]), createEvent);

// Admin approval route (also specific, comes before /:id)
router.put("/:id/approve", protect, admin, approveEvent);

// Parameterized routes (these should come LAST)
router.route("/:id")
  .get(protect, getEventById)
  .put(protect, upload.fields([{ name: "image", maxCount: 1 }]), updateEvent)
  .delete(protect, deleteEvent);

// Join/leave routes (also use :id but are specific actions)
router.post("/:id/join", protect, joinEvent);
router.post("/:id/leave", protect, leaveEvent);

export default router;