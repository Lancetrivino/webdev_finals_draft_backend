import express from "express";
import { protect } from "../middleware/authMiddleware.js";
import { uploadFeedbackPhotos } from "../config/cloudinary.js";
import { 
  addFeedback, 
  getFeedbackByEvent,
  getWebsiteFeedback,
  canSubmitFeedback,
  updateFeedback,
  deleteFeedback,
  markHelpful,
  reportFeedback,
} from "../controllers/feedbackController.js";

const router = express.Router();



//  Website feedback route (no eventId needed)
router.post("/website", protect, uploadFeedbackPhotos.array("photos", 5), addFeedback);

//  Get all website feedback (Admin)
router.get("/website", protect, getWebsiteFeedback);

// Check if user can submit feedback for event
router.get("/:id/can-submit", protect, canSubmitFeedback);

// Get all feedback for an event (with filters & pagination)
router.get("/:id", protect, getFeedbackByEvent);

// Add event feedback with photo uploads (up to 5 photos)
router.post("/:id", protect, uploadFeedbackPhotos.array("photos", 5), addFeedback);

// Update feedback (edit)
router.put("/:id/:reviewId", protect, updateFeedback);

// Delete feedback (with Cloudinary cleanup)
router.delete("/:id/:reviewId", protect, deleteFeedback);

// Mark feedback as helpful
router.post("/:id/:reviewId/helpful", protect, markHelpful);

// Report feedback
router.post("/:id/:reviewId/report", protect, reportFeedback);

export default router;