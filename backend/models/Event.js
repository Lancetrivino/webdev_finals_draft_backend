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
      validate: {
        validator: (v) => !isNaN(new Date(v).getTime()),
        message: "Invalid date format",
      },
    },
    time: {
      type: String, // optional (HH:mm format)
      trim: true,
    },
    duration: {
      type: String, // optional (e.g., "2h 15m")
      trim: true,
    },
    venue: {
      type: String,
      required: [true, "Please add the venue for the event"],
      trim: true,
    },
    typeOfEvent: {
      type: String, // ✅ ADDED: Type of event (e.g., "Conference", "Workshop")
      trim: true,
    },
    image: {
      type: String, // optional - file path or URL
    },
    reminders: {
      type: [String], // optional array of reminder strings
      default: [],
    },
    status: {
      type: String,
      enum: ["Pending", "Approved", "Rejected"],
      default: "Pending",
      required: true,
    },
    capacity: {
      type: Number,
      default: 50,
      min: [1, "Capacity must be at least 1"],
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