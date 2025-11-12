import Event from "../models/Event.js";

// 🟩 GET ALL EVENTS
export const getEvents = async (req, res) => {
  try {
    let events;

    if (req.user.role === "Admin") {
      events = await Event.find().populate("createdBy", "name email role");
    } else {
      events = await Event.find({ createdBy: req.user._id }).populate(
        "createdBy",
        "name email"
      );
    }

    res.status(200).json(events);
  } catch (error) {
    console.error("❌ Error getting events:", error);
    res.status(500).json({ message: "Server error fetching events" });
  }
};

// 🟩 GET SINGLE EVENT BY ID
export const getEventById = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id)
      .populate("createdBy", "name email role")
      .populate("participants", "name email");

    if (!event) return res.status(404).json({ message: "Event not found." });

    const isCreator = event.createdBy?._id?.toString() === req.user._id.toString();
    const isAdmin = req.user.role === "Admin";

    if (event.status !== "Approved" && !isAdmin && !isCreator) {
      return res.status(403).json({ message: "Access denied. Event is not approved." });
    }

    res.status(200).json({
      ...event.toObject(),
      totalParticipants: event.participants?.length || 0,
    });
  } catch (error) {
    console.error("❌ Error getting event by ID:", error);
    if (error.name === "CastError") return res.status(404).json({ message: "Invalid Event ID." });
    res.status(500).json({ message: "Server error fetching event details." });
  }
};

// 🟩 CREATE A NEW EVENT (✅ Fixed for .fields())
export const createEvent = async (req, res) => {
  try {
    // ✅ DEBUG: Log everything received
    console.log("📥 CREATE EVENT REQUEST:");
    console.log("  Headers:", req.headers);
    console.log("  Body:", req.body);
    console.log("  Files:", req.files); // ✅ Changed from req.file
    console.log("  User:", req.user?._id);

    const createdBy = req.user._id;

    // ✅ Destructure and trim all fields
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

    // ✅ DEBUG: Log each field
    console.log("📝 Extracted fields:");
    console.log("  title:", title);
    console.log("  description:", description);
    console.log("  date:", date);
    console.log("  venue:", venue);
    console.log("  time:", time);
    console.log("  typeOfEvent:", typeOfEvent);
    console.log("  capacity:", capacity);
    console.log("  reminders:", reminders);

    // ✅ Validate required fields
    if (!title || title.trim() === "") {
      return res.status(400).json({ message: "Title is required." });
    }
    if (!description || description.trim() === "") {
      return res.status(400).json({ message: "Description is required." });
    }
    if (!date) {
      return res.status(400).json({ message: "Date is required." });
    }
    if (!venue || venue.trim() === "") {
      return res.status(400).json({ message: "Venue is required." });
    }

    // Validate date format (YYYY-MM-DD)
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return res.status(400).json({ message: "Date must be in YYYY-MM-DD format." });
    }

    // Validate time format (HH:mm) if provided
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
        parsedReminders = typeof reminders === 'string' ? JSON.parse(reminders) : reminders;
        if (!Array.isArray(parsedReminders)) {
          throw new Error("Reminders must be an array.");
        }
      } catch (err) {
        console.error("❌ Reminders parsing error:", err);
        return res.status(400).json({ message: "Invalid reminders format." });
      }
    }

    // ✅ Build event object
    const eventFields = {
      title: title.trim(),
      description: description.trim(),
      date: new Date(date), // Convert to Date object
      venue: venue.trim(),
      createdBy,
      status: "Pending",
      capacity: parsedCapacity,
      reminders: parsedReminders,
    };

    // Add optional fields only if they exist
    if (time) eventFields.time = time;
    if (duration) eventFields.duration = duration;
    if (typeOfEvent && typeOfEvent.trim()) eventFields.typeOfEvent = typeOfEvent.trim();
    // ✅ Fixed: Changed from req.file to req.files
    if (req.files?.image?.[0]) eventFields.image = req.files.image[0].path;

    console.log("✅ Creating event with fields:", eventFields);

    const newEvent = await Event.create(eventFields);

    console.log("✅ Event created successfully:", newEvent._id);

    res.status(201).json({
      message: "Event submitted for review. Pending admin approval.",
      event: newEvent,
    });
  } catch (error) {
    console.error("❌ Error creating event:", error);
    
    if (error.name === "ValidationError") {
      const errors = Object.keys(error.errors).map(key => error.errors[key].message);
      return res.status(400).json({ 
        message: "Validation failed", 
        details: errors.join(", ")
      });
    }
    
    res.status(500).json({ 
      message: "Server error creating event", 
      details: error.message 
    });
  }
};

// 🟩 APPROVE EVENT (Admin only)
export const approveEvent = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) return res.status(404).json({ message: "Event not found" });

    if (event.status === "Approved") {
      return res.status(200).json({ message: "Event already approved.", event });
    }

    event.status = "Approved";
    await event.save();

    res.status(200).json({ message: "Event approved successfully.", event });
  } catch (error) {
    console.error("❌ Error approving event:", error);
    res.status(500).json({ message: "Server error during event approval." });
  }
};

// 🟩 UPDATE EVENT (✅ Fixed for .fields())
export const updateEvent = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) return res.status(404).json({ message: "Event not found" });

    const isCreator = event.createdBy.toString() === req.user._id.toString();
    const isAdmin = req.user.role === "Admin";

    if (!isCreator && !isAdmin) {
      return res.status(403).json({ message: "Not authorized to modify this event." });
    }

    const updateData = { ...req.body };
    if (!isAdmin) {
      delete updateData.status;
      delete updateData.createdBy;
    }

    // ✅ Fixed: Handle image upload with .fields()
    if (req.files?.image?.[0]) {
      updateData.image = req.files.image[0].path;
    }

    const updatedEvent = await Event.findByIdAndUpdate(req.params.id, updateData, {
      new: true,
      runValidators: true,
    }).populate("createdBy", "name email role");

    res.status(200).json({ message: "Event updated successfully.", event: updatedEvent });
  } catch (error) {
    console.error("❌ Error updating event:", error);
    res.status(400).json({ message: "Error updating event", details: error.message });
  }
};

// 🟩 DELETE EVENT
export const deleteEvent = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) return res.status(404).json({ message: "Event not found" });

    const isCreator = event.createdBy.toString() === req.user._id.toString();
    const isAdmin = req.user.role === "Admin";

    if (!isCreator && !isAdmin) {
      return res.status(403).json({ message: "Not authorized to delete this event." });
    }

    await Event.deleteOne({ _id: req.params.id });
    res.status(200).json({ message: "Event deleted successfully." });
  } catch (error) {
    console.error("❌ Error deleting event:", error);
    res.status(500).json({ message: "Server error during event deletion" });
  }
};

// 🟩 JOIN EVENT
export const joinEvent = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) return res.status(404).json({ message: "Event not found" });

    if (event.status !== "Approved") {
      return res.status(400).json({ message: "Event is not approved yet." });
    }

    const userId = req.user._id;
    if (event.participants.includes(userId)) {
      return res.status(400).json({ message: "User already registered for this event." });
    }

    event.participants.push(userId);
    await event.save();

    res.status(200).json({ message: "Registered for event successfully.", event });
  } catch (error) {
    console.error("❌ Error joining event:", error);
    res.status(500).json({ message: "Server error during event registration." });
  }
};

// 🟩 LEAVE EVENT
export const leaveEvent = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) return res.status(404).json({ message: "Event not found" });

    const userId = req.user._id;
    if (!event.participants.includes(userId)) {
      return res.status(400).json({ message: "User is not registered for this event." });
    }

    event.participants = event.participants.filter(
      (participantId) => participantId.toString() !== userId.toString()
    );
    await event.save();

    res.status(200).json({ message: "Successfully unregistered from event.", event });
  } catch (error) {
    console.error("❌ Error leaving event:", error);
    res.status(500).json({ message: "Server error during un-registration." });
  }
};