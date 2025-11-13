import express from "express";
import { upload } from "../config/cloudinary.js"; // ✅ Import from cloudinary config
import {
  createEvent,
  getEvents,
  getEventById,
  approveEvent,
  updateEvent,
  deleteEvent,
  joinEvent,
  leaveEvent,
} from "../controllers/eventController.js";
import { protect, admin } from "../middleware/authMiddleware.js";

const router = express.Router();

// ✅ Routes - Using Cloudinary upload
router.route("/")
  .get(protect, getEvents)
  .post(protect, upload.fields([{ name: "image", maxCount: 1 }]), createEvent);

router.put("/:id/approve", protect, admin, approveEvent);

router.route("/:id")
  .get(protect, getEventById)
  .put(protect, upload.fields([{ name: "image", maxCount: 1 }]), updateEvent)
  .delete(protect, deleteEvent);

router.post("/:id/join", protect, joinEvent);
router.post("/:id/leave", protect, leaveEvent);

export default router;