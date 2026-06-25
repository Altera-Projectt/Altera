const mongoose = require('mongoose');

const MessageSchema = new mongoose.Schema(
  {
    sender: {
      type: String,
      enum: ['USER', 'AI'],
      required: true,
    },
    text: {
      type: String,
      required: [true, 'Message text is required'],
    },
  },
  { timestamps: true }
);

const ChatSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User ID is required'],
    },
    title: {
      type: String,
      default: 'New Conversation',
    },
    messages: {
      type: [MessageSchema],
      default: [],
    },
    topic: {
      type: String,
      enum: ['fashion', 'outfit', 'style', 'general'],
      default: 'general',
    },
  },
  {
    timestamps: true,
  }
);

ChatSchema.index({ userId: 1, createdAt: -1 });

module.exports = mongoose.model('Chat', ChatSchema);
