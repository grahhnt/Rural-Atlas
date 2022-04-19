import mongoose from 'mongoose';

const Definition = new mongoose.Schema({
  word: { type: mongoose.Schema.Types.ObjectId, ref: "Word" },
  capitalization: String,
  definition: String,

  badges: [
    {
      _id: { type: String, enum: ["FIRST"] },
      _createdAt: Date
    }
  ],

  votes: [
    {
      _id: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
      vote: { type: String, enum: ["UP", "DOWN"] },
      _createdAt: Date,
      _updatedAt: Date
    }
  ],

  owner: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  _createdAt: Date
});

Definition.pre("save", function(next) {
  if(!this._createdAt) {
    this._createdAt = new Date();
  }
  next();
})

module.exports = mongoose.models.Definition || mongoose.model("Definition", Definition);
