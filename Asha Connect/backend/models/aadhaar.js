const mongoose = require("mongoose");

const AadhaarSchema = new mongoose.Schema({
  phone: {
    type: String,
    required: true,
    unique: true
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
  }
});

module.exports = mongoose.model(
  "Aadhaar",
  AadhaarSchema,
  "aadhaar_registry"
);
