import mongoose from "mongoose";

const eventSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "Please add a title for the event"],
      trim: true,
      maxlength: [100, "Title cannot be more than 100 characters"],
    },
    description: {
      type: String,
      required: [true, "Please add a description for the event"],
    },
    date: {
      type: Date,
      required: [true, "Please add the date of the event"],
    },
    time: {
      type: String, // ⬅️ optional
      trim: true,
    },
    duration: {
      type: String, // ⬅️ optional (e.g., "2h 15m")
      trim: true,
    },
    venue: {
      type: String,
      required: [true, "Please add the venue for the event"],
      trim: true,
    },
    image: {
      type: String, // ⬅️ optional base64 image string
    },
    reminders: {
      type: [String], // ⬅️ optional array of strings
      default: [],
    },
    status: {
      type: String,
      enum: ["Pending", "Approved", "Rejected"],
      default: "Pending",
      required: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    participants: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
  },
  {
    timestamps: true, // adds createdAt & updatedAt
  }
);

const Event = mongoose.model("Event", eventSchema);
export default Event;
