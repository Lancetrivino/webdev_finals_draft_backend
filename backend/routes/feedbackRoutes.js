import express from "express";
import { protect } from "../middleware/authMiddleware.js";
import { 
  addFeedback, 
  getFeedbackByEvent,
  canSubmitFeedback  // ✅ Add this
} from "../controllers/feedbackController.js";

const router = express.Router();

// Add feedback for an event
router.post("/:id", protect, addFeedback);

// Get all feedback for a specific event
router.get("/:id", protect, getFeedbackByEvent);

// ✅ Optional: Check if user can submit feedback
router.get("/:id/can-submit", protect, canSubmitFeedback);

export default router;