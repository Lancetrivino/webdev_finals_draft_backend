import Feedback from "../models/Feedback.js";
import Event from "../models/Event.js";

// 🧩 POST /api/feedback/:id  → Add feedback for an event
export const addFeedback = async (req, res) => {
  try {
    const { id } = req.params; // renamed to match your route param
    const { rating, comment } = req.body;
    const userId = req.user._id;

    // 1. Validate if event exists
    const eventExists = await Event.findById(id);
    if (!eventExists) {
      return res.status(404).json({ message: "The event specified was not found." });
    }

    // 2. Check if user already submitted feedback
    const existingFeedback = await Feedback.findOne({ eventId: id, userId });
    if (existingFeedback) {
      return res.status(400).json({ message: "You have already submitted feedback for this event." });
    }

    // 3. Create and save new feedback
    const newFeedback = await Feedback.create({
      eventId: id,
      userId,
      rating,
      comment,
    });

    res.status(201).json({
      message: "Feedback submitted successfully!",
      feedback: newFeedback,
    });
  } catch (error) {
    console.error("❌ Error submitting feedback:", error);
    res.status(500).json({ message: "Server error during feedback submission." });
  }
};

// 🧩 GET /api/feedback/:id  → Get all feedback for a specific event
export const getFeedbackByEvent = async (req, res) => {
  try {
    const { id } = req.params;

    // Check if the event exists first
    const eventExists = await Event.findById(id);
    if (!eventExists) {
      return res.status(404).json({ message: "The event specified was not found." });
    }

    // Get all feedback for that event, with user details populated
    const feedbackList = await Feedback.find({ eventId: id }).populate("userId", "name email");

    res.status(200).json(feedbackList);
  } catch (error) {
    console.error("❌ Error fetching feedback:", error);
    res.status(500).json({ message: "Server error while fetching feedback." });
  }
};
