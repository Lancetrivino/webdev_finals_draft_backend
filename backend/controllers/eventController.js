import Event from "../models/Event.js";

// 🟩 GET ALL EVENTS
export const getEvents = async (req, res) => {
  try {
    let events;

    // Admins see all, others see only approved events
    if (req.user.role === "Admin") {
      events = await Event.find().populate("createdBy", "name email role");
    } else {
      events = await Event.find({ status: "Approved" }).populate("createdBy", "name email");
    }

    res.status(200).json(events);
  } catch (error) {
    console.error("❌ Error getting events:", error);
    res.status(500).json({ message: "Server error fetching events" });
  }
};

// 🟩 GET A SINGLE EVENT BY ID
export const getEventById = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id)
      .populate("createdBy", "name email role")
      .populate("participants", "name email");

    if (!event) {
      return res.status(404).json({ message: "Event not found." });
    }

    // Access control — only admins or creators can see unapproved events
    const isCreator = event.createdBy?._id?.toString() === req.user._id.toString();
    const isAdmin = req.user.role === "Admin";

    if (event.status !== "Approved" && !isAdmin && !isCreator) {
      return res.status(403).json({ message: "Access denied. Event is not approved." });
    }

    // Add participant count
    const eventDetails = {
      ...event.toObject(),
      totalParticipants: event.participants?.length || 0,
    };

    res.status(200).json(eventDetails);
  } catch (error) {
    console.error("❌ Error getting event by ID:", error);

    if (error.name === "CastError") {
      return res.status(404).json({ message: "Invalid Event ID format." });
    }

    res.status(500).json({ message: "Server error fetching event details." });
  }
};


export const createEvent = async (req, res) => {
  try {
    const createdBy = req.user._id;

    // Destructure fields from request body
    const {
      title,
      description,
      date,
      venue,
      time,
      duration,
      imageData,
      reminders,
    } = req.body;

    // Validate required fields
    if (!title || !description || !date || !venue) {
      return res.status(400).json({ message: "Title, description, date, and venue are required." });
    }

    // Build event object
    const eventFields = {
      title: title.trim(),
      description: description.trim(),
      date,
      venue: venue.trim(),
      createdBy,
      status: "Pending", // New events default to Pending
    };

    // Optional fields
    if (time) eventFields.time = time;
    if (duration) eventFields.duration = duration;
    if (imageData) eventFields.image = imageData; // save base64 string under 'image'
    if (Array.isArray(reminders) && reminders.length > 0) eventFields.reminders = reminders;

    const newEvent = await Event.create(eventFields);

    res.status(201).json({
      message: "Event submitted for review. Pending admin approval.",
      event: newEvent,
    });
  } catch (error) {
    console.error("❌ Error creating event:", error);
    res.status(500).json({ message: "Server error creating event", details: error.message });
  }
};

// 🟩 APPROVE EVENT (Admin only)
export const approveEvent = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);

    if (!event) {
      return res.status(404).json({ message: "Event not found" });
    }

    if (event.status === "Approved") {
      return res.status(200).json({ message: "Event is already approved.", event });
    }

    event.status = "Approved";
    await event.save();

    res.status(200).json({
      message: "Event successfully approved and is now visible to all users.",
      event,
    });
  } catch (error) {
    console.error("❌ Error approving event:", error);
    res.status(500).json({ message: "Server error during event approval" });
  }
};

// 🟩 UPDATE EVENT
export const updateEvent = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);

    if (!event) {
      return res.status(404).json({ message: "Event not found" });
    }

    const isCreator = event.createdBy.toString() === req.user._id.toString();
    const isAdmin = req.user.role === "Admin";

    if (!isCreator && !isAdmin) {
      return res.status(403).json({
        message: "Not authorized to modify this event. Only the creator or an Admin can make changes.",
      });
    }

    const updateData = req.body;

    // Only admins can modify `status` or `createdBy`
    if (!isAdmin) {
      delete updateData.status;
      delete updateData.createdBy;
    }

    const updatedEvent = await Event.findByIdAndUpdate(req.params.id, updateData, {
      new: true,
      runValidators: true,
    }).populate("createdBy", "name email role");

    res.status(200).json({
      message: "Event updated successfully.",
      event: updatedEvent,
    });
  } catch (error) {
    console.error("❌ Error updating event:", error);
    res.status(400).json({ message: "Error updating event", details: error.message });
  }
};

// 🟩 DELETE EVENT
export const deleteEvent = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);

    if (!event) {
      return res.status(404).json({ message: "Event not found" });
    }

    const isCreator = event.createdBy.toString() === req.user._id.toString();
    const isAdmin = req.user.role === "Admin";

    if (!isCreator && !isAdmin) {
      return res.status(403).json({
        message: "Not authorized to delete this event. Only the creator or an Admin can delete.",
      });
    }

    await Event.deleteOne({ _id: req.params.id });

    res.status(204).json({ message: "Event removed successfully." });
  } catch (error) {
    console.error("❌ Error deleting event:", error);
    res.status(500).json({ message: "Server error during event deletion" });
  }
};

// 🟩 JOIN EVENT
export const joinEvent = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);

    if (!event) {
      return res.status(404).json({ message: "Event not found" });
    }

    if (event.status !== "Approved") {
      return res.status(400).json({ message: "Event is not approved yet" });
    }

    const userId = req.user._id;

    if (event.participants.includes(userId)) {
      return res.status(400).json({ message: "User already registered for this event" });
    }

    event.participants.push(userId);
    await event.save();

    res.status(200).json({
      message: "Successfully registered for the event.",
      event,
    });
  } catch (error) {
    console.error("❌ Error joining event:", error);
    res.status(500).json({ message: "Server error during event registration" });
  }
};

// 🟩 LEAVE EVENT
export const leaveEvent = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);

    if (!event) {
      return res.status(404).json({ message: "Event not found" });
    }

    const userId = req.user._id;

    if (!event.participants.includes(userId)) {
      return res.status(400).json({ message: "User is not registered for this event" });
    }

    event.participants = event.participants.filter(
      (participantId) => participantId.toString() !== userId.toString()
    );
    await event.save();

    res.status(200).json({
      message: "Successfully unregistered from the event.",
      event,
    });
  } catch (error) {
    console.error("❌ Error leaving event:", error);
    res.status(500).json({ message: "Server error during un-registration" });
  }
};
