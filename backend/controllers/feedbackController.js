import Feedback from "../models/Feedback.js";
import Event from "../models/Event.js";

// ✅ Add feedback for an event (with all validations)
export const addFeedback = async (req, res) => {
  try {
    const { id: eventId } = req.params;
    const { rating, comment, type, email } = req.body;
    const userId = req.user._id; // from protect middleware

    // ✅ 1. Check if event exists
    const event = await Event.findById(eventId);
    if (!event) {
      return res.status(404).json({ message: "Event not found" });
    }

    // ✅ 2. Check if user has joined the event
    const hasJoined = event.participants.some(
      (participant) => participant.toString() === userId.toString()
    );

    if (!hasJoined) {
      return res.status(403).json({
        message: "You must join this event before giving feedback",
      });
    }

    // ✅ 3. Check if event date has passed
    const eventDate = new Date(event.date);
    const now = new Date();

    if (now <= eventDate) {
      return res.status(400).json({
        message: "You can only submit feedback after the event has ended",
        eventDate: event.date,
      });
    }

    // ✅ 4. Check if user already submitted feedback
    const existingFeedback = await Feedback.findOne({
      event: eventId,
      user: userId,
    });

    if (existingFeedback) {
      return res.status(400).json({
        message: "You have already submitted feedback for this event",
      });
    }

    // ✅ 5. Validate rating
    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({
        message: "Rating must be between 1 and 5",
      });
    }

    // ✅ 6. Validate comment
    if (!comment || comment.trim().length === 0) {
      return res.status(400).json({
        message: "Feedback comment is required",
      });
    }

    if (comment.length > 300) {
      return res.status(400).json({
        message: "Comment must be 300 characters or less",
      });
    }

    // ✅ 7. Create feedback
    const feedback = new Feedback({
      event: eventId,
      user: userId,
      rating: Number(rating),
      comment: comment.trim(),
      type: type || "idea",
      email: email || undefined,
    });

    await feedback.save();

    // ✅ 8. Update event with average rating and total reviews
    const allFeedbacks = await Feedback.find({ event: eventId });
    const totalRatings = allFeedbacks.reduce((sum, f) => sum + f.rating, 0);
    const avgRating = totalRatings / allFeedbacks.length;

    event.averageRating = Math.round(avgRating * 10) / 10; // Round to 1 decimal
    event.totalReviews = allFeedbacks.length;
    await event.save();

    // ✅ 9. Populate user info before sending response
    await feedback.populate("user", "name email");

    res.status(201).json({
      message: "Feedback submitted successfully",
      feedback,
      eventRating: {
        average: event.averageRating,
        total: event.totalReviews,
      },
    });
  } catch (error) {
    console.error("Error adding feedback:", error);
    
    // Handle duplicate feedback error
    if (error.code === 11000) {
      return res.status(400).json({
        message: "You have already submitted feedback for this event",
      });
    }

    res.status(500).json({
      message: "Failed to submit feedback",
      error: error.message,
    });
  }
};

// ✅ Get all feedback for a specific event
export const getFeedbackByEvent = async (req, res) => {
  try {
    const { id: eventId } = req.params;

    // Check if event exists
    const event = await Event.findById(eventId);
    if (!event) {
      return res.status(404).json({ message: "Event not found" });
    }

    // Get all feedback for this event, sorted by newest first
    const feedbacks = await Feedback.find({ event: eventId })
      .populate("user", "name email avatar") // Include user details
      .sort({ createdAt: -1 }); // Newest first

    // Calculate rating summary
    const summary = {
      total: feedbacks.length,
      averageRating: event.averageRating || 0,
      distribution: {
        5: feedbacks.filter((f) => f.rating === 5).length,
        4: feedbacks.filter((f) => f.rating === 4).length,
        3: feedbacks.filter((f) => f.rating === 3).length,
        2: feedbacks.filter((f) => f.rating === 2).length,
        1: feedbacks.filter((f) => f.rating === 1).length,
      },
    };

    res.status(200).json({
      success: true,
      summary,
      feedbacks,
    });
  } catch (error) {
    console.error("Error fetching feedback:", error);
    res.status(500).json({
      message: "Failed to fetch feedback",
      error: error.message,
    });
  }
};

// ✅ Check if user can submit feedback (helper endpoint)
export const canSubmitFeedback = async (req, res) => {
  try {
    const { id: eventId } = req.params;
    const userId = req.user._id;

    const event = await Event.findById(eventId);
    if (!event) {
      return res.status(404).json({ message: "Event not found" });
    }

    const hasJoined = event.participants.some(
      (p) => p.toString() === userId.toString()
    );

    const eventDate = new Date(event.date);
    const now = new Date();
    const eventHasPassed = now > eventDate;

    const existingFeedback = await Feedback.findOne({
      event: eventId,
      user: userId,
    });

    res.status(200).json({
      canSubmit: hasJoined && eventHasPassed && !existingFeedback,
      hasJoined,
      eventHasPassed,
      alreadySubmitted: !!existingFeedback,
      eventDate: event.date,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};