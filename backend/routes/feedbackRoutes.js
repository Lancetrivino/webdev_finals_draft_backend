import express from "express";
import { protect } from "../middleware/authMiddleware.js";
import { uploadFeedbackPhotos } from "../config/cloudinary.js"; // ✅ Import from cloudinary config
import { 
  addFeedback, 
  getFeedbackByEvent,
  canSubmitFeedback,
  updateFeedback,
  deleteFeedback,
  markHelpful,
  reportFeedback,
} from "../controllers/feedbackController.js";

const router = express.Router();

// ============================================
// ROUTES
// ============================================

// Check if user can submit feedback
router.get("/:id/can-submit", protect, canSubmitFeedback);

// Get all feedback for an event (with filters & pagination)
router.get("/:id", protect, getFeedbackByEvent);

// ✅ Add feedback with photo uploads to Cloudinary (up to 5 photos)
router.post("/:id", protect, uploadFeedbackPhotos.array("photos", 5), addFeedback);

// ✅ Update feedback (edit)
router.put("/:id/:reviewId", protect, updateFeedback);

// ✅ Delete feedback (with Cloudinary cleanup)
router.delete("/:id/:reviewId", protect, deleteFeedback);

// ✅ Mark feedback as helpful
router.post("/:id/:reviewId/helpful", protect, markHelpful);

// ✅ Report feedback
router.post("/:id/:reviewId/report", protect, reportFeedback);

export default router;