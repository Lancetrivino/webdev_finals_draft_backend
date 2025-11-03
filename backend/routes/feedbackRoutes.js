import express from "express";
import { protect } from "../middleware/authMiddleware.js";
import { addFeedback } from "../controllers/feedbackController.js";

const router = express.Router();

router.post("/", protect, addFeedback);

export default router;
