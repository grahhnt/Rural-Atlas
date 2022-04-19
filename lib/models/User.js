import mongoose from 'mongoose';

const User = new mongoose.Schema({
  name: String,
  avatar: String, // URL
  accounts: {
    discord: {
      _id: String,
      tag: String,
      avatar: String, // Discord avatar hash
    }
  },
  _createdAt: Date
});

User.pre("save", function(next) {
  if(!this._createdAt) {
    this._createdAt = new Date();
  }
  next();
})

module.exports = mongoose.models.User || mongoose.model("User", User);
