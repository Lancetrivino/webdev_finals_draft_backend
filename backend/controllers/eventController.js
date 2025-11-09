import Event from "../models/Event.js";

// 🟩 CREATE A NEW EVENT
export const createEvent = async (req, res) => {
  try {
    const createdBy = req.user._id;

    const {
      title,
      description,
      date,
      venue,
      time,
      duration,
      reminders,
      typeOfEvent,
      capacity,
    } = req.body;

    // Validate required fields
    if (!title?.trim() || !description?.trim() || !date || !venue?.trim()) {
      return res
        .status(400)
        .json({ message: "Title, description, date, and venue are required." });
    }

    // Validate date format (YYYY-MM-DD)
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return res.status(400).json({ message: "Date must be in YYYY-MM-DD format." });
    }

    // Validate time format (HH:mm)
    if (time && !/^([01]\d|2[0-3]):([0-5]\d)$/.test(time)) {
      return res.status(400).json({ message: "Time must be in HH:mm format." });
    }

    // Validate capacity
    const parsedCapacity = Number(capacity) || 50;
    if (!Number.isInteger(parsedCapacity) || parsedCapacity < 1) {
      return res.status(400).json({ message: "Capacity must be a positive integer." });
    }

    // Parse reminders if sent as JSON string
    let parsedReminders = [];
    if (reminders) {
      try {
        parsedReminders = JSON.parse(reminders);
        if (!Array.isArray(parsedReminders))
          throw new Error("Reminders must be an array.");
      } catch (err) {
        return res.status(400).json({ message: "Invalid reminders format." });
      }
    }

    // Build event object
    const eventFields = {
      title: title.trim(),
      description: description.trim(),
      date,
      venue: venue.trim(),
      createdBy,
      status: "Pending",
      capacity: parsedCapacity,
      reminders: parsedReminders,
    };

    if (time) eventFields.time = time;
    if (duration) eventFields.duration = duration;
    if (typeOfEvent) eventFields.typeOfEvent = typeOfEvent.trim();
    if (req.file) eventFields.image = req.file.path;

    const newEvent = await Event.create(eventFields);

    res.status(201).json({
      message: "Event submitted for review. Pending admin approval.",
      event: newEvent,
    });
  } catch (error) {
    console.error("❌ Error creating event:", error);
    if (error.name === "ValidationError") {
      return res.status(400).json({ message: "Validation failed", details: error.errors });
    }
    res.status(500).json({ message: "Server error creating event", details: error.message });
  }
};
