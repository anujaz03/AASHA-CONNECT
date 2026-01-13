const mongoose = require("mongoose");

const FamilySchema = new mongoose.Schema({
  headName: {
    type: String,
    required: true
  },

  address: {
    type: String,
    required: true
  },

  contact: {
    type: String,
    required: true
  },

  notes: {
    type: String,
    default: ""
  },

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
