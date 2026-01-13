const mongoose = require("mongoose");

const workerSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  phone: {
    type: String,
    required: true,
    unique: true
  },
  area: {
    type: String,
    required: true
  },

  // 🔑 LOGIN CREDENTIALS
  username: {
    type: String,
    unique: true
  },
  password: {
    type: String
  },

  status: {
    type: String,
    default: "Active"
  },

  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model("Worker", workerSchema);
