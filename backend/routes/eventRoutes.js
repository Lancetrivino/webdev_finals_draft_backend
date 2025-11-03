import express from "express";
import {
  createEvent,
  getEvents,
  approveEvent,
  updateEvent,
  deleteEvent,
} from "../controllers/eventController.js";
import { protect, admin } from "../middleware/authMiddleware.js";

const router = express.Router();

// 🧩 GET all events (for logged-in users)
// 🧩 POST create a new event (for logged-in users)
router.route("/")
  .get(protect, getEvents)
  .post(protect, createEvent);

// 🧩 Approve an event (Admin only)
router.put("/:id/approve", protect, admin, approveEvent);

// 🧩 Update or Delete event (for logged-in users)
router.route("/:id")
  .put(protect, updateEvent)
  .delete(protect, deleteEvent);

export default router;
