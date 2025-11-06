  import mongoose from 'mongoose';

  const eventSchema = new mongoose.Schema(
    {
      title: {
        type: String,
        required: [true, 'Please add a title for the event'],
        trim: true,
        maxlength: [100, 'Title cannot be more than 100 characters'],
      },
      description: {
        type: String,
        required: [true, 'Please add a description for the event'],
      },
      date: {
        type: Date,
        required: [true, 'Please add the date of the event'],
      },
      venue: {
        type: String,
        required: [true, 'Please add the venue for the event'],
        trim: true,
      },
      // NEW: Status to handle the Admin approval workflow
      status: {
        type: String,
        enum: ['Pending', 'Approved', 'Rejected'],
        default: 'Pending', // New events start as Pending, requiring admin review
        required: true,
      },
      // The user who created the event (linked to the User model)
      createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
      },
      // Array of user IDs participating in the event
      participants: [
        {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User',
        },
      ],
    },
    {
      timestamps: true, // Adds createdAt and updatedAt fields
    }
  );

  const Event = mongoose.model('Event', eventSchema);

  export default Event;
