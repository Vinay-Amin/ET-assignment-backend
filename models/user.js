const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  instagramId: { type: String, required: true, unique: true },
  username: String,
  fullName: String,
  accessToken: String,
  profilePicture: String,
  isLoggedIn: { type: Boolean, default: false, index: true },
  lastLoginAt: { type: Date },
  createdAt: { type: Date, default: Date.now }
});

// Add compound index for better query performance
UserSchema.index({ isLoggedIn: 1, createdAt: -1 });

module.exports = mongoose.model('User', UserSchema);
