import express from "express";
import { upload } from "../config/cloudinary.js";
import {
  createEvent,
  getEvents,
  getEventById,
  approveEvent,
  rejectEvent, 
  updateEvent,
  deleteEvent,
  joinEvent,
  leaveEvent,
  getAvailableEvents,
} from "../controllers/eventController.js";
import { protect, admin } from "../middleware/authMiddleware.js";

const router = express.Router();


router.get("/available", getAvailableEvents);


router.route("/")
  .get(protect, getEvents)
  .post(protect, upload.fields([{ name: "image", maxCount: 1 }]), createEvent);


router.put("/:id/approve", protect, admin, approveEvent);
router.put("/:id/reject", protect, admin, rejectEvent); 
router.post("/:id/join", protect, joinEvent);
router.post("/:id/leave", protect, leaveEvent);

router.route("/:id")
  .get(protect, getEventById)
  .put(protect, upload.fields([{ name: "image", maxCount: 1 }]), updateEvent)
  .delete(protect, deleteEvent);

export default router;