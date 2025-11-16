import Feedback from "../models/Feedback.js";
import Event from "../models/Event.js";
import mongoose from "mongoose";
import { deleteFromCloudinary, extractPublicId } from "../config/cloudinary.js";

// ✅ Add feedback - NO RESTRICTIONS (can submit anytime)
export const addFeedback = async (req, res) => {
  try {
    const { id: eventId } = req.params;
    const { rating, comment, type, email, feedbackType } = req.body;
    const userId = req.user._id;

    console.log("📝 Adding feedback:", { eventId, userId, feedbackType, rating });

    // WEBSITE FEEDBACK (No event required)
    if (feedbackType === "website" || !eventId || eventId === "website") {
      const photos = req.files ? req.files.map(file => file.path) : [];
      
      const feedback = new Feedback({
        event: null,
        user: userId,
        feedbackType: "website",
        rating: Number(rating),
        comment: comment.trim(),
        type: type || "idea",
        email: email || undefined,
        photos: photos,
        verified: false,
      });

      await feedback.save();
      await feedback.populate("user", "name email avatar");

      console.log("✅ Website feedback created:", feedback._id);

      return res.status(201).json({
        message: "Thank you for your website feedback!",
        feedback,
      });
    }

    // EVENT FEEDBACK
    // 1. Validate eventId
    if (!mongoose.Types.ObjectId.isValid(eventId)) {
      return res.status(400).json({ message: "Invalid event ID" });
    }

    // 2. Check if event exists
    const event = await Event.findById(eventId);
    if (!event) {
      return res.status(404).json({ message: "Event not found" });
    }

    // 3. ❌ REMOVED: Join requirement check
    // 4. ❌ REMOVED: Event date check
    
    // 5. Check for duplicate feedback (still prevent multiple submissions)
    const existingFeedback = await Feedback.findOne({
      event: eventId,
      user: userId,
      feedbackType: "event"
    });
    
    if (existingFeedback) {
      return res.status(400).json({
        message: "You have already submitted feedback for this event",
      });
    }

    // 6. Validate rating
    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({
        message: "Rating must be between 1 and 5",
      });
    }

    // 7. Validate comment
    if (!comment || comment.trim().length === 0) {
      return res.status(400).json({
        message: "Feedback comment is required",
      });
    }
    if (comment.length > 500) {
      return res.status(400).json({
        message: "Comment must be 500 characters or less",
      });
    }

    // 8. Handle photo uploads from Cloudinary
    const photos = req.files ? req.files.map(file => file.path) : [];
    console.log('📸 Uploaded photos:', photos);

    // 9. Create feedback
    const feedback = new Feedback({
      event: eventId,
      user: userId,
      feedbackType: "event",
      rating: Number(rating),
      comment: comment.trim(),
      type: type || "idea",
      email: email || undefined,
      photos: photos,
      verified: true,
    });

    await feedback.save();

    // 10. Update event ratings
    const allFeedbacks = await Feedback.find({ event: eventId, feedbackType: "event" });
    const totalRatings = allFeedbacks.reduce((sum, f) => sum + f.rating, 0);
    const avgRating = totalRatings / allFeedbacks.length;

    event.averageRating = Math.round(avgRating * 10) / 10;
    event.totalReviews = allFeedbacks.length;
    await event.save();

    // 11. Populate user info
    await feedback.populate("user", "name email avatar");

    console.log("✅ Event feedback created:", feedback._id);

    res.status(201).json({
      message: "Feedback submitted successfully!",
      feedback,
      eventRating: {
        average: event.averageRating,
        total: event.totalReviews,
      },
    });
  } catch (error) {
    console.error("❌ Error adding feedback:", error);

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

// ✅ Get feedback with filtering and sorting
export const getFeedbackByEvent = async (req, res) => {
  try {
    const { id: eventId } = req.params;
    const { 
      sortBy = "recent", 
      filterRating, 
      search,
      page = 1,
      limit = 10 
    } = req.query;

    console.log("📖 Fetching feedback for:", eventId);

    // Check if event exists
    const event = await Event.findById(eventId);
    if (!event) {
      return res.status(404).json({ message: "Event not found" });
    }

    // Build query
    let query = { event: eventId, feedbackType: "event" };

    // Filter by rating
    if (filterRating && filterRating > 0) {
      query.rating = parseInt(filterRating);
    }

    // Search in comments
    if (search) {
      query.comment = { $regex: search, $options: "i" };
    }

    // Build sort
    let sort = {};
    switch (sortBy) {
      case "recent":
        sort = { createdAt: -1 };
        break;
      case "oldest":
        sort = { createdAt: 1 };
        break;
      case "highest":
        sort = { rating: -1, createdAt: -1 };
        break;
      case "lowest":
        sort = { rating: 1, createdAt: -1 };
        break;
      case "helpful":
        sort = { helpfulCount: -1, createdAt: -1 };
        break;
      default:
        sort = { createdAt: -1 };
    }

    // Execute query with pagination
    const skip = (page - 1) * limit;
    const feedbacks = await Feedback.find(query)
      .populate("user", "name email avatar")
      .sort(sort)
      .skip(skip)
      .limit(parseInt(limit));

    // Get total count for pagination
    const total = await Feedback.countDocuments(query);

    // Calculate rating summary
    const allFeedbacks = await Feedback.find({ event: eventId, feedbackType: "event" });
    const summary = {
      total: allFeedbacks.length,
      averageRating: event.averageRating || 0,
      distribution: {
        5: allFeedbacks.filter((f) => f.rating === 5).length,
        4: allFeedbacks.filter((f) => f.rating === 4).length,
        3: allFeedbacks.filter((f) => f.rating === 3).length,
        2: allFeedbacks.filter((f) => f.rating === 2).length,
        1: allFeedbacks.filter((f) => f.rating === 1).length,
      },
    };

    console.log(`✅ Found ${feedbacks.length} feedback items`);

    res.status(200).json({
      success: true,
      summary,
      feedbacks,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("❌ Error fetching feedback:", error);
    res.status(500).json({
      message: "Failed to fetch feedback",
      error: error.message,
    });
  }
};

// ✅ Get all website feedback (Admin)
export const getWebsiteFeedback = async (req, res) => {
  try {
    const { 
      sortBy = "recent", 
      filterRating,
      page = 1,
      limit = 20 
    } = req.query;

    let query = { feedbackType: "website" };

    if (filterRating && filterRating > 0) {
      query.rating = parseInt(filterRating);
    }

    let sort = { createdAt: -1 };
    if (sortBy === "highest") sort = { rating: -1, createdAt: -1 };
    if (sortBy === "lowest") sort = { rating: 1, createdAt: -1 };

    const skip = (page - 1) * limit;
    const feedbacks = await Feedback.find(query)
      .populate("user", "name email avatar")
      .sort(sort)
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Feedback.countDocuments(query);

    res.status(200).json({
      success: true,
      feedbacks,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("❌ Error fetching website feedback:", error);
    res.status(500).json({
      message: "Failed to fetch website feedback",
      error: error.message,
    });
  }
};

// ✅ Edit feedback
export const updateFeedback = async (req, res) => {
  try {
    const { id: eventId, reviewId } = req.params;
    const { rating, comment } = req.body;
    const userId = req.user._id;

    const feedback = await Feedback.findOne({
      _id: reviewId,
      event: eventId,
    });

    if (!feedback) {
      return res.status(404).json({ message: "Feedback not found" });
    }

    if (feedback.user.toString() !== userId.toString()) {
      return res.status(403).json({
        message: "You can only edit your own feedback",
      });
    }

    if (rating && (rating < 1 || rating > 5)) {
      return res.status(400).json({
        message: "Rating must be between 1 and 5",
      });
    }

    if (comment && comment.length > 500) {
      return res.status(400).json({
        message: "Comment must be 500 characters or less",
      });
    }

    if (rating) feedback.rating = rating;
    if (comment) feedback.comment = comment.trim();
    feedback.updatedAt = Date.now();

    await feedback.save();

    // Recalculate event average rating
    const allFeedbacks = await Feedback.find({ event: eventId, feedbackType: "event" });
    const totalRatings = allFeedbacks.reduce((sum, f) => sum + f.rating, 0);
    const avgRating = totalRatings / allFeedbacks.length;

    await Event.findByIdAndUpdate(eventId, {
      averageRating: Math.round(avgRating * 10) / 10,
    });

    await feedback.populate("user", "name email avatar");

    res.status(200).json({
      message: "Feedback updated successfully",
      feedback,
    });
  } catch (error) {
    console.error("Error updating feedback:", error);
    res.status(500).json({
      message: "Failed to update feedback",
      error: error.message,
    });
  }
};

// ✅ Delete feedback (with Cloudinary cleanup)
export const deleteFeedback = async (req, res) => {
  try {
    const { id: eventId, reviewId } = req.params;
    const userId = req.user._id;

    const feedback = await Feedback.findOne({
      _id: reviewId,
      event: eventId,
    });

    if (!feedback) {
      return res.status(404).json({ message: "Feedback not found" });
    }

    if (
      feedback.user.toString() !== userId.toString() &&
      req.user.role !== "Admin"
    ) {
      return res.status(403).json({
        message: "You can only delete your own feedback",
      });
    }

    // Delete photos from Cloudinary
    if (feedback.photos && feedback.photos.length > 0) {
      console.log('🗑️ Deleting photos from Cloudinary:', feedback.photos);
      
      for (const photoUrl of feedback.photos) {
        try {
          const publicId = extractPublicId(photoUrl);
          if (publicId) {
            await deleteFromCloudinary(publicId);
            console.log(`✅ Deleted: ${publicId}`);
          }
        } catch (error) {
          console.error(`❌ Error deleting ${photoUrl}:`, error);
        }
      }
    }

    await feedback.deleteOne();

    // Recalculate event ratings
    const allFeedbacks = await Feedback.find({ event: eventId, feedbackType: "event" });
    
    if (allFeedbacks.length > 0) {
      const totalRatings = allFeedbacks.reduce((sum, f) => sum + f.rating, 0);
      const avgRating = totalRatings / allFeedbacks.length;

      await Event.findByIdAndUpdate(eventId, {
        averageRating: Math.round(avgRating * 10) / 10,
        totalReviews: allFeedbacks.length,
      });
    } else {
      await Event.findByIdAndUpdate(eventId, {
        averageRating: 0,
        totalReviews: 0,
      });
    }

    res.status(200).json({
      message: "Feedback deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting feedback:", error);
    res.status(500).json({
      message: "Failed to delete feedback",
      error: error.message,
    });
  }
};

// ✅ Mark feedback as helpful
export const markHelpful = async (req, res) => {
  try {
    const { id: eventId, reviewId } = req.params;
    const userId = req.user._id;

    const feedback = await Feedback.findOne({
      _id: reviewId,
      event: eventId,
    });

    if (!feedback) {
      return res.status(404).json({ message: "Feedback not found" });
    }

    if (feedback.user.toString() === userId.toString()) {
      return res.status(400).json({
        message: "You cannot mark your own review as helpful",
      });
    }

    const userIdStr = userId.toString();
    const alreadyMarked = feedback.markedHelpfulBy.some(
      (id) => id.toString() === userIdStr
    );

    if (alreadyMarked) {
      feedback.markedHelpfulBy = feedback.markedHelpfulBy.filter(
        (id) => id.toString() !== userIdStr
      );
      feedback.helpfulCount = Math.max(0, feedback.helpfulCount - 1);
    } else {
      feedback.markedHelpfulBy.push(userId);
      feedback.helpfulCount += 1;
    }

    await feedback.save();

    res.status(200).json({
      message: alreadyMarked ? "Unmarked as helpful" : "Marked as helpful",
      helpfulCount: feedback.helpfulCount,
      marked: !alreadyMarked,
    });
  } catch (error) {
    console.error("Error marking helpful:", error);
    res.status(500).json({
      message: "Failed to mark as helpful",
      error: error.message,
    });
  }
};

// ✅ Report feedback
export const reportFeedback = async (req, res) => {
  try {
    const { id: eventId, reviewId } = req.params;
    const { reason } = req.body;
    const userId = req.user._id;

    if (!reason || reason.trim().length === 0) {
      return res.status(400).json({
        message: "Please provide a reason for reporting",
      });
    }

    const feedback = await Feedback.findOne({
      _id: reviewId,
      event: eventId,
    });

    if (!feedback) {
      return res.status(404).json({ message: "Feedback not found" });
    }

    feedback.reports = feedback.reports || [];
    
    const alreadyReported = feedback.reports.some(
      (r) => r.reportedBy.toString() === userId.toString()
    );

    if (alreadyReported) {
      return res.status(400).json({
        message: "You have already reported this review",
      });
    }

    feedback.reports.push({
      reportedBy: userId,
      reason: reason.trim(),
      reportedAt: new Date(),
    });

    if (feedback.reports.length >= 3) {
      feedback.flagged = true;
    }

    await feedback.save();

    res.status(200).json({
      message: "Feedback reported successfully. Thank you for keeping our community safe.",
      reportCount: feedback.reports.length,
    });
  } catch (error) {
    console.error("Error reporting feedback:", error);
    res.status(500).json({
      message: "Failed to report feedback",
      error: error.message,
    });
  }
};

// ✅ Check eligibility - NO RESTRICTIONS
export const canSubmitFeedback = async (req, res) => {
  try {
    const { id: eventId } = req.params;
    const userId = req.user._id;

    const event = await Event.findById(eventId);
    if (!event) {
      return res.status(404).json({ message: "Event not found" });
    }

    const existingFeedback = await Feedback.findOne({
      event: eventId,
      user: userId,
      feedbackType: "event"
    });

    // ✅ Always allow submission unless already submitted
    res.status(200).json({
      canSubmit: !existingFeedback,
      alreadySubmitted: !!existingFeedback,
      message: existingFeedback 
        ? "You have already submitted feedback for this event" 
        : "You can submit feedback anytime!",
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};