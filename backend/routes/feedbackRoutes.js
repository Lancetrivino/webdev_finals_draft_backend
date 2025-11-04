import express from "express";
import { protect } from "../middleware/authMiddleware.js";
import { addFeedback } from "../controllers/feedbackController.js";

const router = express.Router();

router.post("/:id", protect, addFeedback);

// GET all feedback for a specific event
router.get("/:id", getFeedbackByEvent);

export default router;
