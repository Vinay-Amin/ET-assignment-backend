const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  instagramId: { type: String, required: true, unique: true },
  username: String,
  fullName: String,
  accessToken: String,
  profilePicture: String,
  isLoggedIn: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('User', UserSchema);
