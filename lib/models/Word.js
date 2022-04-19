import mongoose from 'mongoose';

const Word = new mongoose.Schema({
  word: String, // an all lowercase variant

  firstDefinition: { type: mongoose.Schema.Types.ObjectId, ref: "Definition" },

  _createdAt: Date
});

Word.pre("save", function(next) {
  if(!this._createdAt) {
    this._createdAt = new Date();
  }
  next();
})

module.exports = mongoose.models.Word || mongoose.model("Word", Word);
