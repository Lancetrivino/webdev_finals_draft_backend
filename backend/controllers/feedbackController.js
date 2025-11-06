import Feedback from '../models/Feedback.js';
import Event from '../models/Event.js'; // Need to import Event model to check its existence

// 🧩 POST /api/feedback/:eventId
export const submitFeedback = async (req, res) => {
  try {
    const { eventId } = req.params;
    const { rating, comment } = req.body;
    // Use 'userId' to match the model field and the convention
    const userId = req.user._id; 

    // 1. Validate Event existence
    const eventExists = await Event.findById(eventId);
    if (!eventExists) {
      return res.status(404).json({ message: 'The event specified was not found.' });
    }

    // 2. Check if user already submitted feedback for this event
    // 💡 FIX: Using model field names: eventId and userId
    const existingFeedback = await Feedback.findOne({ eventId: eventId, userId: userId });
    if (existingFeedback) {
      return res.status(400).json({ message: 'You have already submitted feedback for this event.' });
    }

    // 3. Create and save the new feedback document
    // 💡 FIX: Using model field names: eventId and userId
    const newFeedback = await Feedback.create({
      eventId: eventId,
      userId: userId,
      rating,
      comment,
    });

    res.status(201).json({
      message: 'Feedback submitted successfully!',
      feedback: newFeedback,
    });
  } catch (error) {
    console.error('❌ Error submitting feedback:', error);
    res.status(500).json({ message: 'Server error during feedback submission.' });
  }
};