import Feedback from '../models/Feedback.js';
import Event from '../models/Event.js'; 

// 🧩 POST /api/feedback/:id (Function to add new feedback)
export const addFeedback = async (req, res) => {
  try {
    // Extract 'id' from params and rename it to 'eventId' for clarity in controller logic
    const eventId = req.params.id; 
    const { rating, comment } = req.body;
    const userId = req.user._id; 

    // 1. Validate Event existence
    const eventExists = await Event.findById(eventId);
    if (!eventExists) {
      return res.status(404).json({ message: 'The event specified was not found.' });
    }

    // 2. Check if user already submitted feedback for this event
    // Use 'event' and 'user' to match the Mongoose model fields
    const existingFeedback = await Feedback.findOne({ event: eventId, user: userId });
    if (existingFeedback) {
      return res.status(400).json({ message: 'You have already submitted feedback for this event.' });
    }

    // 3. Create and save the new feedback document
    const newFeedback = await Feedback.create({
      event: eventId, // Map URL param to model field 'event'
      user: userId,   // Map user ID to model field 'user'
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

// 🧩 GET /api/feedback/:id (Function to retrieve all feedback for an event)
export const getFeedbackByEvent = async (req, res) => {
    try {
        const eventId = req.params.id;

        // 1. Check if the event exists
        const eventExists = await Event.findById(eventId);
        if (!eventExists) {
          return res.status(404).json({ message: 'The specified event was not found.' });
        }

        // 2. Retrieve all feedback for that event, populating user details
        const feedback = await Feedback.find({ event: eventId })
            .populate('user', 'name email') // Populate the User reference with name and email
            .sort({ submittedAt: -1 }); // Show newest feedback first

        res.status(200).json(feedback);

    } catch (error) {
        console.error('❌ Error fetching feedback by event:', error);
        if (error.name === 'CastError') {
          return res.status(400).json({ message: 'Invalid Event ID format.' });
        }
        res.status(500).json({ message: 'Server error fetching feedback.' });
    }
};