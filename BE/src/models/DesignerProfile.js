const mongoose = require('mongoose');

const DesignerProfileSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
  username: { type: String, required: true, trim: true, lowercase: true, unique: true },
  displayName: { type: String, required: true, trim: true, maxlength: 100 },
  avatar: { type: String, default: null },
  coverImage: { type: String, default: null },
  bio: { type: String, trim: true, maxlength: 1000, default: '' },
}, { timestamps: true });

module.exports = mongoose.model('DesignerProfile', DesignerProfileSchema);
