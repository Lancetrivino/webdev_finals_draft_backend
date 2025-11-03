import Feedback from "../models/Feedback.js";
import Event from "../models/Event.js";


export const addFeedback = async (req, res) => {
  try {
    const { rating, comment } = req.body;
    const { id } = req.params; // event ID
    const userId = req.user.id; // from JWT auth middleware

    // Check if event exists
    const event = await Event.findById(id);
    if (!event) return res.status(404).json({ message: "Event not found" });
    
    if (!event.participants.includes(userId)) {
    return res.status(403).json({ 
        message: 'Only registered participants can submit feedback for this event.' 
    });
}
    // Create new feedback
    const feedback = await Feedback.create({
      eventId: id,
      userId,
      rating,
      comment,
    });


    res.status(201).json({ message: "Feedback submitted successfully", feedback });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Get all feedback for a specific event
export const getFeedbackByEvent = async (req, res) => {
  try {
    const { id } = req.params; // event ID

    const feedbacks = await Feedback.find({ eventId: id })
      .populate("userId", "name email")
      .sort({ createdAt: -1 });

    res.status(200).json(feedbacks);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

