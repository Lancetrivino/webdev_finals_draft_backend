import express from "express";
import { upload } from "../config/cloudinary.js";
import {
  createEvent,
  getEvents,
  getEventById,
  approveEvent,
  rejectEvent, // ✅ Import rejectEvent
  updateEvent,
  deleteEvent,
  joinEvent,
  leaveEvent,
  getAvailableEvents,
} from "../controllers/eventController.js";
import { protect, admin } from "../middleware/authMiddleware.js";

const router = express.Router();

// ✅ IMPORTANT: Specific routes MUST come before parameterized routes
// 1. Most specific routes first
router.get("/available", getAvailableEvents);

// 2. Root routes
router.route("/")
  .get(protect, getEvents)
  .post(protect, upload.fields([{ name: "image", maxCount: 1 }]), createEvent);

// 3. Specific action routes (BEFORE /:id)
router.put("/:id/approve", protect, admin, approveEvent);
router.put("/:id/reject", protect, admin, rejectEvent); // ✅ ADD THIS LINE
router.post("/:id/join", protect, joinEvent);
router.post("/:id/leave", protect, leaveEvent);

// 4. Generic parameterized routes (ALWAYS LAST)
router.route("/:id")
  .get(protect, getEventById)
  .put(protect, upload.fields([{ name: "image", maxCount: 1 }]), updateEvent)
  .delete(protect, deleteEvent);

export default router;