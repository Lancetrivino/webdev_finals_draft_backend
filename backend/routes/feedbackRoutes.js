import express from "express";
import { protect } from "../middleware/authMiddleware.js";
import { submitFeedback, getFeedbackByEvent } from "../controllers/feedbackController.js"; // ✅ include both

const router = express.Router();

// Add feedback for an event
router.post("/:id", protect, submitFeedback);

// Get all feedback for a specific event
router.get("/:id", protect, getFeedbackByEvent);

export default router;
