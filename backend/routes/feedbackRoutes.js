import express from "express";
import { protect } from "../middleware/authMiddleware.js";
import { addFeedback, getFeedbackByEvent } from "../controllers/feedbackController.js"; // ✅ include both

const router = express.Router();

// Add feedback for an event
router.post("/:id",protect, addFeedback);

// Get all feedback for a specific event
router.get("/:id",protect, getFeedbackByEvent);

export default router;
