// models/user.js
const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  instagramId: { type: String, required: true, unique: true },
  username: String,
  fullName: String,
  profilePicture: String,
  accessToken: String,
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('User', UserSchema);
