const mongoose = require("mongoose");

const FamilySchema = new mongoose.Schema({
  headName: {
    type: String,
    required: true,
    trim: true
  },

  address: {
    type: String,
    required: true,
    trim: true
  },

  contact: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },

  notes: {
    type: String,
    default: ""
  },

  // 🔥 ASHA WORKER LINK
  addedByWorkerId: {
    type: String,
    default: ""
  },

  addedByWorkerName: {
    type: String,
    default: ""
  },

  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model("Family", FamilySchema);
