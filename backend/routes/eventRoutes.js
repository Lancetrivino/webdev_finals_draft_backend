import express from "express";
import multer from "multer";
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

// ✅ Multer setup with better error handling
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/");
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + "-" + file.originalname);
  },
});

const fileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith("image/")) {
    cb(null, true);
  } else {
    cb(new Error("Only image files are allowed"), false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB max
});

// ✅ Routes - FIXED: Use .fields() instead of .single()
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