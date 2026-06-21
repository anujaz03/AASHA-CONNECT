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

  abhaId: {
    type: String,
    default: ""
  },

  abhaAddress: {
    type: String,
    default: ""
  },

  latitude: {
    type: Number,
    default: 0
  },

  longitude: {
    type: Number,
    default: 0
  },

  members: [{
    name: String,
    age: Number,
    gender: String,
    relation: String,
    vaccinations: [{
      name: String,
      dueDate: Date,
      status: { type: String, default: "Pending" }
    }]
  }],

  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model("Family", FamilySchema);
