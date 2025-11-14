import mongoose from "mongoose";

const feedbackSchema = new mongoose.Schema(
  {
    event: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Event",
      required: [true, "Event reference is required"],
      index: true, // ✅ Index for faster queries
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "User reference is required"],
      index: true, // ✅ Index for faster queries
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
      maxlength: [300, "Comment cannot be more than 300 characters"],
    },
    type: {
      type: String,
      enum: ["idea", "complaint", "suggestion"],
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
  },
  {
    timestamps: true, // adds createdAt & updatedAt
  }
);

// ✅ Compound index to prevent duplicate feedback from same user for same event
feedbackSchema.index({ event: 1, user: 1 }, { unique: true });

// ✅ Index for sorting by creation date
feedbackSchema.index({ createdAt: -1 });

// ✅ Pre-save hook to validate email format if provided
feedbackSchema.pre("save", function (next) {
  if (this.email && this.email.trim() === "") {
    this.email = undefined; // Remove empty email
  }
  next();
});

const Feedback = mongoose.model("Feedback", feedbackSchema);
export default Feedback;