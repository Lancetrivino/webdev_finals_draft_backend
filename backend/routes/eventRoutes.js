import express from "express";
import {
  createEvent,
  getEvents,
  getEventById, 
  approveEvent,
  updateEvent,
  deleteEvent,
} from "../controllers/eventController.js";
import { protect, admin } from "../middleware/authMiddleware.js";

const router = express.Router();

// 🧩 GET all events & POST create a new event
router.route("/")
  .get(protect, getEvents)
  .post(protect, createEvent);

// 🧩 Approve an event (Admin only)
router.put("/:id/approve", protect, admin, approveEvent);

// 🧩 GET, PUT, or DELETE a specific event by ID
router.route("/:id")
  .get(protect, getEventById) 
  .put(protect, updateEvent)
  .delete(protect, deleteEvent);

export default router;