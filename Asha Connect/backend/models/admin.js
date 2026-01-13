const mongoose = require("mongoose");

const AdminSchema = new mongoose.Schema({
  phone: {
    type: String,
    required: true,
    unique: true   // 🚨 THIS PREVENTS DUPLICATES
  },
  name: {
    type: String,
    required: true
  },
  city: {
    type: String,
    required: true
  },
  aadhaar: {
    type: String,
    required: true
  },
  password: {
    type: String,
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model("Admin", AdminSchema, "admins");
