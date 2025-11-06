import Event from '../models/Event.js';

// 🆕 NEW FUNCTION: Get a single event by ID
export const getEventById = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id)
      .populate('createdBy', 'name email role')
      .populate('participants', 'name email'); // Populate participants for display

    if (!event) {
      return res.status(404).json({ message: 'Event not found.' });
    }

    // Optional Security Check: Ensure only approved events are visible to non-admins
    if (event.status !== 'Approved' && req.user.role !== 'Admin' && event.createdBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Access denied. Event is not approved.' });
    }

    res.status(200).json(event);
  } catch (error) {
    console.error('❌ Error getting event by ID:', error);
    // Check for invalid MongoDB ID format error (e.g., /events/abc instead of /events/123...)
    if (error.name === 'CastError') {
      return res.status(404).json({ message: 'Invalid Event ID format.' });
    }
    res.status(500).json({ message: 'Server error fetching event details.' });
  }
};

export const createEvent = async (req, res) => {
  try {

    const createdBy = req.user._id;

   
    const newEvent = await Event.create({
      ...req.body,
      createdBy,
    });

    res.status(201).json({
      message: 'Event submitted for review.',
      event: newEvent,  
    });
  } catch (error) {
    console.error('❌ Error creating event:', error);
    res.status(400).json({ message: 'Error creating event', details: error.message });
  }
};

export const getEvents = async (req, res) => {
  try {
    let events;

  
    if (req.user.role === 'Admin') {
    
      events = await Event.find().populate('createdBy', 'name email role');
    } else {
     
      events = await Event.find({ status: 'Approved' }).populate('createdBy', 'name email');
    }

    res.status(200).json(events);
  } catch (error) {
    console.error('❌ Error getting events:', error);
    res.status(500).json({ message: 'Server error fetching events' });
  }
};

export const approveEvent = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);

    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }
    
   
    if (event.status === 'Approved') {
        return res.status(200).json({ message: 'Event is already approved.', event });
    }

    event.status = 'Approved';
    await event.save();

    res.status(200).json({
      message: 'Event successfully approved and is now visible to all users.',
      event,
    });
  } catch (error) {
    console.error('❌ Error approving event:', error);
    res.status(500).json({ message: 'Server error during event approval' });
  }

};

export const updateEvent = async (req, res) => {
    try {
        const event = await Event.findById(req.params.id);

        if (!event) {
            return res.status(404).json({ message: 'Event not found' });
        }

       
        const isCreator = event.createdBy.toString() === req.user._id.toString();
        const isAdmin = req.user.role === 'Admin';

        if (!isCreator && !isAdmin) {
            return res.status(403).json({
                message: 'Not authorized to modify this event. Only the creator or an Admin can make changes.'
            });
        }

       
        const updateData = req.body;

        
        if (!isAdmin) {
            delete updateData.status; 
            delete updateData.createdBy;
        }

       
        const updatedEvent = await Event.findByIdAndUpdate(
            req.params.id,
            updateData,
            { new: true, runValidators: true }
        ).populate('createdBy', 'name email role');

        res.status(200).json({
            message: 'Event updated successfully.',
            event: updatedEvent,
        });

    } catch (error) {
        console.error('❌ Error updating event:', error);
        res.status(400).json({ message: 'Error updating event', details: error.message });
    }
};

export const deleteEvent = async (req, res) => {
    try {
        const event = await Event.findById(req.params.id);

        if (!event) {
            return res.status(404).json({ message: 'Event not found' }); 
        }

        
        const isCreator = event.createdBy.toString() === req.user._id.toString();
        const isAdmin = req.user.role === 'Admin';

        if (!isCreator && !isAdmin) {
            return res.status(403).json({
                message: 'Not authorized to delete this event. Only the creator or an Admin can make changes.'
            });
        }

        
        await Event.deleteOne({ _id: req.params.id });

        res.status(204).json({ message: 'Event removed successfully.' }); 

    } catch (error) {
        console.error('❌ Error deleting event:', error);
        res.status(500).json({ message: 'Server error during event deletion' });
    }
};

export const joinEvent = async (req, res) => {
    try {
        const event = await Event.findById(req.params.id);

        if (!event) {
            return res.status(404).json({ message: 'Event not found' });
        }

        
        if (event.status !== 'Approved') {
            return res.status(400).json({ message: 'Event is not approved yet' });
        }
        const userId = req.user._id;
        if (event.participants.includes(userId)) {
            return res.status(400).json({ message: 'User is already registered for this event' });
        }

        
        event.participants.push(userId);
        await event.save();

        res.status(200).json({
            message: 'Successfully registered for the event.',
            event: event,
        });

    } catch (error) {
        console.error('❌ Error joining event:', error);
        res.status(500).json({ message: 'Server error during event registration' });
    }
};

export const leaveEvent = async (req, res) => {
    try {
        const event = await Event.findById(req.params.id);

        if (!event) {
            return res.status(404).json({ message: 'Event not found' });
        }

        const userId = req.user._id;

    
        if (!event.participants.includes(userId)) {
            return res.status(400).json({ message: 'User is not registered for this event' });
        }

        event.participants = event.participants.filter(
            (participantId) => participantId.toString() !== userId.toString()
        );
        await event.save();

        res.status(200).json({
            message: 'Successfully unregistered from the event.',
            event: event,
        });

    } catch (error) {
        console.error('❌ Error leaving event:', error);
        res.status(500).json({ message: 'Server error during un-registration' });
    }
};