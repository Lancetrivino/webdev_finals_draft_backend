import mongoose from "mongoose";

const feedbackSchema = new mongoose.Schema(
  {
    event: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Event",
      required: [true, "Event reference is required"],
      index: true,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "User reference is required"],
      index: true,
    },
    rating: {
      type: Number,
      required: [true, "Rating is required"],
      min: [1, "Rating must be at least 1"],
      max: [5, "Rating cannot be more than 5"],
    },
    comment: {
      type: String,
      required: [true, "Comment is required"],
      trim: true,
      maxlength: [500, "Comment cannot be more than 500 characters"],
    },
    type: {
      type: String,
      enum: ["idea", "issue", "praise", "other", "complaint", "suggestion"],
      default: "idea",
    },
    email: {
      type: String,
      trim: true,
      lowercase: true,
      match: [
        /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
        "Please provide a valid email",
      ],
    },
    // ✅ NEW: Photo uploads from Cloudinary
    photos: {
      type: [String],
      default: [],
      validate: {
        validator: function(arr) {
          return arr.length <= 5;
        },
        message: "You can upload maximum 5 photos"
      }
    },
    // ✅ NEW: Helpful feature
    helpfulCount: {
      type: Number,
      default: 0,
      min: 0,
    },
    markedHelpfulBy: {
      type: [mongoose.Schema.Types.ObjectId],
      ref: "User",
      default: [],
    },
    // ✅ NEW: Report system
    reports: [
      {
        reportedBy: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
        },
        reason: String,
        reportedAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    flagged: {
      type: Boolean,
      default: false,
    },
    // ✅ NEW: Verified attendee badge
    verified: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

// ✅ Compound index to prevent duplicate feedback
feedbackSchema.index({ event: 1, user: 1 }, { unique: true });

// ✅ Indexes for sorting
feedbackSchema.index({ createdAt: -1 });
feedbackSchema.index({ rating: -1 });
feedbackSchema.index({ helpfulCount: -1 });

// ✅ Pre-save hook
feedbackSchema.pre("save", function (next) {
  if (this.email && this.email.trim() === "") {
    this.email = undefined;
  }
  next();
});

const Feedback = mongoose.model("Feedback", feedbackSchema);
export default Feedback;